#!/usr/bin/env node
// One-shot: creates the "Publicitate" tab in the project Google Sheet with
// the header row that lib/sheets.ts:saveAdInquiryToSheet expects.
//
// Usage: node scripts/create-publicitate-sheet.mjs
// Idempotent: if the tab already exists, exits cleanly without re-creating.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { google } from 'googleapis';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function loadEnv() {
  const envPath = path.join(ROOT, '.env.local');
  const raw = readFileSync(envPath, 'utf8');
  const out = {};
  for (const line of raw.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    let val = m[2];
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    out[m[1]] = val;
  }
  return out;
}

const env = loadEnv();
const SPREADSHEET_ID = env.GOOGLE_SHEETS_SPREADSHEET_ID;
const SHEET_NAME = 'Publicitate';
const HEADER = [
  'timestamp',
  'tier',
  'firma',
  'cui',
  'contact',
  'email',
  'telefon',
  'judet',
  'website',
  'mesaj',
  'status',
];

if (!SPREADSHEET_ID) throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID missing');
if (!env.GOOGLE_SERVICE_ACCOUNT_EMAIL) throw new Error('GOOGLE_SERVICE_ACCOUNT_EMAIL missing');
if (!env.GOOGLE_PRIVATE_KEY) throw new Error('GOOGLE_PRIVATE_KEY missing');

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
const existing = meta.data.sheets?.find((s) => s.properties?.title === SHEET_NAME);

if (existing) {
  console.log(`✓ Tab "${SHEET_NAME}" already exists (sheetId=${existing.properties.sheetId}). Nothing to do.`);
  process.exit(0);
}

console.log(`+ Creating tab "${SHEET_NAME}"…`);
const addRes = await sheets.spreadsheets.batchUpdate({
  spreadsheetId: SPREADSHEET_ID,
  requestBody: {
    requests: [
      {
        addSheet: {
          properties: {
            title: SHEET_NAME,
            gridProperties: { rowCount: 1000, columnCount: HEADER.length, frozenRowCount: 1 },
          },
        },
      },
    ],
  },
});

const newSheetId = addRes.data.replies?.[0]?.addSheet?.properties?.sheetId;
console.log(`  sheetId=${newSheetId}`);

console.log(`+ Writing header row…`);
await sheets.spreadsheets.values.update({
  spreadsheetId: SPREADSHEET_ID,
  range: `${SHEET_NAME}!A1`,
  valueInputOption: 'RAW',
  requestBody: { values: [HEADER] },
});

console.log(`+ Formatting header (bold + frozen + light gray bg)…`);
await sheets.spreadsheets.batchUpdate({
  spreadsheetId: SPREADSHEET_ID,
  requestBody: {
    requests: [
      {
        repeatCell: {
          range: { sheetId: newSheetId, startRowIndex: 0, endRowIndex: 1 },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.93, green: 0.93, blue: 0.95 },
              textFormat: { bold: true },
              horizontalAlignment: 'LEFT',
            },
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
        },
      },
      {
        autoResizeDimensions: {
          dimensions: {
            sheetId: newSheetId,
            dimension: 'COLUMNS',
            startIndex: 0,
            endIndex: HEADER.length,
          },
        },
      },
    ],
  },
});

console.log(`✓ Done. Tab "${SHEET_NAME}" ready with ${HEADER.length} columns.`);
