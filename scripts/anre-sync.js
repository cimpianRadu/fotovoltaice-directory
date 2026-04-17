#!/usr/bin/env node
/**
 * ANRE Registry Sync
 *
 * Downloads the full ANRE registry of energy operators with their certifications.
 * Calls POST portal.anre.ro/PublicLists/Atestate/GetAtestate with pagination.
 * Parses the HTML `Detaliu` field into structured certificate data.
 *
 * Output: data/anre-atestate.json
 * Run:    node scripts/anre-sync.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const OUTPUT_PATH = path.join(__dirname, '..', 'data', 'anre-atestate.json');
const PAGE_SIZE = 500;
const ENDPOINT = 'https://portal.anre.ro/PublicLists/Atestate/GetAtestate?menu=Energy';

// Portal has SSL cert issues — replicate the same permissive agent used in the Next.js API route
const agent = new https.Agent({ rejectUnauthorized: false });

function postAnre(page) {
  const body = new URLSearchParams({
    'AtestateTypes[0].IdTipAtestare': '1',
    sort: '',
    page: String(page),
    pageSize: String(PAGE_SIZE),
    group: '',
    filter: '',
  }).toString();

  return new Promise((resolve, reject) => {
    const url = new URL(ENDPOINT);
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      agent,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
        'User-Agent': 'fotovoltaice-directory-sync/1.0',
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(new Error(`Invalid JSON on page ${page}: ${err.message}`));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(60000, () => {
      req.destroy(new Error(`Timeout on page ${page}`));
    });
    req.write(body);
    req.end();
  });
}

function parseDetaliu(html) {
  if (!html) return [];
  const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
  const cells = [];
  let match;
  while ((match = cellRegex.exec(html)) !== null) {
    cells.push(match[1].replace(/<[^>]*>/g, '').trim());
  }
  const certs = [];
  for (let i = 0; i + 4 < cells.length; i += 5) {
    certs.push({
      nrAtestat: cells[i],
      tipTarif: cells[i + 1],
      dataEmitere: cells[i + 2],
      dataExpirare: cells[i + 3],
      stare: cells[i + 4],
    });
  }
  return certs;
}

async function main() {
  console.log('ANRE registry sync starting…');
  const all = [];
  let page = 1;
  let total = Infinity;

  while ((page - 1) * PAGE_SIZE < total) {
    const res = await postAnre(page);
    if (total === Infinity) {
      total = res.Total || 0;
      console.log(`  total records: ${total}`);
    }
    const rows = res.Data || [];
    for (const row of rows) {
      all.push({
        societate: row.Societate || '',
        sediu: row.Sediu || '',
        localitate: row.Localitate || '',
        judet: row.Judet || '',
        telefon: row.TelefonFax || '',
        certificates: parseDetaliu(row.Detaliu || ''),
      });
    }
    process.stdout.write(`  page ${page}: ${rows.length} rows (${all.length}/${total})\n`);
    if (rows.length < PAGE_SIZE) break;
    page += 1;
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(all, null, 2));
  console.log(`\n✓ Wrote ${all.length} firms → ${path.relative(process.cwd(), OUTPUT_PATH)}`);

  // Stats
  const active = all.filter((f) => f.certificates.some((c) => c.stare === 'Atestat'));
  const withC2A = all.filter((f) =>
    f.certificates.some((c) => /C2A/i.test(c.tipTarif) && c.stare === 'Atestat')
  );
  console.log(`  ${active.length} firms with at least one active certificate`);
  console.log(`  ${withC2A.length} firms with active C2A (target for PV directory)`);
}

main().catch((err) => {
  console.error('✗ ANRE sync failed:', err.message);
  process.exit(1);
});
