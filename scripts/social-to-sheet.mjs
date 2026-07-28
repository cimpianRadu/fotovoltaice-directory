// Mută data/social-schedule.json în tabul „Social" din Google Sheets.
// Rulează o singură dată, la migrare. Default dry-run; --write scrie efectiv.
//
//   node scripts/social-to-sheet.mjs
//   node scripts/social-to-sheet.mjs --write

import { readFileSync } from 'node:fs';
import { google } from 'googleapis';

for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)\s*=\s*(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const WRITE = process.argv.includes('--write');
const SHEET = 'Social';
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const COLS = [
  'id', 'tema', 'folder', 'format', 'status', 'programat', 'postat', 'cta', 'nota',
  'facebook', 'instagram', 'youtube', 'tiktok',
];

const schedule = JSON.parse(
  readFileSync(new URL('../data/social-schedule.json', import.meta.url), 'utf8'),
);

const rows = schedule.posts
  .slice()
  .sort((a, b) => a.id - b.id)
  .map((p) => [
    String(p.id),
    p.tema || '',
    p.folder || '',
    p.format || '',
    p.status || '',
    p.programat || '',
    p.postat || '',
    p.cta || '',
    p.nota || '',
    p.platforme?.facebook || '',
    p.platforme?.instagram || '',
    p.platforme?.youtube || '',
    p.platforme?.tiktok || '',
  ]);

console.log(`${rows.length} postări de migrat în tabul „${SHEET}".`);
console.log(`Coloane: ${COLS.join(' | ')}\n`);
for (const r of rows) console.log(`  #${r[0].padStart(2)} ${r[1].slice(0, 58)}`);

if (!WRITE) {
  console.log('\n=== DRY RUN. Adaugă --write ca să scrie în Sheet. ===');
  process.exit(0);
}

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });

const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
const exists = meta.data.sheets.some((s) => s.properties.title === SHEET);
if (exists) {
  console.error(`\nTabul „${SHEET}" există deja. Șterge-l manual dacă vrei să re-migrezi.`);
  process.exit(1);
}

await sheets.spreadsheets.batchUpdate({
  spreadsheetId: SPREADSHEET_ID,
  requestBody: { requests: [{ addSheet: { properties: { title: SHEET } } }] },
});

await sheets.spreadsheets.values.update({
  spreadsheetId: SPREADSHEET_ID,
  range: `${SHEET}!A1`,
  valueInputOption: 'RAW',
  requestBody: { values: [COLS, ...rows] },
});

console.log(`\n✓ Tab „${SHEET}" creat cu ${rows.length} postări.`);
console.log('Sursa de adevăr e de acum Sheet-ul. data/social-schedule.json rămâne ca arhivă.');
