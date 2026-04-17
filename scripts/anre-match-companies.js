#!/usr/bin/env node
/**
 * Compute proposed ANRE match for each company in companies.json.
 *
 * Strategy (ranked):
 *   1. Match via CUI (strip RO prefix) against anre-with-cui.json
 *   2. Match via normalized name + same judet against anre-atestate.json
 *   3. Match via phone digits (last 7 chars)
 *   4. Fallback: report ambiguous/missing
 *
 * Output: writes data/anre-match-proposal.json and prints summary.
 */

const fs = require('fs');
const path = require('path');

const COMPANIES_PATH = path.join(__dirname, '..', 'data', 'companies.json');
const ANRE_PATH = path.join(__dirname, '..', 'data', 'anre-atestate.json');
const CUI_PATH = path.join(__dirname, '..', 'data', 'anre-with-cui.json');
const OUT_PATH = path.join(__dirname, '..', 'data', 'anre-match-proposal.json');

function normalizeName(name) {
  if (!name) return '';
  let n = name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[\.\-_&,'`"\[\]\(\)]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  // Strip Romanian society prefixes: "s c", "sc", lone "s" at start
  n = n.replace(/^(s\s*c|sc|s)\s+/i, '').trim();
  // Strip legal suffixes anywhere
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

function phoneDigits(p) {
  if (!p) return [];
  return (p.match(/\d{7,}/g) || []).map((d) => d.slice(-9));
}

function main() {
  const companies = JSON.parse(fs.readFileSync(COMPANIES_PATH, 'utf8')).companies;
  const anre = JSON.parse(fs.readFileSync(ANRE_PATH, 'utf8'));
  const cuiEnriched = JSON.parse(fs.readFileSync(CUI_PATH, 'utf8'));

  // Build indexes
  const anreByNameJudet = new Map(); // key: `${normName}|${normJudet}` → anre entry
  const anreByName = new Map();      // key: normName → [entries]
  for (const f of anre) {
    const n = normalizeName(f.societate);
    const j = normalizeJudet(f.judet);
    if (n) {
      const key = `${n}|${j}`;
      if (!anreByNameJudet.has(key)) anreByNameJudet.set(key, f);
      if (!anreByName.has(n)) anreByName.set(n, []);
      anreByName.get(n).push(f);
    }
  }

  const cuiToAnreName = new Map(); // raw CUI → anre societate
  for (const f of cuiEnriched) {
    if (f.cui) cuiToAnreName.set(String(f.cui), f.anreName);
  }

  const proposals = [];
  for (const co of companies) {
    const rawCui = (co.cui || '').replace(/^RO/i, '').trim();
    const nk = normalizeName(co.name);
    const jk = normalizeJudet(co.location?.county || '');
    const ourPhones = phoneDigits(co.contact?.phone || '');

    let match = null;
    let method = null;
    let confidence = 'none';

    // 1. CUI → ANRE name from enriched file → lookup exact
    if (rawCui && cuiToAnreName.has(rawCui)) {
      const anreName = cuiToAnreName.get(rawCui);
      match = anre.find((f) => f.societate === anreName);
      if (match) { method = 'cui'; confidence = 'high'; }
    }

    // 2. Name + judet
    if (!match && nk && jk) {
      const hit = anreByNameJudet.get(`${nk}|${jk}`);
      if (hit) { match = hit; method = 'name+judet'; confidence = 'high'; }
    }

    // 3. Unique name match (no judet collision)
    if (!match && nk) {
      const hits = anreByName.get(nk) || [];
      if (hits.length === 1) { match = hits[0]; method = 'name-unique'; confidence = 'medium'; }
    }

    // 4. Phone match (fuzzy, across whole registry — slower, only if unmatched)
    if (!match && ourPhones.length) {
      for (const f of anre) {
        const fPhones = phoneDigits(f.telefon);
        if (ourPhones.some((p) => fPhones.includes(p))) {
          match = f; method = 'phone'; confidence = 'medium';
          break;
        }
      }
    }

    // 5. Name collision with multiple candidates, no judet resolution
    const nameHits = anreByName.get(nk) || [];
    const ambiguous = !match && nameHits.length > 1;

    proposals.push({
      id: co.id,
      name: co.name,
      cui: co.cui,
      ourJudet: co.location?.county,
      ourPhone: co.contact?.phone,
      method,
      confidence,
      anreMatch: match ? {
        societate: match.societate,
        judet: match.judet,
        localitate: match.localitate,
        telefon: match.telefon,
      } : null,
      ambiguousCandidates: ambiguous ? nameHits.map((h) => ({
        societate: h.societate,
        judet: h.judet,
        telefon: h.telefon,
      })) : undefined,
    });
  }

  fs.writeFileSync(OUT_PATH, JSON.stringify(proposals, null, 2));

  // Summary
  const byConf = { high: 0, medium: 0, none: 0 };
  for (const p of proposals) byConf[p.confidence]++;
  console.log(`Total: ${proposals.length}`);
  console.log(`  high confidence: ${byConf.high}`);
  console.log(`  medium confidence: ${byConf.medium}`);
  console.log(`  unmatched: ${byConf.none}`);
  console.log(`\nUnmatched + ambiguous:`);
  for (const p of proposals) {
    if (p.confidence === 'none') {
      console.log(`  ✗ ${p.name} (${p.cui})`);
    } else if (p.confidence === 'medium') {
      console.log(`  ⚠ ${p.name} → ${p.anreMatch.societate} [${p.method}]`);
    }
  }
  console.log(`\nProposal written to ${path.relative(process.cwd(), OUT_PATH)}`);
}

main();
