#!/usr/bin/env node
/**
 * Producția lunară per județ, luată din PVGIS (nu estimată).
 *
 * De ce există: `data/pvgis-yields.json` are doar totalul anual (kWh/kWp/an),
 * iar totalul anual nu spune nimic despre luna în care omul citește. Faptul care
 * mișcă pe cineva în august e „acum produceți de trei ori cât în ianuarie", și
 * pentru asta trebuie defalcarea lunară.
 *
 * Sursa: PVGIS v5.2 (SARAH3), sistem fix montat sud, înclinare 30°, pierderi 14%,
 * 1 kWp instalat. Coordonatele sunt ale reședinței de județ, rotunjite la 2
 * zecimale; iradiația variază lent geografic, deci precizia asta e suficientă.
 * Validarea: totalul anual rezultat se compară cu `pvgis-yields.json`, construit
 * anterior tot din PVGIS. Dacă un județ iese cu peste 5% diferență, coordonata
 * e greșită și scriptul o semnalează.
 *
 * Usage: node scripts/pvgis-monthly.mjs
 */
import { writeFileSync, readFileSync } from 'node:fs';

const SEATS = {
  'Alba': ['Alba Iulia', 46.07, 23.58],
  'Arad': ['Arad', 46.19, 21.31],
  'Argeș': ['Pitești', 44.86, 24.87],
  'Bacău': ['Bacău', 46.57, 26.91],
  'Bihor': ['Oradea', 47.06, 21.93],
  'Bistrița-Năsăud': ['Bistrița', 47.13, 24.49],
  'Botoșani': ['Botoșani', 47.74, 26.67],
  'Brăila': ['Brăila', 45.27, 27.98],
  'Brașov': ['Brașov', 45.65, 25.61],
  'București': ['București', 44.43, 26.10],
  'Buzău': ['Buzău', 45.15, 26.82],
  'Călărași': ['Călărași', 44.20, 27.33],
  'Caraș-Severin': ['Reșița', 45.30, 21.89],
  'Cluj': ['Cluj-Napoca', 46.77, 23.60],
  'Constanța': ['Constanța', 44.18, 28.63],
  'Covasna': ['Sfântu Gheorghe', 45.87, 25.79],
  'Dâmbovița': ['Târgoviște', 44.93, 25.46],
  'Dolj': ['Craiova', 44.32, 23.80],
  'Galați': ['Galați', 45.44, 28.05],
  'Giurgiu': ['Giurgiu', 43.90, 25.97],
  'Gorj': ['Târgu Jiu', 45.04, 23.27],
  'Harghita': ['Miercurea Ciuc', 46.36, 25.80],
  'Hunedoara': ['Deva', 45.88, 22.90],
  'Ialomița': ['Slobozia', 44.56, 27.37],
  'Iași': ['Iași', 47.16, 27.59],
  'Ilfov': ['Otopeni', 44.55, 26.06],
  'Maramureș': ['Baia Mare', 47.66, 23.57],
  'Mehedinți': ['Drobeta-Turnu Severin', 44.63, 22.66],
  'Mureș': ['Târgu Mureș', 46.54, 24.56],
  'Neamț': ['Piatra Neamț', 46.93, 26.37],
  'Olt': ['Slatina', 44.43, 24.37],
  'Prahova': ['Ploiești', 44.94, 26.03],
  'Sălaj': ['Zalău', 47.19, 23.06],
  'Satu Mare': ['Satu Mare', 47.79, 22.88],
  'Sibiu': ['Sibiu', 45.79, 24.15],
  'Suceava': ['Suceava', 47.65, 26.26],
  'Teleorman': ['Alexandria', 43.98, 25.33],
  'Timiș': ['Timișoara', 45.75, 21.23],
  'Tulcea': ['Tulcea', 45.18, 28.80],
  'Vâlcea': ['Râmnicu Vâlcea', 45.10, 24.37],
  'Vaslui': ['Vaslui', 46.64, 27.73],
  'Vrancea': ['Focșani', 45.70, 27.18],
};

const known = JSON.parse(readFileSync('data/pvgis-yields.json', 'utf8')).yields;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const out = {};
const warnings = [];

for (const [judet, [oras, lat, lon]] of Object.entries(SEATS)) {
  const url = `https://re.jrc.ec.europa.eu/api/v5_2/PVcalc?lat=${lat}&lon=${lon}` +
    `&peakpower=1&loss=14&angle=30&aspect=0&outputformat=json`;
  let json;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      json = await res.json();
      break;
    } catch (err) {
      if (attempt === 2) throw new Error(`${judet}: ${err.message}`);
      await sleep(2000);
    }
  }
  const monthly = json.outputs.monthly.fixed.map((m) => Math.round(m.E_m * 10) / 10);
  const anual = Math.round(json.outputs.totals.fixed.E_y);
  out[judet] = { oras, lat, lon, anual, lunar: monthly };

  const ref = known[judet];
  if (ref) {
    const diff = ((anual - ref) / ref) * 100;
    if (Math.abs(diff) > 5) warnings.push(`${judet}: PVGIS ${anual} vs pvgis-yields ${ref} (${diff.toFixed(1)}%)`);
  }
  console.log(`${judet.padEnd(18)} ${oras.padEnd(24)} an ${anual}  aug ${monthly[7]}`);
  await sleep(400);
}

writeFileSync('data/pvgis-monthly.json', JSON.stringify({
  _note: 'Producție lunară kWh per 1 kWp instalat. PVGIS v5.2 (SARAH3), sistem fix sud, înclinare 30°, pierderi de sistem 14%. Coordonate: reședința de județ. Generat cu scripts/pvgis-monthly.mjs.',
  _generat: new Date().toISOString().slice(0, 10),
  _luni: ['ian', 'feb', 'mar', 'apr', 'mai', 'iun', 'iul', 'aug', 'sep', 'oct', 'noi', 'dec'],
  judete: out,
}, null, 2) + '\n');

console.log(`\nScris data/pvgis-monthly.json — ${Object.keys(out).length} județe.`);
if (warnings.length) {
  console.log('\nATENȚIE, diferențe peste 5% față de pvgis-yields.json:');
  warnings.forEach((w) => console.log('  ' + w));
} else {
  console.log('Toate județele se potrivesc cu pvgis-yields.json (sub 5% diferență).');
}
