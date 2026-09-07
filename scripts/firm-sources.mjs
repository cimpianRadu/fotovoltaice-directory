#!/usr/bin/env node
/**
 * De unde vin firmele? Raport read-only din Sheets, pe trei taburi:
 *
 *   Revendicări  Q:T   canal / campanie / pagină intrare / cum a aflat (din 7 sept 2026)
 *   Listări      R:U   la fel
 *   Portal Acces E:G   canal / campanie / pagină intrare pe `cerut`
 *
 * Ce răspunde: (1) pe ce canal intră firmele care revendică singure, (2) ce zic
 * ele că le-a adus, (3) câte conturi noi de portal vin din fiecare canal, (4) care
 * campanii (utm_campaign, adică postări) au produs firme. Rândurile de dinainte de
 * 7 sept n-au coloanele, deci apar ca „(fără date)"; ele se numără separat ca să
 * se vadă cât din istoric e măsurabil.
 *
 * Usage:
 *   node scripts/firm-sources.mjs              # ultimele 30 de zile
 *   node scripts/firm-sources.mjs --days 90
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { google } from 'googleapis';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2);
const daysIdx = args.indexOf('--days');
const DAYS = daysIdx === -1 ? 30 : Number(args[daysIdx + 1]) || 30;

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
const read = async (range) =>
  (await sheets.spreadsheets.values.get({ spreadsheetId: env.GOOGLE_SHEETS_SPREADSHEET_ID, range }))
    .data.values || [];

const since = Date.now() - DAYS * 86_400_000;
const recent = (rows) => rows.filter((r) => Date.parse(r[0] || '') > since);
const tally = (rows, pick) => {
  const m = new Map();
  for (const r of rows) {
    const k = pick(r) || '(fără date)';
    m.set(k, (m.get(k) || 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
};
const print = (title, entries) => {
  console.log(`\n${title}`);
  if (!entries.length) console.log('  (nimic)');
  for (const [k, v] of entries) console.log(`  ${String(v).padStart(3)}  ${k}`);
};

const [claims, listings, portal] = await Promise.all([
  read("'Revendicări'!A:T"),
  read("'Listări'!A:U"),
  read("'Portal Acces'!A:G"),
]);

// ── Revendicări ──────────────────────────────────────────────────────────────
const selfClaims = recent(claims).filter((r) => (r[7] || 'self').toLowerCase() === 'self');
console.log(`=== Revendicări făcute de firme singure, ultimele ${DAYS} zile: ${selfClaims.length}`);
print('Canal (first-touch al sesiunii)', tally(selfClaims, (r) => r[16]));
print('Cum a aflat (răspunsul firmei)', tally(selfClaims, (r) => r[19]));
print('Campanie (utm_campaign = postarea)', tally(selfClaims.filter((r) => r[17]), (r) => r[17]));
print('Pagină de intrare', tally(selfClaims.filter((r) => r[18]), (r) => r[18]));

// Prima revendicare a fiecărei firme (după email, altfel după nume) = firma nouă.
const seen = new Set();
const firstClaims = [];
for (const r of claims.filter((r) => Number.isFinite(Date.parse(r[0] || ''))).sort((a, b) => a[0].localeCompare(b[0]))) {
  const key = (r[8] || r[2] || '').trim().toLowerCase();
  if (!key || seen.has(key)) continue;
  seen.add(key);
  if (Date.parse(r[0]) > since) firstClaims.push(r);
}
console.log(`\n=== Firme NOI la revendicare (prima lor revendicare în ultimele ${DAYS} zile): ${firstClaims.length}`);
print('Canal', tally(firstClaims, (r) => r[16]));
print('Cum a aflat', tally(firstClaims, (r) => r[19]));
print('Sursă (self = singure, manual = date de noi)', tally(firstClaims, (r) => (r[7] || 'self').toLowerCase()));

// ── Listări ──────────────────────────────────────────────────────────────────
const recentListings = recent(listings);
console.log(`\n=== Cereri de listare, ultimele ${DAYS} zile: ${recentListings.length}`);
print('Canal', tally(recentListings, (r) => r[17]));
print('Cum a aflat', tally(recentListings, (r) => r[20]));
print('Campanie', tally(recentListings.filter((r) => r[18]), (r) => r[18]));

// ── Portal: conturi noi ──────────────────────────────────────────────────────
const events = portal.filter((r) => Number.isFinite(Date.parse(r[0] || '')));
const firstRequest = new Map();
for (const r of events.sort((a, b) => a[0].localeCompare(b[0]))) {
  const email = (r[1] || '').trim().toLowerCase();
  if ((r[2] || '').toLowerCase() !== 'cerut' || !email || firstRequest.has(email)) continue;
  firstRequest.set(email, r);
}
const newAccounts = [...firstRequest.values()].filter((r) => Date.parse(r[0]) > since);
console.log(`\n=== Emailuri care au cerut login în portal PRIMA dată, ultimele ${DAYS} zile: ${newAccounts.length}`);
print('Canal', tally(newAccounts, (r) => r[4]));
print('Campanie', tally(newAccounts.filter((r) => r[5]), (r) => r[5]));
print('Pagină de intrare', tally(newAccounts.filter((r) => r[6]), (r) => r[6]));

console.log(
  `\nNotă: „(fără date)" = rânduri de dinainte de 7 sept 2026 sau sesiuni fără referrer/UTM. ` +
    `Un canal „direct" la firmă înseamnă de obicei email de la noi (alertă, revendicare, login) sau link din WhatsApp.`,
);
