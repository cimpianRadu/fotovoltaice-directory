#!/usr/bin/env node
/**
 * Scraper prețuri kituri fotovoltaice (rulare MANUALĂ, lunară)
 *
 * Alimentează articolele din clusterul de preț („kit panouri fotovoltaice X kW pret",
 * ~2.900/lună pe varianta de 5 kW) cu prețuri de listă REALE, citabile.
 * Vezi docs/articles-pipeline.md → „🧭 Plan Recuperare SEO 2026-07-30", Pas 2.
 *
 * NU se rulează în build. Datele intră în data/kit-prices.json și se comit,
 * ca articolele să nu depindă de un apel de rețea la prerender.
 *
 * ⚠️ REGULA NEVER-INVENT:
 *   Fiecare preț păstrează magazinul, URL-ul și data la care a fost citit.
 *   Când citezi în articol, citează sursa + data. Nu media prețuri între
 *   magazine ca să scoți „prețul pieței" — sunt prețuri de listă, nu o piață.
 *   Manopera separată NU se scrapează (nimeni nu o publică) — vine din apeluri
 *   la firme, vezi Pas 5 din plan.
 *
 * Env (oricare, în ordinea asta):
 *   FIRECRAWL_API_KEY din environment
 *   FIRECRAWL_API_KEY din .env.local
 *   FIRECRAWL_API_KEY din .mcp.json (fallback — acolo stă deja pentru MCP)
 *
 * Usage:
 *   node scripts/scrape-kit-prices.mjs                 # scrapează tot
 *   node scripts/scrape-kit-prices.mjs --dry-run       # arată ce ar face
 *   node scripts/scrape-kit-prices.mjs --store genway  # doar un magazin
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const OUT_PATH = join('data', 'kit-prices.json');
const API_BASE = 'https://api.firecrawl.dev/v2/scrape';

/**
 * Surse. URL-urile sunt categorii de kituri descoperite cu firecrawl_map,
 * nu ghicite. `montajInclus` documentează ce vinde magazinul by default —
 * Genway listează kituri „montaj inclus", esolar mai ales kituri de echipament.
 */
const SOURCES = [
  {
    store: 'Genway',
    url: 'https://www.genway.ro/sisteme-fotovoltaice/kit-uri-fotovoltaice',
    montajInclus: 'da',
    note: 'Kituri la cheie cu montaj inclus, TVA 21% afișat pe pagină.',
  },
  {
    store: 'Genway',
    url: 'https://www.genway.ro/sisteme-fotovoltaice',
    montajInclus: 'variabil',
    note: 'Categorie mixtă: acumulatori, invertoare, module. Util pentru clusterul de baterii.',
  },
  {
    store: 'eSolar',
    url: 'https://www.esolar.ro/panouri-fotovoltaice/kit-panouri-fotovoltaice.html',
    montajInclus: 'nu',
    note: 'Kituri de echipament, multe off-grid/mobile. Util pentru clusterul off-grid.',
  },
  {
    store: 'Solar1000',
    url: 'https://solar1000.com/produs/montaj-panouri-fotovoltaice-3-kw-sistem-fotovoltaic-3-kw-monofazat/',
    montajInclus: 'variabil',
    note: 'SURSA CEA MAI VALOROASĂ: publică pentru același kit atât prețul FĂRĂ montaj cât și CU montaj inclus, deci manopera e derivabilă prin scădere, dintr-o sursă publică. Acoperă și punctul de 3 kW, care lipsea.',
  },
  {
    store: 'VoltGrid',
    url: 'https://voltgrid.ro/produs/kit-panouri-fotovoltaice-3-kw-trifazat-ongrid/',
    montajInclus: 'necunoscut',
    note: 'Acoperă punctul de 3 kW on-grid.',
  },
  {
    store: 'VoltExpert',
    url: 'https://voltexpert.ro/sisteme-fotovoltaice-cu-montaj/',
    montajInclus: 'da',
    note: 'Categorie „sisteme fotovoltaice cu montaj", filtrabilă pe putere. Acoperă 3 kW.',
  },
];

const EXTRACT_PROMPT = [
  'Extrage TOATE produsele listate pe pagină care au un preț afișat.',
  'Pentru fiecare produs returnează exact ce scrie pe pagină, fără să estimezi:',
  '- nume: numele complet al produsului',
  '- putereKw: puterea în kW sau kWp ca număr (ex. 5, 12.74). Dacă produsul e o baterie, pune capacitatea în kWh. Dacă nu apare nicio putere, pune null.',
  '- pretRon: prețul în RON ca număr, fără separatori de mii (ex. 46200 pentru "46.200,00 lei"). Dacă prețul nu e afișat, pune null.',
  '- includeMontaj: "da" dacă titlul sau descrierea spune explicit montaj inclus / la cheie, "nu" dacă spune explicit fără montaj, altfel "necunoscut".',
  '- includeBaterie: true dacă produsul include acumulator/baterie, altfel false.',
  '- urlProdus: linkul către pagina produsului, dacă e disponibil.',
  '- pretFaraMontajRon: DOAR dacă pagina publică explicit, pentru ACELAȘI produs, și un preț fără montaj pe lângă cel cu montaj (ex. "fara montaj: 5950lei+tva" și "cu montaj inclus: 8799lei+tva"). În acest caz pune prețul fără montaj aici și pe cel cu montaj în pretRon. Altfel null.',
  '- tvaInclus: true dacă prețul afișat include TVA, false dacă e marcat "+tva", null dacă nu scrie.',
  'Nu inventa produse care nu apar pe pagină. Nu completa prețuri lipsă.',
  'Nu deduce prețul fără montaj scăzând ceva — doar dacă e scris pe pagină.',
].join('\n');

const EXTRACT_SCHEMA = {
  type: 'object',
  properties: {
    produse: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          nume: { type: 'string' },
          putereKw: { type: ['number', 'null'] },
          pretRon: { type: ['number', 'null'] },
          includeMontaj: { type: 'string' },
          includeBaterie: { type: 'boolean' },
          urlProdus: { type: ['string', 'null'] },
          pretFaraMontajRon: { type: ['number', 'null'] },
          tvaInclus: { type: ['boolean', 'null'] },
        },
        required: ['nume'],
      },
    },
  },
  required: ['produse'],
};

function loadApiKey() {
  if (process.env.FIRECRAWL_API_KEY) return process.env.FIRECRAWL_API_KEY;

  const envPath = '.env.local';
  if (existsSync(envPath)) {
    const line = readFileSync(envPath, 'utf8')
      .split('\n')
      .find((l) => l.startsWith('FIRECRAWL_API_KEY='));
    if (line) return line.slice('FIRECRAWL_API_KEY='.length).replace(/^['"]|['"]$/g, '');
  }

  // Fallback: cheia stă deja în .mcp.json pentru serverul MCP firecrawl.
  if (existsSync('.mcp.json')) {
    const m = readFileSync('.mcp.json', 'utf8').match(/"FIRECRAWL_API_KEY"\s*:\s*"([^"]+)"/);
    if (m) return m[1];
  }

  return null;
}

async function scrapeSource(source, apiKey) {
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: source.url,
      onlyMainContent: true,
      formats: [
        {
          type: 'json',
          prompt: EXTRACT_PROMPT,
          schema: EXTRACT_SCHEMA,
        },
      ],
    }),
  });

  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.success) {
    throw new Error(`HTTP ${res.status}: ${body?.error || JSON.stringify(body)?.slice(0, 200)}`);
  }

  const produse = body.data?.json?.produse;
  if (!Array.isArray(produse)) {
    throw new Error('răspuns fără array `produse`');
  }
  return produse;
}

/**
 * Clasifică produsul. Fără asta, tabelele ies fals:
 *   - un off-grid de 1 kW cu banc de baterii costă legitim ~35.000 RON/kW,
 *     un on-grid cu montaj costă ~3.000-6.000 RON/kW. În aceeași coloană,
 *     primul pare o eroare sau, mai rău, pare prețul pieței.
 *   - bateriile sunt cotate în kWh, nu în kW. Raportul RON/kW pe o baterie
 *     nu înseamnă nimic.
 * Deci: niciodată nu compara între tipuri, și niciodată nu amesteca unitățile.
 */
function classify(nume) {
  const n = nume.toLowerCase();

  if (/^acumulator|modul acumulator|battery-box|baterie fotovoltaic|acumulator solar/.test(n)) {
    return { tip: 'baterie', unitate: 'kWh' };
  }
  if (/modul bcu|modul bms|regulator|conector|cablu/.test(n)) {
    return { tip: 'accesoriu', unitate: null };
  }
  if (/off-grid|off grid|stand alone|stand-alone|autonom|mobil|incarcator|barci|rulot/.test(n)) {
    return { tip: 'off-grid', unitate: 'kW' };
  }
  if (/hibrid/.test(n)) return { tip: 'hibrid', unitate: 'kW' };
  if (/kit|instalatie|instalație|sistem|panouri fotovoltaice/.test(n)) {
    return { tip: 'on-grid', unitate: 'kW' };
  }
  return { tip: 'necunoscut', unitate: null };
}

/** Păstrează doar produsele cu preț real. Fără preț nu au valoare editorială. */
function clean(produse, source) {
  const kept = [];
  let dropped = 0;

  for (const p of produse) {
    const pret = typeof p.pretRon === 'number' && p.pretRon > 0 ? p.pretRon : null;
    if (!pret) {
      dropped++;
      continue;
    }
    const nume = String(p.nume || '').trim();
    const { tip, unitate } = classify(nume);
    const marime = typeof p.putereKw === 'number' && p.putereKw > 0 ? p.putereKw : null;

    const faraMontaj =
      typeof p.pretFaraMontajRon === 'number' && p.pretFaraMontajRon > 0 && p.pretFaraMontajRon < pret
        ? p.pretFaraMontajRon
        : null;

    kept.push({
      nume,
      tip,
      unitate,
      marime, // kW pentru sisteme, kWh pentru baterii — citește `unitate`
      pretRon: pret,
      pretPeUnitate: marime && unitate ? Math.round(pret / marime) : null,
      includeMontaj: ['da', 'nu', 'necunoscut'].includes(p.includeMontaj)
        ? p.includeMontaj
        : source.montajInclus === 'da'
          ? 'da'
          : 'necunoscut',
      includeBaterie: p.includeBaterie === true,
      tvaInclus: typeof p.tvaInclus === 'boolean' ? p.tvaInclus : null,
      urlProdus: p.urlProdus || null,
      // Doar când magazinul publică AMBELE prețuri pentru același produs.
      // Diferența e manoperă publicată, nu estimată de noi. Vezi Pas 5 din plan.
      pretFaraMontajRon: faraMontaj,
      manoperaRon: faraMontaj ? pret - faraMontaj : null,
      manoperaPeKw: faraMontaj && marime && unitate === 'kW'
        ? Math.round((pret - faraMontaj) / marime)
        : null,
    });
  }

  return { kept, dropped };
}

/**
 * Detector de erori de extragere, NU o afirmație despre piață.
 * Compară fiecare produs cu mediana grupului lui (același tip + unitate) și
 * semnalează ce e de peste 3x sau sub 1/3 din mediană. Rostul e ca, la rularea
 * de luna viitoare, o temă schimbată sau un preț citit greșit să iasă la
 * suprafață în loc să ajungă într-un articol. Nu se șterge nimic automat.
 */
function flagOutliers(allProducts) {
  const warnings = [];
  const groups = new Map();

  for (const p of allProducts) {
    if (!p.pretPeUnitate) continue;
    const key = `${p.tip}|${p.unitate}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(p);
  }

  for (const [key, items] of groups) {
    if (items.length < 4) continue; // prea puține ca mediana să însemne ceva
    const sorted = [...items].sort((a, b) => a.pretPeUnitate - b.pretPeUnitate);
    const median = sorted[Math.floor(sorted.length / 2)].pretPeUnitate;

    for (const p of items) {
      const r = p.pretPeUnitate / median;
      if (r > 3 || r < 1 / 3) {
        warnings.push(
          `outlier [${key}] ${p.pretPeUnitate.toLocaleString('ro-RO')} RON/${p.unitate} ` +
            `vs mediana ${median.toLocaleString('ro-RO')} (${r.toFixed(1)}x) — ${p.nume.slice(0, 60)}`,
        );
      }
    }
  }

  return warnings;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const storeIdx = args.indexOf('--store');
  const storeFilter = storeIdx !== -1 ? args[storeIdx + 1]?.toLowerCase() : null;

  const sources = storeFilter
    ? SOURCES.filter((s) => s.store.toLowerCase() === storeFilter)
    : SOURCES;

  if (!sources.length) {
    console.error(
      `[kit-prices] Niciun magazin pentru "${storeFilter}". Disponibile: ${[...new Set(SOURCES.map((s) => s.store))].join(', ')}`,
    );
    process.exit(1);
  }

  if (dryRun) {
    console.log('[kit-prices] --dry-run, nu se apelează nimic. Ar scrapa:');
    sources.forEach((s) => console.log(`  ${s.store.padEnd(10)} ${s.url}`));
    console.log(`\nOutput ar merge în ${OUT_PATH}`);
    return;
  }

  const apiKey = loadApiKey();
  if (!apiKey) {
    console.error(
      '[kit-prices] Lipsește FIRECRAWL_API_KEY (căutat în env, .env.local, .mcp.json).',
    );
    process.exit(1);
  }

  const scrapedAt = new Date().toISOString().slice(0, 10);
  const out = { scrapedAt, sources: [], warnings: [] };

  for (const source of sources) {
    process.stdout.write(`[kit-prices] ${source.store} ${source.url} ... `);
    try {
      const produse = await scrapeSource(source, apiKey);
      const { kept, dropped } = clean(produse, source);
      out.sources.push({
        store: source.store,
        url: source.url,
        scrapedAt,
        montajInclus: source.montajInclus,
        note: source.note,
        produse: kept,
      });
      console.log(`${kept.length} cu preț${dropped ? `, ${dropped} fără preț ignorate` : ''}`);
      if (!kept.length) {
        out.warnings.push(`${source.store} ${source.url}: zero produse cu preț (temă schimbată?)`);
      }
    } catch (err) {
      console.log(`EȘEC: ${err.message}`);
      out.warnings.push(`${source.store} ${source.url}: ${err.message}`);
    }
    // Politicos cu API-ul și cu magazinele.
    await new Promise((r) => setTimeout(r, 2000));
  }

  const total = out.sources.reduce((n, s) => n + s.produse.length, 0);
  if (!total) {
    console.error('\n[kit-prices] ZERO produse colectate. Nu suprascriu fișierul existent.');
    out.warnings.forEach((w) => console.error(`  ${w}`));
    process.exit(1);
  }

  const allProducts = out.sources.flatMap((s) => s.produse.map((p) => ({ ...p, store: s.store })));
  out.warnings.push(...flagOutliers(allProducts));

  writeFileSync(OUT_PATH, JSON.stringify(out, null, 2) + '\n');
  console.log(`\n[kit-prices] ${total} produse din ${out.sources.length} surse → ${OUT_PATH}`);

  // Sumar pe tip. Tipurile NU se compară între ele — vezi comentariul de la classify().
  for (const tip of ['on-grid', 'hibrid', 'off-grid', 'baterie']) {
    const items = allProducts
      .filter((p) => p.tip === tip && p.marime)
      .sort((a, b) => a.marime - b.marime);
    if (!items.length) continue;

    const u = items[0].unitate;
    console.log(`\n[kit-prices] ${tip.toUpperCase()} (${items.length}):`);
    for (const p of items) {
      const pret = p.pretRon.toLocaleString('ro-RO').padStart(11);
      const unit = p.pretPeUnitate ? `${p.pretPeUnitate.toLocaleString('ro-RO')} RON/${u}` : '';
      const montaj = p.includeMontaj === 'da' ? 'montaj inclus' : '';
      console.log(
        `  ${String(p.marime).padStart(6)} ${u} ${pret} RON ${unit.padStart(16)}  ${p.store.padEnd(7)} ${montaj}`,
      );
    }
  }

  // Manoperă PUBLICATĂ (nu estimată): doar produsele unde magazinul dă ambele prețuri.
  const cuManopera = allProducts.filter((p) => p.manoperaRon);
  if (cuManopera.length) {
    console.log('\n[kit-prices] MANOPERĂ PUBLICATĂ (diferența cu montaj / fără montaj):');
    for (const p of cuManopera) {
      const tva = p.tvaInclus === false ? ' (+TVA)' : p.tvaInclus === true ? ' (TVA incl.)' : '';
      console.log(
        `  ${String(p.marime ?? '?').padStart(5)} kW  ${p.pretFaraMontajRon.toLocaleString('ro-RO')} → ` +
          `${p.pretRon.toLocaleString('ro-RO')} RON${tva}  =  manoperă ${p.manoperaRon.toLocaleString('ro-RO')} RON` +
          (p.manoperaPeKw ? ` (${p.manoperaPeKw.toLocaleString('ro-RO')} RON/kW)` : '') +
          `  ${p.store}`,
      );
    }
  }

  if (out.warnings.length) {
    console.log('\n[kit-prices] ⚠️  Avertismente (verifică înainte să citezi în articol):');
    out.warnings.forEach((w) => console.log(`  ${w}`));
  }
}

main().catch((err) => {
  console.error(`[kit-prices] ${err.stack || err.message}`);
  process.exit(1);
});
