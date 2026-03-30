import crypto from 'crypto';

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

import { redis, connectRedis } from '../config/redis.js';
import { ActivityLog, DocReview } from '../models/index.js';

const SYSTEM_PROMPT =
  "You are a legal document reviewer specializing in Indian law. Analyze the provided document and return ONLY a JSON object with this exact structure:\n  {\n    risk_score: number (1-10, where 1=very safe, 10=very risky),\n    doc_type_detected: string,\n    summary: string (2 sentences, what this document is about),\n    red_flags: [ { clause: string (quote max 20 words), issue: string (plain English explanation), severity: 'high'|'medium'|'low' } ],\n    missing_protections: [ { protection: string, explanation: string, standard_clause: string (example of what it should say) } ],\n    positive_clauses: [ { clause: string, why_good: string } ],\n    recommendation: string (1-2 sentences: what action to take),\n    lawyer_specialization_needed: string (e.g. 'Property Law', 'Employment Law', 'Corporate Law')\n  }\n  Base analysis on: Indian Contract Act 1872, relevant sector laws (RERA for property, Shops & Establishment Act for employment, etc.), standard market practices in India.\n  Return ONLY the JSON. No preamble, no markdown backticks.";

function extractJsonObject(text) {
  const raw = String(text || '').trim();
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    // Try to salvage: extract the first JSON object.
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

async function geminiGenerateJson(message) {
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
      maxOutputTokens: 900,
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

function truncateToFirstNWords(text, words = 6000) {
  const tokens = String(text || '').split(/\s+/).filter(Boolean);
  return tokens.slice(0, words).join(' ');
}

export async function analyzeDocReview(req, res, next) {
  try {
    await connectRedis();

    const userId = req.user.id;
    const file = req.file;
    const doc_type = String(req.query?.doc_type || req.body?.doc_type || 'uploaded_pdf');

    if (!file) return next({ statusCode: 400, message: 'PDF file is required' });
    if (file.mimetype !== 'application/pdf') return next({ statusCode: 400, message: 'Only PDF is allowed' });

    // 1) Extract text from PDF.
    const parsed = await pdfParse(file.buffer);
    const fullText = String(parsed?.text || '');
    if (!fullText.trim()) return next({ statusCode: 400, message: 'Could not extract text from PDF' });

    const textForGemini = truncateToFirstNWords(fullText, 6000);
    const cacheHash = sha256(fullText.slice(0, 500));
    const cacheKey = `doc_review:${cacheHash}`;

    // 2) Cached response (24hr).
    const cached = await redis.get(cacheKey);
    if (cached) {
      let analysis = null;
      try {
        analysis = JSON.parse(cached);
      } catch {
        analysis = null;
      }
      if (analysis) {
        await ActivityLog.create({
          user_id: userId,
          action: 'doc_review_analyze',
          resource_type: 'doc_review',
          resource_id: null,
          ip_address: req.ip || 'unknown',
        });

        return res.json({ success: true, data: analysis, cached: true });
      }
    }

    // 3) Call Gemini for JSON response.
    const message = `Document type hint: ${doc_type}\n\nDocument text:\n${textForGemini}`;
    const geminiReply = await geminiGenerateJson(message);

    const analysis = extractJsonObject(geminiReply);
    if (!analysis) {
      return next({ statusCode: 502, message: 'AI review failed. Please try again.' });
    }

    // 4) Normalize basic fields.
    const risk_score = Number(analysis?.risk_score);
    const safeRiskScore = Number.isFinite(risk_score) ? Math.min(10, Math.max(1, Math.round(risk_score))) : 5;
    const lawyer_specialization_needed = String(analysis?.lawyer_specialization_needed || 'General Law');

    const normalizedAnalysis = {
      ...analysis,
      risk_score: safeRiskScore,
      lawyer_specialization_needed,
    };

    // 5) Cache analysis result.
    await redis.set(cacheKey, JSON.stringify(normalizedAnalysis), 'EX', 24 * 60 * 60);

    // 6) Save to DB.
    await DocReview.create({
      user_id: userId,
      filename: String(file.originalname || 'document.pdf'),
      risk_score: safeRiskScore,
      analysis_json: normalizedAnalysis,
      lawyer_specialization_needed,
    });

    await ActivityLog.create({
      user_id: userId,
      action: 'doc_review_analyze',
      resource_type: 'doc_review',
      resource_id: null,
      ip_address: req.ip || 'unknown',
    });

    // 7) Return.
    return res.json({ success: true, data: normalizedAnalysis, cached: false });
  } catch (err) {
    return next(err);
  }
}

