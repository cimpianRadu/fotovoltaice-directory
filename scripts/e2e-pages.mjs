// Health check pentru paginile publice principale: se încarcă, au titlu, nu
// aruncă erori JavaScript și au conținutul care le face utile. Prinde stricăciunile
// care nu pică build-ul: /cereri salvată goală de ISR când Sheets a răspuns 429
// (12 oct 2026), o fișă de firmă fără nume, un sitemap gol.
//
// Doar citește: nu trimite formulare și nu scrie nicăieri. Ghidul și fișa de firmă
// testate se iau din sitemap-ul site-ului testat, nu din repo, ca un ghid comis
// dar încă nepublicat să nu pice testul.
//
// Usage: node scripts/e2e-pages.mjs           (testează https://instalatori-fotovoltaice.ro)
//        TARGET_URL=http://localhost:3000 node scripts/e2e-pages.mjs
// Scrie un JSON la final și iese cu 1 dacă pică ceva. Îl rulează și scripts/e2e.mjs.

import { chromium } from 'playwright';

const TARGET = (process.env.TARGET_URL || 'https://instalatori-fotovoltaice.ro').replace(/\/$/, '');

async function sitemapPaths() {
  const res = await fetch(`${TARGET}/sitemap.xml`);
  const xml = await res.text();
  const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  return { status: res.status, xml, paths };
}

// Fiecare verificare primește pagina deja încărcată și întoarce null sau motivul eșecului.
const h1NotEmpty = async (page) => {
  const h1 = (await page.locator('h1').first().textContent({ timeout: 5000 }).catch(() => ''))?.trim();
  return h1 ? null : 'pagina nu are titlu (h1 gol sau lipsă)';
};

function pageChecks(sample) {
  return [
    { id: 'home', name: 'Prima pagină', path: '/', check: h1NotEmpty },
    {
      id: 'cereri',
      name: 'Cererile (/cereri)',
      path: '/cereri',
      check: async (page) => {
        if (await page.getByText('Nicio cerere activă').count()) return 'afișează „Nicio cerere activă”';
        const n = await page.locator('[data-cerere]').count();
        return n > 0 ? null : 'niciun card de cerere';
      },
      details: async (page) => ({ carduri: await page.locator('[data-cerere]').count() }),
    },
    {
      id: 'firme',
      name: 'Lista de firme (/firme)',
      path: '/firme',
      check: async (page) => {
        const n = await page.locator('a[href^="/firme/"]').count();
        return n >= 20 ? null : `doar ${n} linkuri spre firme`;
      },
    },
    { id: 'firma', name: 'O fișă de firmă', path: sample.firma, check: h1NotEmpty },
    { id: 'ghid', name: 'Un ghid', path: sample.ghid, check: h1NotEmpty },
    {
      id: 'cere-oferta',
      name: 'Formularul de cerere (/cere-oferta)',
      path: '/cere-oferta',
      check: async (page) => {
        const n = await page.locator('form button[type="button"]').count();
        return n >= 2 ? null : 'formularul nu are cardurile de la primul pas';
      },
    },
    { id: 'pentru-instalatori', name: 'Pentru instalatori', path: '/pentru-instalatori', check: h1NotEmpty },
  ];
}

(async () => {
  const tests = [];
  const add = (t) => tests.push({ ...t, pass: !t.error });

  // Sitemap și robots fără browser.
  let sample = { firma: null, ghid: null };
  const t0 = Date.now();
  try {
    const sm = await sitemapPaths();
    sample = {
      firma: sm.paths.find((p) => /^\/firme\/[^/]+$/.test(p)) ?? null,
      ghid: sm.paths.find((p) => /^\/ghid\/[^/]+$/.test(p)) ?? null,
    };
    const error =
      sm.status !== 200 ? `HTTP ${sm.status}` : sm.paths.length < 100 ? `doar ${sm.paths.length} adrese` : null;
    add({ id: 'sitemap', name: 'Sitemap', path: '/sitemap.xml', ms: Date.now() - t0, error, details: { adrese: sm.paths.length } });
  } catch (err) {
    add({ id: 'sitemap', name: 'Sitemap', path: '/sitemap.xml', ms: Date.now() - t0, error: String(err?.message || err) });
  }
  const t1 = Date.now();
  try {
    const res = await fetch(`${TARGET}/robots.txt`);
    const body = await res.text();
    const error = res.status !== 200 ? `HTTP ${res.status}` : /sitemap:/i.test(body) ? null : 'nu trimite la sitemap';
    add({ id: 'robots', name: 'robots.txt', path: '/robots.txt', ms: Date.now() - t1, error });
  } catch (err) {
    add({ id: 'robots', name: 'robots.txt', path: '/robots.txt', ms: Date.now() - t1, error: String(err?.message || err) });
  }

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });

  for (const spec of pageChecks(sample)) {
    const start = Date.now();
    if (!spec.path) {
      add({ id: spec.id, name: spec.name, path: null, ms: 0, error: 'nu am găsit o adresă potrivită în sitemap' });
      continue;
    }
    const page = await ctx.newPage();
    const jsErrors = [];
    page.on('pageerror', (err) => jsErrors.push(err.message));
    let error = null;
    let details;
    try {
      const res = await page.goto(TARGET + spec.path, { waitUntil: 'networkidle', timeout: 45000 });
      const status = res?.status() ?? 0;
      if (status !== 200) error = `HTTP ${status}`;
      else {
        await page.waitForTimeout(800); // erorile de hidratare apar după încărcare
        error = await spec.check(page);
        if (!error && jsErrors.length) error = `eroare JavaScript: ${jsErrors[0]}`;
        if (spec.details) details = await spec.details(page);
      }
    } catch (err) {
      error = String(err?.message || err).split('\n')[0];
    }
    add({ id: spec.id, name: spec.name, path: spec.path, ms: Date.now() - start, error, details, jsErrors });
    await page.close();
  }

  // O adresă inexistentă trebuie să dea 404, nu 200 cu o pagină goală (soft 404).
  const start = Date.now();
  try {
    const page = await ctx.newPage();
    const res = await page.goto(`${TARGET}/pagina-care-nu-exista-e2e`, { timeout: 30000 });
    const status = res?.status() ?? 0;
    add({ id: '404', name: 'Pagină inexistentă dă 404', path: '/pagina-care-nu-exista-e2e', ms: Date.now() - start, error: status === 404 ? null : `HTTP ${status}` });
    await page.close();
  } catch (err) {
    add({ id: '404', name: 'Pagină inexistentă dă 404', path: '/pagina-care-nu-exista-e2e', ms: Date.now() - start, error: String(err?.message || err) });
  }

  await browser.close();
  const allPass = tests.every((t) => t.pass);
  console.log(JSON.stringify({ target: TARGET, allPass, pages: tests }, null, 2));
  process.exit(allPass ? 0 : 1);
})();
