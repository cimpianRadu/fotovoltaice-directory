#!/usr/bin/env node
/**
 * Anunță motoarele de căutare care suportă IndexNow (Bing, Yandex, Naver,
 * Seznam) că un URL s-a schimbat, ca să nu aștepți următorul crawl.
 *
 * Google NU folosește IndexNow. Pentru Google rămâne Request Indexing manual
 * din Search Console.
 *
 * Cheia stă în `public/<cheie>.txt` și e citită de acolo, nu duplicată aici.
 *
 * Usage:
 *   node scripts/indexnow.mjs /ghid/slug-ghid            # una sau mai multe căi
 *   node scripts/indexnow.mjs --ghid slug-ghid           # scurtătură pentru /ghid/<slug>
 *   node scripts/indexnow.mjs --firma slug-firma         # scurtătură pentru /firme/<slug>
 *   node scripts/indexnow.mjs --ghid a --ghid b /clasament
 *   node scripts/indexnow.mjs --tot                      # toate URL-urile din sitemap.xml (live)
 *   node scripts/indexnow.mjs --ghid slug --dry          # arată ce ar trimite, fără request
 */

import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const BASE_URL = 'https://instalatori-fotovoltaice.ro';
const HOST = new URL(BASE_URL).host;
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const MAX_URLS = 10_000; // limita per request din protocol

const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const TOT = args.includes('--tot');

/** Cheia IndexNow = numele fișierului .txt din public/ al cărui conținut e identic cu numele. */
function readKey() {
  const publicDir = path.join(ROOT, 'public');
  for (const file of readdirSync(publicDir)) {
    if (!/^[a-f0-9]{8,128}\.txt$/i.test(file)) continue;
    const key = file.replace(/\.txt$/i, '');
    const body = readFileSync(path.join(publicDir, file), 'utf8').trim();
    if (body === key) return key;
  }
  throw new Error(
    'Nu am găsit cheia IndexNow în public/. Trebuie un fișier <cheie>.txt care conține exact <cheie>.',
  );
}

/** Normalizează o cale sau un URL complet la un URL absolut pe domeniul nostru. */
function toUrl(input) {
  const value = input.trim();
  if (/^https?:\/\//i.test(value)) {
    const url = new URL(value);
    if (url.host !== HOST) throw new Error(`URL în afara domeniului ${HOST}: ${value}`);
    return url.toString();
  }
  return `${BASE_URL}${value.startsWith('/') ? '' : '/'}${value}`;
}

/** URL-urile din sitemap-ul live, ca să nu reimplementez logica din app/sitemap.ts. */
async function urlsFromSitemap() {
  const res = await fetch(`${BASE_URL}/sitemap.xml`);
  if (!res.ok) throw new Error(`sitemap.xml a răspuns ${res.status}`);
  const xml = await res.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

function collectFromArgs() {
  const urls = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--ghid' || arg === '--firma') {
      const slug = args[++i];
      if (!slug || slug.startsWith('--')) throw new Error(`${arg} are nevoie de un slug`);
      urls.push(toUrl(`${arg === '--ghid' ? '/ghid' : '/firme'}/${slug}`));
      continue;
    }
    if (arg.startsWith('--')) continue;
    urls.push(toUrl(arg));
  }
  return urls;
}

async function main() {
  const key = readKey();
  const collected = TOT ? await urlsFromSitemap() : collectFromArgs();
  const urlList = [...new Set(collected)];

  if (urlList.length === 0) {
    console.error('Niciun URL de trimis. Vezi exemplele din capul fișierului.');
    process.exit(1);
  }
  if (urlList.length > MAX_URLS) {
    console.error(`Prea multe URL-uri (${urlList.length}), limita e ${MAX_URLS}.`);
    process.exit(1);
  }
  if (TOT) {
    console.log(
      'Atenție: trimiți tot sitemap-ul. E util o singură dată, la pornire. Repetat, motoarele îl ignoră.',
    );
  }

  const payload = {
    host: HOST,
    key,
    keyLocation: `${BASE_URL}/${key}.txt`,
    urlList,
  };

  console.log(`${urlList.length} URL-uri:`);
  for (const url of urlList.slice(0, 20)) console.log(`  ${url}`);
  if (urlList.length > 20) console.log(`  ... și încă ${urlList.length - 20}`);

  if (DRY) {
    console.log('\n--dry: nu am trimis nimic.');
    return;
  }

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  });

  // 200 = acceptat, 202 = acceptat dar cheia încă se validează (normal la prima rulare)
  if (res.status === 200 || res.status === 202) {
    console.log(`\nOK (${res.status}). Trimise ${urlList.length} URL-uri.`);
    return;
  }

  const explain = {
    400: 'format invalid în request',
    403: 'cheia nu e validă sau fișierul nu e accesibil pe domeniu',
    422: 'URL-urile nu aparțin domeniului sau cheia nu se potrivește',
    429: 'prea multe request-uri, încearcă mai târziu',
  };
  console.error(
    `\nEșec: ${res.status}${explain[res.status] ? ` (${explain[res.status]})` : ''}\n${(await res.text()).slice(0, 500)}`,
  );
  process.exit(1);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
