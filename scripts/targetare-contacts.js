#!/usr/bin/env node
/**
 * Fetch contact data (phone, email) for top candidates via targetare.ro API.
 *
 * Reads data/anre-prefilter-results.json, picks firms with score ≥ threshold,
 * and fetches /phones + /emails endpoints for each.
 *
 * Usage:
 *   node scripts/targetare-contacts.js [--min-score=6] [--limit=10]
 */

const fs = require('fs');
const path = require('path');

// Parse .env.local safely — only match lines that start with KEY=...
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
    }
  }
}

const API_KEY = process.env.TARGETARE_API_KEY;
if (!API_KEY) {
  console.error('Missing TARGETARE_API_KEY');
  process.exit(1);
}

const args = process.argv.slice(2);
const minScore = Number((args.find((a) => a.startsWith('--min-score=')) || '=6').split('=')[1]) || 6;
const limit = Number((args.find((a) => a.startsWith('--limit=')) || '=10').split('=')[1]) || 10;

const H = { Authorization: `Bearer ${API_KEY}` };

async function fetchJson(url) {
  const res = await fetch(url, { headers: H });
  if (!res.ok) return null;
  return res.json();
}

(async () => {
  const resultsPath = path.join(__dirname, '..', 'data', 'anre-prefilter-results.json');
  const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
  const candidates = results.filter((r) => r.score >= minScore).slice(0, limit);

  console.log(`Fetching contacts for ${candidates.length} firms (score >= ${minScore})...`);

  const contacts = [];
  let remaining = null;
  for (const f of candidates) {
    const out = {
      cui: f.cui,
      name: f.name,
      judet: f.judet,
      localitate: f.localitate || '',
      address: f.address || '',
      phone: '',
      email: '',
      website: f.website || '',
      year_founded: f.year_founded,
      employees: f.employees,
      revenue_2024: f.revenue_2024,
      profit_2024: f.profit_2024,
      caen_code: f.caen_code,
      caen_label: f.caen_label,
      codes: f.codes,
      hasBoth: f.hasBoth,
      score: f.score,
    };

    const ph = await fetchJson(`https://api.targetare.ro/v1/companies/${f.cui}/phones`);
    if (ph && ph.data) {
      out.phone = ph.data.primaryPhone || ph.data.verifiedPhone || '';
      if (ph.remainingRequests != null) remaining = ph.remainingRequests;
    }

    const em = await fetchJson(`https://api.targetare.ro/v1/companies/${f.cui}/emails`);
    if (em && em.data) {
      out.email = em.data.primaryEmail || em.data.contactEmail || (em.data.websiteEmails && em.data.websiteEmails[0]) || '';
      if (em.remainingRequests != null) remaining = em.remainingRequests;
    }

    contacts.push(out);
    process.stderr.write('.');
  }
  process.stderr.write('\n');

  const outPath = path.join(__dirname, '..', 'data', 'anre-contacts.json');
  fs.writeFileSync(outPath, JSON.stringify(contacts, null, 2));
  console.log(`Written ${contacts.length} contacts → ${outPath}`);
  if (remaining != null) console.log(`API credits remaining: ${remaining}`);

  // Print summary
  contacts.forEach((c) => {
    console.log(`  ${c.name.padEnd(45)} phone: ${c.phone || '—'}  email: ${c.email || '—'}  web: ${c.website || '—'}`);
  });
})();
