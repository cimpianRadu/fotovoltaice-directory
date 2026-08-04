#!/usr/bin/env node
/**
 * Call-list de instalatori pentru o cerere fără destule potriviri în director.
 *
 * Fluxul: /admin/crm arată sub 3 potriviri pe o cerere → rulezi scriptul cu
 * județul (și segmentul) cererii → primești candidați din registrul ANRE,
 * care NU sunt în companies.json și nici în anre-rejected.json, îmbogățiți
 * cu date reale de la targetare.ro (CAEN, cifră de afaceri, angajați,
 * website). Telefonul vine din registrul ANRE. Rulează DOAR local:
 * TARGETARE_API_KEY e în .env.local, intenționat absent de pe Vercel.
 *
 * Usage:
 *   node scripts/lead-targetare.mjs --judet="Ialomița" --segment=rezidential
 *   node scripts/lead-targetare.mjs --judet=Timis --segment=comercial --limit=8
 *   node scripts/lead-targetare.mjs --judet=Cluj --codes=C2A,C1A,B
 *
 * Coduri ANRE per segment (aceeași semantică ca anre-discover.js):
 *   comercial   → C2A, C1A  (PV comercial/industrial)
 *   rezidential → B, BP, BE (instalații mici/rezidențiale)
 *
 * Cost: 1-3 cereri targetare per firmă (companies + financial + websites).
 * Limita implicită de 6 firme ține un run sub ~15 cereri.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

// Parse .env.local safely — only match lines that start with KEY=...
const envPath = path.join(ROOT, '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}

const API_KEY = process.env.TARGETARE_API_KEY;
if (!API_KEY) {
  console.error('[lead-targetare] Missing TARGETARE_API_KEY in .env.local');
  process.exit(1);
}

const args = process.argv.slice(2).reduce((acc, a) => {
  const m = a.match(/^--([^=]+)=(.+)$/);
  if (m) acc[m[1]] = m[2];
  return acc;
}, {});

const judet = args.judet;
if (!judet) {
  console.error('[lead-targetare] --judet= e obligatoriu (ex: --judet="Ialomița")');
  process.exit(1);
}
const segment = args.segment || 'comercial';
const CODES_BY_SEGMENT = {
  comercial: ['C2A', 'C1A'],
  rezidential: ['B', 'BP', 'BE'],
};
const codes = args.codes
  ? args.codes.split(',').map((s) => s.trim().toUpperCase())
  : CODES_BY_SEGMENT[segment];
if (!codes) {
  console.error(`[lead-targetare] segment necunoscut „${segment}" (rezidential|comercial) și fără --codes=`);
  process.exit(1);
}
const limit = args.limit ? parseInt(args.limit, 10) : 6;

// ── Normalizări identice cu anre-prefilter-input.js ────────────────────────

function normalizeName(n) {
  if (!n) return '';
  let x = n.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[\.\-_&,'`"\[\]\(\)]/g, ' ')
    .replace(/\s+/g, ' ').trim();
  x = x.replace(/^(s\s*c|sc|s)\s+/i, '').trim();
  x = x.replace(/\b(srl|sa|sca|snc|scs|sarl|pfa|ii|if|ong|ra|nv|ltd|gmbh|s r l|s a|s c)\b/gi, '').trim();
  return x.replace(/\s+/g, ' ').trim();
}
function normalizeJudet(j) {
  if (!j) return '';
  return j.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/municipiul|oras|oraş|comuna|judetul|judeţul/gi, '')
    .replace(/\s+/g, ' ').trim();
}
function normalizeCui(c) {
  if (!c) return '';
  return String(c).replace(/^ro/i, '').replace(/\s+/g, '').trim();
}
function parseCode(tip) {
  const m = (tip || '').match(/Tarif\s+([A-Za-z0-9]+)/i);
  return m ? m[1].toUpperCase() : null;
}
function activeCodes(firm) {
  const out = new Set();
  for (const c of firm.certificates || []) {
    if (c.stare !== 'Atestat') continue;
    const code = parseCode(c.tipTarif);
    if (code && codes.includes(code)) out.add(code);
  }
  return [...out].sort();
}

// ── Candidați din registrul ANRE ───────────────────────────────────────────

const anre = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'anre-atestate.json'), 'utf8'));
const cuiIdx = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'anre-with-cui.json'), 'utf8'));
const _companiesRaw = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'companies.json'), 'utf8'));
const companies = Array.isArray(_companiesRaw) ? _companiesRaw : _companiesRaw.companies;
const rejectedPath = path.join(ROOT, 'data', 'anre-rejected.json');
const rejected = fs.existsSync(rejectedPath) ? JSON.parse(fs.readFileSync(rejectedPath, 'utf8')) : [];

const cuiByKey = new Map();
for (const e of cuiIdx) {
  if (!e.cui || !e.anreName || !e.anreJudet) continue;
  cuiByKey.set(`${e.anreName}|${e.anreJudet}`, normalizeCui(e.cui));
}

const occupied = new Set();
const occupiedNorm = new Set();
for (const c of companies) {
  if (c.anreMatch?.societate && c.anreMatch?.judet) {
    occupied.add(`${c.anreMatch.societate}|${c.anreMatch.judet}`);
  }
  if (c.name && c.location?.county) {
    occupiedNorm.add(`${normalizeName(c.name)}|${normalizeJudet(c.location.county)}`);
  }
  const cui = normalizeCui(c.cui);
  if (cui) {
    for (const [k, v] of cuiByKey) if (v === cui) occupied.add(k);
  }
}
const rejectedKeys = new Set(rejected.map((r) => `${r.societate}|${r.judet}`));

const wantedJudet = normalizeJudet(judet);
const SOLAR_KEYWORDS = /fotovoltaic|solar(?!ium)|PV\b|panouri|energie regenerabil/i;

const candidates = [];
let noCui = 0;
for (const firm of anre) {
  if (normalizeJudet(firm.judet) !== wantedJudet) continue;
  const firmCodes = activeCodes(firm);
  if (firmCodes.length === 0) continue;
  const key = `${firm.societate}|${firm.judet}`;
  if (occupied.has(key) || rejectedKeys.has(key)) continue;
  if (occupiedNorm.has(`${normalizeName(firm.societate)}|${normalizeJudet(firm.judet)}`)) continue;
  const cui = cuiByKey.get(key);
  if (!cui) {
    noCui += 1;
    continue;
  }
  candidates.push({
    societate: firm.societate.trim(),
    localitate: (firm.localitate || '').trim(),
    telefon: (firm.telefon || '').replace(/\s+/g, ' ').trim(),
    codes: firmCodes,
    cui,
  });
}

// Creditele se cheltuie pe cei mai promițători: numele cu solar/PV întâi,
// apoi cei cu mai multe atestate din țintă.
candidates.sort(
  (a, b) =>
    Number(SOLAR_KEYWORDS.test(b.societate)) - Number(SOLAR_KEYWORDS.test(a.societate)) ||
    b.codes.length - a.codes.length,
);

console.log(
  `[lead-targetare] ${judet} · segment ${segment} · coduri ${codes.join('/')}: ` +
    `${candidates.length} candidați ANRE în afara directorului` +
    (noCui ? ` (+${noCui} fără CUI, săriți)` : ''),
);
if (candidates.length === 0) process.exit(0);

const picked = candidates.slice(0, limit);
console.log(`[lead-targetare] Îmbogățesc primii ${picked.length} prin targetare.ro...\n`);

// ── Enrichment targetare ───────────────────────────────────────────────────

const BASE = 'https://api.targetare.ro/v1';
const HEADERS = { Authorization: `Bearer ${API_KEY}` };

async function apiGet(endpoint) {
  const res = await fetch(`${BASE}${endpoint}`, { headers: HEADERS });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText} — ${endpoint} — ${body.slice(0, 120)}`);
  }
  return res.json();
}

function extractCaen(caenArray) {
  if (!Array.isArray(caenArray) || caenArray.length === 0) return { code: '', label: '' };
  const last = caenArray[caenArray.length - 1];
  const match = last.match(/^(\d{4})\s*-\s*(.+)$/);
  return match ? { code: match[1], label: match[2].trim() } : { code: '', label: last };
}

const TARGET_CAEN = new Set(['4321', '7112', '3511']);

function fmtRon(n) {
  if (!n) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
}

const results = [];
let remaining = null;
for (const [i, cand] of picked.entries()) {
  process.stdout.write(`  [${i + 1}/${picked.length}] ${cand.societate}... `);
  const out = { ...cand, caen: '', caenLabel: '', revenue: 0, employees: 0, founded: 0, website: '', error: null };
  try {
    const res = await apiGet(`/companies/${cand.cui}`);
    remaining = res.remainingRequests ?? remaining;
    const general = res.data;
    out.founded = general.foundingYear || 0;
    const caen = extractCaen(general.caen || []);
    out.caen = caen.code;
    out.caenLabel = caen.label;
    if (general.hasFinData) {
      const fin = await apiGet(`/companies/${cand.cui}/financial`).then((r) => r.data);
      const rows = Array.isArray(fin.financialData) ? fin.financialData : [];
      const latest = rows.sort((a, b) => b.year - a.year)[0] || {};
      out.revenue = fin.turnover || latest.turnover || 0;
      out.employees = fin.employee || latest.employee || 0;
    }
    if (general.hasWebsite) {
      const w = await apiGet(`/companies/${cand.cui}/websites`).then((r) => r.data);
      out.website = (w.websites || [])[0] || '';
    }
    console.log('ok');
  } catch (err) {
    out.error = err.message;
    console.log('ERR');
  }
  results.push(out);
}

// Ordinea de apel: semnale de relevanță PV întâi (CAEN țintă, solar în nume),
// apoi firmele cu activitate financiară reală.
const relevance = (r) =>
  (TARGET_CAEN.has(r.caen) ? 3 : 0) +
  (SOLAR_KEYWORDS.test(`${r.societate} ${r.caenLabel}`) ? 3 : 0) +
  (r.website ? 1 : 0) +
  (r.revenue > 0 ? 1 : 0);
results.sort((a, b) => relevance(b) - relevance(a));

console.log(`\nCall-list ${judet} (${segment}), în ordinea relevanței:\n`);
for (const r of results) {
  console.log(`• ${r.societate}  [${r.codes.join('+')}]`);
  console.log(`    ${r.localitate || '—'} · tel: ${r.telefon || '—'} · CUI ${r.cui}`);
  if (r.error) {
    console.log(`    targetare: ${r.error}`);
  } else {
    console.log(
      `    CAEN ${r.caen || '—'}${r.caenLabel ? ` (${r.caenLabel.slice(0, 50)})` : ''} · ` +
        `CA ${fmtRon(r.revenue)} RON · ${r.employees || '—'} angajați · din ${r.founded || '—'}` +
        (r.website ? ` · ${r.website}` : ''),
    );
  }
}
if (remaining != null) console.log(`\n[lead-targetare] Credite targetare rămase: ${remaining}`);
