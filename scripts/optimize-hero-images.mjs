#!/usr/bin/env node
/**
 * Reîncodează hero-urile de ghid ca JPEG, ca să nu mai ardem Fast Origin
 * Transfer pe Vercel.
 *
 * Problema pe care o rezolvă: nano-banana scoate PNG-uri de 2752x1536, în jur
 * de 3 MB bucata. Optimizatorul `/_next/image` aduce sursa întreagă de la
 * origine de fiecare dată când generează o variantă nouă (altă lățime, alt
 * format, altă regiune), iar `/ghid` randează toate hero-urile odată. 56 de
 * fișiere x 3 MB au mâncat cei 10 GB din planul gratuit.
 *
 * De ce JPEG și nu WebP, deși WebP e cu 1,2 MB mai mic pe tot setul: același
 * fișier alimentează și `og:image`, iar WebP nu e tratat consecvent de
 * preview-urile de linkuri (Facebook e canalul principal pentru firme).
 * Formatul sursă nu ajunge oricum la vizitator: `next/image` transcodează în
 * AVIF/WebP la edge.
 *
 * Lățimea: hero-ul se afișează la 1200 px, deci 2000 px acoperă și ecranele
 * retina fără să ducem înapoi la origine megabytes degeaba.
 *
 * Rulare:
 *   node scripts/optimize-hero-images.mjs           # scrie .jpg, păstrează sursele
 *   node scripts/optimize-hero-images.mjs --clean   # șterge și PNG-urile sursă
 *
 * ATENȚIE la --clean: `getHeroImage()` caută extensiile în ordinea
 * webp, png, jpg. Cât timp PNG-ul rămâne pe disc, el e cel servit, deci fără
 * --clean conversia nu are niciun efect în producție.
 */
import { readdirSync, renameSync, statSync, unlinkSync } from 'fs';
import { join } from 'path';
import sharp from 'sharp';

const DIR = 'public/images/guides';
const WIDTH = 2000;
const QUALITY = 82;

const clean = process.argv.includes('--clean');

/**
 * Criteriul nu e extensia, ci lățimea. Un JPEG de 2752 px costă la fel de mult
 * la origine ca un PNG de 2752 px, iar în director existau deja și JPEG-uri
 * scoase direct din generator. Sărim doar peste ce e deja sub prag.
 */
const candidati = readdirSync(DIR).filter((f) => /\.(png|jpe?g)$/i.test(f));
const surse = [];
for (const fisier of candidati) {
  const { width } = await sharp(join(DIR, fisier)).metadata();
  if (/\.jpe?g$/i.test(fisier) && width <= WIDTH) continue;
  surse.push(fisier);
}

if (surse.length === 0) {
  console.log('Nimic de convertit: toate hero-urile sunt deja sub ' + WIDTH + ' px în ' + DIR);
  process.exit(0);
}

let intrare = 0;
let iesire = 0;

for (const fisier of surse) {
  const src = join(DIR, fisier);
  const dst = join(DIR, fisier.replace(/\.(png|jpe?g)$/i, '.jpg'));

  const octetiIntrare = statSync(src).size;

  // sharp nu poate scrie peste fișierul pe care tocmai îl citește, deci un
  // JPEG sursă se reîncodează într-un temporar și abia apoi îl înlocuiește.
  const inPlace = src === dst;
  const tinta = inPlace ? dst + '.tmp' : dst;
  await sharp(src)
    .resize({ width: WIDTH, withoutEnlargement: true })
    .jpeg({ quality: QUALITY, mozjpeg: true })
    .toFile(tinta);
  if (inPlace) renameSync(tinta, dst);

  const octetiIesire = statSync(dst).size;

  intrare += octetiIntrare;
  iesire += octetiIesire;

  const raport = (octetiIntrare / octetiIesire).toFixed(1);
  console.log(
    `${(octetiIntrare / 1048576).toFixed(2)} MB -> ${(octetiIesire / 1024).toFixed(0)} KB  (${raport}x)  ${fisier}`
  );

  if (clean && src !== dst) unlinkSync(src);
}

console.log('---');
console.log(`${surse.length} fișiere: ${(intrare / 1048576).toFixed(1)} MB -> ${(iesire / 1048576).toFixed(1)} MB`);
console.log(`reducere: ${(intrare / iesire).toFixed(1)}x`);
if (!clean) {
  console.log('\nSursele au rămas pe disc. Fără --clean, PNG-ul e în continuare cel servit.');
}
