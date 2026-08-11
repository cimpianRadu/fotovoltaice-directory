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
await page.addStyleTag({
  content: 'nextjs-portal, [data-nextjs-toast], #__next-build-watcher { display: none !important; }',
}).catch(() => {});

for (const b of await page.locator('button[aria-label*="nchide"], button[aria-label*="lose"]').all()) {
  await b.click().catch(() => {});
}
await page.waitForTimeout(600);

// Rezultatul stă sub formular, iar o captură de viewport ar prinde doar
// formularul. Ancorăm pe „Sistem recomandat", care apare numai după calcul, și
// urcăm la containerul lui: așa iese panoul de rezultat, nu pagina.
const ancora = page.locator('text=/Sistem recomandat/i').first();
await ancora.waitFor({ state: 'visible', timeout: 15000 });
// Rezultatul e blocul cu `space-y-6 scroll-mt-24`, adică părintele cardului
// de sumar. Ancorăm pe el, nu pe o clasă de stil care se poate schimba.
const rezultat = page.locator('div.space-y-6.scroll-mt-24').first();
await rezultat.scrollIntoViewIfNeeded();
await page.waitForTimeout(400);

const slug = `${JUDET.toLowerCase().replace(/[^a-z]/g, '')}-${CONSUM}lei`;
await rezultat.screenshot({ path: `${OUT}/calculator-${slug}.png` });

const text = await page.locator('main').innerText();
const cifre = text
  .split('\n')
  .filter((l) => /kWp|kW\b|RON|ani|kWh/.test(l))
  .slice(0, 14);
console.log(`${OUT}/calculator-${slug}.png`);
console.log(cifre.map((l) => '   ' + l).join('\n'));

await browser.close();
