#!/usr/bin/env node
/**
 * Raportul traficului schimbat cu un site partener (octombrie 2026, ElectroPrep).
 *
 * De ce există: la un schimb de linkuri, peste o lună-două amândouă părțile
 * vor să știe ce a adus celălalt. Partenerul vede în Google Analytics-ul lui
 * click-urile trimise de noi (UTM utm_source=instalatori-fotovoltaice.ro), dar
 * cifrele NOASTRE, adică ce au trimis ei și ce le-am trimis noi, stau în Umami
 * și în Sheets. Scriptul le scoate pe toate într-un mesaj de copiat.
 *
 * Trei direcții:
 *   - ei → noi: vizite cu utm_source-ul lor (au pus UTM pe link) și, separat,
 *     cu referrerul lor; plus cererile, listările și revendicările al căror
 *     canal first-touch e partenerul (lib/attribution.ts → Sheets);
 *   - noi → ei: click-uri pe linkurile din /parteneri/<slug>, din evenimentul
 *     Umami `partener-site-click`, pe fiecare `utm_content`;
 *   - pagina noastră despre ei: câți au văzut-o.
 *
 * Read-only. Nu scrie nimic nicăieri.
 *
 *   node scripts/partener-raport.mjs electroprep [--de-la 2026-10-13] [--pana-la 2026-12-13]
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { google } from 'googleapis';

const PARTNERS = {
  electroprep: {
    nume: 'ElectroPrep',
    utmSource: 'electroprep.ro',
    referrer: 'electroprep.ro',
    pagina: '/parteneri/electroprep',
    // Data de la care pagina lor despre noi e live; înainte nu are ce număra.
    start: '2026-10-12',
    canal: /electroprep/i,
  },
};

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith('--') && !/^\d{4}-/.test(a));
const P = PARTNERS[slug];
if (!P) {
  console.error(`Usage: node scripts/partener-raport.mjs <${Object.keys(PARTNERS).join('|')}> [--de-la YYYY-MM-DD] [--pana-la YYYY-MM-DD]`);
  process.exit(1);
}
const arg = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const startAt = new Date(`${arg('--de-la') || P.start}T00:00:00`).getTime();
const endAt = arg('--pana-la') ? new Date(`${arg('--pana-la')}T23:59:59`).getTime() : Date.now();

const env = Object.fromEntries(
  readFileSync(path.join(ROOT, '.env.local'), 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
    }),
);

// ── Umami ────────────────────────────────────────────────────────────────────
const WEBSITE_ID = '49a078c7-23dc-4a96-9c37-73bb15e9b7ba';
async function umami(p, params = {}) {
  const url = new URL(`https://api.umami.is/v1/websites/${WEBSITE_ID}${p}`);
  for (const [k, v] of Object.entries({ startAt, endAt, ...params })) url.searchParams.set(k, String(v));
  const res = await fetch(url, { headers: { 'x-umami-api-key': env.UMAMI_API_KEY, accept: 'application/json' } });
  if (!res.ok) throw new Error(`Umami ${res.status} pe ${p}: ${await res.text()}`);
  return res.json();
}

const [viaUtm, viaRef, utmPaths, pagina, clickPartener, clickLink] = await Promise.all([
  umami('/stats', { utmSource: P.utmSource }),
  umami('/stats', { referrer: P.referrer }),
  umami('/metrics', { type: 'path', utmSource: P.utmSource, limit: 10 }),
  umami('/stats', { path: P.pagina }),
  umami('/event-data/values', { event: 'partener-site-click', propertyName: 'partener' }),
  umami('/event-data/values', { event: 'partener-site-click', propertyName: 'link' }),
]);
const clickTotal = clickPartener.find((r) => r.value === slug)?.total || 0;
const clickRows = clickLink.filter((r) => r.value.startsWith(`${slug}/`));

// ── Sheets: canalul first-touch scris la trimitere ───────────────────────────
// Indicii coloanei „Canal" pe fiecare tab, din lib/sheets.ts: Leads AH,
// Listări R, Revendicări Q, Portal Acces E (doar pe evenimentul `cerut`).
const auth = new google.auth.JWT({
  email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});
const sheets = google.sheets({ version: 'v4', auth });
// Un singur batchGet, nu patru citiri: cota e 60 de citiri pe minut pe tot
// proiectul, împărțită cu site-ul din producție și cu celelalte scripturi.
const TABS = ['Leads', 'Listări', 'Revendicări', 'Portal Acces'];
async function readAll() {
  // retry: false: la 429, reîncercările automate gaxios (×3) înmulțeau citirile
  // exact când cota era plină. Pe 12 oct 2026 asta a golit /cereri pe prod.
  const res = await sheets.spreadsheets.values.batchGet(
    {
      spreadsheetId: env.GOOGLE_SHEETS_SPREADSHEET_ID,
      ranges: TABS.map((t) => `'${t}'!A:AZ`),
    },
    { retry: false },
  );
  return res.data.valueRanges.map((v) => (v.values || []).slice(1));
}

function ts(raw) {
  if (!raw) return NaN;
  const ro = /^(\d{1,2})[./](\d{1,2})[./](\d{4})(?:[ ,]+(\d{1,2}):(\d{2}))?/.exec(raw);
  if (ro) return new Date(+ro[3], +ro[2] - 1, +ro[1], +(ro[4] || 0), +(ro[5] || 0)).getTime();
  return new Date(raw).getTime();
}
const inRange = (r) => {
  const t = ts(r[0]);
  return t >= startAt && t <= endAt;
};
const count = (rows, col, filter = () => true) =>
  rows.filter((r) => inRange(r) && filter(r) && P.canal.test(r[col] || '')).length;

// Dacă Sheets refuză (cota, rețea), raportul Umami tot iese: e jumătatea care
// nu se poate reface mai târziu dintr-o altă sursă.
let sheetsLine;
try {
  const [leads, listari, revendicari, portal] = await readAll();
  sheetsLine = [
    `cereri de ofertă: ${count(leads, 33)}`,
    `listări firme: ${count(listari, 17)}`,
    `revendicări: ${count(revendicari, 16)}`,
    `conturi portal: ${count(portal, 4, (r) => r[2] === 'cerut')}`,
  ].join(' · ');
} catch (err) {
  sheetsLine = `Sheets indisponibil (${err.code || err.message}); rulează din nou peste un minut`;
}

// ── Ieșire ───────────────────────────────────────────────────────────────────
const fmt = (t) => new Date(t).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' });
console.log(`\n${P.nume}: ${fmt(startAt)} – ${fmt(endAt)}\n`);

console.log(`${P.nume} → noi`);
console.log(`  vizite cu utm_source=${P.utmSource}: ${viaUtm.visits} (${viaUtm.visitors} vizitatori, ${viaUtm.pageviews} pagini)`);
console.log(`  vizite cu referrer ${P.referrer}: ${viaRef.visits} (se suprapun parțial cu cele de sus)`);
if (utmPaths.length) {
  console.log('  pagini văzute în vizitele lor:');
  for (const r of utmPaths) console.log(`    ${String(r.y).padStart(4)}  ${r.x}`);
}
console.log(`  ${sheetsLine}`);

console.log(`\nnoi → ${P.nume}`);
console.log(`  click-uri pe linkurile spre ei: ${clickTotal}`);
for (const r of clickRows.sort((a, b) => b.total - a.total)) {
  console.log(`    ${String(r.total).padStart(4)}  ${r.value.slice(slug.length + 1)}`);
}

console.log(`\npagina ${P.pagina}: ${pagina.pageviews} afișări, ${pagina.visitors} vizitatori\n`);
