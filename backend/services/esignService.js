import axios from 'axios';
import crypto from 'crypto';
import FormData from 'form-data';

import { Document } from '../models/index.js';
import { downloadFromS3, encryptBuffer, getPresignedUrl, uploadToS3AtKey } from './documentService.js';

function decodeKeyHex(keyHex) {
  return Buffer.from(String(keyHex || ''), 'hex');
}

function decryptPdf(encryptedBuffer, encryptionKeyHex) {
  if (!encryptedBuffer || encryptedBuffer.length < 16) {
    throw new Error('Decryption failed: invalid encrypted buffer');
  }

  const keyBuf = decodeKeyHex(encryptionKeyHex);
  if (keyBuf.length !== 32) {
    throw new Error('Decryption failed: invalid encryption key');
  }

  const iv = encryptedBuffer.subarray(0, 16);
  const ciphertext = encryptedBuffer.subarray(16);

  const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuf, iv);
  const decryptedChunks = [decipher.update(ciphertext), decipher.final()];
  return Buffer.concat(decryptedChunks);
}

async function getDecryptedPdfBufferFromDocument(doc) {
  // Fetch via pre-signed S3 URL (encrypted payload), then decrypt locally.
  // This aligns with the document pipeline where documents are stored encrypted in S3.
  const presignedUrl = await getPresignedUrl(doc.s3_key);
  const encryptedResp = await axios.get(presignedUrl, { responseType: 'arraybuffer' });
  const encryptedBuffer = Buffer.from(encryptedResp.data);
  // Fallback: if presigned download fails, try direct SDK download.
  if (!encryptedBuffer || encryptedBuffer.length < 16) {
    const directEncrypted = await downloadFromS3(doc.s3_key);
    return decryptPdf(directEncrypted, doc.encryption_key);
  }
  return decryptPdf(encryptedBuffer, doc.encryption_key);
}

async function withRetry(fn, { retries = 1 } = {}) {
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const status = err?.response?.status;
      const retriable = !status || (status >= 500 && status <= 599);
      if (!retriable || attempt === retries) break;
    }
  }
  throw lastErr;
}

function getLeegalityConfig() {
  const apiKey = process.env.LEEGALITY_API_KEY;
  const baseUrl = process.env.LEEGALITY_BASE_URL;
  if (!apiKey || !baseUrl) {
    throw new Error('Leegality configuration missing');
  }
  return {
    apiKey,
    baseUrl,
  };
}

export async function initiateEsign(documentId, signatories) {
  const { apiKey, baseUrl } = getLeegalityConfig();

  const doc = await Document.findByPk(documentId);
  if (!doc) throw new Error('Document not found');

  const pdfBuffer = await getDecryptedPdfBufferFromDocument(doc);

  const fileName = `${doc.doc_type}_${doc.id}.pdf`;

  // Upload to Leegality
  const form = new FormData();
  form.append('file', pdfBuffer, fileName);

  const uploadResp = await withRetry(
    () => axios.post(`${baseUrl}/api/v3.5/sign/upload`, form, { headers: { 'X-Auth-Token': apiKey, ...form.getHeaders() } }),
    { retries: 1 },
  );

  const leegalityDocId =
    uploadResp?.data?.documentId ||
    uploadResp?.data?.document_id ||
    uploadResp?.data?.id;

  if (!leegalityDocId) {
    throw new Error('Leegality upload did not return documentId');
  }

  // Request signing
  const requestBody = {
    documentId: leegalityDocId,
    signatories: signatories.map((s) => ({
      name: s.name,
      email: s.email,
      phone: s.phone,
      signatureType: s.signatureType,
    })),
    expiryDays: 7,
    message: 'Please sign this document via NextGenLegal',
  };

  const requestResp = await withRetry(
    () => axios.post(`${baseUrl}/api/v3.5/sign/request`, requestBody, { headers: { 'X-Auth-Token': apiKey } }),
    { retries: 1 },
  );

  return {
    inviteLink: requestResp?.data?.inviteLink || requestResp?.data?.invite_link,
    signingRequestId: requestResp?.data?.signingRequestId || requestResp?.data?.signing_request_id || requestResp?.data?.id,
  };
}

export async function checkEsignStatus(signingRequestId) {
  const { apiKey, baseUrl } = getLeegalityConfig();

  const resp = await axios.get(`${baseUrl}/api/v3.5/sign/request/${signingRequestId}`, {
    headers: { 'X-Auth-Token': apiKey },
  });

  const data = resp?.data || {};

  const rawStatus = data?.status || data?.request_status || data?.signing_status;
  const signatories = Array.isArray(data?.signatories) ? data.signatories : [];

  const mappedStatus =
    rawStatus === 'COMPLETED'
      ? 'COMPLETED'
      : rawStatus === 'EXPIRED'
        ? 'EXPIRED'
        : rawStatus === 'PARTIALLY_SIGNED'
          ? 'PARTIALLY_SIGNED'
          : 'PENDING';

  return {
    status: mappedStatus,
    signatories: signatories.map((s) => ({
      name: s?.name || s?.full_name || '',
      signed_at: s?.signed_at || s?.signedAt || null,
    })),
  };
}

export async function downloadSignedDocument(signingRequestId) {
  const { apiKey, baseUrl } = getLeegalityConfig();

  const doc = await Document.findOne({ where: { signature_id: signingRequestId } });
  if (!doc) throw new Error('Document not found for this signing request');

  const downloadResp = await axios.get(
    `${baseUrl}/api/v3.5/sign/request/${signingRequestId}/download`,
    { headers: { 'X-Auth-Token': apiKey }, responseType: 'arraybuffer' },
  );

  const signedPdfBuffer = Buffer.from(downloadResp.data);

  const { encrypted, key } = encryptBuffer(signedPdfBuffer);
  await uploadToS3AtKey(doc.s3_key, encrypted);

  doc.signed = true;
  doc.signed_at = new Date();
  doc.signature_id = signingRequestId;
  doc.signed_expired = false;
  doc.viewer_policy = 'download_allowed';
  await doc.save();

  return { success: true };
}

