import { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { requireTier } from '../middleware/tierMiddleware.js';

const router = Router();

router.post('/generate', authMiddleware, requireTier('business'), async (req, res, next) => {
  try {
    const { business_name, industry, style, colors, icon_preference } = req.body;
    if (!business_name) return next({ statusCode: 400, message: 'business_name is required' });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return next({ statusCode: 500, message: 'AI service not configured' });

    const variations = [];
    const styles = [style || 'minimalist', 'bold', 'elegant'].slice(0, 3);

    for (const s of styles) {
      const prompt = `Generate a professional SVG logo for "${business_name}" in the ${industry || 'general'} industry.
Style: ${s}
Colors: ${(colors || ['#dc2626', '#1f2937']).join(', ')}
Type: ${icon_preference || 'lettermark'}

Output ONLY valid SVG code. No explanation, no markdown fences. The SVG should:
- Be exactly 200x200 viewBox
- Use clean, simple shapes
- Include the business name or initials as text
- Be professional and scalable
- Use the specified colors`;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 4096, temperature: 0.9 },
        }),
      });

      const data = await resp.json();
      let svg = data?.candidates?.[0]?.content?.parts?.map(p => p?.text).filter(Boolean).join('') || '';
      svg = svg.replace(/^```(?:svg|xml)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

      if (svg.includes('<svg')) {
        const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
        variations.push({ svg_data: svg, png_url: dataUrl, style_description: s });
      }
    }

    res.json({ success: true, data: variations });
  } catch (err) { next(err); }
});

export default router;
