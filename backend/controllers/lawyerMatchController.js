import crypto from 'crypto';
import { Op } from 'sequelize';

import { redis, connectRedis } from '../config/redis.js';
import { Lawyer, User } from '../models/index.js';

const SYSTEM_PROMPT =
  "You are a legal intake specialist in India. A user has described their problem: '{problem_description}'. Identify: (1) the primary area of Indian law involved, (2) the specific legal specialization a lawyer should have, (3) whether this is urgent (court deadline, criminal matter, domestic violence). Return ONLY JSON: { specialization: string, urgency: 'high'|'normal', rationale: string (1 sentence why this specialization), suggested_questions: [string, string, string] (3 questions to ask the lawyer at consultation) }";

function extractJsonObject(text) {
  const raw = String(text || '').trim();
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start >= 0 && end > start) {
      const candidate = raw.slice(start, end + 1);
      try {
        return JSON.parse(candidate);
      } catch {
        return null;
      }
    }
    return null;
  }
}

function sha256(input) {
  return crypto.createHash('sha256').update(String(input)).digest('hex');
}

async function geminiMatchGenerate(problem_description) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(
    apiKey,
  )}`;

  const system = SYSTEM_PROMPT.replace('{problem_description}', problem_description);

  const payload = {
    systemInstruction: {
      parts: [{ text: system }],
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: `User problem: ${problem_description}` }],
      },
    ],
    generationConfig: {
      maxOutputTokens: 500,
      temperature: 0.2,
      topP: 0.8,
    },
  };

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`Gemini API error (${resp.status})${text ? `: ${text}` : ''}`);
  }

  const data = await resp.json();
  const reply =
    data?.candidates?.[0]?.content?.parts
      ?.map((p) => p?.text)
      ?.filter(Boolean)
      ?.join('') || data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

  if (!reply) throw new Error('Gemini returned empty response');
  return reply;
}

export async function matchLawyer(req, res, next) {
  try {
    await connectRedis();

    const userId = req.user.id;
    const problem_description = String(req.body?.problem_description || '').trim();
    if (!problem_description) return next({ statusCode: 400, message: 'problem_description is required' });

    // Best-effort caching by input hash (optional).
    const cacheKey = `lawyer_match:${sha256(problem_description.toLowerCase()).slice(0, 24)}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      let parsed = null;
      try {
        parsed = JSON.parse(cached);
      } catch {
        parsed = null;
      }
      if (parsed) return res.json({ success: true, data: parsed, cached: true });
    }

    const geminiReply = await geminiMatchGenerate(problem_description);
    const parsed = extractJsonObject(geminiReply);
    if (!parsed || !parsed.specialization) {
      return next({ statusCode: 502, message: 'AI matching failed. Please try again.' });
    }

    const specialization = String(parsed.specialization);
    const urgency = parsed.urgency === 'high' ? 'high' : 'normal';
    const rationale = String(parsed.rationale || '');
    const suggested_questions = Array.isArray(parsed.suggested_questions) ? parsed.suggested_questions.slice(0, 3) : [];

    // Query top lawyers by specialization match + rating score.
    const where = { verified: true };
    if (specialization) where.specialization = { [Op.contains]: [specialization] };

    const lawyersRows = await Lawyer.findAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['id', 'full_name', 'email', 'phone'] }],
      limit: 30,
    });

    const lawyerIds = lawyersRows.map((l) => l.id);

    let ratingByLawyer = {};
    if (lawyerIds.length > 0) {
      const result = await Lawyer.sequelize.query(
        `SELECT b.lawyer_id AS lawyer_id,
                AVG(r.rating)::float AS avg_rating,
                COUNT(r.id)::int AS review_count
         FROM bookings b
         JOIN reviews r ON r.booking_id = b.id
         WHERE b.lawyer_id IN (:ids)
         GROUP BY b.lawyer_id`,
        { replacements: { ids: lawyerIds } },
      );
      // eslint-disable-next-line prefer-destructuring
      const records = result[0] || result;
      ratingByLawyer = records.reduce((acc, rec) => {
        acc[rec.lawyer_id] = {
          avg_rating: rec.avg_rating ? Number(rec.avg_rating) : 0,
          review_count: rec.review_count ? Number(rec.review_count) : 0,
        };
        return acc;
      }, {});
    }

    const lawyers = lawyersRows.map((l) => {
      const rating = ratingByLawyer[l.id] || { avg_rating: 0, review_count: 0 };
      return {
        id: l.id,
        bar_council_id: l.bar_council_id,
        specialization: l.specialization,
        languages: l.languages,
        state: l.state,
        city: l.city,
        rate_per_hour: l.rate_per_hour,
        bio: l.bio,
        verified: l.verified,
        calendly_url: l.calendly_url,
        created_at: l.created_at,
        user: {
          full_name: l.user?.full_name || null,
          email: l.user?.email || null,
        },
        avg_rating: rating.avg_rating,
        review_count: rating.review_count,
      };
    });

    // Quality score approximation: rating primary, then review count.
    lawyers.sort(
      (a, b) => (b.avg_rating || 0) - (a.avg_rating || 0) || (b.review_count || 0) - (a.review_count || 0),
    );

    const top_lawyers = lawyers.slice(0, 3);

    const payload = {
      matched_specialization: specialization,
      urgency,
      rationale,
      suggested_questions,
      top_lawyers,
    };

    await redis.set(cacheKey, JSON.stringify(payload), 'EX', 2 * 60 * 60);

    return res.json({ success: true, data: payload, cached: false });
  } catch (err) {
    return next(err);
  }
}

