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

// ---------------------------------------------------------------------------
// Stratul de ROSTIRE (adăugat 20 august 2026, după reelul „soare-judete").
//
// Scriptul ăla era corect gramatical și a sunat prost: patru propoziții din
// cinci erau scrise pentru citit, nu pentru rostit („Soarele mai puțin se
// acoperă dintr-un sistem puțin mai mare", „iese în cam doi ani", „extremele
// de soare"). Regulile de mai jos prind doar tiparele care se pot detecta
// mecanic, cu precizie mare. Ce ține de îmbinări construite ad-hoc rămâne în
// sarcina agentului `corector-ro`, care citește scriptul fără să știe subiectul.
// ---------------------------------------------------------------------------

const NUMERALE = new Set([
  'zero','unu','una','un','o','doi','două','trei','patru','cinci','șase','șapte','opt','nouă','zece',
  'unsprezece','doisprezece','douăsprezece','treisprezece','paisprezece','cincisprezece','șaisprezece',
  'șaptesprezece','optsprezece','nouăsprezece','douăzeci','treizeci','patruzeci','cincizeci','șaizeci',
  'șaptezeci','optzeci','nouăzeci','sută','sute','mie','mii','milion','milioane','miliard','miliarde',
  'jumătate','sfert','sferturi',
]);

// Cuvinte prea comune ca repetarea lor să însemne ceva.
const MARUNTE = new Set([
  'acest','această','aceea','aceeași','același','acolo','adică','altul','atât','atâta','avea','aveți',
  'care','când','cerere','curent','către','decât','dintr','doar','după','este','face','fiecare','foarte',
  'însă','între','mult','multă','numai','până','pentru','peste','poate','prin','sunt','totuși','unde',
]);

const norm = (l) =>
  l.toLowerCase().replace(/[„”"(),.!?;:]/g, ' ').split(/\s+/).filter(Boolean);

// 1. Densitate de numerale. Un număr scris în litere ocupă 4-6 cuvinte; două
//    într-o propoziție înseamnă că ascultătorul pierde primul până îl aude pe
//    al doilea. Prima propoziție e cazul grav: acolo omul încă nu știe despre
//    ce e vorba. („o mie trei sute optzeci ... și o mie o sută patruzeci")
function numerale(linie) {
  return norm(linie).filter((c) => NUMERALE.has(c)).length;
}

// 2. Cuvânt de conținut repetat la mai puțin de opt cuvinte distanță. Se aude
//    ca bâlbâială, chiar dacă pe hârtie trece. („mai puțin ... puțin mai mare")
function repetari(linie) {
  const c = norm(linie);
  const gasite = [];
  for (let i = 0; i < c.length; i++) {
    if (c[i].length < 5 || MARUNTE.has(c[i]) || NUMERALE.has(c[i])) continue;
    for (let j = i + 1; j < Math.min(c.length, i + 8); j++) {
      if (c[i] === c[j]) { gasite.push(c[i]); break; }
    }
  }
  return [...new Set(gasite)];
}

// 3. Coada scurtă după ultima virgulă. TTS-ul nu-i dă pauză suficientă, așa că
//    se lipește de ce a fost înainte. („prețul curentului, același peste tot")
//
//    Prima versiune tăia în enumerări („Unu, termenul de execuție") și în cozi
//    care sună bine fiindcă au verb („lasă o cerere pe site, e gratuit"). Acum
//    cere trei lucruri deodată: coada e scurtă, n-are verb, și ce vine înaintea
//    ei e destul de lung cât s-o înghită.
const VERBE_SCURTE = new Set(['e','este','sunt','era','erau','fie','face','iese','vine','costă','are','au','poate','pot','ajunge','rămâne','merge','intră','plătești','plătiți']);
const pareVerb = (c) =>
  VERBE_SCURTE.has(c) || /(ează|ește|esc|ăm|ați|ând|at|ut|it|ns)$/i.test(c);

function coadaScurta(linie) {
  const bucati = linie.split(',').map((b) => b.trim()).filter(Boolean);
  if (bucati.length < 2) return null;
  const ultima = bucati[bucati.length - 1].replace(/[.!?]$/, '');
  const cuvinteCoada = norm(ultima);
  if (cuvinteCoada.length === 0 || cuvinteCoada.length > 3) return null;
  if (cuvinteCoada.some(pareVerb)) return null;
  const inainte = norm(bucati.slice(0, -1).join(' ')).length;
  return inainte >= 8 ? ultima : null;
}

// `\b` din JavaScript nu vede diacriticele: „ț" și „î" nu sunt caractere de
// cuvânt, deci /\bți-ai\b/ și /\bîn cam\b/ nu se potriveau niciodată. Prima
// versiune a regulilor de mai jos a trecut liniștită peste exact propozițiile
// pentru care fusese scrisă. Delimitatorii de aici sunt pe litere Unicode.
const M = '(?<![\\p{L}\\p{N}])';
const MD = '(?![\\p{L}\\p{N}])';
const rx = (corp) => new RegExp(M + corp + MD, 'iu');

const ROSTIRE = [
  {
    re: rx('(mi|ți|și|ne|vi|li|i|te|le)-(am|ai|a|au|ați|aș|ar)'),
    de: 'grup de clitice lipite; Gemini le mestecă și se pierde jumătate din propoziție. Rescrie cu verb simplu („ți-ai lăsat cererea" → „ai trimis o cerere")',
  },
  {
    re: rx('(în|la|de|cu|pe|din)\\s+cam'),
    de: 'ordine greșită la rostire; „iese în cam doi ani" se spune „iese cam în doi ani"',
  },
  {
    re: rx('(kilowa[țt]i?|megawa[țt]i?)\\s+or[ăa]'),
    de: 'unitate ruptă în două cuvinte; la rostire iese „kilowați" plus „oră" separat. Scrie „kilowați-oră" sau, mai bine, reformulează fără unitate',
  },
  {
    re: rx('nu\\s+(doar|numai).{0,40}\\s+ci\\s+și'),
    de: 'construcție „nu doar ... ci și"; e de text scris, la ureche se pierde până ajunge la a doua parte',
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
  const atentii = [
    ...ATENTIE.filter((p) => p.re.test(linie)),
    ...ROSTIRE.filter((p) => p.re.test(linie)),
  ];
  const lung = cuvinte > 26;

  const nNum = numerale(linie);
  const pragNum = i === 0 ? 6 : 9;
  if (nNum > pragNum) {
    atentii.push({
      de: `${nNum} cuvinte-numeral într-o singură propoziție${i === 0 ? ' (și e prima)' : ''}; ascultătorul pierde primul număr până îl aude pe al doilea. Lasă unul singur aici, mută restul`,
    });
  }
  for (const cuv of repetari(linie)) {
    atentii.push({ de: `„${cuv}" apare de două ori la mai puțin de opt cuvinte distanță; se aude ca bâlbâială` });
  }
  const coada = coadaScurta(linie);
  if (coada) {
    atentii.push({ de: `se termină cu „${coada}", coadă scurtă după virgulă; TTS-ul n-o desprinde, se aude lipită. Fă-o propoziție sau topește-o în frază` });
  }
  if (!linie.includes(',') && cuvinte > 18) {
    atentii.push({ de: `${cuvinte} de cuvinte fără nicio virgulă; vocea o citește pe un singur ton. Rupe-o` });
  }

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
// Prin numerale(), nu prin \b: „nouă" se termină în diacritic, deci \b nu
// vede sfârșitul cuvântului (aceeași capcană ca la clitice), iar lista veche
// nici nu conținea 11-19.
const primaAreCifra = numerale(linii[0] || '') > 0 || /\d/.test(linii[0] || '');
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
