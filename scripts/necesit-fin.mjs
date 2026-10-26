#!/usr/bin/env node
/**
 * Cât de mari sunt firmele de pe necesit.ro: CUI din ONRC, apoi cifra de afaceri,
 * profitul și angajații din bilanțurile 2023–2025. Iese în tabelul
 * `necesit_fin_snapshots` din Neon, pe care îl citește /admin/necesit. Nu în
 * data/necesit-firms.json: repo-ul e public, iar potrivirea e munca de prospectare.
 *
 * De ce (26 oct 2026): lista de apeluri de pe necesit spunea doar cine cumpără
 * cereri, nu și dacă firma are mărimea celor care chiar le lucrează. Firmele care
 * au ajuns la ofertă de la noi au 4–25 mil. lei și 6–20 angajați; JTS, la 41 mil.,
 * a revendicat 22 de cereri și n-a lucrat niciuna, iar cele de 1–3 oameni ne spun
 * la telefon că n-au nevoie de clienți.
 *
 * Potrivirea: firmele din directorul nostru se iau direct pe CUI-ul din
 * companies.json. Restul pe nume normalizat (cel de pe necesit și, unde există,
 * cel din registrul ANRE), departajat pe județ. Unde rămân două firme vii cu
 * același nume, nu ghicim: firma rămâne fără mărime.
 *
 * Citește fișierele brute pe care `node scripts/firme-tinta.mjs` le descarcă în
 * data/raw/tinta/ (ONRC + bilanțuri, ~1 GB); dacă lipsesc, rulează-l întâi pe ăla.
 *
 * Usage:
 *   node scripts/necesit-fin.mjs [--dry]
 */

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { neon } from '@neondatabase/serverless';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const RAW = path.join(ROOT, 'data/raw/tinta');
const KEEP = 3;
const DRY = process.argv.includes('--dry');

const YEARS = [2023, 2024, 2025];
const LAST_YEAR = Math.max(...YEARS);
const BILANT_FILES = YEARS.flatMap((y) => [`web_uu_an${y}.txt`, `web_bl_bs_sl_an${y}.txt`]);

const strip = (s) =>
  (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[țţ]/g, 't')
    .replace(/[șş]/g, 's');

// Aceeași normalizare ca scripts/firme-tinta.mjs și scripts/onrc-match.js.
function normName(name) {
  return strip(name)
    .replace(/[.\-_&,'`"]/g, ' ')
    .replace(/\b(srl|sa|sca|snc|scs|sarl|pfa|ii|if|ong|ra|nv|ltd|gmbh|s r l|s a|sc)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const countyKey = (s) => strip(s).replace(/municipiul|judetul/g, '').replace(/sectorul.*$/, '').trim();

const isoDate = (d) => {
  const m = (d || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : '';
};

async function* lines(file) {
  const rl = readline.createInterface({ input: fs.createReadStream(file, 'utf8'), crlfDelay: Infinity });
  let first = true;
  for await (const line of rl) {
    yield first ? line.replace(/^﻿/, '') : line;
    first = false;
  }
}

const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));

function rawFile(name) {
  const file = path.join(RAW, name);
  if (!fs.existsSync(file)) {
    console.error(`Lipsește ${path.relative(ROOT, file)}. Rulează întâi: node scripts/firme-tinta.mjs --dry`);
    process.exit(1);
  }
  return file;
}

// ---------------------------------------------------------------------------
// 1. Firmele de pe necesit, o dată pe firmă (scanarea are un rând per oraș)

const firms = new Map(); // slug → { name, anreName, counties:Set, locality }
for (const f of readJson('data/necesit-firms.json').firms) {
  const seen = firms.get(f.slug);
  if (seen) {
    seen.counties.add(countyKey(f.county));
    if (!seen.anreName && f.anreName) seen.anreName = f.anreName;
    continue;
  }
  firms.set(f.slug, {
    name: f.name,
    anreName: f.anreName || '',
    counties: new Set([countyKey(f.county)]),
    locality: strip(f.locality),
  });
}
console.log(`1. necesit: ${firms.size} firme`);

const companies = readJson('data/companies.json').companies;
const dirByName = new Map(companies.filter((c) => c.cui).map((c) => [normName(c.name), c.cui.replace(/\D/g, '')]));

const keys = new Set();
for (const f of firms.values()) {
  keys.add(normName(f.name));
  if (f.anreName) keys.add(normName(f.anreName));
}

// ---------------------------------------------------------------------------
// 2. ONRC: candidații pe nume

console.log('2. ONRC');
const candidates = new Map(); // normName → [rând ONRC]
{
  let idx = null;
  for await (const line of lines(rawFile('od_firme.csv'))) {
    const f = line.split('^');
    if (!idx) {
      idx = Object.fromEntries(f.map((h, i) => [h, i]));
      continue;
    }
    const key = normName(f[idx.DENUMIRE]);
    if (!keys.has(key)) continue;
    const cui = f[idx.CUI];
    if (!cui || cui === '0') continue;
    if (!candidates.has(key)) candidates.set(key, []);
    candidates.get(key).push({
      name: f[idx.DENUMIRE],
      cui,
      codInm: f[idx.COD_INMATRICULARE],
      registered: isoDate(f[idx.DATA_INMATRICULARE]),
      judet: f[idx.ADR_JUDET],
      status: [],
    });
  }
}

const NEGATIVE = /dizolv|lichid|falim|insolv|radiat|radiere|suspend|nulitate|inactiv/;
const statusName = new Map();
for await (const line of lines(rawFile('n_stare_firma.csv'))) {
  const [cod, den] = line.split('^');
  if (cod !== 'COD') statusName.set(cod, den);
}
{
  const byCod = new Map([...candidates.values()].flat().map((c) => [c.codInm, c]));
  for await (const line of lines(rawFile('od_stare_firma.csv'))) {
    const [codInm, cod] = line.split('^');
    const c = byCod.get(codInm);
    if (!c) continue;
    const name = statusName.get(cod) || cod;
    if (NEGATIVE.test(strip(name)) && !c.status.includes(name)) c.status.push(name);
  }
}

// ---------------------------------------------------------------------------
// 3. Bilanțurile, pentru toți candidații (alegem firma după ce știm care e vie)

console.log('3. Bilanțuri');
const fin = new Map(); // CUI → { year: { ca, profit, emp } }, plus caen
const wanted = new Set([...[...candidates.values()].flat().map((c) => c.cui), ...dirByName.values()]);
for (const name of BILANT_FILES) {
  const year = Number(name.match(/an(\d{4})/)[1]);
  let idx = null;
  for await (const line of lines(rawFile(name))) {
    const f = line.split(',');
    if (!idx) {
      idx = Object.fromEntries(f.map((h, i) => [h.trim().toUpperCase(), i]));
      continue;
    }
    const cui = f[idx.CUI];
    if (!wanted.has(cui)) continue;
    const n = (k) => Number(f[idx[k]]) || 0;
    const entry = fin.get(cui) ?? { years: {}, caen: '' };
    entry.years[year] = { ca: n('I13'), profit: n('I18') - n('I19'), emp: n('I20') };
    entry.caen = f[idx.CAEN] || entry.caen;
    fin.set(cui, entry);
  }
}

// ---------------------------------------------------------------------------
// 4. Alegerea firmei

const onrcByCui = new Map([...candidates.values()].flat().map((c) => [c.cui, c]));
const alive = (c) => !c.status.length;
const filed = (c) => Boolean(fin.get(c.cui)?.years[LAST_YEAR]);

const out = {};
const stats = { firme: firms.size, director: 0, nume: 0, ambigue: 0, negasite: 0, faraBilant: 0 };
for (const [slug, f] of firms) {
  const nameKeys = [normName(f.name), f.anreName && normName(f.anreName)].filter(Boolean);
  let cui = '';
  let via = '';

  const dirCui = nameKeys.map((k) => dirByName.get(k)).find(Boolean);
  if (dirCui) {
    cui = dirCui;
    via = 'director';
  } else {
    const pool = [...new Map(nameKeys.flatMap((k) => candidates.get(k) || []).map((c) => [c.cui, c])).values()];
    const inPlace = pool.filter((c) => {
      const k = countyKey(c.judet);
      return f.counties.has(k) || (k && f.locality.includes(k));
    });
    // Nume identic, nicio firmă în județ: o luăm doar dacă e singura cu numele ăsta.
    const picks = (inPlace.length ? inPlace : pool.length === 1 ? pool : []).sort(
      (a, b) =>
        Number(alive(b)) - Number(alive(a)) ||
        Number(filed(b)) - Number(filed(a)) ||
        b.registered.localeCompare(a.registered),
    );
    if (!picks.length) {
      if (pool.length > 1) stats.ambigue += 1;
      else stats.negasite += 1;
      continue;
    }
    if (picks.length > 1 && alive(picks[1]) && filed(picks[1]) && alive(picks[0]) && filed(picks[0])) {
      stats.ambigue += 1;
      continue;
    }
    cui = picks[0].cui;
    via = 'nume';
  }

  const onrc = onrcByCui.get(cui);
  const entry = fin.get(cui);
  if (!entry) stats.faraBilant += 1;
  stats[via] += 1;
  out[slug] = {
    cui,
    name: onrc?.name || '',
    judet: onrc?.judet || '',
    registered: onrc?.registered || '',
    status: onrc?.status || [],
    caen: entry?.caen || '',
    fin: entry?.years || {},
    via,
  };
}
console.log('4. Rezultat', stats);

if (DRY) {
  console.log('\n--dry: nu scriu în bază. Câteva:');
  for (const [slug, s] of Object.entries(out).slice(0, 12)) {
    const last = s.fin[LAST_YEAR];
    console.log(`  ${slug}: ${s.name} (${s.judet}, ${s.via}) · ${last ? `${Math.round(last.ca / 1e5) / 10} mil., ${last.emp} ang.` : 'fără bilanț ' + LAST_YEAR}`);
  }
} else {
  const sql = neon(databaseUrl());
  const meta = {
    sources: {
      necesit: 'data/necesit-firms.json',
      onrc: 'data/raw/tinta/od_firme.csv',
      bilanturi: YEARS.map((y) => `data.gov.ro/situatii_financiare_${y}`),
    },
    stats,
  };
  const [row] = await sql`
    INSERT INTO necesit_fin_snapshots (generated_at, meta, firms)
    VALUES (${new Date().toISOString()}, ${JSON.stringify(meta)}::jsonb, ${JSON.stringify(out)}::jsonb)
    RETURNING id
  `;
  await sql`
    DELETE FROM necesit_fin_snapshots
    WHERE id NOT IN (SELECT id FROM necesit_fin_snapshots ORDER BY generated_at DESC LIMIT ${KEEP})
  `;
  console.log(`→ Neon, necesit_fin_snapshots #${row.id} (${Object.keys(out).length} firme; păstrez ultimele ${KEEP})`);
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
