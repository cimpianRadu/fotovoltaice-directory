#!/usr/bin/env node
/**
 * Discover ANRE-certified PV firms NOT yet in companies.json.
 *
 * Focus: C2A / C1A (industrial & commercial PV). These are the codes
 * that matter for our target audience — B/BP/BE are residential/small.
 *
 * Dedup strategy (mirrors anre-match-companies.js):
 *   1. Existing anreMatch on a company (societate + judet exact)
 *   2. Normalized name + normalized judet
 *   3. CUI cross-reference via anre-with-cui.json
 *
 * Output: docs/anre-candidates.md — grouped by judet, sorted by societate.
 */

const fs = require('fs');
const path = require('path');

const COMPANIES_PATH = path.join(__dirname, '..', 'data', 'companies.json');
const ANRE_PATH = path.join(__dirname, '..', 'data', 'anre-atestate.json');
const CUI_PATH = path.join(__dirname, '..', 'data', 'anre-with-cui.json');
const REJECTED_PATH = path.join(__dirname, '..', 'data', 'anre-rejected.json');
const OUT_PATH = path.join(__dirname, '..', 'docs', 'anre-candidates.md');

const TARGET_CODES = ['C2A', 'C1A'];

function normalizeName(name) {
  if (!name) return '';
  let n = name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[\.\-_&,'`"\[\]\(\)]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  n = n.replace(/^(s\s*c|sc|s)\s+/i, '').trim();
  n = n.replace(/\b(srl|sa|sca|snc|scs|sarl|pfa|ii|if|ong|ra|nv|ltd|gmbh|s r l|s a|s c)\b/gi, '').trim();
  return n.replace(/\s+/g, ' ').trim();
}

function normalizeJudet(j) {
  if (!j) return '';
  return j.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/municipiul|oras|oraş|comuna|judetul|judeţul/gi, '')
    .replace(/\[[^\]]*\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeCui(cui) {
  if (!cui) return '';
  return String(cui).replace(/^ro/i, '').replace(/\s+/g, '').trim();
}

function parseCode(tipTarif) {
  if (!tipTarif) return null;
  const m = tipTarif.match(/Tarif\s+([A-Za-z0-9]+)/i);
  return m ? m[1].toUpperCase() : null;
}

/** Returns array of active target codes for a firm (e.g. ["C2A", "C1A"]). */
function activeTargetCodes(firm) {
  const found = new Set();
  for (const cert of firm.certificates || []) {
    if (cert.stare !== 'Atestat') continue;
    const code = parseCode(cert.tipTarif);
    if (code && TARGET_CODES.includes(code)) found.add(code);
  }
  return [...found];
}

/** Returns most recent active cert (by dataEmitere) for a given code. */
function latestActiveCert(firm, code) {
  const matches = (firm.certificates || []).filter((c) => {
    if (c.stare !== 'Atestat') return false;
    return parseCode(c.tipTarif) === code;
  });
  matches.sort((a, b) => {
    const parse = (d) => {
      const m = (d || '').match(/(\d{2})\/(\d{2})\/(\d{4})/);
      return m ? `${m[3]}${m[2]}${m[1]}` : '0';
    };
    return parse(b.dataEmitere).localeCompare(parse(a.dataEmitere));
  });
  return matches[0] || null;
}

function formatDate(d) {
  const m = (d || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return d || '';
  return `${m[1]}.${m[2]}.${m[3]}`;
}

function cleanPhone(p) {
  if (!p) return '';
  return p.replace(/\s+/g, ' ').trim();
}

function main() {
  const companies = JSON.parse(fs.readFileSync(COMPANIES_PATH, 'utf8')).companies;
  const anre = JSON.parse(fs.readFileSync(ANRE_PATH, 'utf8'));
  const cuiEnriched = JSON.parse(fs.readFileSync(CUI_PATH, 'utf8'));
  const rejected = fs.existsSync(REJECTED_PATH)
    ? JSON.parse(fs.readFileSync(REJECTED_PATH, 'utf8'))
    : [];

  // Keys of firms we already evaluated and rejected (not PV, no site, etc.)
  // Never surface them again in the candidates list.
  const rejectedKeys = new Set(rejected.map((r) => `${r.societate}|${r.judet}`));

  // Build CUI → (anreName, anreJudet) map so we can resolve companies.json CUIs
  // back to their ANRE registry entry key.
  const cuiToAnreKey = new Map();
  for (const e of cuiEnriched) {
    if (!e.cui || !e.anreName || !e.anreJudet) continue;
    cuiToAnreKey.set(normalizeCui(e.cui), `${e.anreName}|${e.anreJudet}`);
  }

  // Build set of "occupied" ANRE keys (societate|judet) — firms already in directory.
  const occupiedKeys = new Set();
  const occupiedNormNameJudet = new Set();

  for (const c of companies) {
    if (c.anreMatch?.societate && c.anreMatch?.judet) {
      occupiedKeys.add(`${c.anreMatch.societate}|${c.anreMatch.judet}`);
    }
    if (c.name && c.location?.county) {
      occupiedNormNameJudet.add(`${normalizeName(c.name)}|${normalizeJudet(c.location.county)}`);
    }
    const cui = normalizeCui(c.cui);
    if (cui && cuiToAnreKey.has(cui)) {
      occupiedKeys.add(cuiToAnreKey.get(cui));
    }
  }

  // Scan ANRE registry for active C2A/C1A not in directory.
  const candidates = [];
  for (const firm of anre) {
    const codes = activeTargetCodes(firm);
    if (codes.length === 0) continue;

    const key = `${firm.societate}|${firm.judet}`;
    if (occupiedKeys.has(key)) continue;
    if (rejectedKeys.has(key)) continue;

    const normKey = `${normalizeName(firm.societate)}|${normalizeJudet(firm.judet)}`;
    if (occupiedNormNameJudet.has(normKey)) continue;

    // Pick the "best" cert for display: prefer C2A over C1A.
    const primaryCode = codes.includes('C2A') ? 'C2A' : 'C1A';
    const primaryCert = latestActiveCert(firm, primaryCode);

    candidates.push({
      societate: firm.societate.trim(),
      judet: firm.judet.trim(),
      localitate: (firm.localitate || '').trim(),
      codes: codes.sort(), // e.g. ["C1A", "C2A"]
      primaryCode,
      nrAtestat: primaryCert?.nrAtestat || '',
      dataExpirare: primaryCert?.dataExpirare || '',
      telefon: cleanPhone(firm.telefon),
      sediu: (firm.sediu || '').trim(),
    });
  }

  // Sort: judet asc → societate asc
  candidates.sort((a, b) => {
    const j = a.judet.localeCompare(b.judet, 'ro');
    if (j !== 0) return j;
    return a.societate.localeCompare(b.societate, 'ro');
  });

  // Group by judet for markdown
  const byJudet = new Map();
  for (const c of candidates) {
    if (!byJudet.has(c.judet)) byJudet.set(c.judet, []);
    byJudet.get(c.judet).push(c);
  }

  // Summary stats
  const totalC2A = candidates.filter((c) => c.codes.includes('C2A')).length;
  const totalC1A = candidates.filter((c) => c.codes.includes('C1A')).length;
  const both = candidates.filter((c) => c.codes.includes('C2A') && c.codes.includes('C1A')).length;

  // Render markdown
  const lines = [];
  lines.push('# ANRE Candidates — C2A / C1A (industrial/comercial)');
  lines.push('');
  lines.push(`_Generated: ${new Date().toISOString().slice(0, 10)}_`);
  lines.push('');
  lines.push('Firme cu atestat ANRE activ **C2A** sau **C1A** (industrial & comercial) care **nu** sunt încă în `data/companies.json`. Sursă: `data/anre-atestate.json`.');
  lines.push('');
  lines.push('## Stats');
  lines.push('');
  lines.push(`- **Total candidați:** ${candidates.length}`);
  lines.push(`- Cu **C2A** activ: ${totalC2A}`);
  lines.push(`- Cu **C1A** activ: ${totalC1A}`);
  lines.push(`- Cu **ambele**: ${both}`);
  lines.push(`- **Județe acoperite:** ${byJudet.size}`);
  lines.push('');
  lines.push('## Cum folosești');
  lines.push('');
  lines.push('1. Alege 5-10 candidați (preferabil cu C2A + județ neacoperit)');
  lines.push('2. Research: `node scripts/company-tools.js check-bulk <CUI-uri>` (dacă ai CUI-uri)');
  lines.push('3. Adaugă în `companies.json`, apoi `anre-match-companies.js` + `anre-apply-match.js`');
  lines.push('');
  lines.push('## Distribuție pe județ');
  lines.push('');
  lines.push('| Județ | Candidați |');
  lines.push('|---|---:|');
  const judetCounts = [...byJudet.entries()].sort((a, b) => b[1].length - a[1].length);
  for (const [j, arr] of judetCounts) {
    lines.push(`| ${j} | ${arr.length} |`);
  }
  lines.push('');
  lines.push('## Lista completă');
  lines.push('');

  for (const [judet, arr] of [...byJudet.entries()].sort((a, b) => a[0].localeCompare(b[0], 'ro'))) {
    lines.push(`### ${judet} (${arr.length})`);
    lines.push('');
    lines.push('| Societate | Localitate | Certs | Nr. atestat | Expirare | Telefon |');
    lines.push('|---|---|---|---|---|---|');
    for (const c of arr) {
      const certs = c.codes.join(' + ');
      lines.push(`| ${c.societate} | ${c.localitate} | ${certs} | ${c.nrAtestat} | ${formatDate(c.dataExpirare)} | ${c.telefon} |`);
    }
    lines.push('');
  }

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, lines.join('\n'));

  console.log(`\n[anre-discover] ${candidates.length} candidați C2A/C1A neînregistrați`);
  console.log(`  - C2A activ: ${totalC2A}`);
  console.log(`  - C1A activ: ${totalC1A}`);
  console.log(`  - Ambele: ${both}`);
  console.log(`  - Județe: ${byJudet.size}`);
  console.log(`  - Respinși filtrați: ${rejectedKeys.size}`);
  console.log(`\n  Output: ${path.relative(process.cwd(), OUT_PATH)}`);

  // Top 5 județe
  console.log(`\n  Top județe:`);
  for (const [j, arr] of judetCounts.slice(0, 5)) {
    console.log(`    ${j}: ${arr.length}`);
  }
}

main();
