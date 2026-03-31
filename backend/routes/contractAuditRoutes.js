import { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { requireTier } from '../middleware/tierMiddleware.js';

const router = Router();

// Contract audit — accepts JSON text (PDF parsing done client-side for now)
router.post('/', authMiddleware, requireTier('starter'), async (req, res, next) => {
  try {
    const { contract_text } = req.body;
    if (!contract_text || contract_text.trim().length < 50) {
      return next({ statusCode: 400, message: 'contract_text is required (minimum 50 characters)' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return next({ statusCode: 500, message: 'AI service not configured' });

    const prompt = `You are an expert Indian contract law auditor. Analyze the following contract text and return a JSON object with:
- risk_score: number 1-100 (100 = highest risk)
- risks: array of { severity: "critical"|"high"|"medium"|"low", clause_text: string, issue: string, recommendation: string }
- missing_clauses: array of { clause_name: string, importance: "essential"|"recommended"|"optional", description: string }
- favorable_terms: array of strings (good clauses found)
- overall_assessment: string (2-3 sentences)

Consider Indian Contract Act 1872, Specific Relief Act, and relevant Indian laws.
Flag clauses that are unfavorable/unenforceable under Indian law.
Identify missing standard protections.
Check for ambiguous language.

Return ONLY valid JSON, no markdown fences.

CONTRACT TEXT:
${contract_text.substring(0, 15000)}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: 'You are an expert Indian contract law auditor. Return ONLY valid JSON.' }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 8192, temperature: 0.2 },
      }),
    });

    const data = await resp.json();
    let text = data?.candidates?.[0]?.content?.parts?.map(p => p?.text).filter(Boolean).join('') || '{}';
    text = text.replace(/^```json?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

    let audit;
    try { audit = JSON.parse(text); } catch {
      audit = { risk_score: 50, overall_assessment: text, risks: [], missing_clauses: [], favorable_terms: [] };
    }

    res.json({ success: true, data: audit });
  } catch (err) { next(err); }
});

export default router;
