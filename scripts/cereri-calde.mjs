#!/usr/bin/env node
/**
 * Cererile libere în care omul a bifat „cât mai repede" ȘI „fonduri proprii".
 *
 * De ce există: reelul din 12 septembrie 2026 („alerte pe județ") pornește de la
 * numărul lor, iar numărul se schimbă de la o zi la alta. Fără o comandă care
 * să-l scoată în două secunde, captionul se postează cu cifra de acum o
 * săptămână, adică fals.
 *
 * „Libere" = fără nicio revendicare activă (renunțările nu se numără). NU
 * înseamnă că sunt cele care se închid cel mai des: coloanele de ofertă și de
 * câștig sunt aproape goale, deci o comparație de conversie nu are pe ce sta.
 * Ce spune cifra: câți oameni care nu depind de un program de finanțare încă
 * n-au fost luați de nicio firmă.
 *
 *   node scripts/cereri-calde.mjs [--zile 30]
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { google } from 'googleapis';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2);
const ZILE = Number(args[args.indexOf('--zile') + 1]) || 30;

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
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});
const sheets = google.sheets({ version: 'v4', auth });
const read = async (tab) =>
  (
    (
      await sheets.spreadsheets.values.get({
        spreadsheetId: env.GOOGLE_SHEETS_SPREADSHEET_ID,
        range: `'${tab}'!A:AZ`,
      })
    ).data.values || []
  ).slice(1);

// Leads: 0 Data, 6 Județ, 8 kW, 12 Status, 13 Segment, 16 Duplicat al, 24 Finanțare,
//        28 Termen instalare, 37 Tip lucrare. Revendicări: 1 Lead ID, 9 Renunțat la.
const L = (await read('Leads')).filter((r) => r[0] && r[12] !== 'Ascuns' && !r[16]);
const C = await read('Revendicări');
const active = new Set(C.filter((c) => c[0] && !c[9]).map((c) => c[1]));

const zile = (d) => (Date.now() - new Date(d)) / 86400000;
const recente = L.filter((r) => zile(r[0]) <= ZILE);
const libere = recente.filter((r) => !active.has(r[0]));
const calde = libere.filter((r) => r[28] === 'cat-mai-repede' && r[24] === 'fonduri-proprii');

console.log(`Ultimele ${ZILE} de zile: ${recente.length} cereri, ${libere.length} fără nicio firmă.`);
console.log(`Din cele libere, ${calde.length} cu „cât mai repede" + „fonduri proprii":`);
for (const r of calde)
  console.log(
    `  ${r[0].slice(0, 10)} | ${r[6]} | ${r[13]} | ${r[8] ? r[8] + ' kW' : 'putere nespecificată'} | acum ${Math.round(zile(r[0]))} zile`,
  );

const peJudet = {};
for (const r of calde) peJudet[r[6]] = (peJudet[r[6]] || 0) + 1;
const lista = Object.entries(peJudet)
  .sort((a, b) => b[1] - a[1])
  .map(([j, n]) => (n > 1 ? `${j} (${n})` : j))
  .join(', ');
console.log(`\nPentru caption: ${lista || 'niciun județ'}`);
