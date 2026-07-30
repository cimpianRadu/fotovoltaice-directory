#!/usr/bin/env node
/**
 * Refresh financial data (bilanț ANAF) for every firm in companies.json,
 * via the targetare.ro API.
 *
 * Succesorul lui backfill-financials.js, care era un one-off cu anul 2024
 * hardcodat în filtru și în updatedAt. Aici anul nu e presupus: luăm rândul
 * cel mai recent returnat de API și îl comparăm cu ce avem stocat.
 *
 * Datele existente nu se șterg niciodată: dacă API-ul nu întoarce nimic
 * pentru o firmă (bilanț nedepus, firmă prea nouă), rândul rămâne neatins.
 *
 * Răspunsul brut se salvează în --cache ca să putem face raportul pe ghiduri
 * fără să plătim a doua oară creditele.
 *
 * Usage:
 *   node scripts/refresh-financials.js [--dry-run] [--cache=<path>] [--limit=N]
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}

const API_KEY = process.env.TARGETARE_API_KEY;
if (!API_KEY) {
  console.error('Missing TARGETARE_API_KEY in .env.local');
  process.exit(1);
}

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const cachePath = (args.find((a) => a.startsWith('--cache=')) || '=').split('=')[1] || '';
const limit = Number((args.find((a) => a.startsWith('--limit=')) || '=0').split('=')[1]) || 0;

const TODAY = new Date().toISOString().slice(0, 10);
const HISTORY_YEARS = 5;
const BASE = 'https://api.targetare.ro/v1';
const HEADERS = { Authorization: `Bearer ${API_KEY}` };

const dataPath = path.join(__dirname, '..', 'data', 'companies.json');
const db = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const firms = limit ? db.companies.slice(0, limit) : db.companies;

const fmt = (n) => (n || 0).toLocaleString('ro-RO');

(async () => {
  const changes = [];
  const skipped = [];
  const errors = [];
  const raw = {};
  let remaining = null;

  for (const [i, c] of firms.entries()) {
    const cui = String(c.cui).replace(/^RO/, '');
    process.stdout.write(`  [${String(i + 1).padStart(3)}/${firms.length}] ${c.slug.padEnd(38)}`);

    let latest;
    let history = [];
    try {
      const res = await fetch(`${BASE}/companies/${cui}/financial`, { headers: HEADERS });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.remainingRequests != null) remaining = json.remainingRequests;
      raw[c.slug] = { cui, data: json.data || {} };
      const rows = Array.isArray(json.data?.financialData) ? json.data.financialData : [];
      latest = rows.slice().sort((a, b) => b.year - a.year)[0];
      // Istoric pe ultimii ani, exact cum vine de la ANAF prin API. Fără ani
      // fabricați: rândurile fără cifră de afaceri nu intră.
      history = rows
        .filter((r) => r.year != null && r.turnover != null)
        .sort((a, b) => a.year - b.year)
        .slice(-HISTORY_YEARS)
        .map((r) => ({
          year: r.year,
          revenue: r.turnover,
          profit: r.netProfit ?? 0,
          ...(r.employee > 0 ? { employees: r.employee } : {}),
        }));
    } catch (err) {
      console.log(`ERR ${err.message}`);
      errors.push({ slug: c.slug, error: err.message });
      continue;
    }

    if (!latest || latest.turnover == null) {
      console.log('fără bilanț în API, păstrăm ce avem');
      skipped.push({ slug: c.slug, reason: 'fără date în API' });
      continue;
    }

    const before = {
      year: c.financials?.year ?? null,
      revenue: c.financials?.revenue ?? null,
      profit: c.financials?.profit ?? null,
      employees: c.employees ?? null,
    };
    const after = {
      year: latest.year,
      revenue: latest.turnover,
      profit: latest.netProfit ?? 0,
      employees: latest.employee > 0 ? latest.employee : before.employees,
    };

    // Un bilanț mai vechi decât ce avem stocat nu e o actualizare, e o regresie.
    if (before.year != null && after.year < before.year) {
      console.log(`API are doar ${after.year}, stocat ${before.year}, păstrăm`);
      skipped.push({ slug: c.slug, reason: `API mai vechi (${after.year} < ${before.year})` });
      continue;
    }

    const historyChanged =
      JSON.stringify(c.financials?.history || []) !== JSON.stringify(history);

    const same =
      before.year === after.year &&
      before.revenue === after.revenue &&
      before.profit === after.profit &&
      before.employees === after.employees;

    if (same && !historyChanged) {
      console.log(`neschimbat (${after.year})`);
      continue;
    }

    // Cifrele de bază sunt aceleași, doar istoricul e nou (prima rulare după
    // adăugarea câmpului). Scriem istoricul, nu atingem updatedAt.
    if (same && historyChanged) {
      if (!dryRun) {
        c.financials = { ...c.financials, history };
      }
      console.log(`istoric adăugat (${history.map((h) => h.year).join(', ')})`);
      continue;
    }

    const pct =
      before.revenue > 0 ? ((after.revenue - before.revenue) / before.revenue) * 100 : null;

    if (!dryRun) {
      c.financials = { year: after.year, revenue: after.revenue, profit: after.profit, history };
      if (after.employees > 0) c.employees = after.employees;
      c.updatedAt = TODAY;
    }

    console.log(
      `${before.year ?? '—'}→${after.year}  ${fmt(before.revenue)} → ${fmt(after.revenue)}` +
        (pct == null ? '' : ` (${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%)`),
    );
    changes.push({ slug: c.slug, name: c.name, before, after, pct });
  }

  if (!dryRun) {
    fs.writeFileSync(dataPath, JSON.stringify(db, null, 2) + '\n');
  }
  if (cachePath) {
    fs.writeFileSync(cachePath, JSON.stringify({ date: TODAY, changes, skipped, errors, raw }, null, 2));
  }

  const big = changes.filter((c) => c.pct != null && Math.abs(c.pct) >= 10);
  console.log(`\n${'='.repeat(70)}`);
  console.log(`${dryRun ? 'DRY RUN, nimic scris' : 'Scris în companies.json'}`);
  console.log(`  actualizate:        ${changes.length}/${firms.length}`);
  console.log(`  variație ≥10%:      ${big.length}`);
  console.log(`  fără date în API:   ${skipped.length}`);
  console.log(`  erori:              ${errors.length}`);
  if (remaining != null) console.log(`  credite rămase:     ${remaining}`);
  if (cachePath) console.log(`  raport:             ${cachePath}`);
})();
