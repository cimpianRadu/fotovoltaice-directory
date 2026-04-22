#!/usr/bin/env node
/**
 * One-off: refetch financial data from targetare.ro API for firms
 * that were added before we had the API (inconsistent year / missing data).
 *
 * Updates companies.json in place.
 */

const fs = require('fs');
const path = require('path');

// Load .env.local
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
  console.error('Missing TARGETARE_API_KEY in .env.local');
  process.exit(1);
}

const BASE = 'https://api.targetare.ro/v1';
const HEADERS = { Authorization: `Bearer ${API_KEY}` };

const dataPath = path.join(__dirname, '..', 'data', 'companies.json');
const d = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Audit: any firm whose financials.year !== 2024, or missing data
const targets = d.companies.filter(
  (c) => !c.financials || c.financials.year !== 2024 || c.financials.revenue === undefined,
);

console.log(`Refetching financials for ${targets.length} firms:\n`);

async function apiGet(endpoint) {
  const res = await fetch(`${BASE}${endpoint}`, { headers: HEADERS });
  if (!res.ok) throw new Error(`${res.status} ${endpoint}`);
  return res.json();
}

(async () => {
  let remaining = null;
  let updated = 0;

  for (const c of targets) {
    // strip "RO" prefix if present for API
    const cui = c.cui.replace(/^RO/, '');
    process.stdout.write(`  ${c.slug.padEnd(35)} `);

    try {
      const gen = await apiGet(`/companies/${cui}`).then((r) => r.data);
      if (!gen.hasFinData) {
        console.log('no fin data available from API');
        continue;
      }

      const fin = await apiGet(`/companies/${cui}/financial`);
      if (fin.remainingRequests != null) remaining = fin.remainingRequests;
      const data = fin.data || {};
      const rows = Array.isArray(data.financialData) ? data.financialData : [];
      const latest = rows.sort((a, b) => b.year - a.year)[0] || {};

      const revenue = data.turnover || latest.turnover || 0;
      const profit = data.netProfit != null ? data.netProfit : latest.netProfit || 0;
      const employees = data.employee || latest.employee || 0;
      const year = latest.year || 2024;

      const before = {
        year: c.financials?.year,
        revenue: c.financials?.revenue,
        employees: c.employees,
      };

      c.financials = { year, revenue, profit };
      if (employees > 0) c.employees = employees;
      c.updatedAt = '2026-04-22';

      console.log(
        `${before.year || '—'}→${year}, rev ${(before.revenue || 0).toLocaleString()} → ${revenue.toLocaleString()}, emp ${before.employees}→${c.employees}`,
      );
      updated++;
    } catch (err) {
      console.log(`ERR: ${err.message}`);
    }
  }

  fs.writeFileSync(dataPath, JSON.stringify(d, null, 2) + '\n');
  console.log(`\n✓ Updated ${updated}/${targets.length} firms`);
  if (remaining != null) console.log(`API credits remaining: ${remaining}`);
})();
