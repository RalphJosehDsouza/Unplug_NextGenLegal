import crypto from 'crypto';
import jwt from 'jsonwebtoken';

import { ActivityLog, Document, User } from '../models/index.js';
import {
  downloadFromS3,
  deleteFromS3,
  encryptBuffer,
  generatePDF,
  uploadToS3,
} from '../services/documentService.js';
import { razorpay } from '../services/razorpay.js';
import {
  getStampDuty,
  purchaseEStamp,
  applyEStampToDocument,
  getDecryptedPdfBufferForDocumentId,
} from '../services/estampService.js';

function decodeKeyHex(keyHex) {
  return Buffer.from(String(keyHex || ''), 'hex');
}

function getClientIp(req) {
  const headerVal = req.headers['x-forwarded-for'];
  if (typeof headerVal === 'string' && headerVal.trim()) {
    return headerVal.split(',')[0].trim();
  }
  return req.ip || 'unknown';
}

function canAccessDocument(user, doc) {
  if (!user || !doc) return false;
  if (doc.user_id === user.id) return true;

  if (user.role === 'lawyer') {
    return doc.share_scope === 'all_lawyers' && doc.source_type === 'uploaded';
  }

  return false;
}

async function logDocumentActivity(req, { userId, action, documentId }) {
  await ActivityLog.create({
    user_id: userId || null,
    action,
    resource_type: 'document',
    resource_id: documentId,
    ip_address: getClientIp(req),
  });
}

function parseRangeHeader(rangeHeader, total) {
  if (!rangeHeader || !String(rangeHeader).startsWith('bytes=')) return null;

  const [startStrRaw, endStrRaw] = String(rangeHeader).replace('bytes=', '').split('-');
  const startStr = startStrRaw?.trim() || '';
  const endStr = endStrRaw?.trim() || '';

  if (!startStr && !endStr) return null;

  if (!startStr) {
    const suffixLen = Number(endStr);
    if (!Number.isFinite(suffixLen) || suffixLen <= 0) return null;
    const start = Math.max(total - suffixLen, 0);
    return { start, end: total - 1 };
  }

  const start = Number(startStr);
  const end = endStr ? Number(endStr) : total - 1;
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  if (start < 0 || end < 0 || start > end || start >= total) return null;

  return { start, end: Math.min(end, total - 1) };
}

function buildViewToken({ docId, userId, role }) {
  return jwt.sign(
    {
      sub: userId,
      role,
      docId,
      tokenType: 'doc-view',
    },
    process.env.JWT_SECRET,
    { expiresIn: '5m' },
  );
}

function verifyViewToken(token, docId) {
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  if (!payload || payload.tokenType !== 'doc-view') {
    throw new Error('Invalid view token');
  }
  if (payload.docId !== docId) {
    throw new Error('Invalid document scope');
  }
  return { id: payload.sub, role: payload.role };
}

export async function generate(req, res, next) {
  try {
    const userId = req.user.id;
    const { doc_type, title, fields } = req.body;

    const pdfBuffer = await generatePDF(doc_type, fields);
    const { encrypted, key } = encryptBuffer(pdfBuffer);

    const s3Key = await uploadToS3(userId, encrypted, title);

    const doc = await Document.create({
      user_id: userId,
      doc_type,
      title,
      source_type: 'generated',
      mime_type: 'application/pdf',
      file_size_bytes: pdfBuffer.length,
      uploader_name: req.user?.full_name || null,
      viewer_policy: 'view_only',
      share_scope: 'owner_only',
      s3_key: s3Key,
      encryption_key: key,
      signed: false,
      signed_at: null,
      signature_id: null,
      signed_expired: false,
    });

    await logDocumentActivity(req, {
      userId,
      action: 'document.generated',
      documentId: doc.id,
    });

    // eStamping prep: compute stamp duty for legally enforceable documents.
    // We do not auto-purchase: we return stamp info so the user can confirm payment.
    const stampingDocTypes = ['rental_agreement', 'nda', 'partnership_deed', 'affidavit', 'power_of_attorney'];
    if (stampingDocTypes.includes(doc_type)) {
      const estampState = String(process.env.ESTAMP_STATE || 'MH').toUpperCase();

      let property_value_paise = 0;
      if (doc_type === 'rental_agreement') {
        const monthlyRent = Number(fields?.monthly_rent_figures || 0);
        const annualRentPaise = monthlyRent * 12 * 100;
        property_value_paise = Math.round(annualRentPaise);
      } else if (doc_type === 'partnership_deed') {
        const c1 = Number(fields?.capital_contribution_1 || 0);
        const c2 = Number(fields?.capital_contribution_2 || 0);
        property_value_paise = Math.round((c1 + c2) * 100);
      }

      const stamp = await getStampDuty(doc_type, estampState, property_value_paise);
      if (stamp && typeof stamp.stamp_duty_paise === 'number') {
        await doc.update({
          estamped: false,
          stamp_duty_paise: stamp.stamp_duty_paise,
          stamp_article_number: stamp.article_number,
          stamp_act_reference: stamp.act_reference,
          stamp_state: estampState,
        });

        return res.status(201).json({
          success: true,
          data: {
            doc_id: doc.id,
            stamp_duty_required: true,
            stamp_duty_paise: stamp.stamp_duty_paise,
            article_number: stamp.article_number,
            act_reference: stamp.act_reference,
          },
        });
      }
    }

    return res.status(201).json({ success: true, data: { doc_id: doc.id } });
  } catch (err) {
    return next(err);
  }
}

export async function list(req, res, next) {
  try {
    const user = req.user;
    const where = {};

    if (user.role === 'lawyer') {
      where.source_type = 'uploaded';
      where.share_scope = 'all_lawyers';
    } else {
      where.user_id = user.id;
    }

    const docs = await Document.findAll({
      where,
      order: [['created_at', 'DESC']],
      attributes: [
        'id',
        'doc_type',
        'title',
        'signed',
        'signed_at',
        'signature_id',
        'signed_expired',
        'estamped',
        'estamp_certificate',
        'stamp_duty_paise',
        'stamp_state',
        'created_at',
        'source_type',
        'mime_type',
        'file_size_bytes',
        'uploader_name',
        'viewer_policy',
        'share_scope',
      ],
    });

    return res.json({
      success: true,
      data: {
        documents: docs.map((d) => ({
          id: d.id,
          doc_type: d.doc_type,
          title: d.title,
          signed: d.signed,
          signed_at: d.signed_at,
          signature_id: d.signature_id,
          signed_expired: d.signed_expired,
          estamped: d.estamped,
          estamp_certificate: d.estamp_certificate,
          stamp_duty_paise: d.stamp_duty_paise,
          stamp_state: d.stamp_state,
          created_at: d.created_at,
          source_type: d.source_type,
          mime_type: d.mime_type,
          file_size_bytes: d.file_size_bytes,
          uploader_name: d.uploader_name,
          viewer_policy: d.viewer_policy,
          share_scope: d.share_scope,
        })),
      },
    });
  } catch (err) {
    return next(err);
  }
}

export async function upload(req, res, next) {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    if (role === 'lawyer') {
      return next({ statusCode: 403, message: 'Lawyers cannot upload client documents' });
    }

    const file = req.file;
    if (!file) return next({ statusCode: 400, message: 'PDF file is required' });
    if (file.mimetype !== 'application/pdf') {
      return next({ statusCode: 400, message: 'Only PDF uploads are allowed' });
    }

    const titleRaw = String(req.body?.title || file.originalname || 'uploaded-document').trim();
    const title = titleRaw.replace(/\.pdf$/i, '').slice(0, 120);

    const { encrypted, key } = encryptBuffer(file.buffer);
    const s3Key = await uploadToS3(userId, encrypted, title);

    const owner = await User.findByPk(userId, { attributes: ['full_name'] });

    const doc = await Document.create({
      user_id: userId,
      doc_type: 'uploaded_pdf',
      title,
      source_type: 'uploaded',
      mime_type: 'application/pdf',
      file_size_bytes: file.size || file.buffer.length,
      uploader_name: owner?.full_name || null,
      viewer_policy: 'view_only',
      share_scope: 'all_lawyers',
      s3_key: s3Key,
      encryption_key: key,
      signed: false,
      signed_at: null,
      signature_id: null,
      signed_expired: false,
    });

    await logDocumentActivity(req, {
      userId,
      action: 'document.uploaded',
      documentId: doc.id,
    });

    return res.status(201).json({ success: true, data: { doc_id: doc.id } });
  } catch (err) {
    return next(err);
  }
}

function verifyRazorpaySignature({ order_id, payment_id, razorpay_signature }) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) throw new Error('RAZORPAY_KEY_SECRET is not configured');

  const body = `${order_id}|${payment_id}`;
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return expected === razorpay_signature;
}

export async function purchaseEstamp(req, res, next) {
  try {
    const userId = req.user.id;
    const docId = req.params.id;
    const { first_party_name, second_party_name, state } = req.body || {};

    const razorpay_order_id = req.body?.razorpay_order_id || null;
    const razorpay_payment_id = req.body?.razorpay_payment_id || null;
    const razorpay_signature = req.body?.razorpay_signature || null;

    const doc = await Document.findByPk(docId);
    if (!doc) return next({ statusCode: 404, message: 'Document not found' });
    if (doc.user_id !== userId) return next({ statusCode: 403, message: 'Forbidden' });
    if (doc.estamped) return next({ statusCode: 400, message: 'eStamp already applied' });

    if (!first_party_name || !second_party_name || !state) {
      return next({ statusCode: 400, message: 'first_party_name, second_party_name, and state are required' });
    }

    const stampDutyPaise = Number(doc.stamp_duty_paise || 0);
    if (!stampDutyPaise) {
      return next({ statusCode: 400, message: 'Stamp duty not calculated for this document yet' });
    }

    if (!razorpay) {
      return next({ statusCode: 500, message: 'Payment gateway is not configured' });
    }

    // If payment ids are not provided, create Razorpay order and return it.
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      const order = await razorpay.orders.create({
        amount: stampDutyPaise,
        currency: 'INR',
        receipt: `ESTAMP_${doc.id}_${Date.now()}`,
      });

      return res.json({
        success: true,
        data: {
          razorpay_order_id: order.id,
          razorpay_key: process.env.RAZORPAY_KEY_ID,
          amount_paise: stampDutyPaise,
        },
      });
    }

    // Verify Razorpay signature before purchasing eStamp.
    const ok = verifyRazorpaySignature({
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      razorpay_signature,
    });
    if (!ok) return next({ statusCode: 400, message: 'Invalid Razorpay signature' });

    const purchase = await purchaseEStamp(doc.doc_type, state, stampDutyPaise, first_party_name, second_party_name);

    const documentBuffer = await getDecryptedPdfBufferForDocumentId(doc.id);
    await applyEStampToDocument({ docId: doc.id, documentBuffer, estampPdfBuffer: purchase.pdf_buffer });

    doc.estamped = true;
    doc.estamp_certificate = purchase.certificate_number;
    doc.stamp_state = state;
    doc.viewer_policy = 'download_allowed';
    await doc.save();

    return res.json({
      success: true,
      data: {
        certificate_number: purchase.certificate_number,
        message: 'eStamp applied. Document is now legally valid.',
      },
    });
  } catch (err) {
    return next(err);
  }
}

export async function createViewToken(req, res, next) {
  try {
    const docId = req.params.id;
    const doc = await Document.findByPk(docId);
    if (!doc) return next({ statusCode: 404, message: 'Document not found' });

    if (!canAccessDocument(req.user, doc)) {
      return next({ statusCode: 403, message: 'Forbidden' });
    }

    const token = buildViewToken({
      docId,
      userId: req.user.id,
      role: req.user.role,
    });

    return res.json({
      success: true,
      data: {
        view_token: token,
        expires_in_seconds: 300,
      },
    });
  } catch (err) {
    return next(err);
  }
}

export async function stream(req, res, next) {
  try {
    const docId = req.params.id;
    const token = req.query?.token ? String(req.query.token) : null;

    const doc = await Document.findByPk(docId);
    if (!doc) return next({ statusCode: 404, message: 'Document not found' });

    let viewer = req.user || null;
    if (token) {
      try {
        viewer = verifyViewToken(token, docId);
      } catch {
        return next({ statusCode: 401, message: 'Invalid or expired view token' });
      }
    }

    if (!canAccessDocument(viewer, doc)) {
      return next({ statusCode: 403, message: 'Forbidden' });
    }

    const encryptedBuffer = await downloadFromS3(doc.s3_key);
    if (encryptedBuffer.length < 16) return next({ statusCode: 500, message: 'Decryption failed' });

    const keyBuf = decodeKeyHex(doc.encryption_key);
    if (keyBuf.length !== 32) return next({ statusCode: 500, message: 'Decryption failed' });

    const iv = encryptedBuffer.subarray(0, 16);
    const ciphertext = encryptedBuffer.subarray(16);

    const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuf, iv);
    const decryptedChunks = [decipher.update(ciphertext), decipher.final()];
    const decrypted = Buffer.concat(decryptedChunks);

    const safeTitle = String(doc.title || 'document').replace(/"/g, '');
    const total = decrypted.length;
    const parsedRange = parseRangeHeader(req.headers.range, total);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${safeTitle}.pdf"`);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    await logDocumentActivity(req, {
      userId: viewer?.id || null,
      action: 'document.viewed',
      documentId: doc.id,
    });

    if (parsedRange) {
      const { start, end } = parsedRange;
      const chunk = decrypted.subarray(start, end + 1);

      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${total}`);
      res.setHeader('Content-Length', chunk.length);
      return res.send(chunk);
    }

    res.setHeader('Content-Length', total);
    return res.send(decrypted);
  } catch (err) {
    return next(err);
  }
}

export async function download(req, res, next) {
  try {
    const userId = req.user.id;
    const docId = req.params.id;

    const doc = await Document.findByPk(docId);
    if (!doc) return next({ statusCode: 404, message: 'Document not found' });
    if (doc.user_id !== userId) return next({ statusCode: 403, message: 'Forbidden' });
    if (doc.viewer_policy === 'view_only') {
      return next({ statusCode: 403, message: 'This document is view-only' });
    }

    const encryptedBuffer = await downloadFromS3(doc.s3_key);
    if (encryptedBuffer.length < 16) return next({ statusCode: 500, message: 'Decryption failed' });

    const keyBuf = decodeKeyHex(doc.encryption_key);
    if (keyBuf.length !== 32) return next({ statusCode: 500, message: 'Decryption failed' });

    const iv = encryptedBuffer.subarray(0, 16);
    const ciphertext = encryptedBuffer.subarray(16);

    const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuf, iv);
    const decryptedChunks = [decipher.update(ciphertext), decipher.final()];
    const decrypted = Buffer.concat(decryptedChunks);

    const safeTitle = String(doc.title || 'document').replace(/"/g, '');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.pdf"`);
    return res.send(decrypted);
  } catch (err) {
    return next(err);
  }
}

export async function remove(req, res, next) {
  try {
    const userId = req.user.id;
    const docId = req.params.id;

    const doc = await Document.findByPk(docId);
    if (!doc) return next({ statusCode: 404, message: 'Document not found' });
    if (doc.user_id !== userId) return next({ statusCode: 403, message: 'Forbidden' });

    await deleteFromS3(doc.s3_key);
    await doc.destroy();

    await logDocumentActivity(req, {
      userId,
      action: 'document.deleted',
      documentId: docId,
    });

    return res.json({ success: true, data: { message: 'Document deleted' } });
  } catch (err) {
    return next(err);
  }
}

