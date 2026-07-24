#!/usr/bin/env node
/**
 * Compute proposed ANRE match for each company in companies.json.
 *
 * Strategy (ranked):
 *   1. Match via CUI (strip RO prefix) against anre-with-cui.json
 *   2. Match via normalized name + same judet against anre-atestate.json
 *   3. Match via phone digits (last 7 chars)
 *   4. Fuzzy name (edit distance ≤ 2) within the same judet — registrul ANRE
 *      conține typo-uri de tastare ("INSTAL CONTRUCT") care rup egalitatea exactă
 *   5. Fallback: report ambiguous/missing
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
    // Sufix de dezambiguizare din registrul ANRE: "ELECTRICA [AR]" \u2192 "ELECTRICA".
    // Se scoate cu tot cu con\u021binut, altfel r\u0103m\u00e2ne un token "ar" care rupe egalitatea.
    .replace(/\[[^\]]*\]/g, ' ')
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

// Distanța maximă acceptată la potrivirea fuzzy pe nume. La 3 apar deja
// fals-pozitive reale în registru ("VTL ENERGY" → "NAF ENERGY"), deci 2 e plafonul.
const FUZZY_MAX_DISTANCE = 2;
// Sub această lungime o distanță de 2 înseamnă altă firmă, nu un typo.
const FUZZY_MIN_LENGTH = 8;

function editDistance(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (cur[j] < rowMin) rowMin = cur[j];
    }
    if (rowMin > max) return max + 1; // niciun rezultat sub prag mai poate ieși
    prev = cur;
  }
  return prev[b.length];
}

function main() {
  const companies = JSON.parse(fs.readFileSync(COMPANIES_PATH, 'utf8')).companies;
  const anre = JSON.parse(fs.readFileSync(ANRE_PATH, 'utf8'));
  const cuiEnriched = JSON.parse(fs.readFileSync(CUI_PATH, 'utf8'));

  // Build indexes
  const anreByNameJudet = new Map(); // key: `${normName}|${normJudet}` → anre entry
  const anreByName = new Map();      // key: normName → [entries]
  const anreByJudet = new Map();     // key: normJudet → [{ entry, normName }] (pentru fuzzy)
  for (const f of anre) {
    const n = normalizeName(f.societate);
    const j = normalizeJudet(f.judet);
    if (n) {
      const key = `${n}|${j}`;
      if (!anreByNameJudet.has(key)) anreByNameJudet.set(key, f);
      if (!anreByName.has(n)) anreByName.set(n, []);
      anreByName.get(n).push(f);
      if (!anreByJudet.has(j)) anreByJudet.set(j, []);
      anreByJudet.get(j).push({ entry: f, normName: n });
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

    // 5. Fuzzy name within the same judet — prinde typo-urile din registru.
    //    Se acceptă doar dacă există un singur candidat la distanța minimă:
    //    o egalitate între doi candidați înseamnă că nu putem decide.
    if (!match && nk.length >= FUZZY_MIN_LENGTH && jk) {
      const pool = anreByJudet.get(jk) || [];
      let best = null;
      let bestCount = 0;
      for (const cand of pool) {
        const d = editDistance(nk, cand.normName, FUZZY_MAX_DISTANCE);
        if (d > FUZZY_MAX_DISTANCE) continue;
        if (!best || d < best.d) { best = { d, entry: cand.entry }; bestCount = 1; }
        else if (d === best.d) bestCount++;
      }
      if (best && bestCount === 1) {
        match = best.entry;
        method = `fuzzy-name+judet(d=${best.d})`;
        confidence = 'medium';
      }
    }

    // 6. Name collision with multiple candidates, no judet resolution
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
