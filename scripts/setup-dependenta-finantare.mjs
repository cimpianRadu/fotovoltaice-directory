#!/usr/bin/env node
/**
 * Antetul coloanei BD din tabul „Leads” (17 nov 2026): „Depinde de finanțare”,
 * răspunsul la „Cât depinde proiectul de finanțare?” (oricum / doar-cu /
 * nehotarat), scris de saveLeadToSheet.
 *
 * Grila avea deja 56 de coloane (A:BD) pe 16 nov, deci nu se lărgește nimic;
 * dacă între timp e mai îngustă, scriptul o lărgește întâi (o scriere peste
 * grilă pierde tot rândul cererii, vezi scripts/setup-buget.mjs).
 *
 * Idempotent; se oprește dacă BD1 conține altceva. `--dry` doar arată.
 * Usage: node scripts/setup-dependenta-finantare.mjs [--dry]
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { google } from 'googleapis';

const DRY = process.argv.includes('--dry');
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
const NEEDED_COLUMNS = 56; // până la BD inclusiv
const HEADER = 'Depinde de finanțare';

const meta = await sheets.spreadsheets.get({ spreadsheetId, fields: 'sheets.properties' });
const leads = meta.data.sheets.find((s) => s.properties.title === 'Leads');
if (!leads) {
  console.error('STOP: nu există tabul „Leads”.');
  process.exit(1);
}
const cols = leads.properties.gridProperties.columnCount;
if (cols < NEEDED_COLUMNS) {
  console.log(`Leads: are ${cols} coloane, trebuie ${NEEDED_COLUMNS}.`);
  if (!DRY) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          { appendDimension: { sheetId: leads.properties.sheetId, dimension: 'COLUMNS', length: NEEDED_COLUMNS - cols } },
        ],
      },
    });
    console.log('Grila lărgită.');
  }
} else {
  console.log(`Leads: are deja ${cols} coloane.`);
}

const current = (await sheets.spreadsheets.values.get({ spreadsheetId, range: 'Leads!BD1:BD1' })).data.values?.[0]?.[0] || '';
if (current === HEADER) {
  console.log('BD1 are deja antetul.');
} else if (current) {
  console.error(`STOP: BD1 conține „${current}”. Nu scriu peste.`);
  process.exit(1);
} else if (DRY) {
  console.log(`(dry) aș scrie „${HEADER}” în BD1.`);
} else {
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'Leads!BD1',
    valueInputOption: 'RAW',
    requestBody: { values: [[HEADER]] },
  });
  console.log(`BD1 = „${HEADER}”.`);
}
