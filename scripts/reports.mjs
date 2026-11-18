#!/usr/bin/env node
/**
 * Rapoartele din butonul cu gândac (tab-ul „Rapoarte” din Sheets-ul proiectului).
 * Le folosește rutina `rapoarte-erori`, care le ia, le rezolvă și le închide.
 *
 *   node scripts/reports.mjs list [--all] [--json]   rapoartele deschise (Status gol sau „în-lucru”)
 *   node scripts/reports.mjs mark <ID> <status> [rezolvare…]
 *
 * Statusuri: rezolvat · nu-se-reproduce · la-radu (cere plată sau decizia lui) ·
 *            în-lucru · test · spam
 *
 * ⚠️ Fișier IDENTIC în gaseste-dentist, instalatori-fotovoltaice și clinici-estetice.
 * Rulează cu node 22: ~/.nvm/versions/node/v22.22.2/bin/node
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { google } from 'googleapis';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SHEET = 'Rapoarte';
const STATUSES = ['rezolvat', 'nu-se-reproduce', 'la-radu', 'în-lucru', 'test', 'spam'];

function loadEnv() {
  const envPath = path.join(root, '.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    let val = m[2].trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    if (!process.env[m[1].trim()]) process.env[m[1].trim()] = val;
  }
}

function client() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

async function readAll(sheets) {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const meta = await sheets.spreadsheets.get({ spreadsheetId, fields: 'sheets.properties.title' });
  if (!(meta.data.sheets || []).some((s) => s.properties?.title === SHEET)) return { header: [], rows: [] };
  const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: `${SHEET}!A:Z` });
  const [header = [], ...rest] = res.data.values || [];
  const rows = rest.map((r, i) => ({
    row: i + 2,
    ...Object.fromEntries(header.map((h, j) => [h, r[j] || ''])),
  }));
  return { header, rows };
}

function colLetter(i) {
  let s = '';
  for (i += 1; i > 0; i = Math.floor((i - 1) / 26)) s = String.fromCharCode(65 + ((i - 1) % 26)) + s;
  return s;
}

async function main() {
  loadEnv();
  const [cmd = 'list', ...args] = process.argv.slice(2);
  const sheets = client();
  const { header, rows } = await readAll(sheets);

  if (cmd === 'list') {
    const all = args.includes('--all');
    const open = rows.filter((r) => all || !r.Status || r.Status === 'în-lucru');
    if (args.includes('--json')) {
      console.log(JSON.stringify(open, null, 2));
      return;
    }
    if (!open.length) {
      console.log(all ? 'Niciun raport.' : 'Niciun raport deschis.');
      return;
    }
    for (const r of open) {
      console.log(`\n${r.ID} · ${r.Data} · ${r.Tip}${r.Despre ? ` · ${r.Despre}` : ''}${r.Status ? ` · [${r.Status}]` : ''}`);
      console.log(`  pagina: ${r.Pagina}  (din ${r.Sursa || '?'}; commit client ${r['Commit client'] || '?'} / server ${r['Commit server'] || '?'})`);
      console.log(`  ${r.Descriere.replace(/\n/g, '\n  ')}`);
      if (r.Email) console.log(`  email: ${r.Email}`);
      if (r['Erori JS']) console.log(`  erori JS:\n    ${r['Erori JS'].replace(/\n/g, '\n    ')}`);
      if (r['Chat sid']) console.log(`  chat sid: ${r['Chat sid']}`);
      console.log(`  browser: ${r.Browser} · ${r.Ecran}`);
      if (r.Rezolvare) console.log(`  rezolvare: ${r.Rezolvare}`);
    }
    console.log(`\n${open.length} raport(e).`);
    return;
  }

  if (cmd === 'mark') {
    const [id, status, ...note] = args;
    if (!id || !STATUSES.includes(status)) {
      console.error(`Folosire: mark <ID> <${STATUSES.join('|')}> [rezolvare…]`);
      process.exit(2);
    }
    const r = rows.find((x) => x.ID === id);
    if (!r) {
      console.error(`Nu găsesc raportul ${id}.`);
      process.exit(1);
    }
    const si = header.indexOf('Status');
    const ni = header.indexOf('Rezolvare');
    const today = new Date().toISOString().slice(0, 10);
    const text = note.join(' ').trim();
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
      range: `${SHEET}!${colLetter(si)}${r.row}:${colLetter(ni)}${r.row}`,
      valueInputOption: 'RAW',
      requestBody: { values: [[status, text ? `${today}: ${text}` : today]] },
    });
    console.log(`${id} → ${status}`);
    return;
  }

  console.error('Comenzi: list [--all] [--json] · mark <ID> <status> [rezolvare…]');
  process.exit(2);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
