import crypto from 'crypto';

import { Document } from '../models/index.js';
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
      s3_key: s3Key,
      encryption_key: key,
      signed: false,
      signed_at: null,
    });

    return res.status(201).json({ success: true, data: { doc_id: doc.id } });
  } catch (err) {
    return next(err);
  }
}

export async function list(req, res, next) {
  try {
    const userId = req.user.id;

    const docs = await Document.findAll({
      where: { user_id: userId },
      order: [['created_at', 'DESC']],
      attributes: ['id', 'doc_type', 'title', 'signed', 'signed_at', 'created_at'],
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
        })),
      },
    });
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

    return res.json({ success: true, data: { message: 'Document deleted' } });
  } catch (err) {
    return next(err);
  }
}

