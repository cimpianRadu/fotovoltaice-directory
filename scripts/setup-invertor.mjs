#!/usr/bin/env node
/**
 * Coloanele BE-BG din tabul „Leads” (19 nov 2026): invertorul pe care îl are
 * deja clientul, la „doar baterie” și extindere. BE tipul (hibrid / nu-hibrid /
 * nu-stiu), BF marca și modelul, BG sursa (formular / watt). Le scrie
 * saveLeadToSheet, iar Watt AI le completează după trimitere (setLeadInvertor).
 *
 * Grila avea 56 de coloane (A:BD). Se lărgește la 59 ÎNAINTE de deploy: o
 * scriere peste grilă pierde tot rândul cererii (vezi scripts/setup-buget.mjs).
 *
 * Idempotent; se oprește dacă BE1:BG1 conțin altceva. `--dry` doar arată.
 * Usage: node scripts/setup-invertor.mjs [--dry]
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
const NEEDED_COLUMNS = 59; // până la BG inclusiv
const HEADERS = ['Invertor (tip)', 'Invertor (model)', 'Invertor (sursa)'];

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

const current = cols >= NEEDED_COLUMNS
  ? (await sheets.spreadsheets.values.get({ spreadsheetId, range: 'Leads!BE1:BG1' })).data.values?.[0] || []
  : [];
if (HEADERS.every((h, i) => current[i] === h)) {
  console.log('BE1:BG1 au deja antetele.');
} else if (current.some((v, i) => v && v !== HEADERS[i])) {
  console.error(`STOP: BE1:BG1 conțin „${current.join(' | ')}”. Nu scriu peste.`);
  process.exit(1);
} else if (DRY) {
  console.log(`(dry) aș scrie ${HEADERS.map((h) => `„${h}”`).join(', ')} în BE1:BG1.`);
} else {
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'Leads!BE1:BG1',
    valueInputOption: 'RAW',
    requestBody: { values: [HEADERS] },
  });
  console.log('BE1:BG1 scrise.');
}
