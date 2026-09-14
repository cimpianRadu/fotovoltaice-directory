#!/usr/bin/env node
/**
 * Antetul coloanelor AN-AV din tabul Leads, pentru fluxul „mă informez"
 * (14 sept 2026). Întâi lărgește grila: pe 14 sept avea 44 de coloane (A:AR),
 * iar un `values.update` peste limită e respins („exceeds grid limits"), deci
 * fără pasul ăsta aplicația n-ar putea scrie AS-AV. Lărgim la 52 (A:AZ), cât
 * range-ul de citire din lib/sheets. Idempotent: scrie doar celulele de antet
 * goale, nu atinge nimic de sub rândul 1.
 *
 *   node scripts/add-informez-columns.mjs [--dry]
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { google } from 'googleapis';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dry = process.argv.includes('--dry');
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
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });
const ID = env.GOOGLE_SHEETS_SPREADSHEET_ID;

const HEADERS = {
  AN: 'Blocaj',
  AO: 'Blocaj detalii',
  AP: 'Email client la',
  AQ: 'Reactivată la',
  AR: 'Check-in trimise',
  AS: 'Ultimul check-in la',
  AT: 'Răspuns client',
  AU: 'Alerte reactivare la',
  AV: 'Anunț program la',
};

const MIN_COLUMNS = 52; // AZ

const meta = await sheets.spreadsheets.get({ spreadsheetId: ID, fields: 'sheets(properties(sheetId,title,gridProperties(columnCount)))' });
const leadsSheet = meta.data.sheets.find((sh) => sh.properties.title === 'Leads');
if (!leadsSheet) throw new Error('Tabul Leads nu există.');
const columns = leadsSheet.properties.gridProperties.columnCount;
if (columns < MIN_COLUMNS) {
  console.log(dry ? `Aș lărgi grila Leads de la ${columns} la ${MIN_COLUMNS} coloane.` : `Lărgesc grila Leads de la ${columns} la ${MIN_COLUMNS} coloane.`);
  if (!dry) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: ID,
      requestBody: {
        requests: [
          { appendDimension: { sheetId: leadsSheet.properties.sheetId, dimension: 'COLUMNS', length: MIN_COLUMNS - columns } },
        ],
      },
    });
  }
} else {
  console.log(`Grila Leads are deja ${columns} coloane.`);
}

const res = await sheets.spreadsheets.values.get({ spreadsheetId: ID, range: 'Leads!AN1:AV1' });
const existing = (res.data.values?.[0] || []);
const cols = Object.keys(HEADERS);
const data = [];
cols.forEach((col, i) => {
  const cur = existing[i] || '';
  if (cur === HEADERS[col]) return;
  if (cur) {
    console.log(`${col}1 are deja „${cur}”, nu suprascriu.`);
    return;
  }
  data.push({ range: `Leads!${col}1`, values: [[HEADERS[col]]] });
});
if (!data.length) {
  console.log('Antetul e deja complet.');
  process.exit(0);
}
console.log(dry ? 'Aș scrie:' : 'Scriu:', data.map((d) => `${d.range}=${d.values[0][0]}`).join(', '));
if (!dry) {
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: ID,
    requestBody: { valueInputOption: 'RAW', data },
  });
  console.log('Gata.');
}
