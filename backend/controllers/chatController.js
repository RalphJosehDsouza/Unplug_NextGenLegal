import crypto from 'crypto';

import { redis, connectRedis } from '../config/redis.js';
import { ActivityLog } from '../models/index.js';

const SYSTEM_PROMPT =
  "You are a legal assistant specializing exclusively in Indian law. You assist citizens and businesses with questions about Indian statutes, case procedures, and compliance. Rules: (1) Only answer questions about Indian law. (2) Respond in the same language the user writes in — Hindi or English. (3) Keep answers under 150 words. (4) Use plain language, no legal jargon unless explaining a term. (5) Never give specific legal advice for an individual's case. (6) Always end with: 'For your specific situation, consult a qualified Indian lawyer.' (7) If asked about non-Indian law, say: 'I can only assist with Indian legal matters.' (8) Topics you know well: IPC, CPC, Companies Act 2013, GST, RERA, IT Act 2000, Consumer Protection Act, RTI, Labour laws, Transfer of Property Act, Indian Contract Act.";

function detectLanguage(message) {
  // Simple heuristic: Devanagari -> Hindi; otherwise English.
  return /[\u0900-\u097F]/.test(message) ? 'Hindi' : 'English';
}

function sha256(input) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || '0.0.0.0';
}

async function geminiGenerate(message) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(
    apiKey,
  )}`;

  const payload = {
    systemInstruction: {
      parts: [{ text: SYSTEM_PROMPT }],
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: message }],
      },
    ],
    generationConfig: {
      maxOutputTokens: 200,
      temperature: 0.3,
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
      ?.join('') ||
    data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    '';

  if (!reply) throw new Error('Gemini returned empty response');
  return reply;
}

export async function ask(req, res, next) {
  try {
    await connectRedis();

    const userId = req.user.id;
    const message = String(req.body?.message || '').trim();
    if (!message) return next({ statusCode: 400, message: 'message is required' });

    // 1) Per-user rate limit: max 10/min
    const rateKey = `chat_rate:${userId}`;
    const count = await redis.incr(rateKey);
    if (count === 1) {
      await redis.expire(rateKey, 60);
    }
    if (count > 10) {
      return next({ statusCode: 429, message: 'Rate limit exceeded. Try again later.' });
    }

    // 2) Cache by SHA-256 of normalized message
    const cacheKey = `chat_cache:${sha256(message.toLowerCase())}`;
    const cachedReply = await redis.get(cacheKey);
    if (cachedReply) {
      await ActivityLog.create({
        user_id: userId,
        action: 'chat_query',
        resource_type: 'chatbot',
        resource_id: null,
        ip_address: getClientIp(req),
      });

      return res.json({
        success: true,
        data: {
          reply: cachedReply,
          cached: true,
          language_detected: detectLanguage(message),
        },
      });
    }

    // 3) Call Gemini
    const reply = await geminiGenerate(message);

    // 4) Cache successful response for 3600 seconds
    await redis.set(cacheKey, reply, 'EX', 3600);

    await ActivityLog.create({
      user_id: userId,
      action: 'chat_query',
      resource_type: 'chatbot',
      resource_id: null,
      ip_address: getClientIp(req),
    });

    return res.json({
      success: true,
      data: {
        reply,
        cached: false,
        language_detected: detectLanguage(message),
      },
    });
  } catch (err) {
    return next(err);
  }
}

