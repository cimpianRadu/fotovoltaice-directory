#!/usr/bin/env node
/**
 * Antetul pentru bifa „vreau și oferta Premium" din formularul de listare
 * (9 sept 2026):
 *
 *   - „Listări"  V1  → Interes Premium
 *
 * De ce pas separat: scrierile pe o coloană din afara grilei sunt respinse cu
 * „exceeds grid limits" și pierd TOT rândul (vezi scripts/setup-atribuire-firme.mjs).
 * Scriptul verifică grila și o lărgește dacă e nevoie. Antetul se scrie doar în
 * celulă goală: rulat de două ori nu strică nimic.
 *
 * Se rulează ÎNAINTE de deploy-ul codului care scrie coloana V.
 *
 * Usage: node scripts/setup-interes-premium.mjs
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

const TAB = 'Listări';
const CELL = 'V1';
const HEADER = 'Interes Premium';
const NEEDED = 22; // A..V

const meta = await sheets.spreadsheets.get({ spreadsheetId });
const tab = meta.data.sheets.find((s) => s.properties.title === TAB);
if (!tab) {
  console.log(`${TAB}: tabul nu există încă. Sar.`);
  process.exit(0);
}

const cols = tab.properties.gridProperties.columnCount;
if (cols < NEEDED) {
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          appendDimension: { sheetId: tab.properties.sheetId, dimension: 'COLUMNS', length: NEEDED - cols },
        },
      ],
    },
  });
  console.log(`${TAB}: grila lărgită de la ${cols} la ${NEEDED} coloane.`);
} else {
  console.log(`${TAB}: grila are ${cols} coloane, ajunge.`);
}

const existing =
  (await sheets.spreadsheets.values.get({ spreadsheetId, range: `'${TAB}'!${CELL}` })).data.values?.[0]?.[0] || '';

if (existing.trim() === HEADER) {
  console.log(`${TAB}: antetul ${CELL} e deja scris.`);
} else if (existing.trim()) {
  console.log(`${TAB}: ATENȚIE, ${CELL} conține deja „${existing}". Nu suprascriu.`);
} else {
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${TAB}'!${CELL}`,
    valueInputOption: 'RAW',
    requestBody: { values: [[HEADER]] },
  });
  console.log(`${TAB}: antet scris în ${CELL}: ${HEADER}`);
}
