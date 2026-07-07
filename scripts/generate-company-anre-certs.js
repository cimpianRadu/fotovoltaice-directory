#!/usr/bin/env node
/**
 * Generează data/company-anre-certs.json — certificatele ANRE active (PV-relevante)
 * DOAR pentru firmele din companies.json, indexate după "societate|judet".
 *
 * De ce: componentele client (CompanyCard în lista /firme, filterCompanies) au nevoie
 * de certurile active, dar registrul complet (anre-atestate.json, 8,3 MB) nu are ce
 * căuta în bundle-ul de browser. Fișierul derivat are câțiva KB.
 *
 * Logica de rezolvare oglindește lib/anre.ts (parseTipTarif + getCompanyAnreCerts).
 * Dacă modifici regulile acolo, actualizează și aici.
 *
 * Rulează automat ca `prebuild` (npm run build). Manual: node scripts/generate-company-anre-certs.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const companies = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/companies.json'), 'utf8')).companies;
const registry = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/anre-atestate.json'), 'utf8'));

const PV_RELEVANT_CODES = ['C2A', 'C1A', 'B', 'BP', 'BE'];
const CODE_ORDER = { C2A: 1, C1A: 2, B: 3, BP: 4, BE: 5 };

function parseTipTarif(tipTarif) {
  if (!tipTarif) return null;
  const m = tipTarif.match(/Tarif\s+([A-Za-z0-9]+)(.*)$/i);
  if (!m) return null;
  const code = m[1].toUpperCase();
  const rest = (m[2] || '').trim();
  let variant = null;
  if (/vizare\s*periodica/i.test(rest)) variant = 'vizare periodica';
  else if (/vizare/i.test(rest)) variant = 'vizare';
  return { code, variant };
}

function resolveCerts(firm) {
  const resolved = [];
  const seen = new Set();
  const sorted = [...(firm.certificates || [])].sort((a, b) => {
    if ((a.stare === 'Atestat') !== (b.stare === 'Atestat')) return a.stare === 'Atestat' ? -1 : 1;
    return (b.dataEmitere || '').localeCompare(a.dataEmitere || '');
  });
  for (const c of sorted) {
    const parsed = parseTipTarif(c.tipTarif);
    if (!parsed) continue;
    if (!PV_RELEVANT_CODES.includes(parsed.code)) continue;
    if (c.stare !== 'Atestat') continue;
    if (seen.has(parsed.code)) continue;
    seen.add(parsed.code);
    resolved.push({
      code: parsed.code,
      variant: parsed.variant,
      nrAtestat: c.nrAtestat,
      dataEmitere: c.dataEmitere,
      dataExpirare: c.dataExpirare,
      stare: c.stare,
      isActive: true,
      tipTarifRaw: c.tipTarif,
    });
  }
  resolved.sort((a, b) => (CODE_ORDER[a.code] || 99) - (CODE_ORDER[b.code] || 99));
  return resolved;
}

const firmIndex = new Map();
for (const f of registry) firmIndex.set(`${f.societate}|${f.judet}`, f);

const map = {};
let matched = 0;
for (const c of companies) {
  if (!c.anreMatch) continue;
  const key = `${c.anreMatch.societate}|${c.anreMatch.judet}`;
  const firm = firmIndex.get(key);
  if (!firm) {
    console.warn(`⚠ anreMatch fără corespondent în registru: ${key} (${c.name})`);
    continue;
  }
  map[key] = resolveCerts(firm);
  matched++;
}

const outPath = path.join(ROOT, 'data/company-anre-certs.json');
fs.writeFileSync(outPath, JSON.stringify(map, null, 1) + '\n');
const kb = (fs.statSync(outPath).size / 1024).toFixed(1);
console.log(`✔ ${outPath}: ${matched} firme cu anreMatch, ${kb} KB`);
