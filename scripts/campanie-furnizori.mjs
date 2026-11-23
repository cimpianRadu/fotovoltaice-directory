#!/usr/bin/env node
/**
 * Campania de parteneri furnizori (23 nov 2026): legătura dintre rutina locală
 * „campanie-furnizori-followup” (care trimite din Chrome, de pe contact@) și
 * tabelul `campanie_furnizori` din Neon, pe care îl arată /admin/campanie.
 *
 *   node scripts/campanie-furnizori.mjs azi
 *       JSON: firmele active de verificat pentru răspuns și follow-up-urile
 *       scadente azi, cu textul gata completat.
 *   node scripts/campanie-furnizori.mjs trimis <email> <fu1|fu2|fu3>
 *   node scripts/campanie-furnizori.mjs raspuns <email> <email|fu1|fu2|fu3> [nota]
 *   node scripts/campanie-furnizori.mjs respins <email> [nota]
 *   node scripts/campanie-furnizori.mjs adauga <email> <primul_email AAAA-LL-ZZ> <firma> <subiect> [inbound]
 *       Planul follow-up-urilor se calculează din cadența din
 *       data/campanie-furnizori.json. O firmă inbound intră ca „manual”.
 *   node scripts/campanie-furnizori.mjs lista
 *   node scripts/campanie-furnizori.mjs verifica <email> [<email> ...]
 *       ÎNAINTE de primul email dintr-un lot nou: caută adresa și domeniul ei
 *       în toată baza, pe orice stare. Un refuz ține pentru toată firma, nu
 *       doar pentru adresa la care a venit (office@ a refuzat → nici vanzari@).
 *       Iese cu cod 1 dacă vreo adresă e deja în campanie.
 *
 * DATABASE_URL din mediu sau din .env.local (același endpoint ca producția).
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { neon } from '@neondatabase/serverless';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG = JSON.parse(readFileSync(path.join(ROOT, 'data/campanie-furnizori.json'), 'utf8'));

function databaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const line = readFileSync(path.join(ROOT, '.env.local'), 'utf8')
    .split('\n')
    .find((l) => l.startsWith('DATABASE_URL='));
  if (!line) throw new Error('DATABASE_URL lipsește din mediu și din .env.local.');
  return line.slice('DATABASE_URL='.length).trim().replace(/^["']|["']$/g, '');
}

const sql = neon(databaseUrl());
const PASI = ['fu1', 'fu2', 'fu3'];

/** Data de azi în România, AAAA-LL-ZZ. */
function azi() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Bucharest' }).format(new Date());
}

function plus(dateStr, zile) {
  const d = new Date(`${dateStr}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + zile);
  return d.toISOString().slice(0, 10);
}

// Driverul întoarce coloanele `date` ca miezul nopții în ora locală; toISOString
// le-ar muta cu o zi înapoi. Formatul în ora României dă ziua corectă și pe Mac,
// și pe Vercel (UTC).
const iso = (v) =>
  v ? new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Bucharest' }).format(new Date(v)) : null;

async function locuriLibere() {
  const [{ n }] = await sql`SELECT count(*)::int AS n FROM campanie_furnizori WHERE status = 'semnat'`;
  return Math.max(0, CONFIG.tinta - n);
}

function text(pas, firma, locuri) {
  return CONFIG.texte[pas].replaceAll('{FIRMA}', firma).replaceAll('{LOCURI}', String(locuri));
}

async function cmdAzi() {
  const today = azi();
  const locuri = await locuriLibere();
  const active = await sql`SELECT * FROM campanie_furnizori WHERE status = 'activ' ORDER BY id`;
  const scadente = [];
  for (const r of active) {
    const pas = PASI.find((p) => !r[`${p}_trimis`]);
    if (!pas) continue;
    const plan = iso(r[`${pas}_plan`]);
    if (plan && plan <= today) {
      scadente.push({ email: r.email, firma: r.firma, subiect: r.subiect, pas, text: text(pas, r.firma, locuri) });
    }
  }
  console.log(
    JSON.stringify(
      {
        azi: today,
        locuri,
        deVerificat: active.map((r) => ({ email: r.email, firma: r.firma, subiect: r.subiect })),
        scadente,
      },
      null,
      2,
    ),
  );
}

async function cmdTrimis(email, pas) {
  if (!PASI.includes(pas)) throw new Error(`Pas necunoscut: ${pas}`);
  const today = azi();
  const col = `${pas}_trimis`;
  const rows = await sql.query(
    `UPDATE campanie_furnizori SET ${col} = $1, actualizat_la = now() WHERE email = $2 RETURNING firma`,
    [today, email],
  );
  if (!rows.length) throw new Error(`Nu există firma cu adresa ${email}.`);
  console.log(`${rows[0].firma}: ${pas} trimis pe ${today}`);
}

async function cmdRaspuns(email, dupa, nota = '') {
  if (!['email', ...PASI].includes(dupa)) throw new Error(`„după” necunoscut: ${dupa}`);
  const rows = await sql`
    UPDATE campanie_furnizori
    SET status = 'a_raspuns', raspuns_la = ${azi()}, raspuns_dupa = ${dupa},
        nota = CASE WHEN ${nota} = '' THEN nota ELSE ${nota} END, actualizat_la = now()
    WHERE email = ${email} RETURNING firma`;
  if (!rows.length) throw new Error(`Nu există firma cu adresa ${email}.`);
  console.log(`${rows[0].firma}: a răspuns (după ${dupa}), oprit până confirmă Radu`);
}

async function cmdRespins(email, nota = '') {
  const rows = await sql`
    UPDATE campanie_furnizori
    SET status = 'respins', nota = CASE WHEN ${nota} = '' THEN nota ELSE ${nota} END, actualizat_la = now()
    WHERE email = ${email} RETURNING firma`;
  if (!rows.length) throw new Error(`Nu există firma cu adresa ${email}.`);
  console.log(`${rows[0].firma}: adresă respinsă`);
}

async function cmdAdauga(email, primul, firma, subiect, sursa = 'outbound') {
  if (!email || !/^\d{4}-\d{2}-\d{2}$/.test(primul || '') || !firma || !subiect) {
    throw new Error('Folosire: adauga <email> <AAAA-LL-ZZ> <firma> <subiect> [inbound]');
  }
  const inbound = sursa === 'inbound';
  const [d1, d2, d3] = CONFIG.cadentaZile.map((z) => (inbound ? null : plus(primul, z)));
  const rows = await sql`
    INSERT INTO campanie_furnizori (firma, email, sursa, subiect, primul_email, fu1_plan, fu2_plan, fu3_plan, status)
    VALUES (${firma}, ${email}, ${inbound ? 'inbound' : 'outbound'}, ${subiect}, ${primul}, ${d1}, ${d2}, ${d3},
            ${inbound ? 'manual' : 'activ'})
    ON CONFLICT (email) DO NOTHING RETURNING id`;
  console.log(rows.length ? `${firma}: adăugată` : `${firma}: există deja (${email}), neschimbată`);
}

async function cmdLista() {
  const rows = await sql`SELECT firma, email, status, primul_email, fu1_trimis, fu2_trimis, fu3_trimis, raspuns_dupa
                         FROM campanie_furnizori ORDER BY primul_email, id`;
  for (const r of rows) {
    const fu = PASI.map((p) => (r[`${p}_trimis`] ? p : '·')).join(' ');
    console.log(`${r.firma.padEnd(20)} ${r.status.padEnd(10)} ${iso(r.primul_email)}  ${fu}  ${r.raspuns_dupa ?? ''}`);
  }
}

// Domenii de email publice: acolo domeniul nu înseamnă firma, se compară doar adresa.
const DOMENII_PUBLICE = new Set([
  'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.ro', 'hotmail.com', 'outlook.com',
  'live.com', 'icloud.com', 'me.com', 'mail.com', 'proton.me', 'protonmail.com',
]);

async function cmdVerifica(...emails) {
  if (!emails.length) throw new Error('Folosire: verifica <email> [<email> ...]');
  const rows = await sql`SELECT firma, email, status, primul_email FROM campanie_furnizori`;
  let blocate = 0;
  for (const raw of emails) {
    const email = raw.trim().toLowerCase();
    const domeniu = email.split('@')[1] ?? '';
    const public_ = DOMENII_PUBLICE.has(domeniu);
    const gasite = rows.filter((r) => {
      const e = r.email.toLowerCase();
      return e === email || (!public_ && e.split('@')[1] === domeniu);
    });
    if (!gasite.length) {
      console.log(`LIBER      ${email}`);
      continue;
    }
    blocate++;
    for (const r of gasite) {
      const cum = r.email.toLowerCase() === email ? 'aceeași adresă' : `același domeniu (${r.email})`;
      console.log(`NU TRIMITE ${email}: ${r.firma}, ${r.status}, primul email ${iso(r.primul_email)}, ${cum}`);
    }
  }
  if (blocate) process.exitCode = 1;
}

const [cmd, ...args] = process.argv.slice(2);
const cmds = { azi: cmdAzi, trimis: cmdTrimis, raspuns: cmdRaspuns, respins: cmdRespins, adauga: cmdAdauga, lista: cmdLista, verifica: cmdVerifica };
if (!cmds[cmd]) {
  console.error(`Comenzi: ${Object.keys(cmds).join(', ')}`);
  process.exit(1);
}
try {
  await cmds[cmd](...args);
} catch (e) {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
}
