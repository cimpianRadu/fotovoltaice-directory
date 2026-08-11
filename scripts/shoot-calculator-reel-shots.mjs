// Capturile din reelul #26 (calculatorul, caz Timiș 450 lei/lună).
//
// Se refac de pe PRODUCȚIE, nu de pe localhost: reelul arată site-ul așa cum îl
// vede omul care dă click. Cele din 7 august arătau 11.180 lei, cifra dinainte
// ca mediana de preț să fie adusă la TVA 21% (commit 2e3f079); acum e 11.527.
//
//   node scripts/shoot-calculator-reel-shots.mjs
//   node scripts/shoot-calculator-reel-shots.mjs --url http://localhost:3000

import { chromium } from 'playwright';

const args = process.argv.slice(2);
const flag = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i === -1 ? d : args[i + 1];
};

const BASE = flag('url', 'https://instalatori-fotovoltaice.ro');
const OUT = flag('out', 'social/remotion/public');
const JUDET = flag('judet', 'Timiș');
const CONSUM = flag('consum', '450');

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1040, height: 1200 }, deviceScaleFactor: 2 });

const url = `${BASE}/calculator-panouri-fotovoltaice?segment=rezidential&consum=${encodeURIComponent(
  CONSUM,
)}&unitate=lei&judet=${encodeURIComponent(JUDET)}`;
await page.goto(url, { waitUntil: 'networkidle' });
await page
  .addStyleTag({
    content: 'nextjs-portal, [data-nextjs-toast], #__next-build-watcher { display: none !important; }',
  })
  .catch(() => {});

for (const b of await page.locator('button[aria-label*="nchide"], button[aria-label*="lose"]').all()) {
  await b.click().catch(() => {});
}
await page.waitForTimeout(700);

// Formularul completat: ancorăm pe inputul de consum și urcăm la cardul lui.
const formular = page.locator('form.bg-white.rounded-2xl').first();
await formular.scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
await formular.screenshot({ path: `${OUT}/shot-calc-form.png` });

// Panoul de rezultat, același selector ca în shoot-calculator-case.mjs.
const rezultat = page.locator('div.space-y-6.scroll-mt-24').first();
await rezultat.waitFor({ state: 'visible', timeout: 15000 });
await rezultat.scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
await rezultat.screenshot({ path: `${OUT}/shot-calc-res1.png` });

const text = await page.locator('main').innerText();
const cheie = text
  .split('\n')
  .filter((l) => /Sistem recomandat|RON$|ani$/.test(l.trim()))
  .slice(0, 6);
console.log(`${OUT}/shot-calc-form.png\n${OUT}/shot-calc-res1.png`);
console.log('Cifre pe ecran:');
console.log(cheie.map((l) => '   ' + l.trim()).join('\n'));

await browser.close();
