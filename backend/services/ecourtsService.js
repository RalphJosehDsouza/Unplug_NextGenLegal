import axios from 'axios';

import { connectRedis, redis } from '../config/redis.js';

// eCourts provider endpoint (v6).
const ECOUTRS_SEARCH_URL =
  process.env.ECOURTS_SEARCH_URL ||
  'https://services.ecourts.gov.in/ecourtindia_v6/cases/cnr_search';

const cacheTtlSeconds = 4 * 60 * 60; // 4 hours

// Rate-limit outbound calls to external provider.
// minTime ensures ~1 request/sec.
import Bottleneck from 'bottleneck';

const ecourtsLimiter = new Bottleneck({
  minTime: 1000,
  maxConcurrent: 1,
});

export function normalizeCnr(cnr) {
  return String(cnr || '').trim().toUpperCase();
}

export function isValidCnr(cnr) {
  // Basic format: AAAA####YYYY (16 chars total), commonly: 4 letters + 12 digits
  return /^[A-Z]{4}[0-9]{12}$/.test(normalizeCnr(cnr));
}

function tryParseJson(maybeObjOrText) {
  if (!maybeObjOrText) return null;
  if (typeof maybeObjOrText !== 'string') return maybeObjOrText;
  try {
    return JSON.parse(maybeObjOrText);
  } catch {
    return null;
  }
}

function extractFirstString(obj, keys) {
  for (const k of keys) {
    const val = obj?.[k];
    if (typeof val === 'string' && val.trim()) return val.trim();
  }
  return null;
}

function extractDate(maybeDate) {
  const d = maybeDate ? new Date(maybeDate) : null;
  if (!d || Number.isNaN(d.getTime())) return null;
  return d;
}

function extractOrders(root) {
  // eCourts response structures differ; support common patterns.
  const candidates = root?.orders || root?.orderDetails || root?.caseOrders || [];
  if (!Array.isArray(candidates)) return [];

  return candidates
    .map((o) => ({
      date: extractDate(o?.orderDate || o?.date || o?.nextHearingDate) || null,
      text:
        o?.orderDescription ||
        o?.orderText ||
        o?.description ||
        o?.order_name ||
        o?.remarks ||
        null,
      pdf_url: o?.pdfUrl || o?.pdf_url || o?.downloadUrl || null,
    }))
    .filter((x) => x.text || x.pdf_url);
}

function extractActSections(root) {
  // Many providers return acts/sections as arrays or nested objects.
  const candidates =
    root?.acts_sections ||
    root?.act_sections ||
    root?.sections ||
    root?.caseActs ||
    null;
  if (!candidates) return [];

  if (Array.isArray(candidates)) return candidates;

  if (typeof candidates === 'object') {
    return Object.entries(candidates).map(([k, v]) => ({
      act: k,
      sections: Array.isArray(v) ? v : typeof v === 'string' ? [v] : [],
    }));
  }

  return [];
}

export function normalizeEcourtsCase(raw, cnr) {
  const obj = tryParseJson(raw) || raw || {};

  const root = obj?.data || obj?.case || obj?.caseDetails || obj;

  const case_name = extractFirstString(root, [
    'case_title',
    'caseName',
    'case_name',
    'caseDescription',
    'case_type',
  ]);

  const court_name = extractFirstString(root, ['courtName', 'court_name', 'court', 'court_type']);
  const district = extractFirstString(root, ['district', 'districtName', 'dist_name']);
  const state = extractFirstString(root, ['state', 'stateName']);

  const status = extractFirstString(root, ['case_status', 'status', 'caseStatus', 'CaseStatus']);

  // Hearing dates (best-effort).
  const next_hearing_date =
    extractDate(root?.nextHearingDate || root?.next_hearing_date || root?.nextHearingDateString) ||
    null;
  const last_hearing_date =
    extractDate(root?.lastHearingDate || root?.last_hearing_date || root?.hearingDate) || null;

  // Parties (best-effort).
  const petitioner =
    root?.petitioner?.name ||
    root?.petitioner_name ||
    root?.petitioner ||
    root?.petitionerList?.[0] ||
    null;
  const respondent =
    root?.respondent?.name ||
    root?.respondent_name ||
    root?.respondent ||
    root?.respondentList?.[0] ||
    null;

  const orders = extractOrders(root);
  const acts_sections = extractActSections(root);

  return {
    cnr_number: normalizeCnr(cnr),
    case_name: case_name || null,
    court_name: court_name || null,
    district: district || null,
    state: state || null,
    status: status || null,
    petitioner: typeof petitioner === 'string' ? petitioner : petitioner?.fullName || null,
    respondent: typeof respondent === 'string' ? respondent : respondent?.fullName || null,
    next_hearing_date,
    last_hearing_date,
    orders,
    acts_sections,
    raw_provider: obj ? 'ecourts' : null,
  };
}

export async function searchEcourtsCase(cnr) {
  const normalized = normalizeCnr(cnr);
  if (!isValidCnr(normalized)) {
    const err = new Error('Invalid CNR format');
    err.statusCode = 400;
    throw err;
  }

  await connectRedis().catch(() => undefined);

  const cacheKey = `ecourts:case:${normalized}`;
  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      // Restore date objects to ISO-ish strings if present.
      return parsed;
    }
  } catch {
    // Cache is optional; proceed without it.
  }

  const url = `${ECOUTRS_SEARCH_URL}?cnr_number=${encodeURIComponent(normalized)}`;

  const resp = await ecourtsLimiter.schedule(() =>
    axios.get(url, {
      timeout: 20000,
      headers: {
        Accept: 'application/json, text/plain, */*',
        'User-Agent': 'NextGenLegal/1.0',
      },
      responseType: 'text',
    }),
  );

  const normalizedCase = normalizeEcourtsCase(resp.data, normalized);

  // Store in cache (best-effort).
  try {
    await redis.set(cacheKey, JSON.stringify(normalizedCase), 'EX', cacheTtlSeconds);
  } catch {
    // ignore
  }

  return normalizedCase;
}

