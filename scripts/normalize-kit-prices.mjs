// Aduce toate prețurile din data/kit-prices.json pe ACEEAȘI bază: preț final
// cu TVA 21%, cota legală pentru panouri fotovoltaice din 1 august 2025.
//
// De ce există scriptul: `pretRon` e prețul AFIȘAT de magazin, iar magazinele
// îl afișează pe baze diferite. Solar1000 publică fără TVA („8.399 lei + 21%
// TVA"), VoltGrid publică trei rânduri și pe al doilea, „cu TVA 9%", o cotă
// redusă care nu se mai aplică panourilor, VoltExpert și Genway publică direct
// cu 21% inclus. Comparate ca atare, cifrele nu sunt comparabile, iar minimul
// pe putere iese greșit. Exact asta a produs prețurile false din ghidul #46 și
// din reelul #21 (descoperit 2026-08-11).
//
// Cotele de mai jos sunt verificate manual pe câte o pagină de produs per
// magazin, pe 2026-08-11. Dacă adaugi un magazin nou, verifici pagina și abia
// apoi îi treci cota aici. Fără intrare în tabel, produsele magazinului rămân
// nenormalizate și ies din orice comparație, intenționat.
//
//   node scripts/normalize-kit-prices.mjs           (dry-run)
//   node scripts/normalize-kit-prices.mjs --write

import { readFileSync, writeFileSync } from 'node:fs';

const FILE = new URL('../data/kit-prices.json', import.meta.url);
const WRITE = process.argv.includes('--write');

const TVA_LEGAL = 0.21;

// cotaAfisata: cota de TVA conținută în `pretRon`, așa cum o publică magazinul.
// 0 = preț fără TVA. null = neverificat, produsele nu se normalizează.
const BAZE = {
  Solar1000: { cotaAfisata: 0, verificatLa: '2026-08-11', dovada: 'Pagina afișează „8,399.00 lei + 21% TVA" și „*Pret fara TVA (21%)".' },
  VoltGrid: { cotaAfisata: 0.09, verificatLa: '2026-08-11', dovada: 'Pagina afișează trei rânduri: fără TVA, „cu TVA 9%" (rândul luat de scraper) și „cu TVA 19%". Cotele citate din Legea 39/2023, neactualizate.' },
  VoltExpert: { cotaAfisata: 0.21, verificatLa: '2026-08-11', dovada: 'Pagina afișează „25553.99 lei TVA 21% inclus".' },
  Genway: { cotaAfisata: 0.21, verificatLa: '2026-08-11', dovada: 'Pagina afișează 18.250,00 lei cu TVA 21%.' },
  eSolar: { cotaAfisata: null, verificatLa: null, dovada: 'Neverificat. Magazinul vinde echipament fără montaj, produsele lui nu intră în comparațiile „cu montaj".' },
};

const date = JSON.parse(readFileSync(FILE, 'utf8'));

let normalizate = 0;
let sarite = 0;

for (const sursa of date.sources) {
  const baza = BAZE[sursa.store];
  if (!baza) {
    console.error(`⚠️  Magazin fără bază de TVA verificată: ${sursa.store}. Produsele rămân nenormalizate.`);
  }
  sursa.cotaTvaAfisata = baza ? baza.cotaAfisata : null;
  sursa.cotaTvaVerificatLa = baza ? baza.verificatLa : null;
  sursa.cotaTvaDovada = baza ? baza.dovada : null;

  for (const p of sursa.produse) {
    const cota = sursa.cotaTvaAfisata;
    if (cota === null || cota === undefined || typeof p.pretRon !== 'number') {
      p.pretCuTva21Ron = null;
      sarite++;
      continue;
    }
    // Scoatem cota afișată, punem cota legală.
    const faraTva = p.pretRon / (1 + cota);
    p.pretCuTva21Ron = Math.round(faraTva * (1 + TVA_LEGAL) * 100) / 100;
    p.pretPeUnitateCuTva21 = p.marime ? Math.round(p.pretCuTva21Ron / p.marime) : null;
    normalizate++;
  }
}

date.tvaNormalizatLa = '2026-08-11';
date.tvaNota =
  'pretRon = prețul afișat de magazin, pe baza LUI de TVA (vezi cotaTvaAfisata per sursă). ' +
  'pretCuTva21Ron = același preț adus la TVA 21%, cota legală pentru panouri din 1 august 2025. ' +
  'ORICE comparație între magazine se face pe pretCuTva21Ron, niciodată pe pretRon.';

console.log(`Normalizate: ${normalizate} produse. Sărite (cotă neverificată): ${sarite}.`);
console.log('\nMinime on-grid cu montaj, pe baza normalizată:');
for (const kw of [3, 5, 10]) {
  const cand = [];
  for (const s of date.sources) {
    for (const p of s.produse) {
      if (p.unitate === 'kW' && Math.abs(p.marime - kw) < 0.35 && p.includeMontaj === 'da' && p.tip === 'on-grid' && p.pretCuTva21Ron) {
        cand.push({ store: s.store, ...p });
      }
    }
  }
  cand.sort((a, b) => a.pretCuTva21Ron - b.pretCuTva21Ron);
  console.log(`  ${kw} kW:`);
  cand.slice(0, 3).forEach((p) =>
    console.log(`    ${p.pretCuTva21Ron.toLocaleString('ro-RO')} lei (afișat ${p.pretRon.toLocaleString('ro-RO')}) · ${p.store}${p.stoc ? ' · ' + p.stoc : ''}`)
  );
}

if (WRITE) {
  writeFileSync(FILE, JSON.stringify(date, null, 2) + '\n');
  console.log('\n✅ Scris în data/kit-prices.json');
} else {
  console.log('\n(dry-run, nimic scris; rulează cu --write)');
}
