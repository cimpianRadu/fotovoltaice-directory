#!/usr/bin/env node
/**
 * ONRC → ANRE matcher (CUI enrichment).
 *
 * Reads the public ONRC bulk CSV (OD_FIRME.csv) in streaming mode,
 * keeps only rows whose normalized name matches a firm from anre-atestate.json,
 * and writes data/anre-with-cui.json. The big CSV is deleted afterwards.
 *
 * Usage:
 *   node scripts/onrc-match.js [--keep-csv] [--csv-url=URL]
 *
 * Dataset source: https://data.gov.ro/dataset/firme-08-12-2025 (updated ~2 months)
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ONRC_URL = process.env.ONRC_CSV_URL || 'https://data.gov.ro/dataset/f7374920-a656-4e34-85dd-a61c6e6e5603/resource/488a8d00-90df-4f37-b5f4-6c9111e6f1e7/download/od_firme.csv';
const CSV_PATH = path.join(__dirname, '..', 'data', 'raw', 'od_firme.csv');
const ANRE_PATH = path.join(__dirname, '..', 'data', 'anre-atestate.json');
const OUTPUT_PATH = path.join(__dirname, '..', 'data', 'anre-with-cui.json');

const args = process.argv.slice(2);
const keepCsv = args.includes('--keep-csv');

// Normalize company name for matching (ANRE vs ONRC have different formatting).
function normalizeName(name) {
  if (!name) return '';
  let n = name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/[\.\-_&,'`"]/g, ' ')                    // punctuation → space
    .replace(/\s+/g, ' ')
    .trim();
  // Strip legal suffixes (both ONRC and ANRE free-text)
  n = n.replace(/\b(srl|sa|sca|snc|scs|sarl|pfa|ii|if|ong|ra|nv|ltd|gmbh|s r l|s a)\b/gi, '').trim();
  n = n.replace(/\s+/g, ' ').trim();
  return n;
}

function downloadCsv(url, dest) {
  return new Promise((resolve, reject) => {
    console.log(`  downloading ${url}`);
    const out = fs.createWriteStream(dest);
    let bytes = 0;
    let lastLog = Date.now();

    const request = (u, depth = 0) => {
      if (depth > 5) return reject(new Error('Too many redirects'));
      https.get(u, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          return request(new URL(res.headers.location, u).toString(), depth + 1);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode} on ${u}`));
        }
        res.on('data', (chunk) => {
          bytes += chunk.length;
          const now = Date.now();
          if (now - lastLog > 1500) {
            process.stdout.write(`\r  downloaded ${(bytes / 1024 / 1024).toFixed(1)} MB`);
            lastLog = now;
          }
        });
        res.pipe(out);
        out.on('finish', () => {
          out.close();
          process.stdout.write(`\r  downloaded ${(bytes / 1024 / 1024).toFixed(1)} MB (done)\n`);
          resolve();
        });
        out.on('error', reject);
      }).on('error', reject);
    };
    request(url);
  });
}

async function streamMatch(csvPath, lookup) {
  const stream = fs.createReadStream(csvPath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  let header = null;
  let colIdx = null;
  let lineNo = 0;
  let matched = 0;
  const results = new Map(); // normalizedName → { ...row, anreRefs }

  for await (const line of rl) {
    lineNo += 1;
    // CSV uses ^ as separator, UTF-8 BOM on first line
    const clean = lineNo === 1 ? line.replace(/^\uFEFF/, '') : line;
    const fields = clean.split('^');

    if (!header) {
      header = fields;
      colIdx = {
        name: header.indexOf('DENUMIRE'),
        cui: header.indexOf('CUI'),
        codInm: header.indexOf('COD_INMATRICULARE'),
        data: header.indexOf('DATA_INMATRICULARE'),
        forma: header.indexOf('FORMA_JURIDICA'),
        judet: header.indexOf('ADR_JUDET'),
        localitate: header.indexOf('ADR_LOCALITATE'),
        web: header.indexOf('WEB'),
      };
      if (colIdx.name < 0 || colIdx.cui < 0) {
        throw new Error(`Unexpected CSV header: ${header.join(' | ')}`);
      }
      continue;
    }

    const denumire = fields[colIdx.name];
    if (!denumire) continue;
    const norm = normalizeName(denumire);
    const anreEntry = lookup.get(norm);
    if (!anreEntry) continue;

    // Prefer first match (ONRC CSV can have historical duplicates — first is usually current)
    if (results.has(norm)) continue;

    const cui = fields[colIdx.cui];
    results.set(norm, {
      anreKey: anreEntry.societate,
      onrcName: denumire,
      cui: cui && cui !== '0' ? cui : null,
      codInmatriculare: fields[colIdx.codInm] || null,
      dataInmatriculare: fields[colIdx.data] || null,
      formaJuridica: fields[colIdx.forma] || null,
      judet: fields[colIdx.judet] || null,
      localitate: fields[colIdx.localitate] || null,
      web: fields[colIdx.web] || null,
    });
    matched += 1;

    if (lineNo % 100000 === 0) {
      process.stdout.write(`\r  scanned ${lineNo.toLocaleString()} rows, ${matched} matches`);
    }
  }
  process.stdout.write(`\r  scanned ${lineNo.toLocaleString()} rows, ${matched} matches\n`);
  return results;
}

async function main() {
  if (!fs.existsSync(ANRE_PATH)) {
    throw new Error(`Missing ${ANRE_PATH}. Run scripts/anre-sync.js first.`);
  }
  const anre = JSON.parse(fs.readFileSync(ANRE_PATH, 'utf8'));
  console.log(`ANRE source: ${anre.length} firms`);

  // Build lookup: normalizedName → firm (first wins if dupes)
  const lookup = new Map();
  let collisions = 0;
  for (const f of anre) {
    const key = normalizeName(f.societate);
    if (!key) continue;
    if (lookup.has(key)) { collisions += 1; continue; }
    lookup.set(key, f);
  }
  console.log(`  ${lookup.size} unique normalized names (${collisions} collisions ignored)`);

  fs.mkdirSync(path.dirname(CSV_PATH), { recursive: true });
  if (!fs.existsSync(CSV_PATH)) {
    await downloadCsv(ONRC_URL, CSV_PATH);
  } else {
    const sz = fs.statSync(CSV_PATH).size;
    console.log(`  reusing cached CSV (${(sz / 1024 / 1024).toFixed(1)} MB)`);
  }

  console.log('Scanning ONRC CSV…');
  const matches = await streamMatch(CSV_PATH, lookup);

  // Merge ANRE certs onto ONRC matches for final output
  const merged = [];
  for (const [normKey, firm] of matches) {
    const anreFirm = lookup.get(normKey);
    merged.push({
      cui: firm.cui,
      name: firm.onrcName,
      anreName: anreFirm.societate,
      codInmatriculare: firm.codInmatriculare,
      dataInmatriculare: firm.dataInmatriculare,
      formaJuridica: firm.formaJuridica,
      judet: firm.judet,
      localitate: firm.localitate,
      web: firm.web,
      anreSediu: anreFirm.sediu,
      anreJudet: anreFirm.judet,
      anreTelefon: anreFirm.telefon,
      certificates: anreFirm.certificates,
    });
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(merged, null, 2));
  const unmatched = anre.length - merged.length;
  console.log(`\n✓ Wrote ${merged.length} enriched records → ${path.relative(process.cwd(), OUTPUT_PATH)}`);
  console.log(`  ${unmatched} ANRE firms without ONRC match (${((unmatched / anre.length) * 100).toFixed(1)}%)`);

  // Sample stats
  const withCui = merged.filter((m) => m.cui).length;
  const activeC2A = merged.filter((m) =>
    m.certificates.some((c) => /C2A/i.test(c.tipTarif) && c.stare === 'Atestat')
  ).length;
  console.log(`  ${withCui} with CUI resolved, ${activeC2A} with active C2A`);

  if (!keepCsv) {
    fs.unlinkSync(CSV_PATH);
    console.log(`  cleaned up ${path.relative(process.cwd(), CSV_PATH)}`);
  }
}

main().catch((err) => {
  console.error('✗ ONRC match failed:', err.message);
  process.exit(1);
});
