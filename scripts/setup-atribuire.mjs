#!/usr/bin/env node
/**
 * Pregătește tabul „Leads" pentru atribuirea pe canal (august 2026):
 *   - lărgește grila la 36 de coloane, dacă e nevoie;
 *   - scrie antetul pentru AH („Canal"), AI („Campanie") și AJ („Pagină intrare").
 *
 * De ce e nevoie de pas separat: scrierile pe o coloană care nu există în grilă
 * sunt respinse de API cu „exceeds grid limits", spre deosebire de citiri, care
 * se rotunjesc tăcut. Dacă grila rămâne la 33 de coloane, PRIMA cerere trimisă
 * după deploy eșuează cu totul, nu doar atribuirea ei. Aceeași capcană ca la
 * scripts/setup-abonamente.mjs.
 *
 * Idempotent: rulat de două ori nu strică nimic. Nu atinge nicio celulă de date.
 *
 * Usage: node scripts/setup-atribuire.mjs
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { google } from 'googleapis';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
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
const spreadsheetId = env.GOOGLE_SHEETS_SPREADSHEET_ID;

const NEEDED_COLUMNS = 36; // până la AJ inclusiv
// Aceleași etichete ca în comentariile din saveLeadToSheet (lib/sheets.ts).
const HEADER = ['Canal', 'Campanie', 'Pagină intrare'];

const meta = await sheets.spreadsheets.get({ spreadsheetId });
const leads = meta.data.sheets.find((s) => s.properties.title === 'Leads');
if (!leads) {
  console.error('STOP: nu există tabul „Leads".');
  process.exit(1);
}

const cols = leads.properties.gridProperties.columnCount;
if (cols < NEEDED_COLUMNS) {
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          appendDimension: {
            sheetId: leads.properties.sheetId,
            dimension: 'COLUMNS',
            length: NEEDED_COLUMNS - cols,
          },
        },
      ],
    },
  });
  console.log(`Leads: ${NEEDED_COLUMNS - cols} coloane adăugate (erau ${cols}).`);
} else {
  console.log(`Leads: are deja ${cols} coloane.`);
}

// Plasa de siguranță: dacă pe AH1 stă altceva decât antetul așteptat și nu e
// gol, cineva a folosit deja coloana și a scrie peste ar rupe ce e dedesubt.
const current =
  (
    await sheets.spreadsheets.values.get({ spreadsheetId, range: 'Leads!AH1:AJ1' })
  ).data.values?.[0] || [];
const occupied = current.filter((v, i) => v && v !== HEADER[i]);
if (occupied.length) {
  console.error(`STOP: AH1:AJ1 conține deja „${occupied.join('", „')}". Nu scriu nimic.`);
  process.exit(1);
}

await sheets.spreadsheets.values.update({
  spreadsheetId,
  range: 'Leads!AH1:AJ1',
  valueInputOption: 'RAW',
  requestBody: { values: [HEADER] },
});
console.log('Leads: antet AH/AI/AJ scris.');
