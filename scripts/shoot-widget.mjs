// Capturi pentru postări cu widgetul de estimare rapidă.
//
// ATENȚIE la raportul de aspect. Widgetul e o bandă orizontală pe desktop, iar o
// captură element-level de acolo iese 2496x460, adică 5,4:1. Facebook și
// Instagram acceptă între 4:5 și 1,91:1 și refuză încărcarea; o versiune
// anterioară a scriptului chiar a produs fâșiile alea (2026-08-11).
//
// Soluția NU e să punem fâșia pe o pânză cu chenar. Fotografiem pagina reală la
// lățime de telefon, unde widgetul se aranjează pe verticală, și decupăm un
// cadru 4:5 centrat pe el. Tot ce se vede în poză e pagina, nu decor.
//
//   node scripts/shoot-widget.mjs
//   node scripts/shoot-widget.mjs --url https://instalatori-fotovoltaice.ro
//   node scripts/shoot-widget.mjs --facturi 400 --segment firma --pagina /firme

import { chromium, devices } from 'playwright';
import { mkdirSync } from 'node:fs';

const args = process.argv.slice(2);
const flag = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i === -1 ? d : args[i + 1];
};

const BASE = flag('url', 'http://localhost:3000');
const OUT = flag('out', 'social/2026-08-11-widget-estimare');
const PAGINA = flag('pagina', '/');
const SEGMENT = flag('segment', 'casa');
const FACTURI = (flag('facturi', '250,400,900') || '').split(',').map((s) => s.trim());

// 4:5 e formatul de feed al brandului (vezi scripts/compose-posters.py).
const RAPORT = 4 / 5;
// Lățimile încercate, în ordine, până când cardul încape într-un cadru 4:5.
const LATIMI = [390, 440, 500, 570, 650, 740];

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  ...devices['iPhone 13 Pro'],
  deviceScaleFactor: 3,
});
const page = await context.newPage();

const ascundeOverlay = () =>
  page
    .addStyleTag({
      content:
        'nextjs-portal, [data-nextjs-toast], #__next-build-watcher { display: none !important; }',
    })
    .catch(() => {});

await page.goto(BASE + PAGINA, { waitUntil: 'networkidle' });
await ascundeOverlay();

const seg = page.getByRole('button', { name: SEGMENT === 'casa' ? /^Casă$/ : /^Firmă$/ });
if (await seg.count()) await seg.first().click().catch(() => {});

for (const b of await page.locator('button[aria-label*="nchide"], button[aria-label*="lose"]').all()) {
  await b.click().catch(() => {});
}
await page.waitForTimeout(400);

const input = page.locator('#widget-factura');
await input.waitFor({ state: 'visible' });
const card = input.locator('xpath=ancestor::div[contains(@class,"rounded-2xl")][1]');

for (const suma of FACTURI) {
  await input.fill(suma);
  await input.blur();
  await page.waitForTimeout(300);
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);

  // Cadrul e EXACT 4:5, cât e lățimea ferestrei pe înălțimea corespunzătoare.
  // Cardul trebuie să încapă în el, altfel poza iese cu alt raport și Facebook
  // o respinge (a pățit-o versiunea din 11 august, 0,739 în loc de 0,8).
  // Lățimea ferestrei nu se poate depăși, deci o creștem până când cardul, care
  // se reașază la fiecare lățime, intră în cadru.
  let box = await card.boundingBox();
  let vw = page.viewportSize().width;
  for (const candidat of LATIMI) {
    if (box.height <= vw / RAPORT) break;
    await page.setViewportSize({ width: candidat, height: 1200 });
    await page.waitForTimeout(250);
    await card.scrollIntoViewIfNeeded();
    box = await card.boundingBox();
    vw = candidat;
  }
  if (box.height > vw / RAPORT) {
    throw new Error(
      `Cardul (${Math.round(box.height)}px) nu încape în cadrul 4:5 la nicio lățime din ${LATIMI}.`,
    );
  }

  const w = vw;
  const h = w / RAPORT;
  const x = 0;
  const y = Math.max(0, box.y + box.height / 2 - h / 2);

  const file = `${OUT}/widget-${suma}lei-4x5.png`;
  await page.screenshot({ path: file, clip: { x, y, width: w, height: h } });
  console.log(`${file}  (cadru ${Math.round(w)}x${Math.round(h)} CSS, raport ${(w / h).toFixed(3)})`);
  console.log(`   ${(await card.innerText()).replace(/\n+/g, ' · ')}\n`);
}

await browser.close();
console.log(`Gata. ${FACTURI.length} capturi 4:5 în ${OUT}/`);
