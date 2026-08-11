// Verifică pozele dintr-un folder de postare ÎNAINTE de a le urca.
//
// De ce există: pe 11 august am produs trei capturi de 2496x460, adică 5,4:1,
// iar Facebook le-a refuzat la încărcare. A doua încercare a scos 0,739 în loc
// de 0,800 și tot n-am prins-o decât după ce a picat din nou. Constrângerea era
// știută de la început (docs/social-pipeline.md spune 4:5 pentru feed), doar că
// nimic nu o verifica.
//
// Meta acceptă rapoarte între 4:5 (0,8) și 1,91:1 pentru pozele din feed.
// Story-urile sunt 9:16 și se recunosc după sufixul din nume.
//
//   node scripts/check-social-images.mjs social/2026-08-11-kit-pret-poster
//   node scripts/check-social-images.mjs social/*/          (toate)

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';

const MIN = 0.8; // 4:5
const MAX = 1.91; // 1,91:1
const STORY = 9 / 16;
const TOLERANTA = 0.01;

/** Citim doar antetul PNG/JPEG, fără dependențe. */
function dimensiuni(cale) {
  const buf = readFileSync(cale);
  if (buf.slice(1, 4).toString() === 'PNG') {
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  }
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length) {
      if (buf[i] !== 0xff) { i++; continue; }
      const marker = buf[i + 1];
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
      }
      i += 2 + buf.readUInt16BE(i + 2);
    }
  }
  return null;
}

const foldere = process.argv.slice(2);
if (!foldere.length) {
  console.error('Dă cel puțin un folder. Ex: node scripts/check-social-images.mjs social/2026-08-11-kit-pret-poster');
  process.exit(2);
}

let probleme = 0;
let verificate = 0;

for (const folder of foldere) {
  if (!statSync(folder, { throwIfNoEntry: false })?.isDirectory()) continue;
  const poze = readdirSync(folder).filter((f) => /\.(png|jpe?g)$/i.test(f) && !f.startsWith('.'));
  if (!poze.length) continue;

  console.log(`\n${folder}`);
  for (const nume of poze) {
    const dim = dimensiuni(join(folder, nume));
    if (!dim) { console.log(`  ?  ${nume}  (format necitit)`); continue; }
    verificate++;
    const r = dim.w / dim.h;
    const eStory = /story|9x16|9-16/i.test(basename(nume));
    const ok = eStory
      ? Math.abs(r - STORY) < TOLERANTA
      : r >= MIN - 0.001 && r <= MAX + 0.001;
    if (!ok) probleme++;
    const asteptat = eStory ? '9:16 (0,563)' : 'între 0,800 și 1,910';
    console.log(
      `  ${ok ? '✓' : '✗'}  ${nume.padEnd(34)} ${String(dim.w).padStart(5)}x${String(dim.h).padEnd(5)}` +
        ` raport ${r.toFixed(3)}${ok ? '' : `  → Meta cere ${asteptat}`}`,
    );
  }
}

console.log(
  `\n${verificate} poze verificate, ${probleme} cu raport greșit.` +
    (probleme ? ' NU le urca așa, vor fi refuzate sau decupate.' : ' Gata de urcat.'),
);
process.exit(probleme ? 1 : 0);
