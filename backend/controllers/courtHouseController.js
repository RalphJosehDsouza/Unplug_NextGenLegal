import { Op } from 'sequelize';

import {
  ActivityLog,
  CaseType,
  CaseTypeRequiredDocument,
  CourtHearing,
  CourtHearingDocument,
  Document,
  Notification,
  User,
} from '../models/index.js';
import { encryptBuffer, uploadToS3 } from '../services/documentService.js';

function getClientIp(req) {
  const headerVal = req.headers['x-forwarded-for'];
  if (typeof headerVal === 'string' && headerVal.trim()) {
    return headerVal.split(',')[0].trim();
  }
  return req.ip || 'unknown';
}

async function findOwnedHearingOrThrow({ hearingId, lawyerId }) {
  const hearing = await CourtHearing.findOne({ where: { id: hearingId, lawyer_id: lawyerId } });
  if (!hearing) {
    throw { statusCode: 404, message: 'Court hearing not found' };
  }
  return hearing;
}

function normalizeMimeList(list) {
  if (!Array.isArray(list)) return [];
  return list.map((v) => String(v).toLowerCase());
}

async function loadChecklist({ hearingId, caseTypeId }) {
  const [requirements, uploads] = await Promise.all([
    CaseTypeRequiredDocument.findAll({
      where: { case_type_id: caseTypeId },
      order: [['sort_order', 'ASC'], ['label', 'ASC']],
      attributes: ['id', 'code', 'label', 'description', 'allowed_mime', 'required', 'sort_order'],
    }),
    CourtHearingDocument.findAll({
      where: { court_hearing_id: hearingId },
      include: [
        {
          model: Document,
          as: 'document',
          attributes: ['id', 'title', 'mime_type', 'created_at'],
        },
      ],
      attributes: ['id', 'required_document_id', 'uploaded_at', 'uploaded_by'],
    }),
  ]);

  const byRequirementId = new Map();
  for (const item of uploads) {
    byRequirementId.set(item.required_document_id, item);
  }

  return requirements.map((reqDoc) => {
    const uploaded = byRequirementId.get(reqDoc.id);
    return {
      id: reqDoc.id,
      code: reqDoc.code,
      label: reqDoc.label,
      description: reqDoc.description,
      allowed_mime: reqDoc.allowed_mime || [],
      required: reqDoc.required,
      sort_order: reqDoc.sort_order,
      uploaded: Boolean(uploaded),
      upload: uploaded
        ? {
            id: uploaded.id,
            uploaded_at: uploaded.uploaded_at,
            uploaded_by: uploaded.uploaded_by,
            document: uploaded.document,
          }
        : null,
    };
  });
}

function summarizeChecklist(checklist) {
  const required = checklist.filter((c) => c.required);
  const uploaded = required.filter((c) => c.uploaded);
  return {
    total_required: required.length,
    uploaded_required: uploaded.length,
    missing_required: required.length - uploaded.length,
    complete: required.length > 0 && uploaded.length === required.length,
  };
}

export async function listCaseTypes(req, res, next) {
  try {
    const caseTypes = await CaseType.findAll({
      where: { active: true },
      include: [
        {
          model: CaseTypeRequiredDocument,
          as: 'required_documents',
          attributes: ['id', 'code', 'label', 'description', 'allowed_mime', 'required', 'sort_order'],
        },
      ],
      order: [
        ['name', 'ASC'],
        [{ model: CaseTypeRequiredDocument, as: 'required_documents' }, 'sort_order', 'ASC'],
      ],
    });

    return res.json({ success: true, data: { case_types: caseTypes } });
  } catch (err) {
    return next(err);
  }
}

export async function createHearing(req, res, next) {
  try {
    const lawyerId = req.user.id;
    const topic = String(req.body?.topic || '').trim();
    const description = String(req.body?.description || '').trim();
    const hearingAt = req.body?.hearing_at;
    const caseTypeId = String(req.body?.case_type_id || '').trim();

    if (!topic) return next({ statusCode: 400, message: 'topic is required' });
    if (!hearingAt) return next({ statusCode: 400, message: 'hearing_at is required' });
    if (!caseTypeId) return next({ statusCode: 400, message: 'case_type_id is required' });

    const caseType = await CaseType.findOne({ where: { id: caseTypeId, active: true } });
    if (!caseType) return next({ statusCode: 400, message: 'Invalid case type' });

    const hearing = await CourtHearing.create({
      lawyer_id: lawyerId,
      case_type_id: caseTypeId,
      topic,
      description: description || null,
      hearing_at: new Date(hearingAt),
      status: 'scheduled',
    });

    await ActivityLog.create({
      user_id: lawyerId,
      action: 'courthouse.hearing.created',
      resource_type: 'court_hearing',
      resource_id: hearing.id,
      ip_address: getClientIp(req),
    });

    return res.status(201).json({ success: true, data: { hearing_id: hearing.id } });
  } catch (err) {
    return next(err);
  }
}

export async function listHearings(req, res, next) {
  try {
    const lawyerId = req.user.id;

    const hearings = await CourtHearing.findAll({
      where: { lawyer_id: lawyerId },
      include: [
        {
          model: CaseType,
          as: 'caseType',
          attributes: ['id', 'name', 'slug'],
        },
      ],
      order: [['hearing_at', 'ASC']],
    });

    const result = await Promise.all(
      hearings.map(async (hearing) => {
        const checklist = await loadChecklist({ hearingId: hearing.id, caseTypeId: hearing.case_type_id });
        return {
          id: hearing.id,
          topic: hearing.topic,
          description: hearing.description,
          hearing_at: hearing.hearing_at,
          status: hearing.status,
          case_type: hearing.caseType,
          checklist_summary: summarizeChecklist(checklist),
        };
      }),
    );

    return res.json({ success: true, data: { hearings: result } });
  } catch (err) {
    return next(err);
  }
}

export async function getHearing(req, res, next) {
  try {
    const lawyerId = req.user.id;
    const hearingId = req.params.id;

    const hearing = await CourtHearing.findOne({
      where: { id: hearingId, lawyer_id: lawyerId },
      include: [
        {
          model: CaseType,
          as: 'caseType',
          attributes: ['id', 'name', 'slug'],
        },
      ],
    });

    if (!hearing) return next({ statusCode: 404, message: 'Court hearing not found' });

    const checklist = await loadChecklist({ hearingId: hearing.id, caseTypeId: hearing.case_type_id });

    return res.json({
      success: true,
      data: {
        hearing: {
          id: hearing.id,
          topic: hearing.topic,
          description: hearing.description,
          hearing_at: hearing.hearing_at,
          status: hearing.status,
          case_type: hearing.caseType,
          checklist,
          checklist_summary: summarizeChecklist(checklist),
        },
      },
    });
  } catch (err) {
    return next(err);
  }
}

export async function uploadRequiredDocument(req, res, next) {
  try {
    const lawyerId = req.user.id;
    const hearingId = req.params.id;
    const requirementId = req.params.requirementId;

    const hearing = await findOwnedHearingOrThrow({ hearingId, lawyerId });
    const requirement = await CaseTypeRequiredDocument.findOne({
      where: {
        id: requirementId,
        case_type_id: hearing.case_type_id,
      },
    });

    if (!requirement) {
      return next({ statusCode: 400, message: 'Invalid requirement for this hearing' });
    }

    const file = req.file;
    if (!file) return next({ statusCode: 400, message: 'File is required' });

    const allowedMime = normalizeMimeList(requirement.allowed_mime);
    if (allowedMime.length > 0 && !allowedMime.includes(String(file.mimetype || '').toLowerCase())) {
      return next({
        statusCode: 400,
        message: `Invalid file type. Allowed: ${allowedMime.join(', ')}`,
      });
    }

    const titleRaw = String(req.body?.title || `${hearing.topic} - ${requirement.label}`).trim();
    const title = titleRaw.slice(0, 120);

    const { encrypted, key } = encryptBuffer(file.buffer);
    const s3Key = await uploadToS3(lawyerId, encrypted, title);

    const owner = await User.findByPk(lawyerId, { attributes: ['full_name'] });

    const doc = await Document.create({
      user_id: lawyerId,
      doc_type: 'uploaded_pdf',
      title,
      source_type: 'uploaded',
      mime_type: file.mimetype || 'application/octet-stream',
      file_size_bytes: file.size || file.buffer.length,
      uploader_name: owner?.full_name || null,
      viewer_policy: 'view_only',
      share_scope: 'owner_only',
      s3_key: s3Key,
      encryption_key: key,
      signed: false,
      signed_at: null,
    });

    const existing = await CourtHearingDocument.findOne({
      where: {
        court_hearing_id: hearing.id,
        required_document_id: requirement.id,
      },
    });

    if (existing) {
      existing.document_id = doc.id;
      existing.uploaded_by = lawyerId;
      existing.uploaded_at = new Date();
      await existing.save();
    } else {
      await CourtHearingDocument.create({
        court_hearing_id: hearing.id,
        required_document_id: requirement.id,
        document_id: doc.id,
        uploaded_by: lawyerId,
      });
    }

    await ActivityLog.create({
      user_id: lawyerId,
      action: 'courthouse.requirement.uploaded',
      resource_type: 'court_hearing',
      resource_id: hearing.id,
      ip_address: getClientIp(req),
    });

    const checklist = await loadChecklist({ hearingId: hearing.id, caseTypeId: hearing.case_type_id });

    return res.status(201).json({
      success: true,
      data: {
        document_id: doc.id,
        checklist_summary: summarizeChecklist(checklist),
      },
    });
  } catch (err) {
    if (err?.statusCode) return next(err);
    return next(err);
  }
}

export async function listMissingReminderCandidates({ start, end }) {
  const hearings = await CourtHearing.findAll({
    where: {
      hearing_at: { [Op.between]: [start, end] },
      status: 'scheduled',
    },
    include: [
      {
        model: CaseType,
        as: 'caseType',
        attributes: ['id', 'name'],
        include: [
          {
            model: CaseTypeRequiredDocument,
            as: 'required_documents',
            where: { required: true },
            required: false,
            attributes: ['id', 'label'],
          },
        ],
      },
      {
        model: CourtHearingDocument,
        as: 'uploads',
        attributes: ['required_document_id'],
      },
    ],
    order: [['hearing_at', 'ASC']],
  });

  return hearings.map((hearing) => {
    const requiredDocs = hearing.caseType?.required_documents || [];
    const uploadedIds = new Set((hearing.uploads || []).map((u) => u.required_document_id));
    const missing = requiredDocs.filter((d) => !uploadedIds.has(d.id));
    return {
      hearing,
      missing,
    };
  });
}

export async function createCourtReminderNotification({ userId, hearingId, title, body }) {
  return Notification.create({
    user_id: userId,
    title,
    body,
    type: 'court_hearing',
    resource_id: hearingId,
    read: false,
  });
}
