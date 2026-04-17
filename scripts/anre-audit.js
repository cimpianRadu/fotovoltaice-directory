#!/usr/bin/env node
/**
 * ANRE Audit — Cross-reference companies.json with anre-with-cui.json.
 *
 * Reports:
 *   • companies not found in ANRE registry (by CUI or name)
 *   • ANRE-* certifications we list that aren't actually active on ANRE
 *   • active ANRE certs the firm has that we're not listing
 *   • stale data hints (ANRE name/sediu/judet differs noticeably)
 *
 * Usage:
 *   node scripts/anre-audit.js [--json]
 *
 * Output:
 *   stdout (human-readable) or JSON report if --json passed.
 */

const fs = require('fs');
const path = require('path');

const COMPANIES_PATH = path.join(__dirname, '..', 'data', 'companies.json');
const ANRE_PATH = path.join(__dirname, '..', 'data', 'anre-with-cui.json');

const args = process.argv.slice(2);
const asJson = args.includes('--json');

// --- Name normalization (same rules as onrc-match.js) ---
function normalizeName(name) {
  if (!name) return '';
  let n = name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[\.\-_&,'`"]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  n = n.replace(/\b(srl|sa|sca|snc|scs|sarl|pfa|ii|if|ong|ra|nv|ltd|gmbh|s r l|s a)\b/gi, '').trim();
  return n.replace(/\s+/g, ' ').trim();
}

function stripCuiPrefix(cui) {
  if (!cui) return '';
  return String(cui).replace(/^RO/i, '').trim();
}

// Map an ANRE "tipTarif" string → our canonical cert code (e.g. "C2A", "B", "A3").
// Returns null if it's not a tarif code we track.
function tipTarifToCode(tipTarif) {
  if (!tipTarif) return null;
  // "Tarif C2A", "Tarif C2A*-vizare periodica", "Tarif A3 Vizare"
  const m = tipTarif.match(/Tarif\s+([A-Za-z0-9]+)/i);
  if (!m) return null;
  return m[1].toUpperCase();
}

// Extract active ANRE cert codes (state = "Atestat") for an ANRE firm.
function activeAnreCodes(anreFirm) {
  const codes = new Set();
  for (const c of anreFirm.certificates || []) {
    if (c.stare !== 'Atestat') continue;
    const code = tipTarifToCode(c.tipTarif);
    if (code) codes.add(code);
  }
  return codes;
}

// Parse our "ANRE-C2A" → "C2A". Returns null if not an ANRE cert string.
function parseOurAnreCert(cert) {
  const m = /^ANRE[-\s]?(.+)$/i.exec(cert);
  return m ? m[1].toUpperCase() : null;
}

function main() {
  const raw = JSON.parse(fs.readFileSync(COMPANIES_PATH, 'utf8'));
  const companies = raw.companies || raw;
  const anre = JSON.parse(fs.readFileSync(ANRE_PATH, 'utf8'));

  // Build indexes.
  const byCui = new Map();
  const byName = new Map();
  for (const f of anre) {
    if (f.cui) byCui.set(stripCuiPrefix(f.cui), f);
    const nk = normalizeName(f.anreName || f.name);
    if (nk && !byName.has(nk)) byName.set(nk, f);
  }

  const report = {
    totalCompanies: companies.length,
    notOnAnre: [],      // couldn't match by CUI or name
    matchedByName: [],  // no CUI match but name matched (worth fixing)
    mismatches: [],     // listed cert not active on ANRE
    missingCerts: [],   // active ANRE cert we don't list
    stale: [],          // anre metadata differs from ours
  };

  for (const co of companies) {
    const coCui = stripCuiPrefix(co.cui);
    const coNameKey = normalizeName(co.name);

    let match = coCui ? byCui.get(coCui) : null;
    let matchedBy = match ? 'cui' : null;
    if (!match) {
      match = byName.get(coNameKey);
      if (match) matchedBy = 'name';
    }

    if (!match) {
      report.notOnAnre.push({ name: co.name, cui: co.cui });
      continue;
    }

    if (matchedBy === 'name') {
      report.matchedByName.push({
        name: co.name,
        ourCui: co.cui,
        anreCui: match.cui,
        anreName: match.anreName,
      });
    }

    const active = activeAnreCodes(match);
    const listedAnre = new Set(
      (co.certifications || [])
        .map(parseOurAnreCert)
        .filter(Boolean)
    );

    // Certs we claim but ANRE doesn't confirm as active
    const ghost = [...listedAnre].filter((code) => !active.has(code));
    // Certs ANRE shows active but we don't list
    const missing = [...active].filter((code) => !listedAnre.has(code));

    if (ghost.length) {
      report.mismatches.push({
        name: co.name,
        cui: co.cui,
        listedButNotActive: ghost,
        anreActive: [...active],
      });
    }
    if (missing.length) {
      report.missingCerts.push({
        name: co.name,
        cui: co.cui,
        weList: [...listedAnre],
        anreActive: [...active],
        missing,
      });
    }

    // Stale judet comparison
    if (co.location?.county && match.anreJudet) {
      const a = normalizeName(co.location.county);
      const b = normalizeName(match.anreJudet);
      if (a && b && a !== b) {
        report.stale.push({
          name: co.name,
          ours: { county: co.location.county, city: co.location.city },
          anre: { judet: match.anreJudet, localitate: match.localitate, sediu: match.anreSediu },
        });
      }
    }
  }

  if (asJson) {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  // Human-readable
  console.log(`\nANRE AUDIT — ${report.totalCompanies} companies in directory\n`);
  console.log(`✗ Not found on ANRE (${report.notOnAnre.length}):`);
  for (const x of report.notOnAnre) console.log(`   - ${x.name} (${x.cui || 'no CUI'})`);

  console.log(`\n⚠ Matched by name only — no CUI match (${report.matchedByName.length}):`);
  for (const x of report.matchedByName) {
    console.log(`   - ${x.name}  our=${x.ourCui}  anre=${x.anreCui || '∅'}  (ANRE: ${x.anreName})`);
  }

  console.log(`\n✗ Listed certs NOT active on ANRE (${report.mismatches.length}):`);
  for (const x of report.mismatches) {
    console.log(`   - ${x.name}: claims ${x.listedButNotActive.map((c) => 'ANRE-' + c).join(', ')}; ANRE active: ${[...x.anreActive].join(', ') || '—'}`);
  }

  console.log(`\n+ Active ANRE certs we're NOT listing (${report.missingCerts.length}):`);
  for (const x of report.missingCerts) {
    console.log(`   - ${x.name}: missing ${x.missing.map((c) => 'ANRE-' + c).join(', ')} (ANRE active: ${x.anreActive.join(', ')})`);
  }

  console.log(`\n~ Judet mismatch ours vs ANRE (${report.stale.length}):`);
  for (const x of report.stale) {
    console.log(`   - ${x.name}: ours=${x.ours.county}/${x.ours.city || '?'}  anre=${x.anre.judet}/${x.anre.localitate || '?'}`);
  }

  const clean = report.totalCompanies
    - report.notOnAnre.length
    - report.mismatches.length
    - report.missingCerts.length;
  console.log(`\n→ ${clean} companies pass audit cleanly (no flags).`);
}

main();
