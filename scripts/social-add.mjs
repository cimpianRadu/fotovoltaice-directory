// Adaugă o postare în tabul „Social" din Google Sheets (sursa pentru /admin/social).
// Folderul din social/ nu e văzut de dashboard, adevărul stă în Sheet, deci
// fiecare postare nouă are nevoie de un rând aici.
//
// Default dry-run; --write scrie efectiv. ID-ul se calculează automat (max + 1).
//
//   node scripts/social-add.mjs --tema "..." --folder "social/2026-.../" \
//     --format "poster 4:5" --status programat --programat 2026-07-30 \
//     --cta /cere-oferta --nota "..."
//   node scripts/social-add.mjs ... --write

import { readFileSync } from 'node:fs';
import { google } from 'googleapis';

for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)\s*=\s*(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const SHEET = 'Social';
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
// Aceeași ordine ca SOCIAL_COLS din lib/sheets.ts. Dacă se schimbă acolo,
// se schimbă și aici, altfel dashboardul citește pe coloane greșite.
const COLS = [
  'id', 'tema', 'folder', 'format', 'status', 'programat', 'postat', 'cta', 'nota',
  'facebook', 'instagram', 'youtube', 'tiktok',
];

const args = process.argv.slice(2);
const WRITE = args.includes('--write');
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? '' : (args[i + 1] || '');
};

const tema = flag('tema');
if (!tema) {
  console.error('Lipsește --tema. Vezi comentariul din capul fișierului.');
  process.exit(1);
}

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });

const existing = await sheets.spreadsheets.values.get({
  spreadsheetId: SPREADSHEET_ID,
  range: `${SHEET}!A:M`,
});
const rows = existing.data.values || [];
const ids = rows.slice(1).map((r) => Number(r[0])).filter(Number.isFinite);
const nextId = ids.length ? Math.max(...ids) + 1 : 1;

const row = [
  String(nextId),
  tema,
  flag('folder'),
  flag('format'),
  flag('status') || 'programat',
  flag('programat'),
  flag('postat'),
  flag('cta'),
  flag('nota'),
  '', '', '', '',
];

console.log(`Rând nou în „${SHEET}", ID #${nextId}:\n`);
for (let i = 0; i < COLS.length; i++) {
  if (row[i]) console.log(`  ${COLS[i].padEnd(10)} ${row[i]}`);
}

if (!WRITE) {
  console.log('\n=== DRY RUN. Adaugă --write ca să scrie în Sheet. ===');
  process.exit(0);
}

await sheets.spreadsheets.values.append({
  spreadsheetId: SPREADSHEET_ID,
  range: `${SHEET}!A1`,
  valueInputOption: 'RAW',
  insertDataOption: 'INSERT_ROWS',
  requestBody: { values: [row] },
});

console.log(`\n✓ Postarea #${nextId} adăugată. Se vede în /admin/social fără deploy.`);
