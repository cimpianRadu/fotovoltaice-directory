#!/usr/bin/env node
/**
 * Fetch contact data (phone, email) for top candidates via targetare.ro API.
 *
 * Reads data/anre-prefilter-results.json, picks firms with score ≥ threshold,
 * and fetches /phones + /emails endpoints for each.
 *
 * Fără credite pe targetare (sau fără cheie, sau --source=site): telefonul vine din
 * registru (ANAF, apoi ANRE), iar emailul din site-ul firmei (mailto: și adrese din
 * homepage + /contact). Emailul de pe site e de verificat la research.
 *
 * Usage:
 *   node scripts/targetare-contacts.js [--min-score=6] [--limit=10] [--source=auto|targetare|site]
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
const sourceArg = (process.argv.find((a) => a.startsWith('--source=')) || '--source=auto').split('=')[1];
let useTargetare = !!API_KEY && sourceArg !== 'site';
if (!API_KEY && sourceArg !== 'site') console.warn('Lipsește TARGETARE_API_KEY → contacte din registru + site');

const args = process.argv.slice(2);
const minScore = Number((args.find((a) => a.startsWith('--min-score=')) || '=6').split('=')[1]) || 6;
const limit = Number((args.find((a) => a.startsWith('--limit=')) || '=10').split('=')[1]) || 10;
const pvGateArg = (args.find((a) => a.startsWith('--pv-gate=')) || '').split('=')[1] || '';
const pvGateAllow = pvGateArg ? new Set(pvGateArg.split(',').map((s) => s.trim())) : null;

const H = { Authorization: `Bearer ${API_KEY}` };

async function fetchJson(url) {
  const res = await fetch(url, { headers: H });
  if ([401, 402, 403, 429].includes(res.status)) {
    if (useTargetare) console.warn(`\ntargetare ${res.status} → contacte din registru + site pentru restul`);
    useTargetare = false;
    return null;
  }
  if (!res.ok) return null;
  return res.json();
}

const UA = 'Mozilla/5.0 (compatible; PVDirectoryBot/1.0; +https://instalatori-fotovoltaice.ro)';
const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const EMAIL_SKIP = /\.(png|jpe?g|webp|gif|svg)$|example\.|sentry|wixpress|@(domain|email)\./i;

async function emailFromSite(website) {
  if (!website) return '';
  const base = (/^https?:/i.test(website) ? website : `https://${website}`).replace(/\/+$/, '');
  const host = base.replace(/^https?:\/\/(www\.)?/i, '').split('/')[0].toLowerCase();
  const found = [];
  for (const url of [base, `${base}/contact`, `${base}/contact/`]) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 10_000);
      const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: ctrl.signal, redirect: 'follow' });
      clearTimeout(t);
      if (!res.ok) continue;
      const html = await res.text();
      const mailto = [...html.matchAll(/mailto:([^"'?>\s]+)/gi)].map((m) => decodeURIComponent(m[1]));
      for (const e of [...mailto, ...(html.match(EMAIL_RE) || [])]) {
        const clean = e.trim().toLowerCase();
        if (!EMAIL_SKIP.test(clean) && !found.includes(clean)) found.push(clean);
      }
    } catch (_) {}
    if (found.length) break;
  }
  // preferă adresa de pe domeniul firmei
  return found.find((e) => e.endsWith('@' + host)) || found[0] || '';
}

function firstPhone(s) {
  const m = String(s || '').replace(/[\s./-]/g, '').match(/(\+?40|0)\d{9}/);
  return m ? m[0].replace(/^\+?40/, '0') : '';
}

(async () => {
  const resultsPath = path.join(__dirname, '..', 'data', 'anre-prefilter-results.json');
  const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
  const candidates = results
    .filter((r) => r.score >= minScore)
    .filter((r) => !pvGateAllow || pvGateAllow.has(r.pvGate))
    .slice(0, limit);

  const gateNote = pvGateAllow ? `, pvGate in {${[...pvGateAllow].join(',')}}` : '';
  console.log(`Fetching contacts for ${candidates.length} firms (score >= ${minScore}${gateNote})...`);

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

    if (useTargetare) {
      const ph = await fetchJson(`https://api.targetare.ro/v1/companies/${f.cui}/phones`);
      if (ph && ph.data) {
        out.phone = ph.data.primaryPhone || ph.data.verifiedPhone || '';
        if (ph.remainingRequests != null) remaining = ph.remainingRequests;
      }
    }
    if (useTargetare) {
      const em = await fetchJson(`https://api.targetare.ro/v1/companies/${f.cui}/emails`);
      if (em && em.data) {
        out.email = em.data.primaryEmail || em.data.contactEmail || (em.data.websiteEmails && em.data.websiteEmails[0]) || '';
        if (em.remainingRequests != null) remaining = em.remainingRequests;
      }
    }
    if (!out.phone) {
      out.phone = firstPhone(f.phone_registry) || firstPhone(f.telefon_anre);
      if (out.phone) out.phone_source = f.phone_registry ? 'anaf' : 'anre';
    }
    if (!out.email) {
      out.email = await emailFromSite(out.website);
      if (out.email) out.email_source = 'site';
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
