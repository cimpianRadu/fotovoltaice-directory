#!/usr/bin/env node
/**
 * Scrie data/firme-platforma.json: fișele din director ale firmelor cu cont
 * activ în /portal (19 nov 2026, cerut de Radu: „la firme, când se caută pe
 * județ, să fie primele cele de pe platformă, cu care colaborăm”).
 *
 * Listele de firme sunt statice, iar conturile stau în Sheets, deci lista se
 * scoate de aici, o dată, și se comite. Rulează din nou când o firmă își face
 * cont sau e dezactivată:
 *
 *   node --env-file=.env.local scripts/generate-firme-platforma.mjs
 *
 * O singură citire Sheets (cota e comună cu producția). Potrivirea cu fișa: întâi
 * după emailul de contact, apoi după nume, doar când numele duce la o singură
 * fișă. Firmele cu cont fără fișă se afișează la final, ca să știm pe cine să
 * adăugăm în director.
 */
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createJiti } from '../node_modules/jiti/lib/jiti.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const jiti = createJiti(import.meta.url, {
  alias: { '@': ROOT, 'server-only': path.join(ROOT, 'node_modules/server-only/empty.js') },
});

const { getClaims } = await jiti.import('@/lib/sheets');
const { getRegisteredFirms } = await jiti.import('@/lib/whatsapp-tracking');
const { getCompanies } = await jiti.import('@/lib/utils');

const norm = (s) =>
  (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\b(s\.?c\.?|s\.?r\.?l\.?|s\.?a\.?|pfa)\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const firms = await getRegisteredFirms(await getClaims());
const companies = getCompanies();

const slugs = new Set();
const fara = [];
for (const f of firms) {
  const byEmail = companies.find((c) => f.emails.includes((c.contact.email || '').trim().toLowerCase()));
  const nf = norm(f.numeFirma);
  const byName = companies.filter((c) => {
    const n = norm(c.name);
    return n && nf && (n.includes(nf) || nf.includes(n));
  });
  const match = byEmail || (byName.length === 1 ? byName[0] : null);
  if (match) slugs.add(match.slug);
  else fara.push(f.numeFirma);
}

const out = {
  generatedAt: new Date().toISOString(),
  slugs: [...slugs].sort(),
};
writeFileSync(path.join(ROOT, 'data/firme-platforma.json'), JSON.stringify(out, null, 2) + '\n');
console.log(`${out.slugs.length} fișe cu cont în portal → data/firme-platforma.json`);
if (fara.length) console.log(`Cont în portal, fără fișă în director (${fara.length}): ${fara.join(', ')}`);
