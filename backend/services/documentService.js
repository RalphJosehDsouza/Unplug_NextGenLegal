import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import handlebars from 'handlebars';
import puppeteer from 'puppeteer';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templatesDir = path.join(__dirname, '..', 'templates');

const s3 = new S3Client({
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function generatePDF(templateName, fields) {
  const templatePath = path.join(templatesDir, `${templateName}.hbs`);
  const templateStr = await fs.readFile(templatePath, 'utf8');

  const template = handlebars.compile(templateStr);
  const html = template(fields || {});

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '2cm',
        bottom: '2cm',
        left: '2cm',
        right: '2cm',
      },
    });
    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

export function encryptBuffer(buffer) {
  const key = crypto.randomBytes(32); // AES-256
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const encryptedChunks = [cipher.update(buffer), cipher.final()];
  const ciphertext = Buffer.concat(encryptedChunks);

  // Prepend IV so we can decrypt later.
  const encrypted = Buffer.concat([iv, ciphertext]);

  return {
    encrypted,
    key: key.toString('hex'),
    iv: iv.toString('hex'),
  };
}

function sanitizeFilename(name) {
  return String(name || '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-_]/g, '')
    .slice(0, 80);
}

export async function uploadToS3(userId, encryptedBuffer, filename) {
  const safeName = sanitizeFilename(filename) || 'document';
  const s3Key = `docs/${userId}/${Date.now()}-${safeName}.pdf.enc`;

  const cmd = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: s3Key,
    Body: encryptedBuffer,
    ContentType: 'application/octet-stream',
  });

  await s3.send(cmd);
  return s3Key;
}

export async function generatePresignedUrl(s3Key) {
  const cmd = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: s3Key,
  });

  // 900 seconds expiry
  return getSignedUrl(s3, cmd, { expiresIn: 900 });
}

async function streamToBuffer(stream) {
  if (!stream) return Buffer.alloc(0);

  // Node.js Readable stream
  if (typeof stream.pipe === 'function') {
    return await new Promise((resolve, reject) => {
      const chunks = [];
      stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }

  // For SDK environments that return Uint8Array/Buffer-like objects
  if (Buffer.isBuffer(stream)) return stream;
  if (stream instanceof Uint8Array) return Buffer.from(stream);

  return Buffer.alloc(0);
}

export async function downloadFromS3(s3Key) {
  const cmd = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: s3Key,
  });

  const resp = await s3.send(cmd);
  return streamToBuffer(resp.Body);
}

export async function deleteFromS3(s3Key) {
  const cmd = new DeleteObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: s3Key,
  });
  await s3.send(cmd);
}

