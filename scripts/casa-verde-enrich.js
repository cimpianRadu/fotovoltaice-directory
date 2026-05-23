/**
 * Casa Verde enrich — pulls targetare.ro data by CUI for residential candidates.
 * Separate from the ANRE prefilter; same API, different population.
 *
 * Reads data/casa-verde-candidates.json, enriches a batch with general +
 * financial + websites + phones + emails, flags mega-utilities / no-website,
 * writes data/casa-verde-enriched.json.
 *
 * CLI: node scripts/casa-verde-enrich.js [--limit=40] [--skip=0]
 * API: ~3-5 credits/firm.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
for (const line of fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const API_KEY = process.env.TARGETARE_API_KEY;
if (!API_KEY) { console.error('Missing TARGETARE_API_KEY'); process.exit(1); }

const BASE = 'https://api.targetare.ro/v1';
const H = { Authorization: `Bearer ${API_KEY}` };
const args = process.argv.slice(2);
const limit = Number((args.find((a) => a.startsWith('--limit=')) || '=40').split('=')[1]) || 40;
const skip = Number((args.find((a) => a.startsWith('--skip=')) || '=0').split('=')[1]) || 0;

const MEGA_REVENUE = 50_000_000; // utilities (E.ON, PPC, ENGIE) are not residential installers to feature

async function get(endpoint) {
  const r = await fetch(`${BASE}${endpoint}`, { headers: H });
  if (!r.ok) throw new Error(`${r.status} ${endpoint}`);
  return r.json();
}
const lastCaen = (arr) => {
  if (!Array.isArray(arr) || !arr.length) return { code: '', label: '' };
  const m = arr[arr.length - 1].match(/^(\d{4})\s*-\s*(.+)$/);
  return m ? { code: m[1], label: m[2].trim() } : { code: '', label: arr[arr.length - 1] };
};

async function enrich(cand) {
  const out = { cui: cand.cui, name: cand.name, sourceUrl: cand.sourceUrl, flag: '' };
  try {
    const g = (await get(`/companies/${cand.cui}`)).data;
    out.name = g.companyName || cand.name;
    out.companyType = g.companyType || '';
    out.judet = g.county || '';
    out.localitate = g.locality || '';
    out.address = g.fullAddress || '';
    out.founded = g.foundingYear || 0;
    out.status = g.status || '';
    const caen = lastCaen(g.caen);
    out.caen_code = caen.code; out.caen_label = caen.label;
    out.website = ''; out.revenue = 0; out.profit = 0; out.employees = 0; out.phone = ''; out.email = '';

    if (g.hasFinData) {
      const f = (await get(`/companies/${cand.cui}/financial`)).data;
      const rows = Array.isArray(f.financialData) ? [...f.financialData].sort((a, b) => b.year - a.year) : [];
      const latest = rows[0] || {};
      out.revenue = f.turnover || latest.turnover || 0;
      out.profit = f.netProfit || latest.netProfit || 0;
      out.employees = f.employee || latest.employee || 0;
      out.finYear = latest.year || 0;
    }
    if (g.hasWebsite) {
      const w = (await get(`/companies/${cand.cui}/websites`)).data;
      out.website = (w.websites || [])[0] || '';
    }
    if (g.hasPhone) {
      const p = (await get(`/companies/${cand.cui}/phones`)).data;
      out.phone = (p.phones || p.phoneNumbers || [])[0] || '';
    }
    if (g.hasEmail) {
      const e = (await get(`/companies/${cand.cui}/emails`)).data;
      out.email = (e.emails || [])[0] || '';
    }

    // Flags for triage
    if (out.revenue >= MEGA_REVENUE) out.flag = 'mega-utility';
    else if (!out.website) out.flag = 'no-website';
    else if (out.caen_code === '3511' || out.caen_code === '3514') out.flag = 'energy-supplier';
  } catch (err) {
    out.flag = 'error'; out.error = err.message;
  }
  return out;
}

async function main() {
  const cands = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/casa-verde-candidates.json'), 'utf8'));
  const batch = cands.slice(skip, skip + limit);
  console.log(`[casa-verde-enrich] enriching ${batch.length} (skip ${skip})...`);
  const results = [];
  for (let i = 0; i < batch.length; i++) {
    process.stdout.write(`  [${i + 1}/${batch.length}] ${batch[i].name}... `);
    const r = await enrich(batch[i]);
    results.push(r);
    console.log(r.flag ? r.flag : `OK ${out2(r)}`);
  }
  fs.writeFileSync(path.join(ROOT, 'data/casa-verde-enriched.json'), JSON.stringify(results, null, 2) + '\n');

  const good = results.filter((r) => !r.flag);
  console.log(`\n  clean (no flag): ${good.length} | mega:${results.filter(r=>r.flag==='mega-utility').length} no-web:${results.filter(r=>r.flag==='no-website').length} supplier:${results.filter(r=>r.flag==='energy-supplier').length} err:${results.filter(r=>r.flag==='error').length}`);
  console.log('  → data/casa-verde-enriched.json');
  // Remaining credits ping
  try { const ping = await fetch(`${BASE}/account`, { headers: H }); } catch {}
}
function out2(r){ return `${r.judet} ${r.founded||'?'} ${(r.revenue/1e6).toFixed(1)}M ${r.employees}emp`; }

main().catch((e) => { console.error(e); process.exit(1); });
