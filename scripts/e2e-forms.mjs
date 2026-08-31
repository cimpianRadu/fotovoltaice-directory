// End-to-end health check for the 3 public site forms (lead / listing / ad-inquiry).
// Drives the REAL rendered forms in headless Chromium (incl. the custom SearchableSelect
// dropdowns — exactly the component class that broke silently before), asserts each
// submission returns 2xx, verifies the row landed in its Google Sheet tab, then deletes
// the test rows. Prints a JSON summary and exits 1 if any form fails.
//
// Usage: node scripts/e2e-forms.mjs           (tests https://instalatori-fotovoltaice.ro)
//        TARGET_URL=http://localhost:3000 node scripts/e2e-forms.mjs
//
// Needs .env.local with GOOGLE_* keys for sheet verification/cleanup.

import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { google } from 'googleapis';

const TARGET = (process.env.TARGET_URL || 'https://instalatori-fotovoltaice.ro').replace(/\/$/, '');
const TOKEN = `rt${Date.now()}`;
const TEST_EMAIL_PREFIX = 'routine-test-'; // every test row's email starts with this

const env = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
const getEnv = (k) => env.match(new RegExp(`^${k}=(.*)$`, 'm'))?.[1]?.trim().replace(/^["']|["']$/g, '');

const FORMS = [
  {
    id: 'lead', label: 'Cere ofertă (/cere-oferta)', path: '/cere-oferta',
    api: '/api/leads', sheet: 'Leads', emailCol: 3,
    // Wizard în 5 pași din 24 aug 2026 (vezi LeadForm STEPS): proiect → zonă →
    // contact → detalii, cu trimiterea la „detalii"; pasul 5 (consum + mesaj) e
    // ecran post-trimitere și nu intră în testul de submit. `formKey` n-ar avea
    // ce aștepta la pasul 0 (tipul de proiect e card, nu input), deci ready-ul
    // se face pe cardurile din formular.
    wizard: true, ready: 'form button[type="button"]', formKey: null,
    // numeCompanie only exists in the "Firmă"/commercial segment (required there); harmless if absent in residential
    text: { numeCompanie: `ROUTINE TEST ${TOKEN}`, numeContact: 'ROUTINE TEST', email: `${TEST_EMAIL_PREFIX}${TOKEN}-lead@example.com`, telefon: '0712345678', localitate: 'ROUTINE TEST' },
    // dropdown-urile pasului 4 sunt obligatorii (au „nu știu" în listă); le
    // completăm și ca să testăm componenta SearchableSelect
    // `tipLucrare` (din 25 aug 2026) e prima întrebare a pasului 4 și e
    // obligatorie; se alege prima opțiune, „sistem nou", deci nu apare câmpul de
    // capacitate baterie al retrofitului.
    selects: [{ name: 'judet', step: 1 }, { name: 'tipLucrare', step: 3 }, { name: 'tipAcoperis', step: 3 }, { name: 'termen', step: 3 }, { name: 'finantare', step: 3 }, { name: 'bransament', step: 3 }],
  },
  {
    id: 'listing', label: 'Listare firmă (/listeaza-firma)', path: '/listeaza-firma',
    api: '/api/listings', formKey: 'numeFirma', sheet: 'Listări', emailCol: 5,
    text: { numeFirma: `ROUTINE TEST ${TOKEN}`, cui: 'RO12345678', numeContact: 'ROUTINE TEST', email: `${TEST_EMAIL_PREFIX}${TOKEN}-listing@example.com`, telefon: '0712345678', website: 'https://example.com' },
    selects: [{ name: 'judet' }, { name: 'specializare' }, { name: 'segment' }],
  },
  {
    id: 'ad', label: 'Publicitate (/publicitate)', path: '/publicitate',
    api: '/api/ad-inquiry', formKey: 'tierLabel', sheet: 'Publicitate', emailCol: 5,
    text: { numeFirma: `ROUTINE TEST ${TOKEN}`, numeContact: 'ROUTINE TEST', telefon: '0712345678', email: `${TEST_EMAIL_PREFIX}${TOKEN}-ad@example.com`, mesaj: `E2E routine ${TOKEN}` },
    selects: [{ name: 'judet' }], // tier defaults to 'plus' (React state) → judet field shown
  },
];

// Runs in the page: fill text inputs, open+pick each SearchableSelect, tick all checkboxes.
async function fillForm(spec) {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const setText = (name, val) => {
    const el = document.querySelector(`[name="${name}"]`);
    if (!el) return false;
    const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, val);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  };
  const pick = async (name) => {
    const hidden = document.querySelector(`input[name="${name}"]`);
    if (!hidden) return { ok: false, reason: 'select absent' };
    const c = hidden.closest('div.relative');
    const trigger = c.querySelector('button');
    let lastSample = [];
    for (let attempt = 0; attempt < 3 && !hidden.value; attempt++) {
      trigger.click(); // open
      let opts = [];
      for (let i = 0; i < 25; i++) { // poll up to ~2s for options to render
        await sleep(80);
        opts = [...c.querySelectorAll('li button')];
        if (opts.length > 1) break;
      }
      lastSample = opts.map((b) => b.textContent.trim());
      const opt = opts.find((b) => { const t = b.textContent.trim(); return t && t !== 'Selectează...'; });
      if (opt) { opt.click(); await sleep(180); }
      else { trigger.click(); await sleep(150); } // close, then retry
    }
    return { ok: !!hidden.value, value: hidden.value, sample: hidden.value ? undefined : lastSample.slice(0, 4) };
  };
  // SearchableSelect se închide pe mousedown pe document — altfel lista rămasă
  // deschisă acoperă butonul de pe pasul următor.
  const closeDropdowns = async () => {
    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await sleep(100);
  };
  const tickCheckboxes = (root) =>
    root.querySelectorAll('input[type="checkbox"]').forEach((c) => { if (!c.checked) c.click(); });

  const missingText = [];
  const selResults = {};

  if (spec.wizard) {
    const steps = [];
    const form = document.querySelector('form');
    const fillTexts = (keys) => {
      for (const k of keys) if (k in spec.text && !setText(k, spec.text[k])) missingText.push(k);
    };
    const pickStep = async (n) => {
      for (const s of spec.selects.filter((x) => x.step === n)) selResults[s.name] = await pick(s.name);
    };
    // „Continuă" avansează doar dacă pasul curent e valid; confirmăm cu un
    // selector de pe pasul următor, ca să nu raportăm un pas trecut degeaba.
    const next = async (expect) => {
      await closeDropdowns();
      const btn = [...form.querySelectorAll('button')].find((b) => b.textContent.trim().startsWith('Continuă'));
      if (!btn) return false;
      btn.click();
      for (let i = 0; i < 25; i++) {
        await sleep(100);
        if (document.querySelector(expect)) return true;
      }
      return false;
    };

    // Pasul 1 — tipul de proiect e card, iar cardul avansează singur.
    const card = [...form.querySelectorAll('button[type="button"]')][0];
    if (!card) return { error: 'pasul 1: niciun card de tip proiect', missingText, selResults };
    card.click();
    for (let i = 0; i < 25 && !document.querySelector('input[name="localitate"]'); i++) await sleep(100);
    if (!document.querySelector('input[name="localitate"]')) return { error: 'pasul 1 nu avansează', steps };
    steps.push('proiect');

    // Pasul 2 — zonă.
    await pickStep(1);
    fillTexts(['localitate']);
    if (!(await next('input[name="telefon"]'))) return { error: 'pasul 2 (zonă) nu avansează', steps, missingText, selResults };
    steps.push('zona');

    // Pasul 3 — contact.
    fillTexts(['numeCompanie', 'numeContact', 'telefon', 'email']);
    if (!(await next('#gdpr'))) return { error: 'pasul 3 (contact) nu avansează', steps, missingText, selResults };
    steps.push('contact');

    // Pasul 4 — detaliile obligatorii + GDPR; consum și mesaj sunt pe pasul 5,
    // post-trimitere, deci nu se completează aici.
    await pickStep(3);
    await closeDropdowns();
    tickCheckboxes(form);
    steps.push('detalii');
    return { steps, missingText, selResults };
  }

  for (const [k, v] of Object.entries(spec.text)) if (!setText(k, v)) missingText.push(k);
  for (const s of spec.selects) selResults[s.name] = await pick(s.name);
  await closeDropdowns();
  tickCheckboxes(document.querySelector(`[name="${spec.formKey}"]`).closest('form'));
  return { missingText, selResults };
}

async function runBrowser() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const results = {};
  for (const f of FORMS) {
    const r = { form: f.label, submitOk: false, apiStatus: null, fill: null, error: null };
    try {
      const page = await ctx.newPage();
      await page.goto(TARGET + f.path, { waitUntil: 'networkidle', timeout: 45000 });
      await page.waitForSelector(f.ready || `[name="${f.formKey}"]`, { state: 'attached', timeout: 20000 });
      await page.waitForTimeout(1200); // let React hydrate before interacting (clicks are no-ops pre-hydration)
      r.fill = await page.evaluate(fillForm, f);
      if (r.fill?.error) { r.error = r.fill.error; await page.close(); results[f.id] = r; continue; }
      const respP = page.waitForResponse(
        (resp) => resp.url().includes(f.api) && resp.request().method() === 'POST',
        { timeout: 20000 },
      );
      await page.evaluate((key) => {
        const form = key ? document.querySelector(`[name="${key}"]`).closest('form') : document.querySelector('form');
        form.querySelector('button[type="submit"]').click();
      }, f.formKey);
      const resp = await respP;
      r.apiStatus = resp.status();
      r.submitOk = resp.status() >= 200 && resp.status() < 300;
      if (!r.submitOk) { try { r.apiBody = await resp.text(); } catch { /* ignore */ } }
      await page.close();
    } catch (err) {
      r.error = err instanceof Error ? err.message : String(err);
    }
    results[f.id] = r;
  }
  await browser.close();
  return results;
}

function sheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: getEnv('GOOGLE_SERVICE_ACCOUNT_EMAIL'),
      private_key: getEnv('GOOGLE_PRIVATE_KEY')?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return { sheets: google.sheets({ version: 'v4', auth }), id: getEnv('GOOGLE_SHEETS_SPREADSHEET_ID') };
}

async function verifyAndClean(browserResults) {
  const { sheets, id } = sheetsClient();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: id });
  const sheetIdByTitle = Object.fromEntries(meta.data.sheets.map((s) => [s.properties.title, s.properties.sheetId]));

  for (const f of FORMS) {
    const res = browserResults[f.id];
    const myEmail = f.text.email;
    const sheetId = sheetIdByTitle[f.sheet];
    if (sheetId === undefined) { res.sheetFound = false; res.cleanError = `tab "${f.sheet}" lipsește`; continue; }
    const got = await sheets.spreadsheets.values.get({ spreadsheetId: id, range: `${f.sheet}!A:Z` });
    const rows = got.data.values ?? [];
    res.sheetFound = rows.some((row) => (row[f.emailCol] || '') === myEmail);
    // delete this run's row + any stale routine-test leftovers from prior failed runs
    const del = [];
    rows.forEach((row, i) => { if ((row[f.emailCol] || '').startsWith(TEST_EMAIL_PREFIX)) del.push(i); });
    if (del.length) {
      del.sort((a, b) => b - a);
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: id,
        requestBody: { requests: del.map((idx) => ({ deleteDimension: { range: { sheetId, dimension: 'ROWS', startIndex: idx, endIndex: idx + 1 } } })) },
      });
      res.cleanedRows = del.length;
    } else {
      res.cleanedRows = 0;
    }
  }
}

(async () => {
  const browserResults = await runBrowser();
  let cleanupError = null;
  try {
    await verifyAndClean(browserResults);
  } catch (err) {
    cleanupError = err instanceof Error ? err.message : String(err);
  }

  const summary = FORMS.map((f) => {
    const r = browserResults[f.id];
    const pass = r.submitOk === true && r.sheetFound === true;
    return { id: f.id, form: f.label, pass, apiStatus: r.apiStatus, sheetFound: r.sheetFound ?? null, error: r.error, apiBody: r.apiBody, fill: r.fill, cleanedRows: r.cleanedRows };
  });
  const allPass = summary.every((s) => s.pass) && !cleanupError;

  const out = { target: TARGET, token: TOKEN, allPass, cleanupError, forms: summary };
  console.log(JSON.stringify(out, null, 2));
  process.exit(allPass ? 0 : 1);
})();
