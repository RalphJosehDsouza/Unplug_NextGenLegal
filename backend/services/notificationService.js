import nodemailer from 'nodemailer';
import axios from 'axios';

function smtpTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

export async function sendEmail(to, subject, htmlBody) {
  const transport = smtpTransport();
  if (!transport) return;
  await transport.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject,
    html: htmlBody,
  });
}

export function emailTemplate({ title, bodyHtml, ctaUrl, ctaLabel = 'View Dashboard', theme = 'indigo' }) {
  const headerBg = theme === 'red' ? '#dc2626' : '#4f46e5';
  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: Arial, sans-serif; background: #f6f7fb; margin: 0; padding: 0; }
        .wrap { max-width: 720px; margin: 0 auto; padding: 28px; }
        .card { background: #fff; border-radius: 14px; border: 1px solid #e7e8f0; overflow: hidden; }
        .header { background: ${headerBg}; color: #fff; padding: 18px 20px; font-weight: 800; }
        .content { padding: 22px 20px; color: #111; }
        .cta { display: inline-block; background: ${headerBg}; color: #fff; text-decoration: none; padding: 10px 14px; border-radius: 10px; margin-top: 16px; }
        .muted { color: #666; font-size: 12px; margin-top: 14px; line-height: 1.4; }
        table { width: 100%; border-collapse: collapse; margin-top: 14px; }
        td { padding: 10px 8px; border-bottom: 1px solid #eee; font-size: 14px; vertical-align: top; }
      </style>
    </head>
    <body>
      <div class="wrap">
        <div class="card">
          <div class="header">NextGenLegal</div>
          <div class="content">
            <div style="font-size:16px; font-weight:800; margin-bottom:10px;">${title}</div>
            ${bodyHtml}
            ${ctaUrl ? `<a class="cta" href="${ctaUrl}">${ctaLabel}</a>` : ''}
            <div class="muted">If you didn’t request this, you can ignore this message.</div>
          </div>
        </div>
      </div>
    </body>
  </html>`;
}

export async function sendSMS(phone, message) {
  const authkey = process.env.MSG91_AUTH_KEY;
  const flow_id = process.env.MSG91_SMS_FLOW_ID;
  const sender = process.env.MSG91_SMS_SENDER || 'FromAPI';
  if (!authkey || !flow_id) return;

  const mobileDigits = String(phone || '').replace(/\D/g, '');
  if (!mobileDigits) return;
  const mobiles = mobileDigits.startsWith('91') ? mobileDigits : `91${mobileDigits}`;

  const msg = String(message || '').slice(0, 160);

  await axios.post(
    'https://control.msg91.com/api/v5/flow/',
    {
      flow_id,
      sender,
      recipients: [{ mobiles, VAR1: msg }],
    },
    { headers: { authkey } },
  );
}

export async function sendWhatsApp(phone, templateName, vars) {
  const authkey = process.env.MSG91_AUTH_KEY;
  const endpoint = process.env.MSG91_WHATSAPP_ENDPOINT;
  if (!authkey || !endpoint) return;

  const mobileDigits = String(phone || '').replace(/\D/g, '');
  if (!mobileDigits) return;

  await axios.post(
    endpoint,
    {
      templateName,
      recipients: [{ mobile: mobileDigits, ...vars }],
    },
    { headers: { authkey } },
  );
}

