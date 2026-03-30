import { Document, ComplianceTask } from '../models/index.js';
import { generatePDF, encryptBuffer, uploadToS3 } from '../services/documentService.js';
import { identifyPIO, generateRTIText } from '../services/rtiService.js';

function getDateOnly(d) {
  return d.toISOString().slice(0, 10);
}

function computeResponseDeadline(now = new Date(), days = 30) {
  const dt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return getDateOnly(dt);
}

function computeFeeDetails(pio, bpl_exempt) {
  if (bpl_exempt) return 'BPL cardholder: RTI application fee is waived.';

  const feeMode = pio?.fee_mode || 'IPO';
  const feeModeText =
    feeMode === 'IPO'
      ? 'IPO/DD'
      : feeMode === 'DD'
        ? 'Demand Draft (DD)'
        : feeMode === 'online'
          ? 'online portal'
          : feeMode === 'court_fee_stamp'
            ? 'court fee stamp'
            : 'the prescribed mode';

  return `Application fee: ₹10 payable via ${feeModeText} (as applicable to this department).`;
}

export async function searchPio(req, res, next) {
  try {
    const { department, state } = req.body || {};
    const results = identifyPIO(department, state);
    return res.json({ success: true, data: { matches: results } });
  } catch (err) {
    return next(err);
  }
}

export async function generateRti(req, res, next) {
  try {
    const userId = req.user.id;
    const {
      department,
      state,
      pio,
      applicant_name,
      applicant_address,
      applicant_phone,
      applicant_email,
      information_sought,
      bpl_exempt,
      ai_enhance,
    } = req.body || {};

    if (!department || !applicant_name || !applicant_address || !information_sought) {
      return next({ statusCode: 400, message: 'Missing required fields' });
    }

    const pioMatches = identifyPIO(department, state);
    const selectedPio = pio || pioMatches?.[0] || null;
    if (!selectedPio) return next({ statusCode: 404, message: 'No PIO found for this department/state' });

    const feeDetails = computeFeeDetails(selectedPio, Boolean(bpl_exempt));
    const information_sought_text = await generateRTIText(
      {
        applicant_name,
        applicant_address,
        department: selectedPio?.department || department,
        information_sought,
        pio_designation: selectedPio?.pio_designation,
        pio_name: selectedPio?.pio_name,
        fee_mode: selectedPio?.fee_mode,
        fee_details: feeDetails,
        bpl_exempt: Boolean(bpl_exempt),
      },
      Boolean(ai_enhance),
    );

    const date = getDateOnly(new Date());
    const pdfBuffer = await generatePDF('rti_application', {
      date,
      applicant_name,
      applicant_address,
      applicant_phone: applicant_phone || '',
      applicant_email: applicant_email || '',
      pio_name: selectedPio?.pio_name || 'Public Information Officer',
      pio_designation: selectedPio?.pio_designation || '',
      department: selectedPio?.department || department,
      department_address: selectedPio?.pio_address || '',
      information_sought_text,
      fee_details: feeDetails,
      bpl_exempt: Boolean(bpl_exempt),
      state: selectedPio?.state || state || '',
      online_portal_url: selectedPio?.online_portal_url || '',
    });

    const { encrypted, key } = encryptBuffer(pdfBuffer);
    const s3Key = await uploadToS3(userId, encrypted, `RTI_${department}`.slice(0, 80));

    const doc = await Document.create({
      user_id: userId,
      doc_type: 'rti_application',
      title: `RTI Application - ${department}`.slice(0, 120),
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

    // RTI reminders: notify user if PIO doesn't respond in 30 days.
    const response_deadline = computeResponseDeadline(new Date(), 30);
    await ComplianceTask.create({
      user_id: userId,
      task_type: 'rti_response',
      label: `RTI response from ${department}`,
      due_date: response_deadline,
      status: 'pending',
      notified_at: null,
      notes: `external_ref: ${doc.id}`,
      external_ref: doc.id,
    });

    return res.json({
      success: true,
      data: {
        document_id: doc.id,
        pio_details: selectedPio,
        response_deadline,
        tracking_created: true,
        generated_text: information_sought_text,
      },
    });
  } catch (err) {
    return next(err);
  }
}

