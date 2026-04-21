#!/usr/bin/env node
/**
 * Generate shortlist of ANRE candidates with CUI for prefilter stage.
 *
 * Reads: data/anre-atestate.json, data/anre-with-cui.json, data/companies.json,
 *        data/anre-rejected.json
 * Writes: data/anre-prefilter-input.json
 *
 * Output shape: [{ societate, judet, cui, codes, telefon, sediu }]
 *
 * Filters:
 *   - active C2A or C1A (PV industrial/comercial target)
 *   - NOT in companies.json (via exact anreMatch, normalized name+judet, CUI)
 *   - NOT in anre-rejected.json
 *   - HAS a CUI in anre-with-cui.json (needed for targetare.ro lookup)
 *
 * CLI: node scripts/anre-prefilter-input.js [--judet=Bucuresti] [--limit=20]
 */

const fs = require('fs');
const path = require('path');

const ANRE = path.join(__dirname, '..', 'data', 'anre-atestate.json');
const CUI = path.join(__dirname, '..', 'data', 'anre-with-cui.json');
const COMPANIES = path.join(__dirname, '..', 'data', 'companies.json');
const REJECTED = path.join(__dirname, '..', 'data', 'anre-rejected.json');
const OUT = path.join(__dirname, '..', 'data', 'anre-prefilter-input.json');

const TARGET_CODES = ['C2A', 'C1A'];

const args = process.argv.slice(2).reduce((acc, a) => {
  const m = a.match(/^--([^=]+)=(.+)$/);
  if (m) acc[m[1]] = m[2];
  return acc;
}, {});
const judetFilter = args.judet || null;
const limit = args.limit ? parseInt(args.limit, 10) : 20;

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
    if (code && TARGET_CODES.includes(code)) out.add(code);
  }
  return [...out].sort();
}

const anre = JSON.parse(fs.readFileSync(ANRE, 'utf8'));
const cuiIdx = JSON.parse(fs.readFileSync(CUI, 'utf8'));
const companies = JSON.parse(fs.readFileSync(COMPANIES, 'utf8')).companies;
const rejected = fs.existsSync(REJECTED) ? JSON.parse(fs.readFileSync(REJECTED, 'utf8')) : [];

// Index CUI by (societate|judet)
const cuiByKey = new Map();
for (const e of cuiIdx) {
  if (!e.cui || !e.anreName || !e.anreJudet) continue;
  cuiByKey.set(`${e.anreName}|${e.anreJudet}`, normalizeCui(e.cui));
}

// Occupied keys from companies.json
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

// Build candidate list
const out = [];
for (const firm of anre) {
  const codes = activeCodes(firm);
  if (codes.length === 0) continue;
  const key = `${firm.societate}|${firm.judet}`;
  if (occupied.has(key)) continue;
  if (rejectedKeys.has(key)) continue;
  if (occupiedNorm.has(`${normalizeName(firm.societate)}|${normalizeJudet(firm.judet)}`)) continue;
  const cui = cuiByKey.get(key);
  if (!cui) continue; // need CUI for targetare.ro
  if (judetFilter && normalizeJudet(firm.judet) !== normalizeJudet(judetFilter)) continue;

  out.push({
    societate: firm.societate.trim(),
    judet: firm.judet.trim(),
    cui,
    codes,
    hasBoth: codes.includes('C2A') && codes.includes('C1A'),
    telefon: (firm.telefon || '').replace(/\s+/g, ' ').trim(),
    sediu: (firm.sediu || '').trim(),
    localitate: (firm.localitate || '').trim(),
  });
}

// Sort: hasBoth first, then by societate
out.sort((a, b) => {
  if (a.hasBoth !== b.hasBoth) return a.hasBoth ? -1 : 1;
  return a.societate.localeCompare(b.societate, 'ro');
});

const shortlist = out.slice(0, limit);
fs.writeFileSync(OUT, JSON.stringify(shortlist, null, 2) + '\n');

console.log(`[prefilter-input] total eligible: ${out.length}`);
console.log(`  With both C2A+C1A: ${out.filter((x) => x.hasBoth).length}`);
console.log(`  Filter judet: ${judetFilter || '(any)'}`);
console.log(`  Written top ${shortlist.length} → ${path.relative(process.cwd(), OUT)}`);
