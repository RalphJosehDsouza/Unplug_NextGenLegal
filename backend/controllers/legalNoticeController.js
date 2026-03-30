import { Document, LegalNoticeTracking } from '../models/index.js';
import { generatePDF, encryptBuffer, uploadToS3 } from '../services/documentService.js';

function formatDateHuman(d) {
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toLocaleDateString('en-IN');
}

function addDays(d, days) {
  const dt = d instanceof Date ? new Date(d) : new Date(d);
  dt.setDate(dt.getDate() + days);
  return dt;
}

function buildOpeningText({ notice_type, sender_name }) {
  const s = sender_name || 'my client';
  switch (notice_type) {
    case 'cheque_bounce_138':
      return `Under instructions from my client ${s}, I hereby serve upon you this Legal Notice under Section 138 of the Negotiable Instruments Act, 1881.`;
    case 'consumer_complaint':
      return `Under instructions from my client ${s}, I hereby serve upon you this Legal Notice for resolution of your deficiency in service / unfair trade practice under applicable provisions of consumer law.`;
    case 'property_dispute':
      return `Under instructions from my client ${s}, I hereby serve upon you this Legal Notice relating to the property dispute and call upon you to take appropriate action as set out herein.`;
    case 'employment_dispute':
      return `Under instructions from my client ${s}, I hereby serve upon you this Legal Notice seeking redress for employment-related grievance as described herein.`;
    case 'rent_recovery':
      return `Under instructions from my client ${s}, I hereby serve upon you this Legal Notice for recovery of rent and/or possession and call upon you to comply with the demands set out herein.`;
    case 'defamation':
      return `Under instructions from my client ${s}, I hereby serve upon you this Legal Notice demanding cessation and retraction of defamatory statements and compliance as set out herein.`;
    case 'custom':
      return `Under instructions from my client ${s}, I hereby serve upon you this Legal Notice as per the facts and relief sought described herein.`;
    default:
      return `Under instructions from my client ${s}, I hereby serve upon you this Legal Notice with the demands set out herein.`;
  }
}

export async function generateLegalNotice(req, res, next) {
  try {
    const userId = req.user.id;
    const {
      notice_type,
      sender_name,
      sender_address,
      sender_advocate_name,
      recipient_name,
      recipient_address,
      subject,
      facts_and_circumstances,
      relief_sought,
      response_deadline_days,
      city,
      date,
    } = req.body || {};

    const responseDays = Number(response_deadline_days ?? 30);
    const generatedDate = date ? new Date(date) : new Date();
    const responseDeadline = addDays(generatedDate, responseDays);

    if (!notice_type) return next({ statusCode: 400, message: 'notice_type is required' });
    if (!sender_name || !sender_address) return next({ statusCode: 400, message: 'Sender details are required' });
    if (!recipient_name || !recipient_address) return next({ statusCode: 400, message: 'Recipient details are required' });
    if (!subject) return next({ statusCode: 400, message: 'subject is required' });
    if (!facts_and_circumstances) return next({ statusCode: 400, message: 'facts_and_circumstances is required' });
    if (!relief_sought) return next({ statusCode: 400, message: 'relief_sought is required' });
    if (!city) return next({ statusCode: 400, message: 'city is required' });

    const opening_text = buildOpeningText({ notice_type, sender_name });

    const templateFields = {
      notice_type,
      sender_name,
      sender_address,
      sender_advocate_name: sender_advocate_name || '',
      recipient_name,
      recipient_address,
      subject,
      facts_and_circumstances,
      relief_sought,
      response_deadline_days: responseDays,
      city,
      date: formatDateHuman(generatedDate),
      opening_text,
    };

    const pdfBuffer = await generatePDF('legal_notice', templateFields);
    const { encrypted, key } = encryptBuffer(pdfBuffer);
    const title = `Legal Notice (${notice_type}) - ${formatDateHuman(generatedDate)}`;
    const s3Key = await uploadToS3(userId, encrypted, title);

    const doc = await Document.create({
      user_id: userId,
      doc_type: 'legal_notice',
      title,
      source_type: 'generated',
      mime_type: 'application/pdf',
      file_size_bytes: pdfBuffer.length,
      uploader_name: null,
      viewer_policy: 'download_allowed',
      share_scope: 'owner_only',
      s3_key: s3Key,
      encryption_key: key,
      signed: false,
      signed_at: null,
      signature_id: null,
      signed_expired: false,
      estamped: false,
    });

    return res.json({
      success: true,
      data: {
        document_id: doc.id,
        notice_type,
        response_deadline: responseDeadline.toISOString(),
      },
    });
  } catch (err) {
    return next(err);
  }
}

export async function trackDelivery(req, res, next) {
  try {
    const userId = req.user.id;
    const docId = req.params.id;
    const {
      postal_tracking_number,
      sent_via,
      sent_at,
    } = req.body || {};

    const doc = await Document.findByPk(docId);
    if (!doc) return next({ statusCode: 404, message: 'Document not found' });
    if (doc.user_id !== userId) return next({ statusCode: 403, message: 'Forbidden' });
    if (doc.doc_type !== 'legal_notice') return next({ statusCode: 400, message: 'Not a legal notice document' });

    if (!postal_tracking_number) return next({ statusCode: 400, message: 'postal_tracking_number is required' });
    if (!sent_via) return next({ statusCode: 400, message: 'sent_via is required' });
    if (!sent_at) return next({ statusCode: 400, message: 'sent_at is required' });

    const sentAtDate = new Date(sent_at);
    const responseDeadline = addDays(sentAtDate, 30);

    const tracking = await LegalNoticeTracking.create({
      document_id: doc.id,
      tracking_number: postal_tracking_number,
      sent_via,
      sent_at: sentAtDate,
      delivered_at: null,
      response_deadline: responseDeadline,
      response_received: false,
    });

    const ms = responseDeadline.getTime() - Date.now();
    const daysRemaining = Math.ceil(ms / (24 * 60 * 60 * 1000));

    return res.json({
      success: true,
      data: {
        tracking_id: tracking.id,
        response_deadline: responseDeadline.toISOString(),
        days_remaining: daysRemaining,
      },
    });
  } catch (err) {
    return next(err);
  }
}

export async function getTracking(req, res, next) {
  try {
    const userId = req.user.id;

    const trackings = await LegalNoticeTracking.findAll({
      include: [
        {
          model: Document,
          as: 'document',
          attributes: ['id', 'title', 'created_at', 'doc_type'],
          where: { user_id: userId },
          required: true,
        },
      ],
      order: [['sent_at', 'DESC']],
    });

    const now = Date.now();
    const items = trackings.map((t) => {
      const daysRemaining = Math.ceil((new Date(t.response_deadline).getTime() - now) / (24 * 60 * 60 * 1000));
      const delivered = Boolean(t.delivered_at);
      const actionRequired = daysRemaining < 7 && !t.response_received;

      return {
        tracking_id: t.id,
        document_id: t.document_id,
        notice_title: t.document?.title || null,
        tracking_number: t.tracking_number,
        sent_via: t.sent_via,
        sent_at: t.sent_at,
        delivered_at: t.delivered_at,
        response_deadline: t.response_deadline,
        response_received: t.response_received,
        days_remaining: daysRemaining,
        status: delivered ? 'Delivered' : 'Pending delivery',
        action_required: actionRequired,
      };
    });

    return res.json({ success: true, data: { trackings: items } });
  } catch (err) {
    return next(err);
  }
}

