// Capturi pentru postarea despre widgetul de estimare rapidă.
//
// Element-level, nu viewport: panoul de preview resetează scroll-ul, iar o
// captură de pagină întreagă ar prinde jumătate de hero. Playwright decupează
// exact cardul, pe fundal alb, la 2x, deci iese curat și pe Instagram.
//
//   node scripts/shoot-widget.mjs                     (localhost:3000)
//   node scripts/shoot-widget.mjs --url https://...   (producție, după deploy)
//   node scripts/shoot-widget.mjs --out social/2026-08-11-widget-estimare

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const args = process.argv.slice(2);
const flag = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i === -1 ? d : args[i + 1];
};

const BASE = flag('url', 'http://localhost:3000');
const OUT = flag('out', 'social/2026-08-11-widget-estimare');
// Facturile din capturi. Trei cazuri, ca postarea să arate că widgetul chiar
// răspunde la ce scrii, nu că afișează un rezultat fix.
const FACTURI = (flag('facturi', '250,400,900') || '').split(',').map((s) => s.trim());

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 2,
});

// Indicatorul de dev al Next.js stă fix în colț și intră peste text în captură.
// Nu face parte din pagina reală, deci se ascunde, nu se fotografiază.
await page.addStyleTag({
  content: 'nextjs-portal, [data-nextjs-toast], #__next-build-watcher { display: none !important; }',
}).catch(() => {});

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.addStyleTag({
  content: 'nextjs-portal, [data-nextjs-toast], #__next-build-watcher { display: none !important; }',
}).catch(() => {});

// Segmentul „Casă": widgetul își schimbă ipoteza de autoconsum după el, iar
// postarea e adresată proprietarilor de case.
const casa = page.getByRole('button', { name: /^Casă$/ });
if (await casa.count()) await casa.first().click();

// Popupurile (cere ofertă, sponsor) acoperă pagina în capturi.
for (const b of await page.locator('button[aria-label*="nchide"], button[aria-label*="lose"]').all()) {
  await b.click().catch(() => {});
}

const input = page.locator('#widget-factura');
await input.waitFor({ state: 'visible' });
const card = page.locator('#widget-factura').locator('xpath=ancestor::div[contains(@class,"rounded-2xl")][1]');

for (const suma of FACTURI) {
  await input.fill(suma);
  await input.blur();
  await page.waitForTimeout(250);
  const file = `${OUT}/widget-${suma}lei.png`;
  await card.screenshot({ path: file });
  const text = (await card.innerText()).replace(/\n+/g, ' · ');
  console.log(`${file}\n   ${text}\n`);
}

await browser.close();
console.log(`Gata. ${FACTURI.length} capturi în ${OUT}/`);
