#!/usr/bin/env node
/**
 * PV Content Check — post-prefilter stage
 *
 * For each firm in data/anre-prefilter-results.json with score ≥ 6 AND a website,
 * fetch the homepage (+ /servicii and /despre-noi if linked), strip HTML, and
 * count PV-related keyword hits. Firms with 0 hits are probably not PV installers
 * (automation, lighting, security, gas/water infra) and should be skipped during
 * research.
 *
 * Writes updated scores back to anre-prefilter-results.json with new fields:
 *   - pvContentHits: number of distinct PV keywords found across pages
 *   - pvContentSample: first 2 matched snippets (for debugging)
 *   - pvGate: 'pass' | 'weak' | 'fail'
 *       pass  = 3+ hits (definitely does PV)
 *       weak  = 1-2 hits (worth researching, PV may be minor service)
 *       fail  = 0 hits (skip — non-PV firm)
 *
 * Also updates docs/anre-prefiltered.md with a PV column.
 *
 * Usage:
 *   node scripts/anre-prefilter-content.js
 *   node scripts/anre-prefilter-content.js --min-score=6
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2).reduce((acc, a) => {
  const [k, v] = a.replace(/^--/, '').split('=');
  acc[k] = v ?? true;
  return acc;
}, {});

const MIN_SCORE = parseInt(args['min-score'] || '6', 10);
const TIMEOUT_MS = 10_000;
const UA = 'Mozilla/5.0 (compatible; PVDirectoryBot/1.0; +https://instalatori-fotovoltaice.ro)';

// Keyword patterns — each distinct match adds 1 hit
const PV_KEYWORDS = [
  /\bfotovoltaic\w*/i,
  /\bpanou(ri)?\s+(solar|fotovoltaic)/i,
  /\bsistem(e)?\s+fotovoltaic/i,
  /\benergie\s+solar/i,
  /\benergie\s+regenerabil/i,
  /\b(on|off)[-\s]?grid/i,
  /\bprosumator\b/i,
  /\binvert(or|er)\b/i,
  /\bkWp\b/,
  /\bMWp\b/,
  /\bcentral(a|ă|e)\s+fotovoltaic/i,
  /\bparc(uri)?\s+fotovoltaic/i,
  /\bpompe?\s+de\s+c[aă]ldur[aă]/i, // heat pumps often signal PV crossover
];

const EXTRA_PAGES = ['/servicii', '/despre-noi', '/despre', '/about', '/portofoliu', '/proiecte'];

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#?\w+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchText(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Accept: 'text/html' },
      signal: controller.signal,
      redirect: 'follow',
    });
    if (!res.ok) return { ok: false, status: res.status, text: '', finalUrl: res.url };
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('html') && !ct.includes('text')) return { ok: false, status: 415, text: '', finalUrl: res.url };
    const html = await res.text();
    return { ok: true, status: res.status, text: stripHtml(html), finalUrl: res.url };
  } catch (err) {
    return { ok: false, status: 0, text: '', error: err.message, finalUrl: url };
  } finally {
    clearTimeout(timer);
  }
}

function countHits(text) {
  const hits = [];
  for (const re of PV_KEYWORDS) {
    const m = text.match(re);
    if (m) {
      const idx = m.index ?? 0;
      const snippet = text.slice(Math.max(0, idx - 40), Math.min(text.length, idx + 80)).trim();
      hits.push({ pattern: re.source, sample: snippet });
    }
  }
  return hits;
}

function gate(hitCount) {
  if (hitCount >= 3) return 'pass';
  if (hitCount >= 1) return 'weak';
  return 'fail';
}

async function checkFirm(firm) {
  if (!firm.website) {
    return { ...firm, pvContentHits: 0, pvContentSample: [], pvGate: 'no-site' };
  }

  const base = firm.website.replace(/\/+$/, '');
  const pages = [base, ...EXTRA_PAGES.map((p) => base + p)];

  let combined = '';
  let anyOk = false;
  for (const url of pages) {
    const r = await fetchText(url);
    if (r.ok) {
      anyOk = true;
      combined += ' ' + r.text;
      if (combined.length > 200_000) break; // cap memory
    }
    // first (homepage) failure short-circuits
    if (url === base && !r.ok) {
      return {
        ...firm,
        pvContentHits: 0,
        pvContentSample: [],
        pvGate: 'dead-site',
        pvError: `home ${r.status} ${r.error || ''}`.trim(),
      };
    }
  }

  const hits = countHits(combined);
  return {
    ...firm,
    pvContentHits: hits.length,
    pvContentSample: hits.slice(0, 2).map((h) => h.sample),
    pvGate: gate(hits.length),
  };
}

async function main() {
  const resultsPath = path.join(__dirname, '..', 'data', 'anre-prefilter-results.json');
  if (!fs.existsSync(resultsPath)) {
    console.error('[prefilter-content] Run anre-prefilter-api.js first');
    process.exit(1);
  }
  const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

  const toCheck = results.filter((r) => r.score >= MIN_SCORE && r.website);
  console.log(`[prefilter-content] Checking ${toCheck.length}/${results.length} firms (score ≥ ${MIN_SCORE}, has website)...`);

  const updated = [];
  for (let i = 0; i < results.length; i++) {
    const firm = results[i];
    if (firm.score < MIN_SCORE || !firm.website) {
      updated.push({ ...firm, pvGate: 'skip' });
      continue;
    }
    process.stdout.write(`  [${i + 1}/${results.length}] ${firm.name}... `);
    const checked = await checkFirm(firm);
    updated.push(checked);
    const mark = checked.pvGate === 'pass' ? 'PASS' : checked.pvGate === 'weak' ? 'weak' : checked.pvGate === 'fail' ? 'FAIL' : checked.pvGate.toUpperCase();
    console.log(`${mark} (${checked.pvContentHits} hits)`);
  }

  fs.writeFileSync(resultsPath, JSON.stringify(updated, null, 2));

  const counts = updated.reduce((a, r) => {
    a[r.pvGate] = (a[r.pvGate] || 0) + 1;
    return a;
  }, {});

  console.log('\n[prefilter-content] Gate summary:');
  Object.entries(counts).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

  // Update markdown with PV column
  const mdPath = path.join(__dirname, '..', 'docs', 'anre-prefiltered.md');
  if (fs.existsSync(mdPath)) {
    const formatRon = (n) => (n ? `${(n / 1_000_000).toFixed(2)}M` : '—');
    const gateIcon = (g) => {
      if (g === 'pass') return '✅';
      if (g === 'weak') return '🟡';
      if (g === 'fail') return '❌';
      if (g === 'dead-site') return '💀';
      return '—';
    };
    const mdLines = [
      `# ANRE Prefilter — ${updated[0]?.judet || 'mixed'}`,
      '',
      `Generated: ${new Date().toISOString().slice(0, 10)} via targetare.ro + PV content check`,
      `Total: ${updated.length} • Score ≥6: ${updated.filter((r) => r.score >= 6).length} • PV gate PASS: ${counts.pass || 0} • WEAK: ${counts.weak || 0} • FAIL: ${counts.fail || 0}`,
      '',
      '| Score | PV | Hits | Firm | CUI | CAEN | Revenue | Site | Notes |',
      '|-------|----|------|------|-----|------|---------|------|-------|',
      ...updated.map((r) => {
        const notes = r.pvError || (r.reasons || []).join(', ');
        return `| ${r.score} | ${gateIcon(r.pvGate)} | ${r.pvContentHits ?? '—'} | ${r.name} | ${r.cui} | ${r.caen_code || '—'} | ${formatRon(r.revenue_2024)} | ${r.website ? '✓' : '—'} | ${notes} |`;
      }),
    ];
    fs.writeFileSync(mdPath, mdLines.join('\n') + '\n');
    console.log(`  Output: ${mdPath}`);
  }
}

main().catch((err) => {
  console.error('[prefilter-content] Fatal:', err.message);
  process.exit(1);
});
