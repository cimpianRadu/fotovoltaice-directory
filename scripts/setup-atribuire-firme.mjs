#!/usr/bin/env node
/**
 * Antetele pentru atribuirea FIRMELOR (7 sept 2026): de unde vin firmele care
 * revendică, se listează sau intră în portal.
 *
 *   - „Revendicări"  Q:T  → Canal, Campanie, Pagină intrare, Cum a aflat
 *   - „Listări"      R:U  → Canal, Campanie, Pagină intrare, Cum a aflat
 *                           (Q rămâne marcajul „Email trimis" al scripts/outreach.mjs)
 *   - „Portal Acces" E:G  → Canal, Campanie, Pagină intrare (doar pe `cerut`)
 *
 * De ce pas separat: scrierile pe o coloană din afara grilei sunt respinse cu
 * „exceeds grid limits" și pierd TOT rândul (vezi scripts/setup-interval-apel.mjs).
 * Cele trei taburi au 26 de coloane la 7 sept, deci grila ajunge; scriptul
 * verifică oricum și lărgește dacă e nevoie. Antetele se scriu doar în celule
 * goale: rulat de două ori nu strică nimic și nu atinge nicio celulă de date.
 *
 * Se rulează ÎNAINTE de deploy-ul codului care scrie coloanele.
 *
 * Usage: node scripts/setup-atribuire-firme.mjs
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

// Aceleași etichete ca în lib/sheets.ts (CLAIMS_HEADER, PORTAL_HEADER, saveListingToSheet).
const PLAN = [
  { tab: 'Revendicări', range: 'Q1:T1', header: ['Canal', 'Campanie', 'Pagină intrare', 'Cum a aflat'], needed: 20 },
  { tab: 'Listări', range: 'R1:U1', header: ['Canal', 'Campanie', 'Pagină intrare', 'Cum a aflat'], needed: 21 },
  { tab: 'Portal Acces', range: 'E1:G1', header: ['Canal', 'Campanie', 'Pagină intrare'], needed: 7 },
];

const meta = await sheets.spreadsheets.get({ spreadsheetId });

for (const p of PLAN) {
  const tab = meta.data.sheets.find((s) => s.properties.title === p.tab);
  if (!tab) {
    console.log(`${p.tab}: tabul nu există încă (se creează singur cu antetul complet la prima scriere). Sar.`);
    continue;
  }
  const cols = tab.properties.gridProperties.columnCount;
  if (cols < p.needed) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            appendDimension: {
              sheetId: tab.properties.sheetId,
              dimension: 'COLUMNS',
              length: p.needed - cols,
            },
          },
        ],
      },
    });
    console.log(`${p.tab}: grila lărgită de la ${cols} la ${p.needed} coloane.`);
  } else {
    console.log(`${p.tab}: grila are ${cols} coloane, ajunge.`);
  }

  const existing =
    (
      await sheets.spreadsheets.values.get({ spreadsheetId, range: `'${p.tab}'!${p.range}` })
    ).data.values?.[0] || [];
  const merged = p.header.map((h, i) => (existing[i] && existing[i].trim() ? existing[i] : h));
  const conflicts = p.header.filter((h, i) => existing[i] && existing[i].trim() && existing[i] !== h);
  if (conflicts.length) {
    console.log(`${p.tab}: ATENȚIE, antet diferit deja scris în ${p.range}: ${JSON.stringify(existing)}. Nu suprascriu.`);
    continue;
  }
  if (existing.length === p.header.length && existing.every((v, i) => v === p.header[i])) {
    console.log(`${p.tab}: antetul ${p.range} e deja scris.`);
    continue;
  }
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${p.tab}'!${p.range}`,
    valueInputOption: 'RAW',
    requestBody: { values: [merged] },
  });
  console.log(`${p.tab}: antet scris în ${p.range}: ${merged.join(' | ')}`);
}
