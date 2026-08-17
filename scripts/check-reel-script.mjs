// Trece scriptul unui reel prin filtrul editorial ÎNAINTE de a genera vocea.
//
// De ce există: pe 11 august am livrat un reel în care jumătate din propoziții
// vorbeau despre produsul nostru, nu despre banii omului („până acum trebuia să
// completați un formular întreg", „vă spune puterea sistemului, cât costă și în
// cât timp devine rentabil"). Userul l-a respins, pe drept. Verificarea aia se
// putea face în text, în zece secunde, înainte de voce și de render.
//
// Nu înlocuiește judecata, dar prinde tiparele care s-au dovedit slabe și
// estimează durata înainte să coste ceva.
//
//   node scripts/check-reel-script.mjs social/<folder>/script.txt

import { readFileSync } from 'node:fs';

const cale = process.argv[2];
if (!cale) {
  console.error('Dă calea către script.txt');
  process.exit(2);
}

const linii = readFileSync(cale, 'utf8').split('\n').map((l) => l.trim()).filter(Boolean);

// Calibrat pe TOATE timeline-urile reale generate cu Gemini Charon la tempo 1.12:
// 1.648 de cuvinte în 503,6 secunde de vorbire, în 108 propoziții = 3,27
// cuvinte/sec. Valoarea dinainte (3,68) venea dintr-un singur reel și estima cu
// ~4,4s sub realitate, destul cât să strige „prea scurt" la un reel de 31,2s.
// Recalculează cu:
//   node -e "const fs=require('fs');let W=0,S=0;for(const f of fs.readdirSync('social/remotion/src').filter(f=>/^timeline.*\.json$/.test(f))){const t=JSON.parse(fs.readFileSync('social/remotion/src/'+f));if(!t.sentences)continue;for(const s of t.sentences){W+=s.text.trim().split(/\s+/).length;S+=s.duration}}console.log(W/S)"
const CUVINTE_PE_SEC = 3.27;
const PAUZA = 0.28;
// Liniștea pe care o adaugă generatorul de voce la capete (--lead 0.5 --tail 1.0).
const LEAD_TAIL = 1.5;

const INTERZISE = [
  { re: /până acum|înainte trebuia|vechiul formular/i, de: 'vorbește despre cum era la noi înainte; omului nu-i pasă' },
  { re: /am (îmbunătățit|adăugat|lansat|construit)/i, de: 'anunț de produs; spune ce câștigă el, nu ce am făcut noi' },
  { re: /vă spune (puterea|cât|în cât)|îți spune (puterea|cât)/i, de: 'listă de funcții; se vede pe ecran oricum' },
  { re: /nu (sunt )?cifre scrise de mână|nu (sunt )?scoase din burtă/i, de: 'mândrie internă despre metodă' },
  { re: /^rămâne o estimare|^este doar o estimare/i, de: 'avertismentul ca propoziție separată rupe ritmul; topește-l în CTA' },
  { re: /link (în|in) (comentari|descriere|bio)/i, de: 'leagă render-ul de o platformă; locul linkului se spune doar în caption' },
  { re: /\b\d[\d.,]*\b/, de: 'cifră scrisă cu numere; TTS-ul o pronunță greșit, scrie-o în litere' },
];

// Nu blochează, doar atrage atenția: unele nimeresc nume proprii care nu se pot
// reformula (Iași, Ilfov, Ialomița).
const ATENTIE = [
  // Geist n-are serife pe „I" majuscul, deci arată identic cu „l" mic. Regula era
  // scrisă în docs/reel-workflow.md doar pentru textul mare din scene, dar
  // captions-urile se generează din chiar rândurile astea: pe 12 august „Iar dacă
  // vrei oferte concrete" a apărut pe ecran ca „lar dacă", descoperit abia după
  // render, deci a costat încă un ciclu complet de voce.
  {
    re: /(^|[\s„"(])I(?=[a-zăâîșț])/,
    de: 'cuvânt cu „I" majuscul; în Geist se citește „l" („Iar" → „lar"), iar captionul se generează din rândul ăsta. Reformulează dacă e cuvânt comun („Iar dacă" → „Și dacă"); dacă e nume propriu (Iași, Ilfov), lasă-l în voce dar ține-l departe de textul mare din scenă',
  },
];

let erori = 0;
let avertismente = 0;

console.log(`${cale}\n`);

let vorbire = 0;
linii.forEach((linie, i) => {
  const cuvinte = linie.split(/\s+/).length;
  const sec = cuvinte / CUVINTE_PE_SEC;
  vorbire += sec;

  const probleme = INTERZISE.filter((p) => p.re.test(linie));
  const atentii = ATENTIE.filter((p) => p.re.test(linie));
  const lung = cuvinte > 26;

  const marca = probleme.length ? '✗' : lung || atentii.length ? '!' : ' ';
  console.log(`${marca} ${String(i + 1).padStart(2)}. ${sec.toFixed(1)}s  ${linie.slice(0, 76)}`);
  for (const p of probleme) {
    console.log(`      → ${p.de}`);
    erori++;
  }
  for (const p of atentii) {
    console.log(`      → ${p.de}`);
    avertismente++;
  }
  if (lung) {
    console.log(`      → ${cuvinte} de cuvinte, prea lungă pentru o singură scenă; taie-o în două`);
    avertismente++;
  }
});

// Prima propoziție trebuie să conțină un fapt concret, nu o introducere.
const primaAreCifra = /\b(unu|doi|două|trei|patru|cinci|șase|șapte|opt|nouă|zece|sute|mii)\b/i.test(
  linii[0] || '',
);
if (!primaAreCifra) {
  console.log('\n✗ Prima propoziție nu are nicio cifră concretă. Cine derulează două secunde nu ajunge la concluzie, deci concluzia stă la început.');
  erori++;
}

const ultima = linii[linii.length - 1] || '';
if (!/lăsați o cerere|lasă o cerere|cereți|vezi ghidul/i.test(ultima)) {
  console.log('\n! Ultima propoziție nu pare să conțină un îndemn. Verifică.');
  avertismente++;
}

// Pauzele stau ÎNTRE propoziții, deci n-1, plus liniștea de la capete.
const totalSec = vorbire + Math.max(0, linii.length - 1) * PAUZA + LEAD_TAIL;

console.log(`\nDurată estimată: ${totalSec.toFixed(1)}s (${linii.length} propoziții).`);
if (totalSec < 28 || totalSec > 42) {
  console.log(`! În afara benzii care a mers (30-40s). Taie sau adaugă înainte de a genera vocea.`);
  avertismente++;
}

console.log(
  erori
    ? `\n${erori} probleme de fond. NU genera vocea încă.`
    : `\nFără probleme de fond${avertismente ? `, ${avertismente} de verificat` : ''}. Trimite scriptul userului înainte de voce.`,
);
process.exit(erori ? 1 : 0);
