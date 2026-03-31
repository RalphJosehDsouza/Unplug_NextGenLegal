import { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { requireTier } from '../middleware/tierMiddleware.js';

const router = Router();

router.post('/', authMiddleware, requireTier('starter'), async (req, res, next) => {
  try {
    const { industry, keywords, style, count } = req.body;
    if (!industry || !keywords) {
      return next({ statusCode: 400, message: 'industry and keywords are required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return next({ statusCode: 500, message: 'AI service not configured' });

    const num = Math.min(Math.max(parseInt(count) || 10, 3), 20);
    const prompt = `Generate ${num} creative, unique business name suggestions for an Indian business.
Industry: ${industry}
Keywords: ${keywords}
Style: ${style || 'professional'}

For each name return JSON array of objects with: { name, tagline, domain_suggestion, reasoning }
Names must be culturally appropriate for India, easy to pronounce, memorable, and not already well-known brands.
Return ONLY valid JSON array, no markdown.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 4096, temperature: 0.8 },
      }),
    });

    const data = await resp.json();
    let text = data?.candidates?.[0]?.content?.parts?.map(p => p?.text).filter(Boolean).join('') || '[]';
    text = text.replace(/^```json?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

    let suggestions;
    try { suggestions = JSON.parse(text); } catch { suggestions = [{ name: text, tagline: '', domain_suggestion: '', reasoning: '' }]; }

    res.json({ success: true, data: suggestions });
  } catch (err) { next(err); }
});

export default router;
