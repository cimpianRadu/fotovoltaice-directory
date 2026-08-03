// Marchează o postare din tabul „Social" ca publicată, pe una sau mai multe platforme.
// Alternativa din UI e /admin/social (click pe badge-ul de platformă), dar aia cere
// browser + login; asta merge din terminal, util când postezi de pe telefon și
// vrei să sincronizezi Sheet-ul după.
//
// Default dry-run; --write scrie efectiv.
//
//   node scripts/social-mark-posted.mjs --id 9 --platforme facebook,instagram --data 2026-08-03
//   node scripts/social-mark-posted.mjs --cauta afir --platforme facebook --write
//
// --data lipsă = azi. `postat` se setează la prima platformă marcată (convenția din
// docs/social-pipeline.md: `postat` urmează platformele).

import { readFileSync } from 'node:fs';
import { google } from 'googleapis';

for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)\s*=\s*(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const SHEET = 'Social';
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
// Aceeași ordine ca SOCIAL_COLS din lib/sheets.ts și ca scripts/social-add.mjs.
const COLS = [
  'id', 'tema', 'folder', 'format', 'status', 'programat', 'postat', 'cta', 'nota',
  'facebook', 'instagram', 'youtube', 'tiktok',
];
const PLATFORME = ['facebook', 'instagram', 'youtube', 'tiktok'];

const args = process.argv.slice(2);
const WRITE = args.includes('--write');
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? '' : (args[i + 1] || '');
};

const id = flag('id');
const cauta = flag('cauta').toLowerCase();
if (!id && !cauta) {
  console.error('Dă --id <n> sau --cauta <text din temă/folder>.');
  process.exit(1);
}

const platforme = (flag('platforme') || 'facebook').split(',').map((p) => p.trim()).filter(Boolean);
const necunoscute = platforme.filter((p) => !PLATFORME.includes(p));
if (necunoscute.length) {
  console.error(`Platforme necunoscute: ${necunoscute.join(', ')}. Acceptate: ${PLATFORME.join(', ')}.`);
  process.exit(1);
}

const data = flag('data') || new Date().toISOString().slice(0, 10);
if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
  console.error(`--data trebuie în format YYYY-MM-DD, am primit „${data}".`);
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

const idx = rows.findIndex((r, i) => {
  if (i === 0) return false;
  if (id) return String(r[0]).trim() === String(id).trim();
  return `${r[1] || ''} ${r[2] || ''}`.toLowerCase().includes(cauta);
});

if (idx === -1) {
  console.error(id ? `Nu am găsit rândul cu id ${id}.` : `Nu am găsit niciun rând care să conțină „${cauta}".`);
  process.exit(1);
}

const row = [...(rows[idx] || [])];
while (row.length < COLS.length) row.push('');

console.log(`Rând #${row[0]} (linia ${idx + 1} în Sheet): ${row[1]}\n`);
console.log('  înainte:');
for (const p of PLATFORME) console.log(`    ${p.padEnd(10)} ${row[COLS.indexOf(p)] || '(gol)'}`);
console.log(`    ${'postat'.padEnd(10)} ${row[COLS.indexOf('postat')] || '(gol)'}`);
console.log(`    ${'status'.padEnd(10)} ${row[COLS.indexOf('status')] || '(gol)'}`);

for (const p of platforme) row[COLS.indexOf(p)] = data;
// `postat` urmează platformele: se setează la prima marcată, nu se suprascrie după.
if (!row[COLS.indexOf('postat')]) row[COLS.indexOf('postat')] = data;
row[COLS.indexOf('status')] = 'postat';

console.log('\n  după:');
for (const p of PLATFORME) console.log(`    ${p.padEnd(10)} ${row[COLS.indexOf(p)] || '(gol)'}`);
console.log(`    ${'postat'.padEnd(10)} ${row[COLS.indexOf('postat')]}`);
console.log(`    ${'status'.padEnd(10)} ${row[COLS.indexOf('status')]}`);

if (!WRITE) {
  console.log('\n=== DRY RUN. Adaugă --write ca să scrie în Sheet. ===');
  process.exit(0);
}

await sheets.spreadsheets.values.update({
  spreadsheetId: SPREADSHEET_ID,
  range: `${SHEET}!A${idx + 1}:M${idx + 1}`,
  valueInputOption: 'RAW',
  requestBody: { values: [row] },
});

console.log('\n✅ Scris în Sheet.');
