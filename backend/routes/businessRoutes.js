import { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { requireTier } from '../middleware/tierMiddleware.js';
import { BusinessRegistration } from '../models/index.js';

const router = Router();

// Create a new business registration draft
router.post('/register', authMiddleware, requireTier('business'), async (req, res, next) => {
  try {
    const { entity_type, company_name, state, registered_address, directors, authorized_capital, paid_up_capital, main_objects } = req.body;
    if (!entity_type || !company_name || !state) {
      return next({ statusCode: 400, message: 'entity_type, company_name, and state are required' });
    }
    const reg = await BusinessRegistration.create({
      user_id: req.user.id,
      entity_type, company_name, state, registered_address,
      directors: directors || [],
      authorized_capital, paid_up_capital, main_objects,
    });
    res.status(201).json({ success: true, data: reg });
  } catch (err) { next(err); }
});

// List user's registrations
router.get('/registrations', authMiddleware, async (req, res, next) => {
  try {
    const list = await BusinessRegistration.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
    });
    res.json({ success: true, data: list });
  } catch (err) { next(err); }
});

// Get single registration
router.get('/registrations/:id', authMiddleware, async (req, res, next) => {
  try {
    const reg = await BusinessRegistration.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!reg) return next({ statusCode: 404, message: 'Registration not found' });
    res.json({ success: true, data: reg });
  } catch (err) { next(err); }
});

// Update draft
router.put('/registrations/:id', authMiddleware, async (req, res, next) => {
  try {
    const reg = await BusinessRegistration.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!reg) return next({ statusCode: 404, message: 'Registration not found' });
    const { company_name, state, registered_address, directors, authorized_capital, paid_up_capital, main_objects } = req.body;
    await reg.update({ company_name, state, registered_address, directors, authorized_capital, paid_up_capital, main_objects });
    res.json({ success: true, data: reg });
  } catch (err) { next(err); }
});

// Generate incorporation documents via Gemini AI
router.post('/registrations/:id/generate-docs', authMiddleware, requireTier('business'), async (req, res, next) => {
  try {
    const reg = await BusinessRegistration.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!reg) return next({ statusCode: 404, message: 'Registration not found' });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return next({ statusCode: 500, message: 'AI service not configured' });

    const entityLabel = reg.entity_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const directorsText = (reg.directors || []).map((d, i) => `Director ${i+1}: ${d.name}, Address: ${d.address || 'N/A'}, DIN: ${d.din || 'N/A'}`).join('\n');

    const docs = [];
    const docTypes = ['Memorandum of Association (MOA)', 'Articles of Association (AOA)', 'Director Consent Letter'];

    for (const docType of docTypes) {
      const prompt = `Generate a complete, professional ${docType} for a ${entityLabel} company in India.
Company Name: ${reg.company_name}
State: ${reg.state}
Registered Address: ${reg.registered_address || 'TBD'}
Directors:\n${directorsText || 'TBD'}
Authorized Capital: ₹${reg.authorized_capital || 'TBD'}
Main Objects: ${reg.main_objects || 'TBD'}

Output ONLY valid HTML with inline CSS. Professional legal formatting. Include proper numbered clauses, schedules, signature blocks, witness sections.`;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: 'You are an Indian corporate law document generator. Output ONLY valid HTML.' }] },
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 8192, temperature: 0.2 },
        }),
      });
      const data = await resp.json();
      let html = data?.candidates?.[0]?.content?.parts?.map(p => p?.text).filter(Boolean).join('') || '';
      html = html.replace(/^```html?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
      docs.push({ name: docType, html_preview: html.substring(0, 500), generated: true });
    }

    await reg.update({ status: 'documents_generated', generated_documents: docs });
    res.json({ success: true, data: { registration: reg, documents: docs } });
  } catch (err) { next(err); }
});

export default router;
