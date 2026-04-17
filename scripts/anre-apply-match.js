#!/usr/bin/env node
/**
 * Apply the ANRE match proposal to companies.json.
 *
 * For each company:
 *   • Adds `anreMatch: { societate, judet }` pointing to the exact ANRE registry entry
 *     (or null if not on ANRE).
 *   • Removes all "ANRE-*" entries from the certifications[] array. These will now
 *     be resolved live at build time from data/anre-atestate.json via lib/anre.ts.
 *
 * Existing ISO-* and other non-ANRE certs are preserved.
 *
 * Usage: node scripts/anre-apply-match.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');

const COMPANIES_PATH = path.join(__dirname, '..', 'data', 'companies.json');
const PROPOSAL_PATH = path.join(__dirname, '..', 'data', 'anre-match-proposal.json');
const args = process.argv.slice(2);
const dry = args.includes('--dry-run');

function main() {
  const raw = JSON.parse(fs.readFileSync(COMPANIES_PATH, 'utf8'));
  const proposals = JSON.parse(fs.readFileSync(PROPOSAL_PATH, 'utf8'));
  const proposalById = new Map(proposals.map((p) => [p.id, p]));

  let changed = 0;
  let removedAnreCerts = 0;
  for (const co of raw.companies) {
    const prop = proposalById.get(co.id);
    if (!prop) {
      console.warn(`  no proposal for ${co.id}`);
      continue;
    }

    // Set anreMatch (always write — use `in` to detect field absence, not value)
    const newMatch = prop.anreMatch
      ? { societate: prop.anreMatch.societate, judet: prop.anreMatch.judet }
      : null;
    const fieldAbsent = !('anreMatch' in co);
    const matchChanged = fieldAbsent || JSON.stringify(co.anreMatch) !== JSON.stringify(newMatch);
    if (matchChanged) {
      co.anreMatch = newMatch;
      changed++;
    }

    // Strip ANRE-* from certifications
    if (Array.isArray(co.certifications)) {
      const before = co.certifications.length;
      co.certifications = co.certifications.filter((c) => !/^ANRE[-\s]/i.test(c));
      removedAnreCerts += before - co.certifications.length;
    }
  }

  if (dry) {
    console.log(`[dry-run] Would update ${changed} anreMatch fields, remove ${removedAnreCerts} ANRE-* cert entries.`);
    return;
  }

  fs.writeFileSync(COMPANIES_PATH, JSON.stringify(raw, null, 2) + '\n');
  console.log(`✓ Updated ${changed} anreMatch fields`);
  console.log(`✓ Removed ${removedAnreCerts} hardcoded ANRE-* cert entries`);
  console.log(`  ${path.relative(process.cwd(), COMPANIES_PATH)}`);
}

main();
