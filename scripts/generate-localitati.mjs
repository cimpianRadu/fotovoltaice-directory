// Localitățile din România pe județe, pentru sugestiile din formularul de cerere
// (pasul „Zonă"). Sursa e nomenclatorul oficial SIRUTA (INS), în forma publicată
// de https://github.com/strainu/SIRUTA (siruta.csv, separator „;").
//
// Scrie public/localitati/<slug-județ>.json, câte un fișier pe județ (~10-25 KB),
// ca browserul să ceară doar județul ales, nu toată țara (~13.700 de localități).
// Fiecare intrare e [nume, unitate, rang]:
//   - nume: „Corlătești"
//   - unitate: „comuna Berceni" / „orașul Mizil" / „municipiul Ploiești", goală
//     când localitatea e chiar orașul sau municipiul (Ploiești, Alba Iulia)
//   - rang: 0 municipiu/oraș, 1 reședință de comună, 2 restul; ordonează sugestiile
//
// Rulare (o dată, sau când se schimbă nomenclatorul):
//   curl -sSL -o /tmp/siruta.csv https://raw.githubusercontent.com/strainu/SIRUTA/master/siruta.csv
//   node scripts/generate-localitati.mjs /tmp/siruta.csv

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

// Aceeași regulă ca `countySlug` din lib/localitati-shared.ts: numele fișierului
// pe care îl cere browserul. Ținute identice de mână, sunt trei linii.
const localitateSlug = (s) =>
  s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');

const src = process.argv[2];
if (!src) {
  console.error('Folosire: node scripts/generate-localitati.mjs <siruta.csv>');
  process.exit(1);
}

const counties = JSON.parse(readFileSync(new URL('../data/counties.json', import.meta.url), 'utf8')).counties;

// Cuvintele de legătură rămân mici în interiorul numelui: „Curtea de Argeș",
// „Valea lui Mihai", „Câmpulung la Tisa".
const SMALL = new Set(['de', 'din', 'la', 'lui', 'pe', 'sub', 'cu', 'și', 'peste', 'lângă']);

function titleCase(upper) {
  const lower = upper.toLocaleLowerCase('ro-RO');
  let out = lower.replace(/(^|[\s\-.(])(\p{L})/gu, (_, sep, ch) => sep + ch.toLocaleUpperCase('ro-RO'));
  out = out
    .split(' ')
    .map((w, i) => (i > 0 && SMALL.has(w.toLocaleLowerCase('ro-RO')) ? w.toLocaleLowerCase('ro-RO') : w))
    .join(' ');
  return out;
}

const rows = readFileSync(src, 'utf8')
  .split(/\r?\n/)
  .slice(1)
  .filter(Boolean)
  .map((line) => {
    const [siruta, denloc, , jud, sirsup, tip, niv] = line.split(';');
    return { siruta, denloc: denloc.trim(), jud, sirsup, tip: Number(tip), niv: Number(niv) };
  });

const bySiruta = new Map(rows.map((r) => [r.siruta, r]));

// Județul din SIRUTA → numele din data/counties.json, comparat fără diacritice.
const countyByJud = new Map();
for (const r of rows.filter((x) => x.niv === 1)) {
  const name = r.denloc.replace(/^JUDEȚUL\s+|^MUNICIPIUL\s+/u, '');
  const match = counties.find((c) => localitateSlug(c) === localitateSlug(name));
  if (!match) throw new Error(`Județ fără corespondent în counties.json: ${r.denloc}`);
  countyByJud.set(r.jud, match);
}

// Numele unității administrative (nivelul 2), fără prefixul din SIRUTA. Comunele
// vin fără prefix („BERCENI"), orașele cu „ORAȘ", municipiile cu „MUNICIPIUL".
const uatName = (uat) => titleCase(uat.denloc.replace(/^(ORAȘ|MUNICIPIUL)\s+/u, ''));

// Unitatea spusă cum o spune omul. TIP 3 = comună, 2/5 = oraș, 1/4 = municipiu.
function uatLabel(uat) {
  if (uat.tip === 3) return `comuna ${uatName(uat)}`;
  if (uat.tip === 2 || uat.tip === 5) return `orașul ${uatName(uat)}`;
  if (uat.tip === 1 || uat.tip === 4) return `municipiul ${uatName(uat)}`;
  return uatName(uat);
}

// Tipurile SIRUTA de la nivelul 3: 9/17 = reședința unui municipiu/oraș, 22 =
// sat reședință de comună, 6 = sectoarele Bucureștiului. Reședința orașului
// poartă de obicei numele lui (Ploiești), dar nu mereu (Breaza de Jos e
// reședința orașului Breaza): atunci unitatea rămâne lângă nume.
const out = new Map(counties.map((c) => [c, []]));
for (const r of rows.filter((x) => x.niv === 3)) {
  const county = countyByJud.get(r.jud);
  const uat = bySiruta.get(r.sirsup);
  if (!county || !uat) continue;
  const nume = r.tip === 6 ? titleCase(r.denloc.replace(/^BUCUREȘTI\s+/u, '')) : titleCase(r.denloc);
  const isTown = r.tip === 9 || r.tip === 17 || r.tip === 6;
  const unitate = r.tip === 6 || (isTown && nume === uatName(uat)) ? '' : uatLabel(uat);
  const rang = isTown ? 0 : r.tip === 22 ? 1 : 2;
  out.get(county).push([nume, unitate, rang]);
}

const dir = new URL('../public/localitati/', import.meta.url);
mkdirSync(dir, { recursive: true });
let total = 0;
for (const [county, list] of out) {
  if (!list.length) throw new Error(`Județ fără localități: ${county}`);
  list.sort((a, b) => a[2] - b[2] || a[0].localeCompare(b[0], 'ro'));
  writeFileSync(new URL(`${localitateSlug(county)}.json`, dir), JSON.stringify(list));
  total += list.length;
}
console.log(`${total} localități în ${out.size} județe → public/localitati/`);
