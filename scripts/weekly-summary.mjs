#!/usr/bin/env node
/**
 * Cifrele pentru postarea de rezumat de vineri: câte cereri au intrat în
 * săptămână, câte au fost preluate de firme, câte sunt încă disponibile și
 * câte oferte au fost marcate ca trimise din portal.
 *
 * Read-only. Nu scrie nimic în Sheet.
 *
 * Usage:
 *   node scripts/weekly-summary.mjs                  # luni-duminica săptămânii curente (ora RO)
 *   node scripts/weekly-summary.mjs --de 2026-08-10 --pana 2026-08-16
 *   node scripts/weekly-summary.mjs --json           # doar JSON, pentru compunerea pozei
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { google } from 'googleapis';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2);
const JSON_ONLY = args.includes('--json');
const flag = (n) => {
  const i = args.indexOf(`--${n}`);
  return i === -1 ? '' : args[i + 1] || '';
};

const env = Object.fromEntries(
  readFileSync(path.join(ROOT, '.env.local'), 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
    }),
);

/** Ziua calendaristică în ora României, ca la restul aplicației. */
function roDay(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Bucharest' }).format(d);
}

/** Lunea săptămânii curente, în ora României. */
function currentMonday() {
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Bucharest' }).format(new Date());
  const d = new Date(`${today}T12:00:00Z`);
  const dow = (d.getUTCDay() + 6) % 7; // 0 = luni
  d.setUTCDate(d.getUTCDate() - dow);
  return d.toISOString().slice(0, 10);
}

const from = flag('de') || currentMonday();
const to = flag('pana') || new Date(new Date(`${from}T12:00:00Z`).getTime() + 6 * 86400000)
  .toISOString()
  .slice(0, 10);

const auth = new google.auth.JWT({
  email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});
const sheets = google.sheets({ version: 'v4', auth });
const read = async (range) =>
  (
    await sheets.spreadsheets.values.get({
      spreadsheetId: env.GOOGLE_SHEETS_SPREADSHEET_ID,
      range,
    })
  ).data.values || [];

// A:V, nu A:N: coloana M e statusul de vizibilitate și V e statusul de CRM, iar
// fără ele numărăm altceva decât arată /cereri. Pe 17 august, varianta A:N a
// raportat 8 cereri libere când pe feed erau 6: una ascunsă manual și un
// duplicat trimis de același om la 5 minute distanță, ambele „Ascuns" în Sheet.
const [leadRows, claimRows] = await Promise.all([read('Leads!A:V'), read('Revendicări!A:N')]);

// Aceleași reguli ca în lib/sheets.ts: status „Ascuns" (col. M) scoate cererea din
// feed, iar LEAD_CLOSED_STATUSES pe statusul de CRM (col. V) o scoate din ce se
// mai poate revendica. Închisă nu înseamnă nereală: o cerere câștigată rămâne în
// „cereri noi" ale săptămânii, dar nu mai apare între cele disponibile.
const LEAD_CLOSED_STATUSES = ['castigata', 'altundeva', 'renuntat'];

const leads = leadRows
  .slice(1)
  .filter((r) => r[0])
  .map((r) => ({
    id: r[0],
    zi: roDay(r[0]),
    judet: r[6] || '',
    segment: r[13] || '',
    ascuns: (r[12] || '').trim() === 'Ascuns',
    inchisa: LEAD_CLOSED_STATUSES.includes((r[21] || '').trim().toLowerCase()),
  }))
  .filter((l) => !l.ascuns);

// Coloanele contractuale: J = renunțat la, M = aprobat la, N = ofertat la.
const claims = claimRows
  .slice(1)
  .filter((r) => r[0])
  .map((r) => ({
    ts: r[0],
    zi: roDay(r[0]),
    leadId: r[1],
    firma: (r[2] || '').trim(),
    releasedAt: r[9] || '',
    offeredAt: r[13] || '',
  }));

const inWeek = (zi) => zi >= from && zi <= to;

const cereriSaptamana = leads.filter((l) => inWeek(l.zi));
const activeClaimsFor = (leadId) => claims.filter((c) => c.leadId === leadId && !c.releasedAt);

const preluate = cereriSaptamana.filter((l) => activeClaimsFor(l.id).length > 0).length;
const disponibile = cereriSaptamana.length - preluate;
const revendicariSaptamana = claims.filter((c) => inWeek(c.zi) && !c.releasedAt).length;
// Ofertele se numără după data marcării, nu după data cererii: firma poate
// oferta în această săptămână o cerere primită săptămâna trecută.
const oferteSaptamana = claims.filter((c) => c.offeredAt && inWeek(roDay(c.offeredAt))).length;
const firmeActive = new Set(
  claims.filter((c) => inWeek(c.zi) && c.firma).map((c) => c.firma.toLowerCase()),
).size;

const judete = {};
for (const l of cereriSaptamana) if (l.judet) judete[l.judet] = (judete[l.judet] || 0) + 1;
const topJudete = Object.entries(judete)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 3);

// O cerere merge la maxim 3 firme (MAX_CLAIMS_PER_LEAD din lib/sheets.ts), deci
// „revendicată" nu înseamnă „luată": cât timp are sub 3 revendicări active, o
// altă firmă mai poate intra pe ea. Ăsta e argumentul de urgență din postări.
const MAX_CLAIMS_PER_LEAD = 3;
const deRevendicat = leads.filter((l) => !l.inchisa);
const libereAcum = deRevendicat.filter((l) => activeClaimsFor(l.id).length === 0);
const cuLocuriRamase = deRevendicat.filter((l) => {
  const n = activeClaimsFor(l.id).length;
  return n > 0 && n < MAX_CLAIMS_PER_LEAD;
});
const locuriRamase = cuLocuriRamase.reduce(
  (s, l) => s + (MAX_CLAIMS_PER_LEAD - activeClaimsFor(l.id).length),
  0,
);

const out = {
  de: from,
  pana: to,
  cereriNoi: cereriSaptamana.length,
  preluate,
  disponibile,
  revendicari: revendicariSaptamana,
  oferteTrimise: oferteSaptamana,
  firmeActive,
  topJudete,
  // Totaluri, pentru context când săptămâna e slabă.
  totalCereri: leads.length,
  totalCereriDisponibile: libereAcum.length,
  totalCereriDisponibileJudete: libereAcum.map((l) => l.judet).filter(Boolean),
  cereriCuLocuriRamase: cuLocuriRamase.length,
  locuriRamase,
};

if (JSON_ONLY) {
  console.log(JSON.stringify(out, null, 2));
  process.exit(0);
}

console.log(`\n=== Săptămâna ${from} → ${to} ===\n`);
console.log(`  Cereri noi ............... ${out.cereriNoi}`);
console.log(`  Preluate de firme ........ ${out.preluate}`);
console.log(`  Încă disponibile ......... ${out.disponibile}`);
console.log(`  Revendicări active ....... ${out.revendicari} (de la ${out.firmeActive} firme)`);
console.log(`  Oferte marcate trimise ... ${out.oferteTrimise}`);
if (topJudete.length) {
  console.log(`  Top județe ............... ${topJudete.map(([j, n]) => `${j} ${n}`).join(', ')}`);
}
console.log(`\n  Context: ${out.totalCereri} cereri în total, ${out.totalCereriDisponibile} fără nicio firmă`);
if (out.totalCereriDisponibileJudete.length) {
  console.log(`  Județele lor ............. ${out.totalCereriDisponibileJudete.join(', ')}`);
}
console.log(
  `  Cu locuri rămase ......... ${out.cereriCuLocuriRamase} cereri (${out.locuriRamase} locuri, maxim ${MAX_CLAIMS_PER_LEAD} firme pe cerere)\n`,
);

if (out.cereriNoi === 0) {
  console.log('  ⚠️  Zero cereri în interval. Verifică dacă postarea de vineri mai are sens.\n');
}
