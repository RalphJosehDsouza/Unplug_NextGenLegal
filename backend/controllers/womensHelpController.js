import { Document } from '../models/index.js';
import { generatePDF, encryptBuffer, uploadToS3 } from '../services/documentService.js';

function getDateOnly(d) {
  return d.toISOString().slice(0, 10);
}

export async function generatePwdvaApplication(req, res, next) {
  try {
    const userId = req.user.id;
    const {
      applicant_name,
      applicant_address,
      respondent_name,
      respondent_address,
      relationship,
      incident_description,
      reliefs_sought,
      children_details,
      court_name,
      district,
      date,
    } = req.body || {};

    if (!applicant_address || !respondent_name || !respondent_address || !incident_description || !court_name || !district) {
      return next({ statusCode: 400, message: 'Missing required fields for application generation' });
    }

    const appName = applicant_name || req.user.full_name || 'Applicant';
    const reliefList = Array.isArray(reliefs_sought) ? reliefs_sought : [];

    const pdfBuffer = await generatePDF('pwdva_application', {
      date: date || getDateOnly(new Date()),
      applicant_name: appName,
      applicant_address,
      respondent_name: respondent_name || '',
      respondent_address: respondent_address || '',
      relationship: relationship || '',
      incident_description: incident_description || '',
      reliefs_sought: reliefList,
      children_details: children_details || '',
      court_name,
      district,
    });

    const { encrypted, key } = encryptBuffer(pdfBuffer);
    const s3Key = await uploadToS3(userId, encrypted, `PWDVA_${court_name}`.slice(0, 80));

    const doc = await Document.create({
      user_id: userId,
      doc_type: 'pwdva_application',
      title: 'Protection Order Application (PWDVA 2005)',
      source_type: 'generated',
      mime_type: 'application/pdf',
      file_size_bytes: pdfBuffer.length,
      uploader_name: req.user?.full_name || null,
      viewer_policy: 'download_allowed',
      share_scope: 'owner_only',
      s3_key: s3Key,
      encryption_key: key,
      signed: false,
      signed_at: null,
      signature_id: null,
      signed_expired: false,
    });

    return res.status(201).json({
      success: true,
      data: {
        document_id: doc.id,
        message: 'Protection Order application generated.',
      },
    });
  } catch (err) {
    return next(err);
  }
}

