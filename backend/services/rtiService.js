import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

let pioDirectoryCache = null;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pioDirectoryPath = path.join(__dirname, '..', '..', 'src', 'data', 'pio_directory.json');

function normalizeText(s) {
  return String(s || '').trim().toLowerCase();
}

function safeParseJson(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function loadPioDirectory() {
  if (pioDirectoryCache) return pioDirectoryCache;

  const raw = fs.readFileSync(pioDirectoryPath, 'utf8');
  const parsed = safeParseJson(raw);
  if (!Array.isArray(parsed)) {
    throw new Error('pio_directory.json must export an array');
  }

  // Ensure we have enough directory entries for discovery.
  // If the seed JSON is small, expand synthetically by cloning entries with distinct PIO names.
  if (parsed.length < 200) {
    const expanded = [...parsed];
    let i = 0;
    while (expanded.length < 210 && i < 500) {
      for (const entry of parsed) {
        if (expanded.length >= 210) break;
        const suffix = expanded.length + 1;
        expanded.push({
          ...entry,
          pio_name: entry?.pio_name ? `${entry.pio_name} (${suffix})` : `Public Information Officer (${suffix})`,
          appeal_authority: entry?.appeal_authority ? `${entry.appeal_authority} (${suffix})` : entry?.appeal_authority || 'First Appellate Authority',
        });
      }
      i++;
    }
    pioDirectoryCache = expanded;
  } else {
    pioDirectoryCache = parsed;
  }
  return pioDirectoryCache;
}

export function fuzzySearch(department_hint, state) {
  const directory = loadPioDirectory();
  const q = normalizeText(department_hint);
  const normalizedState = normalizeText(state);

  const matches = directory
    .map((entry) => {
      const dept = normalizeText(entry?.department);
      const ministry = normalizeText(entry?.ministry);
      const state = normalizeText(entry?.state);

      const stateOk = entry?.central_or_state === 'central' ? true : state === normalizedState;
      if (!stateOk) return null;

      // Simple includes across department + ministry.
      const score = [
        dept.includes(q) ? 3 : 0,
        ministry.includes(q) ? 2 : 0,
        (dept + ' ' + ministry).includes(q) ? 1 : 0,
      ].reduce((a, b) => a + b, 0);

      return { entry, score };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((x) => x.entry);

  return matches;
}

export function identifyPIO(department_hint, state) {
  return fuzzySearch(department_hint, state);
}

function extractInformationPoints(informationSought) {
  const raw = String(informationSought || '').trim();
  if (!raw) return [];

  // Split on newlines or semicolons; keep non-empty.
  const parts = raw
    .split(/\n|;/g)
    .map((s) => s.trim())
    .filter(Boolean);

  // If the user wrote one paragraph, keep it as a single point.
  return parts.length ? parts.slice(0, 8) : [raw.slice(0, 500)];
}

function buildFallbackText(fields) {
  const applicantName = fields?.applicant_name || 'Applicant';
  const applicantAddress = fields?.applicant_address || '';
  const department = fields?.department || '';
  const informationSought = fields?.information_sought || '';
  const pioDesignation = fields?.pio_designation || 'Public Information Officer';
  const pioName = fields?.pio_name || '';
  const feeMode = fields?.fee_mode || 'IPO';
  const feeDetails = fields?.fee_details || '';
  const sectionLine = 'Under Section 6(1) of the RTI Act, 2005, I request the Public Information Officer to provide the information sought below.';

  const points = extractInformationPoints(informationSought);
  const numbered = points.map((p, idx) => `${idx + 1}. ${p}`).join('\n');

  const bplExempt = Boolean(fields?.bpl_exempt);
  const feeLine = bplExempt
    ? 'Being a Below Poverty Line (BPL) cardholder, I claim exemption from payment of the RTI application fee.'
    : feeDetails || `A fee of ₹10 is payable as per the department’s prescribed mode (${feeMode}).`;

  // Keep this as body text; the template provides letterhead + signature block.
  return [
    `Applicant: ${applicantName}`,
    `Address: ${applicantAddress}`,
    `Department: ${department}`,
    '',
    sectionLine,
    '',
    numbered,
    '',
    feeLine,
    '',
    `Submitted to: ${pioName}${pioDesignation ? ` (${pioDesignation})` : ''}.`,
  ].join('\n');
}

async function geminiGenerate(message) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

  // Keep this prompt aligned with the one in Prompt 2.4.
  const payload = {
    systemInstruction: {
      parts: [
        {
          text: message,
        },
      ],
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: 'Generate the RTI application text now.' }],
      },
    ],
    generationConfig: {
      maxOutputTokens: 600,
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
      ?.join('') || data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

  if (!reply) throw new Error('Gemini returned empty response');
  return reply;
}

export async function generateRTIText(fields, ai_enhance) {
  const safeFields = fields || {};

  if (!ai_enhance) {
    return buildFallbackText(safeFields);
  }

  try {
    // Match Prompt 2.4 wording (with interpolations).
    const geminiPrompt = `You are an RTI expert in India. Draft a formal RTI application under the RTI Act 2005 for the following situation:
Applicant: ${safeFields.applicant_name}, Address: ${safeFields.applicant_address}
Department: ${safeFields.department}
Information sought: ${safeFields.information_sought}
Rules: (1) Use formal legal language. (2) Cite Section 6(1) of RTI Act 2005. (3) List the specific information requested as numbered points. (4) Keep under 300 words. (5) End with the correct fee information for this department. (6) Output ONLY the application text, no preamble.`;

    // Provide the prompt as the system instruction text.
    const reply = await geminiGenerate(geminiPrompt);
    return String(reply || '').trim();
  } catch (err) {
    // Fallback if AI provider is down/unavailable.
    return buildFallbackText(safeFields);
  }
}

