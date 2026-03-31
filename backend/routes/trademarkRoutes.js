import { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { requireTier } from '../middleware/tierMiddleware.js';
import { TrademarkApplication } from '../models/index.js';

const router = Router();

// Create draft
router.post('/apply', authMiddleware, requireTier('business'), async (req, res, next) => {
  try {
    const { mark_type, trademark_name, trademark_description, logo_url, nice_classes, applicant_name, applicant_address, applicant_type } = req.body;
    if (!mark_type || !trademark_name || !applicant_name) {
      return next({ statusCode: 400, message: 'mark_type, trademark_name, and applicant_name are required' });
    }
    const app = await TrademarkApplication.create({
      user_id: req.user.id,
      mark_type, trademark_name, trademark_description, logo_url,
      nice_classes: nice_classes || [],
      applicant_name, applicant_address, applicant_type: applicant_type || 'individual',
    });
    res.status(201).json({ success: true, data: app });
  } catch (err) { next(err); }
});

// List
router.get('/applications', authMiddleware, async (req, res, next) => {
  try {
    const list = await TrademarkApplication.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
    });
    res.json({ success: true, data: list });
  } catch (err) { next(err); }
});

// Detail
router.get('/applications/:id', authMiddleware, async (req, res, next) => {
  try {
    const app = await TrademarkApplication.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!app) return next({ statusCode: 404, message: 'Application not found' });
    res.json({ success: true, data: app });
  } catch (err) { next(err); }
});

// AI Conflict check
router.post('/applications/:id/conflict-check', authMiddleware, requireTier('business'), async (req, res, next) => {
  try {
    const app = await TrademarkApplication.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!app) return next({ statusCode: 404, message: 'Application not found' });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return next({ statusCode: 500, message: 'AI service not configured' });

    const prompt = `Analyze potential trademark conflicts for the following mark in India:
Mark Name: "${app.trademark_name}"
Mark Type: ${app.mark_type}
Description: ${app.trademark_description || 'N/A'}
Nice Classes: ${(app.nice_classes || []).join(', ') || 'N/A'}

Return a JSON object with:
- risk_level: "low" | "medium" | "high"
- similar_marks: array of { name, class, similarity_reason }
- likelihood_of_confusion: string explanation
- recommendation: string
- overall_assessment: string (2-3 sentences)

Return ONLY valid JSON, no markdown.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 4096, temperature: 0.3 },
      }),
    });
    const data = await resp.json();
    let text = data?.candidates?.[0]?.content?.parts?.map(p => p?.text).filter(Boolean).join('') || '{}';
    text = text.replace(/^```json?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

    let report;
    try { report = JSON.parse(text); } catch { report = { risk_level: 'medium', overall_assessment: text }; }

    await app.update({ conflict_report: report, status: 'conflict_checked' });
    res.json({ success: true, data: { application: app, conflict_report: report } });
  } catch (err) { next(err); }
});

// Generate TM-A form
router.post('/applications/:id/generate-forms', authMiddleware, requireTier('business'), async (req, res, next) => {
  try {
    const app = await TrademarkApplication.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!app) return next({ statusCode: 404, message: 'Application not found' });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return next({ statusCode: 500, message: 'AI service not configured' });

    const prompt = `Generate a complete Indian Trademark Application Form TM-A in HTML format.
Trademark: ${app.trademark_name}
Type: ${app.mark_type}
Description: ${app.trademark_description || 'N/A'}
Nice Classes: ${(app.nice_classes || []).join(', ')}
Applicant: ${app.applicant_name}
Address: ${app.applicant_address || 'N/A'}
Applicant Type: ${app.applicant_type}

Output ONLY valid HTML with inline CSS. Make it look like an official Indian government form.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 8192, temperature: 0.2 },
      }),
    });
    const data = await resp.json();
    let html = data?.candidates?.[0]?.content?.parts?.map(p => p?.text).filter(Boolean).join('') || '';
    html = html.replace(/^```html?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

    const docs = [{ name: 'TM-A Application Form', html_preview: html.substring(0, 500), generated: true }];
    await app.update({ status: 'documents_generated', generated_documents: docs });
    res.json({ success: true, data: { application: app, documents: docs } });
  } catch (err) { next(err); }
});

export default router;
