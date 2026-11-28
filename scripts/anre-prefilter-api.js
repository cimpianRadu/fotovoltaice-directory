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
 * Surse:
 *   targetare.ro (TARGETARE_API_KEY) — implicit când are credite.
 *   ANAF (gratuit, fără cheie) — când lipsește cheia, când targetare răspunde
 *   401/402/403/429 (fără credite), sau cu --source=anaf. ANAF nu dă site-ul firmei:
 *   îl ia din data/anre-with-cui.json (`web`) când există, altfel firma pierde +2.
 *
 * Usage:
 *   node scripts/anre-prefilter-api.js [--source=auto|targetare|anaf]
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

const { anafGeneral, anafLatestBilant } = require('./lib/anaf');

const API_KEY = process.env.TARGETARE_API_KEY;
const sourceArg = (process.argv.find((a) => a.startsWith('--source=')) || '--source=auto').split('=')[1];
let SOURCE = sourceArg === 'anaf' || !API_KEY ? 'anaf' : sourceArg === 'targetare' ? 'targetare' : 'auto';
if (!API_KEY && sourceArg !== 'anaf') {
  console.warn('[prefilter-api] Lipsește TARGETARE_API_KEY → folosesc ANAF');
}

// targetare fără credite / cheie invalidă → trecem pe ANAF pentru tot lotul
const OUT_OF_CREDITS = /\b(401|402|403|429)\b|credit|quota|limit/i;

const BASE = 'https://api.targetare.ro/v1';
const HEADERS = { Authorization: `Bearer ${API_KEY}` };

const TARGET_CAEN = new Set(['4321', '7112', '3511']);
const SOLAR_KEYWORDS = /fotovoltaic|solar(?!ium)|PV\b|panouri|energie regenerabil/i;

class TargetareUnavailable extends Error {}

async function apiGet(endpoint) {
  const url = `${BASE}${endpoint}`;
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    const msg = `${res.status} ${res.statusText} — ${endpoint} — ${body.slice(0, 200)}`;
    if ([401, 402, 403, 429].includes(res.status) || OUT_OF_CREDITS.test(body)) throw new TargetareUnavailable(msg);
    throw new Error(msg);
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
    telefon_anre: input.telefon || '',
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
    if (err instanceof TargetareUnavailable && SOURCE === 'auto') throw err;
    out.error = err.message;
    console.error(`[prefilter-api] ${input.societate} (${input.cui}): ${err.message}`);
  }

  out.source = 'targetare';
  return out;
}

// Site-ul din registrul ANRE+CUI (ANAF nu îl dă)
const anreWithCui = (() => {
  try {
    const rows = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'anre-with-cui.json'), 'utf8'));
    const m = new Map();
    for (const r of rows) if (r.cui && r.web) m.set(String(r.cui).replace(/\D/g, ''), r.web);
    return m;
  } catch (_) {
    return new Map();
  }
})();

async function enrichOneAnaf(input, generalMap) {
  const out = {
    cui: input.cui, name: input.societate, judet: input.judet, localitate: input.localitate || '',
    codes: input.codes, hasBoth: input.hasBoth, score: 0, reasons: [], caen_code: '', caen_label: '',
    website: '', revenue_2024: 0, profit_2024: 0, employees: 0, year_founded: 0, status: '', address: '',
    phone_registry: '', telefon_anre: input.telefon || '', fin_year: 0, error: null, source: 'anaf',
  };
  try {
    const cui = String(input.cui).replace(/\D/g, '');
    const g = generalMap.get(cui) || {};
    const b = await anafLatestBilant(cui);
    out.status = g.status || '';
    out.address = g.address || input.sediu || '';
    out.phone_registry = g.phone || '';
    out.year_founded = g.year_founded || 0;
    out.caen_code = (b && b.caen_code) || g.caen_code || '';
    out.caen_label = (b && b.caen_label) || '';
    // câmpurile se numesc _2024 din istoric; anul real e în fin_year
    out.revenue_2024 = (b && b.turnover) || 0;
    out.profit_2024 = (b && b.netProfit) || 0;
    out.employees = (b && b.employees) || 0;
    out.fin_year = (b && b.year) || 0;
    out.website = anreWithCui.get(cui) || '';
    if (g.active === false) out.error = `inactiv în ANAF: ${g.status || 'inactiv'}`;

    const general = { caen: out.caen_code ? [`${out.caen_code} - ${out.caen_label}`] : [], foundingYear: out.year_founded };
    const scored = scoreFirm(input, general, { turnover: out.revenue_2024 }, out.website ? [out.website] : []);
    out.score = g.active === false ? 0 : scored.score;
    out.reasons = scored.reasons;
  } catch (err) {
    out.error = err.message;
    console.error(`[prefilter-api] ANAF ${input.societate} (${input.cui}): ${err.message}`);
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
  let generalMap = null;
  const ensureGeneral = async () => {
    if (generalMap) return generalMap;
    try {
      generalMap = await anafGeneral(input.map((f) => f.cui));
    } catch (err) {
      console.warn(`[prefilter-api] ANAF date generale indisponibile (${err.message}); continui doar cu bilanțul`);
      generalMap = new Map();
    }
    return generalMap;
  };
  for (let i = 0; i < input.length; i++) {
    const firm = input[i];
    process.stdout.write(`  [${i + 1}/${input.length}] ${firm.societate}... `);
    let result;
    if (SOURCE !== 'anaf') {
      try {
        result = await enrichOne(firm);
      } catch (err) {
        console.warn(`\n[prefilter-api] targetare indisponibil (${err.message.slice(0, 120)}) → trec pe ANAF pentru restul lotului`);
        SOURCE = 'anaf';
      }
    }
    if (!result) result = await enrichOneAnaf(firm, await ensureGeneral());
    results.push(result);
    console.log(result.error ? `ERR` : `score ${result.score} (${result.source})`);
  }

  // Fetch final remaining count for reporting
  if (SOURCE !== 'anaf') try {
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
    `Generated: ${new Date().toISOString().slice(0, 10)} via ${[...new Set(results.map((r) => r.source))].join(' + ')}`,
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
