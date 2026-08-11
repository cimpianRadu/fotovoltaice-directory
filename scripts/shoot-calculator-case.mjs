// Capturi pentru un caz lucrat pe calculatorul complet: un județ, o factură.
//
// Widgetul de pe prima pagină e fixat pe București, deci un exemplu pe alt județ
// se fotografiază din calculator, unde județul se poate schimba. Starea intră
// prin URL (`?segment=...&consum=...&unitate=lei&judet=...`), adăugată în 4e904d4
// tocmai ca un rezultat să poată fi trimis mai departe și refotografiat identic.
//
//   node scripts/shoot-calculator-case.mjs --judet Brașov --consum 400
//   node scripts/shoot-calculator-case.mjs --url https://instalatori-fotovoltaice.ro

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const args = process.argv.slice(2);
const flag = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i === -1 ? d : args[i + 1];
};

const BASE = flag('url', 'http://localhost:3000');
const JUDET = flag('judet', 'Brașov');
const CONSUM = flag('consum', '400');
const OUT = flag('out', 'social/2026-08-11-widget-estimare');

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 1100 }, deviceScaleFactor: 2 });

const url = `${BASE}/calculator-panouri-fotovoltaice?segment=rezidential&consum=${encodeURIComponent(
  CONSUM,
)}&unitate=lei&judet=${encodeURIComponent(JUDET)}`;
await page.goto(url, { waitUntil: 'networkidle' });

for (const b of await page.locator('button[aria-label*="nchide"], button[aria-label*="lose"]').all()) {
  await b.click().catch(() => {});
}
await page.waitForTimeout(600);

// Rezultatul e sub formular. Îl prindem după eticheta de amortizare, care apare
// doar când calculul s-a făcut, ca să nu fotografiem un formular gol.
const rezultat = page.locator('text=/amortiz/i').first();
await rezultat.waitFor({ state: 'visible', timeout: 15000 });

const slug = `${JUDET.toLowerCase().replace(/[^a-z]/g, '')}-${CONSUM}lei`;
await page.screenshot({ path: `${OUT}/calculator-${slug}.png`, fullPage: false });

const text = await page.locator('main').innerText();
const cifre = text
  .split('\n')
  .filter((l) => /kWp|kW\b|RON|ani|kWh/.test(l))
  .slice(0, 14);
console.log(`${OUT}/calculator-${slug}.png`);
console.log(cifre.map((l) => '   ' + l).join('\n'));

await browser.close();
