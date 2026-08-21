#!/usr/bin/env node
/**
 * Scrie rândul de header al tabului „Leads" (A1:Y1).
 *
 * De ce e nevoie: headerul se oprea la T și era parțial greșit. Coloanele
 * P (mesaj ascuns) și U (consum lunar) erau fără nume, V/W/X (pipeline-ul CRM)
 * la fel, iar T scria „Tip Sistem" deși ține alimentarea (mono/trifazat). Într-un
 * sheet pe care îl citește și un om, coloanele nenumite sunt exact locul unde
 * cineva scrie din greșeală și rupe contractul de coloane (vezi incidentul cu
 * coloana O din iulie 2026, care a blocat 6 leaduri trei zile).
 *
 * Scrie DOAR rândul 1 și doar dacă rândul 1 nu conține date. Codul nu citește
 * niciodată headerul (rândurile se filtrează după timestampul ISO din coloana A),
 * deci scriptul e sigur de rulat oricând și e idempotent.
 *
 * Usage:
 *   node scripts/fix-leads-header.mjs            # dry run, arată diferențele
 *   node scripts/fix-leads-header.mjs --apply    # scrie
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

// Ordinea e contractul dintre app și scripturi. Vezi saveLeadToSheet /
// getLeadsSince din lib/sheets.ts și coloanele-marcaj din scripts/outreach.mjs.
// „Email trimis" (O) trebuie să rămână identic cu HEADER din outreach.mjs.
const HEADERS = [
  'Data', // A
  'Companie', // B
  'Contact', // C
  'Email', // D
  'Telefon', // E
  'Tip proiect', // F
  'Județ', // G
  'Suprafață (mp)', // H
  'Putere (kW)', // I
  'Mesaj', // J
  'Sursa', // K
  'Firme solicitate', // L — una sau mai multe, „; " între ele (din 21 aug 2026)
  'Status', // M — „Ascuns" scoate cererea din feedul public /cereri
  'Segment', // N
  'Email trimis', // O — marcaj outreach.mjs. NU scrie manual aici.
  'Mesaj ascuns', // P — orice text scoate mesajul din feedul public
  'Duplicat al', // Q — timestamp-ul cererii canonice, scris de scripts/merge-leads.mjs
  'Consimțământ GDPR', // R
  'Tip acoperiș', // S
  'Alimentare (fazare)', // T
  'Consum lunar', // U
  'Status CRM', // V — scris din /admin/crm
  'Note CRM', // W — jurnal datat, scris din /admin/crm
  'Contactat de firmă', // X — da / nu, verificat telefonic cu clientul
  'Finanțare', // Y — ruta declarată în formular (din 29 iul 2026)
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
      range: 'Leads!A1:Z1',
    })
  ).data.values?.[0] || [];

// Plasa de siguranță: dacă rândul 1 e o cerere, headerul lipsește cu totul și a
// scrie peste el ar șterge un lead. Se oprește, nu „repară".
if (Number.isFinite(Date.parse(current[0] || ''))) {
  console.error('STOP: rândul 1 din „Leads" conține date, nu header. Nu scriu nimic.');
  process.exit(1);
}

console.log(`=== Header Leads!A1:Y1 ${APPLY ? '(APPLY)' : '(DRY RUN)'} ===\n`);
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
  range: 'Leads!A1:Y1',
  valueInputOption: 'RAW',
  requestBody: { values: [HEADERS] },
});
console.log(`\n${changes} coloane actualizate.`);
