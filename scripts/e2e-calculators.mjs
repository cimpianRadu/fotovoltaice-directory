// Health check pentru cele 3 calculatoare publice: widgetul de baterie (home),
// widgetul rapid de sistem (home) și calculatorul complet (/calculator-panouri-fotovoltaice).
// Rulează paginile REALE în Chromium headless și verifică nu doar că se randează,
// ci că CIFRELE sunt corecte:
//  - bateria: dimensionarea pe consum + punctajul și finanțarea AFM, comparate cu
//    formulele din lib/battery-sizing.ts (replicate aici — dacă constanta din prod
//    diverge de cea de aici, testul pică și semnalează);
//  - sistemul: identitățile afișate chiar în pagină (autoconsum+injectat=producție,
//    economie=autoconsum+injectat, producție=kWp×randament, amortizarea recalculată)
//    plus monotonie (consum mai mare → sistem mai mare). Nu replică curba de preț:
//    aia vine din date scanate și se schimbă legitim.
//
// Usage: node scripts/e2e-calculators.mjs           (testează https://instalatori-fotovoltaice.ro)
//        TARGET_URL=http://localhost:3000 node scripts/e2e-calculators.mjs
//
// Nu are nevoie de .env.local — nu scrie și nu citește nimic extern.

import { chromium } from 'playwright';

const TARGET = (process.env.TARGET_URL || 'https://instalatori-fotovoltaice.ro').replace(/\/$/, '');

// ---------- Oglinda formulelor din lib/battery-sizing.ts ----------
// Ținute sincron manual, intenționat: dacă programul AFM se schimbă în cod dar nu
// aici (sau invers), testul pică și forțează alinierea.
const PROGRAM = {
  minKwh: 12,
  costStandardPerKwh: 1250,
  maxShare: 0.75,
  maxGrant: 15000,
  minOwnShare: 0.25,
  maxPoints: { contribution: 40, capacity: 40, pv: 20 },
};
const SIZING_TABLE = [
  { maxKwhPerMonth: 200, capacity: [5, 5] },
  { maxKwhPerMonth: 300, capacity: [5, 7] },
  { maxKwhPerMonth: 500, capacity: [7, 10] },
  { maxKwhPerMonth: 800, capacity: [10, 15] },
  { maxKwhPerMonth: Infinity, capacity: [15, 20] },
];
const bracketFor = (kwh) => SIZING_TABLE.find((b) => kwh <= b.maxKwhPerMonth);
function grantFor(cap, cost) {
  const eligibleBase = Math.min(cost, cap * PROGRAM.costStandardPerKwh);
  const maxGrant = Math.min(PROGRAM.maxGrant, PROGRAM.maxShare * eligibleBase);
  const minOwnShare = cost > 0 ? Math.max(PROGRAM.minOwnShare, (cost - maxGrant) / cost) : PROGRAM.minOwnShare;
  return { eligibleBase, maxGrant, minOwnShare };
}
function scoreFor(cap, pv, ownShare) {
  const contribution = Math.max(0, Math.min(PROGRAM.maxPoints.contribution, 80 * ownShare - 10));
  return {
    total: contribution + Math.min(PROGRAM.maxPoints.capacity, cap) + Math.min(PROGRAM.maxPoints.pv, pv),
  };
}
/** Ce afișează widgetul la pasul 3, pentru capacitate+cost auto (nemodificat de om). */
function batteryExpectation(cap, pvKw) {
  const cost = cap * PROGRAM.costStandardPerKwh;
  const g = grantFor(cap, cost);
  const minPct = Math.ceil(g.minOwnShare * 1000) / 10;
  const pct = Math.max(minPct, 25) / 100; // slider-ul pornește de la 25%
  const ownLei = cost * pct;
  return {
    cost,
    pct: pct * 100,
    ownLei,
    granted: Math.max(0, Math.min(g.maxGrant, cost - ownLei)),
    score: scoreFor(cap, pvKw, pct).total,
  };
}

// ---------- Oglinda amortizării din lib/pv-estimate.ts ----------
function expectedPayback(invest, econAnuala) {
  let cum = -invest;
  let payback = null;
  for (let an = 1; an <= 25; an++) {
    const v = econAnuala * Math.pow(1 - 0.005, an - 1);
    cum += v;
    if (payback === null && cum >= 0) payback = an - 1 + -(cum - v) / Math.max(v, 1);
  }
  return payback;
}

// ---------- Helpere care rulează în pagină ----------
// String de corp de funcție, injectat în fiecare page.evaluate prin
// `new Function` (const-urile dintr-un eval direct nu scapă în scope-ul
// apelantului). Nu are voie să închidă peste variabile din scriptul nodejs.
const PAGE_HELPERS = `
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  // „11.250 RON", „40,0%", „1.283 kWh" → număr. Punct/spațiu = mii, virgulă = zecimale.
  const parseNum = (text) => {
    const m = String(text ?? '').match(/-?\\d[\\d.\\u00a0\\u202f ]*(?:,\\d+)?/);
    if (!m) return NaN;
    return Number(m[0].replace(/[.\\u00a0\\u202f ]/g, '').replace(',', '.'));
  };
  const setNumberInput = (el, val) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, String(val));
    el.dispatchEvent(new Event('input', { bubbles: true }));
  };
  const byExactText = (selector, text) =>
    [...document.querySelectorAll(selector)].find((el) => el.textContent.trim() === text);
  const clickButton = (text) => {
    const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim().startsWith(text));
    if (!b) return false;
    b.click();
    return true;
  };
`;

async function newPage(ctx, path) {
  const page = await ctx.newPage();
  await page.goto(TARGET + path, { waitUntil: 'networkidle', timeout: 45000 });
  return page;
}

// ---------- Check 1: widgetul de baterie de pe home ----------
async function checkBattery(ctx) {
  const r = { id: 'baterie', label: 'Calculator baterie (home)', pass: false, checks: {}, error: null };
  try {
    const page = await newPage(ctx, '/');
    await page.waitForSelector('#bw-consum', { state: 'attached', timeout: 20000 });
    await page.waitForTimeout(1200); // hidratare React

    const expectedSizing = bracketFor(700).capacity;
    const scenarios = [batteryExpectation(12, 5), batteryExpectation(20, 5)];

    const got = await page.evaluate(
      async ({ helpers }) => {
        const { sleep, parseNum, setNumberInput, byExactText, clickButton } = new Function(helpers + '; return { sleep, parseNum, setNumberInput, byExactText, clickButton };')();
        const out = {};

        // Pasul 1: consum 700 kWh → intervalul recomandat de capacitate.
        setNumberInput(document.querySelector('#bw-consum'), 700);
        await sleep(200);
        out.sizingText = byExactText('div', 'De cât ai nevoie, tehnic')?.nextElementSibling?.textContent.trim() ?? null;

        // Pasul 2: capacitatea implicită (12) și costul auto-completat.
        if (!clickButton('Vezi ce punctaj faci')) return { error: 'butonul spre pasul 2 lipsește' };
        await sleep(300);
        out.defaultCap = parseNum(document.querySelector('#bw-cap')?.value);
        out.defaultCost = parseNum(document.querySelector('#bw-cost')?.value);

        // Pasul 3, de două ori: cu 12 kWh (finanțare sub plafon) și cu 20 kWh
        // (plafonul de 15.000 lei + contribuția minimă urcată la 40%).
        const readStep3 = () => ({
          granted: parseNum(byExactText('div', 'Primești de la AFM')?.nextElementSibling?.textContent),
          own: parseNum(byExactText('div', 'Plătești tu')?.nextElementSibling?.textContent),
          score: parseNum(byExactText('div', 'din 100')?.previousElementSibling?.textContent),
        });
        if (!clickButton('Calculează punctajul')) return { ...out, error: 'butonul spre pasul 3 lipsește' };
        await sleep(300);
        out.s12 = readStep3();

        if (!clickButton('Înapoi')) return { ...out, error: 'butonul Înapoi lipsește' };
        await sleep(300);
        setNumberInput(document.querySelector('#bw-cap'), 20);
        await sleep(200);
        if (!clickButton('Calculează punctajul')) return { ...out, error: 'revenirea la pasul 3 nu merge' };
        await sleep(300);
        out.s20 = readStep3();

        out.ctaHref = [...document.querySelectorAll('a')]
          .find((a) => a.textContent.includes('Cere o ofertă pentru baterii'))?.getAttribute('href') ?? null;
        return out;
      },
      { helpers: PAGE_HELPERS },
    );

    if (got.error) throw new Error(got.error);
    const [a, b] = expectedSizing;
    r.checks.sizing700 = {
      expected: `${a} - ${b} kWh`,
      got: got.sizingText,
      ok: !!got.sizingText && got.sizingText.includes(a === b ? `${a} kWh` : `${a} - ${b} kWh`),
    };
    r.checks.defaultCost = { expected: scenarios[0].cost, got: got.defaultCost, ok: got.defaultCost === scenarios[0].cost && got.defaultCap === 12 };
    for (const [key, exp, gotS] of [['cap12', scenarios[0], got.s12], ['cap20', scenarios[1], got.s20]]) {
      r.checks[key] = {
        expected: { granted: exp.granted, own: exp.ownLei, score: exp.score },
        got: gotS,
        ok:
          gotS.granted === exp.granted &&
          gotS.own === exp.ownLei &&
          Math.abs(gotS.score - exp.score) < 0.05,
      };
    }
    r.checks.cta = { got: got.ctaHref, ok: !!got.ctaHref && got.ctaHref.startsWith('/cere-oferta') };
    r.pass = Object.values(r.checks).every((c) => c.ok);
    await page.close();
  } catch (err) {
    r.error = err instanceof Error ? err.message : String(err);
  }
  return r;
}

// ---------- Check 2: widgetul rapid de sistem de pe home ----------
async function checkQuickEstimate(ctx) {
  const r = { id: 'sistem-home', label: 'Calculator sistem rapid (home)', pass: false, checks: {}, error: null };
  try {
    const page = await newPage(ctx, '/');
    await page.waitForSelector('#widget-factura', { state: 'attached', timeout: 20000 });
    await page.waitForTimeout(1200);

    const got = await page.evaluate(
      async ({ helpers }) => {
        const { sleep, parseNum, setNumberInput, byExactText, clickButton } = new Function(helpers + '; return { sleep, parseNum, setNumberInput, byExactText, clickButton };')();
        // Tabul „Sistem fotovoltaic" (bateria e implicită) — testează și tabul.
        const tab = [...document.querySelectorAll('[role="tab"]')].find((t) => t.textContent.includes('Sistem fotovoltaic'));
        if (!tab) return { error: 'tabul „Sistem fotovoltaic" lipsește' };
        tab.click();
        await sleep(300);

        const read = () => {
          const metric = (label) => {
            const dt = [...document.querySelectorAll('dt')].find((d) => d.textContent.trim() === label);
            return parseNum(dt?.nextElementSibling?.textContent);
          };
          const dtPayback = [...document.querySelectorAll('dt')].find((d) => d.textContent.trim() === 'Devine rentabil în');
          return {
            kw: metric('Sistem'),
            invest: metric('Investiție'),
            paybackText: dtPayback?.nextElementSibling?.textContent.trim() ?? null,
          };
        };
        setNumberInput(document.querySelector('#widget-factura'), 400);
        await sleep(300);
        const at400 = read();
        setNumberInput(document.querySelector('#widget-factura'), 800);
        await sleep(300);
        const at800 = read();
        return { at400, at800 };
      },
      { helpers: PAGE_HELPERS },
    );

    if (got.error) throw new Error(got.error);
    const sane = (m) =>
      Number.isFinite(m.kw) && m.kw > 0 && m.kw < 100 &&
      Number.isFinite(m.invest) && m.invest > 1000 &&
      !!m.paybackText && (/ani/.test(m.paybackText));
    r.checks.factura400 = { got: got.at400, ok: sane(got.at400) };
    r.checks.factura800 = { got: got.at800, ok: sane(got.at800) };
    r.checks.monotonie = {
      got: { kw: [got.at400.kw, got.at800.kw], invest: [got.at400.invest, got.at800.invest] },
      ok: got.at800.kw >= got.at400.kw && got.at800.invest > got.at400.invest,
    };
    r.pass = Object.values(r.checks).every((c) => c.ok);
    await page.close();
  } catch (err) {
    r.error = err instanceof Error ? err.message : String(err);
  }
  return r;
}

// ---------- Check 3: calculatorul complet ----------
async function readCalculatorResult(ctx, consumKwh) {
  const page = await newPage(ctx, `/calculator-panouri-fotovoltaice?consum=${consumKwh}&unitate=kwh`);
  // `?consum=` în URL setează showResult, deci rezultatul apare după hidratare.
  await page.waitForSelector('#calculator-rezultat', { state: 'attached', timeout: 20000 });
  await page.waitForTimeout(500);
  const got = await page.evaluate(
    async ({ helpers }) => {
      const { sleep, parseNum, setNumberInput, byExactText, clickButton } = new Function(helpers + '; return { sleep, parseNum, setNumberInput, byExactText, clickButton };')();
      const root = document.querySelector('#calculator-rezultat');
      const h2 = [...root.querySelectorAll('h2')].find((h) => h.textContent.includes('Sistem recomandat'));
      const specLine = [...root.querySelectorAll('p')].find((p) => p.textContent.includes('Producție specifică folosită'));
      // „Producție specifică folosită: 1.283 kWh/kWp/an · Suprafață necesară: ~50 m²"
      const specNums = (specLine?.textContent.match(/-?\d[\d.   ]*(?:,\d+)?/g) ?? []).map(parseNum);

      const card = (label) => {
        const p = [...root.querySelectorAll('p')].find((x) => x.textContent.trim() === label);
        return { value: parseNum(p?.nextElementSibling?.textContent), sub: p?.nextElementSibling?.nextElementSibling?.textContent ?? '' };
      };
      const eco = card('Economie anuală');
      const ecoParts = (eco.sub.match(/-?\d[\d.   ]*(?:,\d+)?/g) ?? []).map(parseNum);
      const amort = card('Amortizare');

      const dlRow = (label) => {
        const dt = [...root.querySelectorAll('dt')].find((d) => d.textContent.trim().startsWith(label));
        return parseNum(dt?.nextElementSibling?.textContent);
      };

      const chart = root.querySelector('[class*="h-32"]');
      const bars = chart ? [...chart.children] : [];
      const monthly = bars.map((b) => parseNum(b.querySelector('span')?.textContent));

      const cta = [...root.querySelectorAll('a')].find((a) => a.textContent.includes('Cere oferte personalizate'));

      return {
        kwp: parseNum(h2?.textContent),
        yield: specNums[0] ?? NaN,
        suprafata: specNums[1] ?? NaN,
        investitie: card('Investiție estimată').value,
        economieAnuala: eco.value,
        economieAutoconsum: ecoParts[0] ?? NaN,
        venitInjectat: ecoParts[1] ?? NaN,
        amortizareText: amort.value, // NaN dacă e „Imediat"/„—"
        productieAnuala: dlRow('Total producție'),
        autoconsumKwh: dlRow('Autoconsum'),
        injectatKwh: dlRow('Injectat în rețea'),
        monthlyCount: bars.length,
        monthlySum: monthly.reduce((s, v) => s + (Number.isFinite(v) ? v : 0), 0),
        monthlyAllFinite: monthly.length > 0 && monthly.every((v) => Number.isFinite(v) && v > 0),
        ctaHref: cta?.getAttribute('href') ?? null,
      };
    },
    { helpers: PAGE_HELPERS },
  );
  await page.close();
  return got;
}

async function checkFullCalculator(ctx) {
  const r = { id: 'calculator', label: 'Calculator complet (/calculator-panouri-fotovoltaice)', pass: false, checks: {}, error: null };
  try {
    const g = await readCalculatorResult(ctx, 5000);

    r.checks.rezultatRandat = {
      got: { kwp: g.kwp, investitie: g.investitie, economieAnuala: g.economieAnuala },
      ok: g.kwp > 0 && g.kwp < 500 && g.investitie > 0 && g.economieAnuala > 0,
    };
    r.checks.productieEgalKwpOriRandament = {
      got: { productie: g.productieAnuala, kwp: g.kwp, randament: g.yield },
      ok: g.productieAnuala === Math.round(g.kwp * g.yield),
    };
    r.checks.suprafata = { got: g.suprafata, ok: g.suprafata === Math.round(g.kwp * 5) };
    r.checks.energieSeImparte = {
      got: { autoconsum: g.autoconsumKwh, injectat: g.injectatKwh, total: g.productieAnuala },
      ok: g.autoconsumKwh + g.injectatKwh === g.productieAnuala,
    };
    r.checks.economiaSeAduna = {
      got: { autoconsum: g.economieAutoconsum, injectat: g.venitInjectat, total: g.economieAnuala },
      ok: g.economieAutoconsum + g.venitInjectat === g.economieAnuala,
    };
    const paybackExp = expectedPayback(g.investitie, g.economieAnuala);
    r.checks.amortizare = {
      expected: paybackExp === null ? null : Math.round(paybackExp * 10) / 10,
      got: g.amortizareText,
      // afișat cu 1 zecimală; „—"/„Imediat" parsează NaN și trebuie să coincidă cu null/≤0
      ok: paybackExp === null ? !Number.isFinite(g.amortizareText) : Math.abs(g.amortizareText - paybackExp) <= 0.06,
    };
    r.checks.grafic12Luni = {
      got: { bars: g.monthlyCount, suma: g.monthlySum, anual: g.productieAnuala },
      ok: g.monthlyCount === 12 && g.monthlyAllFinite && Math.abs(g.monthlySum - g.productieAnuala) <= 12,
    };
    r.checks.cta = { got: g.ctaHref, ok: !!g.ctaHref && g.ctaHref.startsWith('/cere-oferta') };

    const big = await readCalculatorResult(ctx, 15000);
    r.checks.monotonie = {
      got: { kwp: [g.kwp, big.kwp], investitie: [g.investitie, big.investitie] },
      ok: big.kwp > g.kwp && big.investitie > g.investitie,
    };

    r.pass = Object.values(r.checks).every((c) => c.ok);
  } catch (err) {
    r.error = err instanceof Error ? err.message : String(err);
  }
  return r;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });

  const results = [];
  results.push(await checkBattery(ctx));
  results.push(await checkQuickEstimate(ctx));
  results.push(await checkFullCalculator(ctx));

  await browser.close();

  const summary = results.map((r) => ({
    id: r.id,
    calculator: r.label,
    pass: r.pass,
    error: r.error,
    failedChecks: Object.fromEntries(Object.entries(r.checks).filter(([, c]) => !c.ok)),
    checks: r.checks,
  }));
  const allPass = summary.every((s) => s.pass);
  console.log(JSON.stringify({ target: TARGET, allPass, calculators: summary }, null, 2));
  process.exit(allPass ? 0 : 1);
})();
