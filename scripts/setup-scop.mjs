#!/usr/bin/env node
/**
 * Pregătește tabul „Leads" pentru „Ce vreți să rezolvați?" (17 sept 2026):
 *   - lărgește grila la 51 de coloane, dacă e nevoie;
 *   - scrie antetele pentru AX („Scop") și AY („Scop detalii").
 *
 * De ce e nevoie de pas separat: scrierile pe o coloană care nu există în grilă
 * sunt respinse de API cu „exceeds grid limits", spre deosebire de citiri, care
 * se rotunjesc tăcut. Dacă grila rămâne la 36 de coloane, PRIMA cerere trimisă
 * după deploy eșuează cu totul, nu doar atribuirea ei. Aceeași capcană ca la
 * scripts/setup-abonamente.mjs.
 *
 * Idempotent: rulat de două ori nu strică nimic. Nu atinge nicio celulă de date.
 *
 * Usage: node scripts/setup-scop.mjs
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

const NEEDED_COLUMNS = 51; // până la AY inclusiv
// Aceleași etichete ca în comentariile din LEAD_ENRICH_COLUMNS (lib/sheets.ts).
const HEADER = ['Scop', 'Scop detalii'];

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

// Plasa de siguranță: coloanele trebuie să fie goale sub antet. Dacă cineva a
// scris deja ceva în AX/AY de mână, enrich-ul ar scrie peste, deci ne oprim.
const values =
  (await sheets.spreadsheets.values.get({ spreadsheetId, range: 'Leads!AX:AY' })).data.values || [];
const header = values[0] || [];
const wrongHeader = header.filter((v, i) => v && v !== HEADER[i]);
const dataRows = values.slice(1).filter((r) => r.some((v) => v));
if (wrongHeader.length || dataRows.length) {
  console.error(
    `STOP: AX/AY nu sunt libere (antet: „${header.join('", „')}", ${dataRows.length} rânduri cu date). Nu scriu nimic.`,
  );
  process.exit(1);
}

await sheets.spreadsheets.values.update({
  spreadsheetId,
  range: 'Leads!AX1:AY1',
  valueInputOption: 'RAW',
  requestBody: { values: [HEADER] },
});
console.log('Leads: antete AX-AY scrise.');
