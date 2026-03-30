import crypto from 'crypto';

import { Document, User } from '../models/index.js';
import { initiateEsign, checkEsignStatus, downloadSignedDocument } from '../services/esignService.js';

function getLeegalityConfig() {
  const apiKey = process.env.LEEGALITY_API_KEY;
  const baseUrl = process.env.LEEGALITY_BASE_URL;
  if (!apiKey || !baseUrl) {
    throw new Error('Leegality configuration missing');
  }
  return { apiKey, baseUrl };
}

function mapSignatureType(type) {
  const t = String(type || '').toUpperCase();
  if (t === 'AADHAAR') return 'AADHAAR';
  if (t === 'CLICK' || t === 'CLICK_TO_SIGN' || t === 'CLICK2SIGN') return 'CLICK';
  // Default to CLICK for safety (avoids Aadhaar-specific validation errors).
  return 'CLICK';
}

export async function initiateDocumentEsign(req, res, next) {
  try {
    const docId = req.params.id;
    const signatories = Array.isArray(req.body?.signatories) ? req.body.signatories : [];

    const doc = await Document.findByPk(docId);
    if (!doc) return next({ statusCode: 404, message: 'Document not found' });
    if (doc.user_id !== req.user.id) return next({ statusCode: 403, message: 'Forbidden' });

    if (signatories.length === 0) {
      return next({ statusCode: 400, message: 'signatories are required' });
    }

    const owner = await User.findByPk(doc.user_id, { attributes: ['email', 'phone', 'full_name'] });
    if (!owner) return next({ statusCode: 404, message: 'Document owner not found' });

    // Must include owner as first signatory.
    const first = signatories[0];
    if (!first || String(first.email || '').toLowerCase() !== String(owner.email || '').toLowerCase()) {
      return next({ statusCode: 400, message: 'Document owner must be the first signatory' });
    }

    const mappedSignatories = signatories.map((s, idx) => ({
      // For the owner (index 0), overwrite name/email/phone from the DB to avoid token payload gaps.
      name: idx === 0 ? owner.full_name || '' : s?.name || '',
      email: idx === 0 ? owner.email || '' : s?.email || '',
      phone: idx === 0 ? owner.phone || '' : s?.phone || '',
      signatureType: mapSignatureType(s?.type),
    }));

    let result;
    try {
      result = await initiateEsign(docId, mappedSignatories);
    } catch (err) {
      // Leegality error mapping
      const status = err?.response?.status;
      const code = err?.response?.data?.error || err?.response?.data?.code || err?.response?.data?.error_code;
      if (status === 422 && String(code || '').includes('AADHAAR_INVALID')) {
        return next({ statusCode: 422, message: 'Invalid Aadhaar. Please verify and try again.' });
      }
      return next({ statusCode: 502, message: 'E-sign service temporarily unavailable' });
    }

    const signingRequestId = result.signingRequestId;
    if (!signingRequestId) {
      return next({ statusCode: 502, message: 'E-sign initiation failed' });
    }

    doc.signature_id = signingRequestId;
    doc.signed = false;
    doc.signed_at = null;
    doc.signed_expired = false;
    await doc.save();

    return res.json({
      success: true,
      data: {
        signing_url: result.inviteLink,
        message: 'Signing link sent to all parties via email',
      },
    });
  } catch (err) {
    return next(err);
  }
}

export async function getDocumentEsignStatus(req, res, next) {
  try {
    const docId = req.params.id;
    const doc = await Document.findByPk(docId);
    if (!doc) return next({ statusCode: 404, message: 'Document not found' });
    if (doc.user_id !== req.user.id) return next({ statusCode: 403, message: 'Forbidden' });

    if (!doc.signature_id) {
      return res.json({
        success: true,
        data: {
          status: 'PENDING',
          signatories: [],
          completed: false,
        },
      });
    }

    const statusResp = await checkEsignStatus(doc.signature_id);
    if (statusResp.status === 'COMPLETED') {
      await downloadSignedDocument(doc.signature_id);
      doc.signed = true;
    }

    return res.json({
      success: true,
      data: {
        status: statusResp.status,
        signatories: statusResp.signatories,
        completed: statusResp.status === 'COMPLETED',
      },
    });
  } catch (err) {
    return next(err);
  }
}

export async function leegalityWebhook(req, res, next) {
  try {
    const { apiKey } = getLeegalityConfig();

    // Webhook verification (best-effort): hash the JSON body.
    const signatureHeader = req.header('X-Leegality-Signature');
    const rawBodyStr = JSON.stringify(req.body || {});
    const computed = crypto.createHmac('sha256', apiKey).update(rawBodyStr).digest('hex');

    if (!signatureHeader || String(signatureHeader).toLowerCase() !== String(computed).toLowerCase()) {
      return res.status(401).send('Invalid signature');
    }

    const eventType =
      req.body?.event ||
      req.body?.type ||
      req.body?.data?.event ||
      req.body?.data?.type ||
      null;

    const signingRequestId =
      req.body?.signingRequestId ||
      req.body?.signing_request_id ||
      req.body?.data?.signingRequestId ||
      req.body?.data?.signing_request_id ||
      null;

    // 200 immediately; process async.
    res.status(200).send('OK');

    void (async () => {
      if (!eventType) return;

      if (eventType === 'DOCUMENT_SIGNED' && signingRequestId) {
        await downloadSignedDocument(signingRequestId);
      }

      if (eventType === 'DOCUMENT_EXPIRED' && signingRequestId) {
        const doc = await Document.findOne({ where: { signature_id: signingRequestId } });
        if (!doc) return;
        doc.signed_expired = true;
        await doc.save();
      }
    })();
  } catch (err) {
    // Avoid leaking signature verification details.
    return res.status(200).send('OK');
  }
}

