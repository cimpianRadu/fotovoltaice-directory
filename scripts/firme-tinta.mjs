#!/usr/bin/env node
/**
 * Firmele de instalații care au cel mai mult nevoie de lucrări: cele nou
 * înființate și cele cărora le-a scăzut cifra de afaceri. Iese în tabelul
 * `tinta_snapshots` din Neon, pe care îl citește /admin/tinta. Nu într-un
 * fișier din repo: repo-ul e public, iar lista e munca de prospectare (23 oct 2026).
 *
 * De ce: până acum, cele care au refuzat cererile („avem destulă muncă",
 * „avem marketingul nostru") erau firme stabile. O firmă cu echipă și fără
 * clienți (nouă) sau una care a pierdut volum după suspendarea Casa Verde
 * Fotovoltaice (iul. 2026) are altă problemă, pe care cererile chiar o rezolvă.
 *
 * Totul vine din date publice, fără credite targetare:
 *   1. Registrul ANRE (`data/anre-atestate.json`): universul. Fără atestat B /
 *      Be / C2A activ, o firmă nu poate executa legal instalația, deci nu e client.
 *   2. ONRC, data.gov.ro (OD_FIRME + OD_STARE_FIRMA): CUI, data înmatriculării,
 *      starea firmei (dizolvare, insolvență…). Potrivirea ANRE → ONRC e pe nume
 *      normalizat, departajată pe județ.
 *   3. Situațiile financiare 2023–2025, data.gov.ro (WEB_UU + WEB_BL_BS_SL):
 *      cifra de afaceri, profit/pierdere, angajați, CAEN.
 *
 * Semnalul „face fotovoltaice" nu există în niciun registru, deci îl declarăm
 * explicit, cu sursa: e în director, e validată AFM, e pe necesit ca firmă de
 * fotovoltaice, sau numele o spune. Pagina le arată implicit doar pe acestea.
 *
 * Fișierele brute (~1 GB) se descarcă o dată în data/raw/tinta/ (gitignored)
 * și se refolosesc. `--refresh` le descarcă din nou.
 *
 * Usage:
 *   node scripts/firme-tinta.mjs [--refresh] [--dry]
 */

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import { neon } from '@neondatabase/serverless';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const RAW = path.join(ROOT, 'data/raw/tinta');
// Câte generări păstrăm în bază. Una are ~1 MB, iar planul gratuit Neon are 0,5 GB.
const KEEP = 3;
const args = new Set(process.argv.slice(2));
const REFRESH = args.has('--refresh');
const DRY = args.has('--dry');

// Surse. La o actualizare de set pe data.gov.ro se schimbă doar URL-urile de aici.
const ONRC_DATASET = 'firme-02-09-2026';
const ONRC = {
  firme: 'https://data.gov.ro/dataset/937617a7-6070-4edc-9d39-e790596dca37/resource/5cfc3113-413d-4524-8e8c-1a5e9fa5faa0/download/od_firme.csv',
  stare: 'https://data.gov.ro/dataset/937617a7-6070-4edc-9d39-e790596dca37/resource/f1cb654d-3c24-450d-9ac9-f23513878a45/download/od_stare_firma.csv',
  nomenclator: 'https://data.gov.ro/dataset/7fe937a5-9d85-46ca-8069-260b43f4050d/resource/18b26aa9-078c-4ec3-b43f-f677ccbce869/download/n_stare_firma.csv',
};
const BILANT = {
  2023: [
    'https://data.gov.ro/dataset/7861a98f-4d5c-4faa-90d4-8e934ebd1782/resource/ee5b6665-c096-4582-ada7-cc51a62c3c40/download/web_uu_an2023.txt',
    'https://data.gov.ro/dataset/7861a98f-4d5c-4faa-90d4-8e934ebd1782/resource/8c914899-cf2a-494c-9d3b-7f9f7faa47a3/download/web_bl_bs_sl_an2023.txt',
  ],
  2024: [
    'https://data.gov.ro/dataset/d3caacb6-2c08-445e-94e6-8d36d00ab250/resource/25098618-f6a5-4610-8c7f-c0bdb801635f/download/web_uu_an2024.txt',
    'https://data.gov.ro/dataset/d3caacb6-2c08-445e-94e6-8d36d00ab250/resource/f89140dc-20dd-494f-912a-d1a482188885/download/web_bl_bs_sl_an2024.txt',
  ],
  2025: [
    'https://data.gov.ro/dataset/e2266fdc-0a6b-43b8-9c9f-7a6943d85b28/resource/eeecc692-d914-4d3b-b7f5-d1a8a9791979/download/web_uu_an2025.txt',
    'https://data.gov.ro/dataset/e2266fdc-0a6b-43b8-9c9f-7a6943d85b28/resource/3540a9ce-6a4d-4e29-9aa1-ac909fe28ac1/download/web_bl_bs_sl_an2025.txt',
  ],
};
const YEARS = Object.keys(BILANT).map(Number);
const LAST_YEAR = Math.max(...YEARS);

// Atestatele cu care firma poate EXECUTA o instalație fotovoltaică. Bp și C1A
// sunt doar de proiectare: o firmă numai cu ele nu montează nimic.
const EXEC_CODES = new Set(['B', 'BE', 'C2A']);

// Pragurile segmentelor. Sunt reguli de selecție, nu estimări: fiecare firmă
// din listă poartă cifrele exacte din bilanț care au băgat-o acolo.
const NEW_SINCE = '2023-01-01'; // înmatriculată de atunci încoace
const NEW_CERT_SINCE = '2024-01-01'; // firmă mai veche, dar primul atestat ANRE e recent
const DROP = 0.3; // CA ultimului an cu cel puțin 30% sub vârful anilor anteriori
const DROP_MIN_PEAK = 300_000; // sub 300.000 lei, o „scădere" e zgomot de firmă mică

// ---------------------------------------------------------------------------

const strip = (s) =>
  (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[țţ]/g, 't')
    .replace(/[șş]/g, 's');

// Aceeași normalizare ca scripts/onrc-match.js: ANRE scrie „LAVINIA", ONRC „LAVINIA SRL".
function normName(name) {
  return strip(name)
    .replace(/[.\-_&,'`"]/g, ' ')
    .replace(/\b(srl|sa|sca|snc|scs|sarl|pfa|ii|if|ong|ra|nv|ltd|gmbh|s r l|s a|sc)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// „Bucureşti Sectorul 6", „Municipiul Braşov" → cheie de județ comparabilă cu ANRE.
const countyKey = (s) => strip(s).replace(/municipiul|judetul/g, '').replace(/sectorul.*$/, '').trim();

/** Primul număr utilizabil din câmpul liber ANRE („0722 348102,0257218282"). */
function firstPhone(raw) {
  for (const chunk of (raw || '').split(/[,;/]+/)) {
    const d = chunk.replace(/\D/g, '');
    if (d.length >= 10) return d.slice(0, 10);
  }
  return '';
}

/** „13/05/1992" → „1992-05-13". */
const isoDate = (d) => {
  const m = (d || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : '';
};

async function download(url, name) {
  const dest = path.join(RAW, name);
  if (!REFRESH && fs.existsSync(dest) && fs.statSync(dest).size > 0) return dest;
  process.stdout.write(`  ↓ ${name}… `);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} la ${url}`);
  await pipeline(Readable.fromWeb(res.body), fs.createWriteStream(`${dest}.part`));
  fs.renameSync(`${dest}.part`, dest);
  console.log(`${(fs.statSync(dest).size / 1024 / 1024).toFixed(0)} MB`);
  return dest;
}

async function* lines(file) {
  const rl = readline.createInterface({ input: fs.createReadStream(file, 'utf8'), crlfDelay: Infinity });
  let first = true;
  for await (const line of rl) {
    yield first ? line.replace(/^﻿/, '') : line;
    first = false;
  }
}

const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));

// ---------------------------------------------------------------------------
// 1. Universul: firme ANRE cu atestat de execuție activ

fs.mkdirSync(RAW, { recursive: true });
console.log('1. Registrul ANRE');

const anreRaw = readJson('data/anre-atestate.json');
const anreList = Array.isArray(anreRaw) ? anreRaw : Object.values(anreRaw)[0];

const universe = new Map(); // normName → { anre, codes, firstCert }
for (const f of anreList) {
  const certs = f.certificates || [];
  const codes = new Set();
  for (const c of certs) {
    const code = (c.tipTarif || '').match(/Tarif\s+([A-Za-z0-9]+)/i)?.[1]?.toUpperCase();
    if (code && EXEC_CODES.has(code) && c.stare === 'Atestat') codes.add(code);
  }
  if (!codes.size) continue;
  const key = normName(f.societate);
  if (!key) continue;
  const firstCert = certs.map((c) => isoDate(c.dataEmitere)).filter(Boolean).sort()[0] || '';
  // Același nume în două județe: rămân amândouă ca candidați, departajăm la ONRC.
  if (!universe.has(key)) universe.set(key, []);
  universe.get(key).push({ anre: f, codes: [...codes].sort(), firstCert });
}
const universeCount = [...universe.values()].reduce((n, v) => n + v.length, 0);
console.log(`   ${anreList.length} firme în registru → ${universeCount} cu B / Be / C2A activ`);

// ---------------------------------------------------------------------------
// 2. ONRC: CUI, data înmatriculării, stare

console.log(`2. ONRC (${ONRC_DATASET})`);
const firmeCsv = await download(ONRC.firme, 'od_firme.csv');
const stareCsv = await download(ONRC.stare, 'od_stare_firma.csv');
const nomCsv = await download(ONRC.nomenclator, 'n_stare_firma.csv');

const onrcByName = new Map(); // normName → [rând ONRC]
{
  let idx = null;
  for await (const line of lines(firmeCsv)) {
    const f = line.split('^');
    if (!idx) {
      idx = Object.fromEntries(f.map((h, i) => [h, i]));
      continue;
    }
    const key = normName(f[idx.DENUMIRE]);
    if (!universe.has(key)) continue;
    const cui = f[idx.CUI];
    if (!cui || cui === '0') continue;
    if (!onrcByName.has(key)) onrcByName.set(key, []);
    onrcByName.get(key).push({
      name: f[idx.DENUMIRE],
      cui,
      codInm: f[idx.COD_INMATRICULARE],
      registered: isoDate(f[idx.DATA_INMATRICULARE]),
      judet: f[idx.ADR_JUDET],
      localitate: f[idx.ADR_LOCALITATE],
      web: f[idx.WEB] || '',
    });
  }
}

// Stările negative din nomenclator: tot ce înseamnă că firma e pe ducă.
const NEGATIVE = /dizolv|lichid|falim|insolv|radiat|radiere|suspend|nulitate|inactiv/;
const statusName = new Map();
for await (const line of lines(nomCsv)) {
  const [cod, den] = line.split('^');
  if (cod !== 'COD') statusName.set(cod, den);
}

const firms = []; // după departajare: o intrare per firmă ANRE potrivită
let ambiguous = 0;
for (const [key, entries] of universe) {
  const candidates = onrcByName.get(key) || [];
  for (const entry of entries) {
    const county = countyKey(entry.anre.judet);
    const sameCounty = candidates.filter((c) => countyKey(c.judet) === county);
    // Nume identic în alt județ, fără candidat pe județul ANRE: nu ghicim.
    const pool = sameCounty.length ? sameCounty : candidates.length === 1 ? candidates : [];
    if (!pool.length) {
      if (candidates.length > 1) ambiguous += 1;
      continue;
    }
    // ONRC păstrează și firmele radiate cu același nume; cea mai recentă e de regulă cea vie.
    const onrc = [...pool].sort((a, b) => b.registered.localeCompare(a.registered))[0];
    firms.push({ ...entry, onrc, status: [] });
  }
}
console.log(`   ${firms.length} potrivite pe CUI · ${ambiguous} sărite (nume identic în alt județ)`);

{
  const byCod = new Map(firms.map((f) => [f.onrc.codInm, f]));
  for await (const line of lines(stareCsv)) {
    const [codInm, cod] = line.split('^');
    const firm = byCod.get(codInm);
    if (!firm) continue;
    const name = statusName.get(cod) || cod;
    if (NEGATIVE.test(strip(name))) firm.status.push(name);
  }
}

// ---------------------------------------------------------------------------
// 3. Bilanțurile

console.log('3. Situații financiare');
const byCui = new Map(firms.map((f) => [f.onrc.cui, f]));
for (const year of YEARS) {
  for (const url of BILANT[year]) {
    const file = await download(url, path.basename(new URL(url).pathname));
    let idx = null;
    let hits = 0;
    for await (const line of lines(file)) {
      const f = line.split(',');
      if (!idx) {
        idx = Object.fromEntries(f.map((h, i) => [h.trim().toUpperCase(), i]));
        continue;
      }
      const firm = byCui.get(f[idx.CUI]);
      if (!firm) continue;
      const n = (k) => Number(f[idx[k]]) || 0;
      firm.fin ??= {};
      firm.fin[year] = {
        ca: n('I13'),
        profit: n('I18') - n('I19'), // profit net minus pierdere netă: un singur număr cu semn
        emp: n('I20'),
      };
      firm.caen = f[idx.CAEN] || firm.caen;
      hits += 1;
    }
    console.log(`   ${year} ${path.basename(file)}: ${hits} firme`);
  }
}

// ---------------------------------------------------------------------------
// 4. Semnalul „face fotovoltaice" și segmentele

const companies = readJson('data/companies.json').companies;
const dirByCui = new Map(companies.filter((c) => c.cui).map((c) => [c.cui.replace(/\D/g, ''), c]));
const afmRaw = readJson('data/casa-verde-installers.json');
const afmCuis = new Set((Array.isArray(afmRaw) ? afmRaw : Object.values(afmRaw)[0]).map((e) => String(e.cui).replace(/\D/g, '')));
const necesit = new Map();
for (const f of readJson('data/necesit-firms.json').firms) {
  if (f.anreName) necesit.set(normName(f.anreName), f);
}
const SOLAR_NAME = /solar|fotovolt|photovolt|\bpv\b|sun|soare|renew|green ?energ/;

const out = [];
for (const f of firms) {
  const cui = f.onrc.cui;
  const key = normName(f.anre.societate);
  const nec = necesit.get(key);
  const signals = [];
  if (dirByCui.has(cui)) signals.push('director');
  if (afmCuis.has(cui)) signals.push('afm');
  if (nec?.pvOnly) signals.push('necesit');
  if (SOLAR_NAME.test(strip(f.onrc.name))) signals.push('nume');

  const segments = [];
  const reasons = [];
  if (f.onrc.registered >= NEW_SINCE) {
    segments.push('noua');
    reasons.push(`Înființată pe ${f.onrc.registered}`);
  } else if (f.firstCert >= NEW_CERT_SINCE) {
    segments.push('noua');
    reasons.push(`Firmă din ${f.onrc.registered.slice(0, 4)}, dar primul atestat ANRE e din ${f.firstCert}`);
  }

  const fin = f.fin || {};
  const lastYear = YEARS.filter((y) => fin[y]).at(-1);
  if (lastYear) {
    const prev = YEARS.filter((y) => y < lastYear && fin[y]);
    const peakYear = prev.sort((a, b) => fin[b].ca - fin[a].ca)[0];
    if (peakYear && fin[peakYear].ca >= DROP_MIN_PEAK && fin[lastYear].ca <= fin[peakYear].ca * (1 - DROP)) {
      segments.push('scadere');
      const pct = Math.round((1 - fin[lastYear].ca / fin[peakYear].ca) * 100);
      reasons.push(`Cifra de afaceri ${lastYear}: −${pct}% față de ${peakYear}`);
    }
    if (peakYear && fin[peakYear].profit > 0 && fin[lastYear].profit < 0) {
      reasons.push(`Din profit în ${peakYear}, pe pierdere în ${lastYear}`);
    }
  }
  if (!segments.length) continue;

  const warnings = [...new Set(f.status)];
  if (f.onrc.registered < `${LAST_YEAR}-01-01` && !fin[LAST_YEAR]) warnings.push(`Fără bilanț depus pe ${LAST_YEAR}`);
  if (fin[lastYear]?.ca > 20_000_000) warnings.push('Peste 20 mil. lei cifră de afaceri: are, probabil, vânzări proprii');

  const dir = dirByCui.get(cui);
  const phone = firstPhone(f.anre.telefon) || dir?.contact?.phone || '';

  let score = signals.length * 3;
  if (signals.includes('afm') || signals.includes('necesit')) score += 2;
  if (segments.includes('scadere')) score += 3;
  if (segments.includes('noua')) score += 2;
  if (segments.length === 2) score += 2;
  const emp = fin[lastYear]?.emp ?? 0;
  if (emp >= 2 && emp <= 30) score += 1; // are echipă, dar nu departament de vânzări
  if (phone) score += 1;
  else score -= 4;
  score -= warnings.length * 3;

  out.push({
    cui,
    name: f.onrc.name,
    anreName: f.anre.societate,
    judet: f.anre.judet,
    localitate: f.onrc.localitate || f.anre.localitate,
    phone,
    web: f.onrc.web,
    registered: f.onrc.registered,
    firstCert: f.firstCert,
    codes: f.codes,
    caen: f.caen || '',
    fin,
    signals,
    segments,
    reasons,
    warnings,
    directorySlug: dir?.slug || '',
    necesitUrl: nec?.url || '',
    score,
  });
}
out.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, 'ro'));

const count = (pred) => out.filter(pred).length;
const stats = {
  universe: universeCount,
  matched: firms.length,
  noi: count((f) => f.segments.includes('noua')),
  scadere: count((f) => f.segments.includes('scadere')),
  fotovoltaice: count((f) => f.signals.length > 0),
  fotovoltaiceNoi: count((f) => f.signals.length > 0 && f.segments.includes('noua')),
  fotovoltaiceScadere: count((f) => f.signals.length > 0 && f.segments.includes('scadere')),
  cuTelefon: count((f) => f.phone),
};
console.log('4. Rezultat', stats);

if (DRY) {
  console.log('\n--dry: nu scriu în bază. Primele 15:');
  for (const f of out.slice(0, 15)) console.log(`  ${String(f.score).padStart(3)} ${f.name} (${f.judet}) · ${f.signals.join(',') || '—'} · ${f.reasons.join(' · ')}`);
} else {
  const sql = neon(databaseUrl());
  const meta = {
    sources: {
      anre: 'data/anre-atestate.json',
      onrc: `data.gov.ro/${ONRC_DATASET}`,
      bilanturi: YEARS.map((y) => `data.gov.ro/situatii_financiare_${y}`),
    },
    rules: { newSince: NEW_SINCE, newCertSince: NEW_CERT_SINCE, drop: DROP, dropMinPeak: DROP_MIN_PEAK },
    stats,
  };
  const [row] = await sql`
    INSERT INTO tinta_snapshots (generated_at, meta, firms)
    VALUES (${new Date().toISOString()}, ${JSON.stringify(meta)}::jsonb, ${JSON.stringify(out)}::jsonb)
    RETURNING id
  `;
  await sql`
    DELETE FROM tinta_snapshots
    WHERE id NOT IN (SELECT id FROM tinta_snapshots ORDER BY generated_at DESC LIMIT ${KEEP})
  `;
  console.log(`→ Neon, tinta_snapshots #${row.id} (${out.length} firme; păstrez ultimele ${KEEP})`);
}

function databaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const line = fs
    .readFileSync(path.join(ROOT, '.env.local'), 'utf8')
    .split('\n')
    .find((l) => l.startsWith('DATABASE_URL='));
  if (!line) throw new Error('DATABASE_URL lipsește din mediu și din .env.local.');
  return line.slice('DATABASE_URL='.length).trim().replace(/^["']|["']$/g, '');
}
