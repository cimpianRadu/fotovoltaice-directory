#!/usr/bin/env node
/**
 * Scrie rândul de header al tabului „Revendicări" (A1:N1), inclusiv coloanele
 * de portal adăugate în aug 2026 (I–N: Email, Renunțat la, Motiv renunțare,
 * Note firmă, Aprobat la, Ofertat la).
 *
 * Același model ca fix-leads-header.mjs: scrie DOAR rândul 1 și doar dacă
 * rândul 1 nu conține date (codul nu citește headerul — rândurile se filtrează
 * după timestampul ISO din coloana A), deci e idempotent și sigur de rerulat.
 *
 * Usage:
 *   node scripts/extend-claims-header.mjs            # dry run, arată diferențele
 *   node scripts/extend-claims-header.mjs --apply    # scrie
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { google } from 'googleapis';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const APPLY = process.argv.includes('--apply');

const env = Object.fromEntries(
  readFileSync(path.join(ROOT, '.env.local'), 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
    }),
);

// Ordinea e contractul dintre app și scripturi — ține-o identică cu
// CLAIMS_HEADER din lib/sheets.ts.
const HEADERS = [
  'Timestamp', // A
  'Lead ID', // B
  'Firmă', // C
  'Contact', // D
  'Telefon', // E
  'Status', // F
  'Contactat la', // G — apel confirmat cu clientul; eliberează slotul firmei
  'Sursă', // H — self (public /cereri) sau manual (marcat din CRM)
  'Email', // I — identitatea firmei în /portal
  'Renunțat la', // J — scris din /portal; eliberează slotul firmei + locul cererii
  'Motiv renunțare', // K — obligatoriu la renunț
  'Note firmă', // L — jurnal datat, scris de firmă din /portal
  'Aprobat la', // M — scris din /admin/crm; deblochează datele clientului în portal
  'Ofertat la', // N — firma marchează din /portal că a trimis oferta clientului
];

const auth = new google.auth.JWT({
  email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = env.GOOGLE_SHEETS_SPREADSHEET_ID;

const current =
  (
    await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Revendicări!A1:N1',
    })
  ).data.values?.[0] || [];

// Plasa de siguranță: dacă rândul 1 e o revendicare, headerul lipsește cu totul
// și a scrie peste el ar șterge un rând real. Se oprește, nu „repară".
if (Number.isFinite(Date.parse(current[0] || ''))) {
  console.error('STOP: rândul 1 din „Revendicări" conține date, nu header. Nu scriu nimic.');
  process.exit(1);
}

console.log(`=== Header Revendicări!A1:N1 ${APPLY ? '(APPLY)' : '(DRY RUN)'} ===\n`);
const colLetter = (i) => String.fromCharCode(65 + i);
let changes = 0;
for (const [i, want] of HEADERS.entries()) {
  const have = current[i] || '';
  if (have === want) continue;
  changes++;
  console.log(`  ${colLetter(i)}: ${have ? `„${have}"` : '(gol)'} → „${want}"`);
}

if (!changes) {
  console.log('  Headerul e deja corect. Nimic de făcut.');
  process.exit(0);
}

if (!APPLY) {
  console.log(`\n${changes} coloane de actualizat. Rulează cu --apply ca să scrii.`);
  process.exit(0);
}

await sheets.spreadsheets.values.update({
  spreadsheetId: SPREADSHEET_ID,
  range: 'Revendicări!A1:N1',
  valueInputOption: 'RAW',
  requestBody: { values: [HEADERS] },
});
console.log(`\n${changes} coloane actualizate.`);
