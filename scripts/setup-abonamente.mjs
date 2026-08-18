#!/usr/bin/env node
/**
 * Pregătește Sheet-ul pentru coloanele și taburile adăugate în august 2026:
 *   - scrie antetul coloanelor AE („Prioritar până la"), AF („Alerte firme")
 *     și AG („Branșament") în tabul Leads;
 *   - creează tabul „Abonamente" cu antetul lui, dacă lipsește.
 *
 * Idempotent: rulat de două ori nu strică nimic. Read-only peste datele
 * existente, scrie doar antete și tabul nou.
 *
 * Usage: node scripts/setup-abonamente.mjs
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

// Aceleași etichete ca în comentariile din lib/sheets.ts.
const SUBSCRIPTIONS_HEADER = [
  'Firmă', 'Email', 'Contact', 'Telefon', 'Județe',
  'Ore fereastră', 'Activ', 'De la', 'Până la', 'Note',
];

const meta = await sheets.spreadsheets.get({ spreadsheetId });
const titles = meta.data.sheets.map((s) => s.properties.title);
const leads = meta.data.sheets.find((s) => s.properties.title === 'Leads');

// Tabul Leads se oprea la coloana AD (30 coloane). Scrierile pe o coloană care
// nu există în grilă sunt respinse de API („exceeds grid limits"), spre
// deosebire de citiri, care se rotunjesc tăcut — de aceea coloanele se adaugă
// aici, o dată, nu la prima cerere rezervată.
const cols = leads.properties.gridProperties.columnCount;
if (cols < 33) {
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          appendDimension: {
            sheetId: leads.properties.sheetId,
            dimension: 'COLUMNS',
            length: 33 - cols,
          },
        },
      ],
    },
  });
  console.log(`Leads: ${33 - cols} coloane adăugate (erau ${cols}).`);
} else {
  console.log(`Leads: are deja ${cols} coloane.`);
}

await sheets.spreadsheets.values.update({
  spreadsheetId,
  range: 'Leads!AE1:AG1',
  valueInputOption: 'RAW',
  requestBody: { values: [['Prioritar până la', 'Alerte firme', 'Branșament']] },
});
console.log('Leads: antet AE/AF/AG scris.');

if (!titles.includes('Abonamente')) {
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: { requests: [{ addSheet: { properties: { title: 'Abonamente' } } }] },
  });
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: 'Abonamente!A1',
    valueInputOption: 'RAW',
    requestBody: { values: [SUBSCRIPTIONS_HEADER] },
  });
  console.log('Tabul „Abonamente" creat, cu antet.');
} else {
  console.log('Tabul „Abonamente" există deja, îl las cum e.');
}
