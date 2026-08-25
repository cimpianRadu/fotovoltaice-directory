#!/usr/bin/env node
/**
 * Listele de apeluri către CLIENȚI (oamenii care au lăsat cereri), citite live din Sheets.
 *
 * De ce există: pe 21 aug 2026, din 54 de cereri, doar 7 aveau coloana X
 * („Contactat de firmă") completată. Singura dovadă că platforma livrează
 * (ofertă primită, contract semnat) vine de la client, nu de la firmă.
 *
 *   A) bucla de închis: cereri cu o revendicare pe „ofertat"/„discutii" → întrebi clientul
 *      dacă a primit oferta și dacă semnează
 *   B) firma a zis „sun eu" (de_sunat) fără urmare → întrebi clientul dacă l-a sunat cineva
 *   C) de calificat: cereri din ultimele N zile fără status CRM → cele 5 întrebări + interval apel
 *
 * Usage: node scripts/call-lists.mjs [--days 10]
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { google } from 'googleapis';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2);
const DAYS = Number(args[args.indexOf('--days') + 1]) || 10;

const env = Object.fromEntries(
  readFileSync(path.join(ROOT, '.env.local'), 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
    }),
);
const auth = new google.auth.JWT({
  email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});
const sheets = google.sheets({ version: 'v4', auth });
const ID = env.GOOGLE_SHEETS_SPREADSHEET_ID;
const read = async (tab) =>
  ((await sheets.spreadsheets.values.get({ spreadsheetId: ID, range: `'${tab}'!A:AZ` })).data.values || []).slice(1);

// Leads: 0 Data, 2 Contact, 4 Telefon, 6 Județ, 8 kW, 12 Status, 13 Segment, 16 Duplicat al,
//        21 Status CRM, 23 Contactat de firmă, 24 Finanțare, 28 Termen, 36 Interval apel
// Revendicări: 0 Timestamp, 1 Lead ID, 2 Firmă, 5 Status, 13 Ofertat la
const L = (await read('Leads')).filter((r) => r[0] && r[12] !== 'Ascuns' && !r[16]);
const C = (await read('Revendicări')).filter((r) => r[0]);
const byId = new Map(L.map((r) => [r[0], r]));

const fmt = (r) =>
  `${r[0].slice(0, 10)} | ${r[2]} | ${r[4]} | ${r[6]} | ${r[13]} ${r[8] ? r[8] + 'kW' : ''} | fin=${r[24] || '-'} | termen=${r[28] || '-'} | interval=${r[36] || '-'} | CRM=${r[21] || '-'} | contactat=${r[23] || '-'}`;
const claimsFor = (id) =>
  C.filter((c) => c[1] === id)
    .map((c) => `${c[2]}[${c[5]}${c[13] ? ' ofertat ' + c[13].slice(0, 10) : ''}]`)
    .join(', ');

console.log('=== A) BUCLA DE ÎNCHIS (ofertă trimisă → a primit-o? semnează?)');
const hot = new Set(C.filter((c) => c[5] === 'ofertat' || c[13] || c[5] === 'discutii').map((c) => c[1]));
for (const id of hot) {
  const r = byId.get(id);
  if (r) console.log(' •', fmt(r), '|| firme:', claimsFor(id));
}

console.log('\n=== B) FIRMA A ZIS „SUN EU" (de_sunat fără ofertat → l-a sunat cineva?)');
for (const id of new Set(C.filter((c) => c[5] === 'de_sunat').map((c) => c[1]))) {
  if (hot.has(id)) continue;
  const r = byId.get(id);
  if (r) console.log(' •', fmt(r), '|| firme:', claimsFor(id));
}

console.log(`\n=== C) DE CALIFICAT (ultimele ${DAYS} zile, fără status CRM)`);
const cut = Date.now() - DAYS * 86400000;
for (const r of L.filter((r) => new Date(r[0]).getTime() >= cut && !r[21])) {
  console.log(' •', fmt(r), '|| firme:', claimsFor(r[0]) || '(nerevendicată)');
}

console.log('\n=== D) STARE');
console.log('cereri vizibile:', L.length, '| status CRM completat:', L.filter((r) => r[21]).length, '| contactat de firmă completat:', L.filter((r) => r[23]).length, '| interval apel completat:', L.filter((r) => r[36]).length);
console.log('nerevendicate:', L.filter((r) => !C.some((c) => c[1] === r[0])).map((r) => r[0].slice(0, 10) + ' ' + r[6]).join('; ') || '-');
