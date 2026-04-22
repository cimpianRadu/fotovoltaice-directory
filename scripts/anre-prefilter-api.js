#!/usr/bin/env node
/**
 * ANRE Prefilter via targetare.ro API
 *
 * Replaces the firecrawl+listafirme.ro scraping approach with direct API calls.
 * Reads data/anre-prefilter-input.json (produced by anre-prefilter-input.js)
 * and outputs scored candidates to:
 *   - data/anre-prefilter-results.json
 *   - docs/anre-prefiltered.md
 *
 * Scoring rules (max 12 points):
 *   CAEN 4321/7112/3511        +3
 *   activity contains fotovoltaic/solar/PV/panouri +3
 *   website present            +2
 *   revenue ≥ 2M RON           +2
 *   revenue ≥ 500k RON         +1
 *   age ≥ 3 years              +1
 *   hasBoth C1A+C2A            +1
 *
 * Env:
 *   TARGETARE_API_KEY — required
 *
 * Usage:
 *   node scripts/anre-prefilter-api.js
 */

const fs = require('fs');
const path = require('path');

// Load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, 'utf8');
  env.split('\n').forEach((line) => {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
    }
  });
}

const API_KEY = process.env.TARGETARE_API_KEY;
if (!API_KEY) {
  console.error('[prefilter-api] Missing TARGETARE_API_KEY in .env.local');
  process.exit(1);
}

const BASE = 'https://api.targetare.ro/v1';
const HEADERS = { Authorization: `Bearer ${API_KEY}` };

const TARGET_CAEN = new Set(['4321', '7112', '3511']);
const SOLAR_KEYWORDS = /fotovoltaic|solar(?!ium)|PV\b|panouri|energie regenerabil/i;

async function apiGet(endpoint) {
  const url = `${BASE}${endpoint}`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText} — ${endpoint} — ${body.slice(0, 200)}`);
  }
  return res.json();
}

function extractCaen(caenArray) {
  if (!Array.isArray(caenArray) || caenArray.length === 0) return { code: '', label: '' };
  // Last element is the most specific: "4321 - Lucrari de instalatii electrice"
  const last = caenArray[caenArray.length - 1];
  const match = last.match(/^(\d{4})\s*-\s*(.+)$/);
  return match ? { code: match[1], label: match[2].trim() } : { code: '', label: last };
}

function scoreFirm(input, general, financial, websites) {
  const reasons = [];
  let score = 0;

  const caen = extractCaen(general?.caen || []);
  if (TARGET_CAEN.has(caen.code)) {
    score += 3;
    reasons.push(`CAEN ${caen.code} (+3)`);
  }

  const activityBlob = `${caen.label} ${input.societate}`.toLowerCase();
  if (SOLAR_KEYWORDS.test(activityBlob)) {
    score += 3;
    reasons.push('solar/PV în nume/CAEN (+3)');
  }

  const hasWebsite = !!(websites && websites.length > 0);
  if (hasWebsite) {
    score += 2;
    reasons.push('website (+2)');
  }

  const revenue = financial?.turnover || 0;
  if (revenue >= 2_000_000) {
    score += 2;
    reasons.push(`revenue ≥2M (+2)`);
  } else if (revenue >= 500_000) {
    score += 1;
    reasons.push(`revenue ≥500k (+1)`);
  }

  const age = general?.foundingYear ? 2026 - general.foundingYear : 0;
  if (age >= 3) {
    score += 1;
    reasons.push(`age ${age}y (+1)`);
  }

  if (input.hasBoth) {
    score += 1;
    reasons.push('C1A+C2A (+1)');
  }

  return { score, reasons, caen, hasWebsite, revenue, age };
}

async function enrichOne(input) {
  const out = {
    cui: input.cui,
    name: input.societate,
    judet: input.judet,
    localitate: input.localitate || '',
    codes: input.codes,
    hasBoth: input.hasBoth,
    score: 0,
    reasons: [],
    caen_code: '',
    caen_label: '',
    website: '',
    revenue_2024: 0,
    profit_2024: 0,
    employees: 0,
    year_founded: 0,
    status: '',
    address: '',
    error: null,
  };

  try {
    const general = await apiGet(`/companies/${input.cui}`).then((r) => r.data);
    out.status = general.status || '';
    out.address = general.fullAddress || '';
    out.year_founded = general.foundingYear || 0;
    const caen = extractCaen(general.caen || []);
    out.caen_code = caen.code;
    out.caen_label = caen.label;

    let financial = null;
    if (general.hasFinData) {
      financial = await apiGet(`/companies/${input.cui}/financial`).then((r) => r.data);
      // latest year from financialData array, or root-level turnover/employee
      const rows = Array.isArray(financial.financialData) ? financial.financialData : [];
      const latest = rows.sort((a, b) => b.year - a.year)[0] || {};
      out.revenue_2024 = financial.turnover || latest.turnover || 0;
      out.profit_2024 = financial.netProfit || latest.netProfit || 0;
      out.employees = financial.employee || latest.employee || 0;
    }

    let websites = [];
    if (general.hasWebsite) {
      const w = await apiGet(`/companies/${input.cui}/websites`).then((r) => r.data);
      websites = w.websites || [];
      out.website = websites[0] || '';
    }

    const scored = scoreFirm(input, general, financial, websites);
    out.score = scored.score;
    out.reasons = scored.reasons;
  } catch (err) {
    out.error = err.message;
    console.error(`[prefilter-api] ${input.societate} (${input.cui}): ${err.message}`);
  }

  return out;
}

async function main() {
  const inputPath = path.join(__dirname, '..', 'data', 'anre-prefilter-input.json');
  if (!fs.existsSync(inputPath)) {
    console.error('[prefilter-api] Run anre-prefilter-input.js first');
    process.exit(1);
  }
  const input = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  console.log(`[prefilter-api] Processing ${input.length} firms...`);

  const results = [];
  let remainingRequests = null;
  for (let i = 0; i < input.length; i++) {
    const firm = input[i];
    process.stdout.write(`  [${i + 1}/${input.length}] ${firm.societate}... `);
    const result = await enrichOne(firm);
    results.push(result);
    console.log(result.error ? `ERR` : `score ${result.score}`);
  }

  // Fetch final remaining count for reporting
  try {
    const ping = await fetch(`${BASE}/companies/${input[0].cui}`, { headers: HEADERS });
    if (ping.ok) {
      const json = await ping.json();
      remainingRequests = json.remainingRequests;
    }
  } catch (_) {}

  results.sort((a, b) => b.score - a.score);

  const resultsPath = path.join(__dirname, '..', 'data', 'anre-prefilter-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));

  // Markdown report
  const formatRon = (n) => (n ? `${(n / 1_000_000).toFixed(2)}M` : '—');
  const mdLines = [
    `# ANRE Prefilter — ${input[0]?.judet || 'mixed'}`,
    '',
    `Generated: ${new Date().toISOString().slice(0, 10)} via targetare.ro API`,
    `Total: ${results.length} firms • Ready for research (≥6): ${results.filter((r) => r.score >= 6).length}`,
    remainingRequests != null ? `Remaining API credits: ${remainingRequests}` : '',
    '',
    '| Score | Firm | CUI | CAEN | Revenue | Emp | Site | Founded | C1/C2 | Notes |',
    '|-------|------|-----|------|---------|-----|------|---------|-------|-------|',
    ...results.map((r) => {
      const notes = r.error ? `ERR: ${r.error.slice(0, 60)}` : r.reasons.join(', ');
      return `| ${r.score} | ${r.name} | ${r.cui} | ${r.caen_code || '—'} | ${formatRon(r.revenue_2024)} | ${r.employees || '—'} | ${r.website ? '✓' : '—'} | ${r.year_founded || '—'} | ${r.hasBoth ? '✓' : r.codes.join('+')} | ${notes} |`;
    }),
  ];
  const mdPath = path.join(__dirname, '..', 'docs', 'anre-prefiltered.md');
  fs.writeFileSync(mdPath, mdLines.filter(Boolean).join('\n') + '\n');

  console.log(`\n[prefilter-api] Done. ${results.filter((r) => r.score >= 6).length}/${results.length} firms ready for research (score ≥ 6)`);
  if (remainingRequests != null) {
    console.log(`[prefilter-api] API credits remaining: ${remainingRequests}`);
  }
  console.log(`  Output: ${resultsPath}`);
  console.log(`          ${mdPath}`);
}

main().catch((err) => {
  console.error('[prefilter-api] Fatal:', err.message);
  process.exit(1);
});
