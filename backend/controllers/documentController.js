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
    });

    await logDocumentActivity(req, {
      userId,
      action: 'document.generated',
      documentId: doc.id,
    });

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

