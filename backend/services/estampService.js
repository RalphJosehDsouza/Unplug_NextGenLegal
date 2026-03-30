import axios from 'axios';
import crypto from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PDFDocument } from 'pdf-lib';

import { encryptBuffer, downloadFromS3, uploadToS3AtKey } from './documentService.js';
import { Document } from '../models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let stampDutyConfigCache = null;

async function loadStampDutyConfig() {
  if (stampDutyConfigCache) return stampDutyConfigCache;
  const configPath = path.join(__dirname, '..', 'config', 'stampDuty.json');
  const raw = await fs.readFile(configPath, 'utf8');
  stampDutyConfigCache = JSON.parse(raw);
  return stampDutyConfigCache;
}

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

async function getDecryptedPdfBuffer(doc) {
  const encryptedBuffer = await downloadFromS3(doc.s3_key);
  return decryptPdf(encryptedBuffer, doc.encryption_key);
}

export async function getStampDuty(doc_type, state, property_value_paise) {
  const config = await loadStampDutyConfig();
  const s = String(state || 'MH').toUpperCase();
  const stateCfg = config[s] || config.MH;

  const rule = stateCfg?.[doc_type];
  if (!rule) {
    // If unknown, treat as no stamping required.
    return null;
  }

  const propertyPaise = Number(property_value_paise || 0);

  let stamp_duty_paise = 0;
  if (typeof rule.flat_rupees === 'number') {
    stamp_duty_paise = Math.round(rule.flat_rupees * 100);
  } else if (typeof rule.rate === 'number') {
    stamp_duty_paise = Math.round(propertyPaise * rule.rate);
    if (typeof rule.min_rupees === 'number') {
      stamp_duty_paise = Math.max(stamp_duty_paise, Math.round(rule.min_rupees * 100));
    }
    if (typeof rule.max_rupees === 'number') {
      stamp_duty_paise = Math.min(stamp_duty_paise, Math.round(rule.max_rupees * 100));
    }
  } else {
    stamp_duty_paise = 0;
  }

  return {
    stamp_duty_paise,
    article_number: rule.article_number || null,
    act_reference: rule.act_reference || null,
  };
}

export async function purchaseEStamp(doc_type, state, amount_paise, first_party_name, second_party_name) {
  const apiKey = process.env.ESTAMP_API_KEY;
  const baseUrl = process.env.ESTAMP_BASE_URL;
  if (!apiKey || !baseUrl) {
    throw new Error('eStamp configuration missing');
  }

  const considerationAmount = Number(amount_paise) / 100;

  const resp = await axios.post(
    `${baseUrl}/api/purchase`,
    {
      state,
      article_description: doc_type,
      consideration_amount: considerationAmount,
      first_party: first_party_name,
      second_party: second_party_name,
      stamp_duty: considerationAmount,
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    },
  );

  const data = resp?.data || {};
  const certificate_number = data?.estamp_certificate_number || data?.certificate_number || data?.certificateNumber;
  const estamp_pdf_url = data?.estamp_pdf_url || data?.pdf_url || data?.estampPdfUrl;

  if (!certificate_number || !estamp_pdf_url) {
    throw new Error('eStamp purchase did not return certificate/pdf');
  }

  const pdfResp = await axios.get(estamp_pdf_url, { responseType: 'arraybuffer' });
  const pdf_buffer = Buffer.from(pdfResp.data);

  return {
    certificate_number,
    pdf_buffer,
  };
}

export async function mergeStampWithDocument(documentBuffer, estampBuffer) {
  const estampPdf = await PDFDocument.load(estampBuffer);
  const docPdf = await PDFDocument.load(documentBuffer);

  const merged = await PDFDocument.create();

  // Stamp pages first, then original document pages.
  const estampPages = await merged.copyPages(estampPdf, estampPdf.getPageIndices());
  for (const p of estampPages) merged.addPage(p);

  const docPages = await merged.copyPages(docPdf, docPdf.getPageIndices());
  for (const p of docPages) merged.addPage(p);

  const out = await merged.save();
  return Buffer.from(out);
}

// Helper used by controller: decrypt, merge, then overwrite same S3 object.
export async function applyEStampToDocument({ docId, documentBuffer, estampPdfBuffer }) {
  const doc = await Document.findByPk(docId);
  if (!doc) throw new Error('Document not found');

  const merged = await mergeStampWithDocument(documentBuffer, estampPdfBuffer);
  const { encrypted, key } = encryptBuffer(merged);
  await uploadToS3AtKey(doc.s3_key, encrypted);
  doc.encryption_key = key;
  return doc;
}

export async function getDecryptedPdfBufferForDocumentId(docId) {
  const doc = await Document.findByPk(docId);
  if (!doc) throw new Error('Document not found');
  return getDecryptedPdfBuffer(doc);
}

