// Aduce coloana Status din tabul „Listări" la zi cu realitatea din
// data/companies.json. Rândurile tratate rămân uneori „Nou" pentru că firma a
// fost adăugată prin script, nu prin Sheet — și atunci lista arată cereri
// nerezolvate care de fapt sunt publicate de săptămâni.
//
// Default dry-run; --write scrie efectiv. Fiecare update verifică întâi numele
// firmei din coloana B, ca să nu scrie pe rândul greșit dacă apare un rând nou.
//
//   node scripts/sync-listari-status.mjs
//   node scripts/sync-listari-status.mjs --write

import { readFileSync } from 'node:fs';
import { google } from 'googleapis';

for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)\s*=\s*(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const WRITE = process.argv.includes('--write');
const SHEET = 'Listări';
const STATUS_COL = 'L';
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

// Ce trebuie să scrie pe rândurile rămase „Nou". Numele e cel din coloana B,
// verificat înainte de scriere.
const UPDATES = [
  {
    numeFirma: 'JTS Instal Construct SRL',
    status: 'Adăugat în director (publicat 2026-07-29)',
  },
  {
    numeFirma: 'Solrom Construct',
    status: 'Adăugat în director (2026-08-07)',
  },
  {
    numeFirma: 'Enera Switch',
    status: 'Era deja în director (adăugat 2026-04-22, batch Cluj)',
  },
];

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });

const res = await sheets.spreadsheets.values.get({
  spreadsheetId: SPREADSHEET_ID,
  range: `${SHEET}!A1:Z500`,
});
const rows = res.data.values || [];

const data = [];
for (const u of UPDATES) {
  const idx = rows.findIndex((r) => (r[1] || '').trim() === u.numeFirma.trim());
  if (idx === -1) {
    console.error(`✗ Nu găsesc rândul pentru „${u.numeFirma}" — sar peste.`);
    continue;
  }
  const rowNum = idx + 1; // A1 e rândul 1
  console.log(`  rând ${rowNum}: ${u.numeFirma}`);
  console.log(`    „${rows[idx][11] || ''}" → „${u.status}"`);
  data.push({ range: `${SHEET}!${STATUS_COL}${rowNum}`, values: [[u.status]] });
}

if (!data.length) {
  console.log('\nNimic de scris.');
  process.exit(0);
}

if (!WRITE) {
  console.log('\n=== DRY RUN. Adaugă --write ca să scrie în Sheet. ===');
  process.exit(0);
}

await sheets.spreadsheets.values.batchUpdate({
  spreadsheetId: SPREADSHEET_ID,
  requestBody: { valueInputOption: 'RAW', data },
});
console.log(`\n✓ ${data.length} celule Status actualizate.`);
