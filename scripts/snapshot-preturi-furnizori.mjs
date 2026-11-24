#!/usr/bin/env node
/**
 * Snapshot săptămânal al ofertelor-tip de energie electrică din comparatorul ANRE (posf.ro).
 *
 * Comparatorul arată doar ofertele valabile azi, nu istoricul. Păstrăm noi câte o fotografie
 * pe săptămână, ca după câteva luni să avem evoluția prețului pe furnizor și pe zonă,
 * date pe care nu le are nimeni altcineva (grafic în ghiduri, citări).
 *
 * Din 13 nov 2026 (Ordinul ANRE 67/2026, art. 15), prosumatorii de până la 200 kW primesc pe
 * surplus prețul energiei active din contract: `pret_energie` de aici e reperul pentru ei.
 *
 * Scrie data/istoric-preturi-furnizori/YYYY-MM-DD.json (ora României). Dacă fișierul zilei
 * există deja, nu face nimic (rutina poate rula de mai multe ori).
 *
 *   node scripts/snapshot-preturi-furnizori.mjs          # snapshot azi
 *   node scripts/snapshot-preturi-furnizori.mjs --force  # rescrie snapshot-ul de azi
 */
import fs from 'node:fs';
import path from 'node:path';

const API = 'https://posf.ro/comparator/api/index.php';
const OUT_DIR = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'data', 'istoric-preturi-furnizori');

// Profilurile de consum. Ținute fixe: dacă le schimbi, seria nu mai e comparabilă.
const PROFILURI = [
  { cheie: 'casnic-150', tip_client: 'casnic', consum_lunar: 150, consum_anual: 1800 },
  { cheie: 'noncasnic-1000', tip_client: 'noncasnic', consum_lunar: 1000, consum_anual: 12000 },
];

const azi = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Bucharest' }); // YYYY-MM-DD
const [y, m, d] = azi.split('-');
const outFile = path.join(OUT_DIR, `${azi}.json`);

if (fs.existsSync(outFile) && !process.argv.includes('--force')) {
  console.log(`Există deja ${path.relative(process.cwd(), outFile)}, nimic de făcut.`);
  process.exit(0);
}

async function get(params, incercari = 3) {
  const url = new URL(API);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(45_000), headers: { accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (i >= incercari) throw new Error(`${params.request} ${JSON.stringify(params).slice(0, 120)}: ${e.message}`);
      await new Promise((r) => setTimeout(r, 3000 * i));
    }
  }
}

const COLOANE = [
  'profil', 'id_zona', 'furnizor', 'id_oferta', 'oferta', 'tip_produs',
  'pret_final', 'pret_energie', 'componenta_fixa', 'factura_lunara', 'tarif_distributie',
  'valabil_de_la', 'valabil_pana_la',
];

const num = (v) => (v === null || v === undefined || v === '' ? null : Number(v));

const judete = await get({ request: 'get-judete' });
const zone = [...new Map(judete.map((j) => [j.id_zona, j.nume_zona])).entries()].sort((a, b) => a[0] - b[0]);
if (zone.length < 8) throw new Error(`Doar ${zone.length} zone în get-judete, ceva s-a schimbat la API.`);

const oferte = [];
const vazute = new Set();
const rezumat = [];
for (const p of PROFILURI) {
  for (const [id_zona, nume_zona] of zone) {
    const lista = await get({
      request: 'comparator-electric',
      tip_oferta: 0,
      data_start_aplicare: `${d}-${m}-${y}`,
      tip_client: p.tip_client,
      tip_pret: 'nediferentiat',
      consum_anual: p.consum_anual,
      consum_lunar: p.consum_lunar,
      valoare_factura_curenta: '',
      nivel_tensiune: 'JT_',
      id_zona,
      tip_produs: 0,
      perioada_contract: '',
      energie_regenerabila: '',
      factura_electronica: '',
      frecventa_emitere_factura: '',
      procent_zona_noapte: '',
      procent_zona_zi: '',
      frecventa_citire_contor: '',
      valoare_fixa: '',
    });
    if (!Array.isArray(lista)) throw new Error(`Răspuns neașteptat pentru ${p.cheie} / zona ${id_zona}`);
    for (const o of lista) {
      // API-ul întoarce uneori aceeași ofertă de două ori în aceeași zonă.
      const cheie = `${p.cheie}|${id_zona}|${o.id_oferta}`;
      if (vazute.has(cheie)) continue;
      vazute.add(cheie);
      oferte.push([
        p.cheie,
        id_zona,
        String(o.nume_furnizor ?? '').trim(),
        o.id_oferta,
        String(o.denumire_oferta ?? '').trim(),
        o.tip_produs,
        num(o.pret_final),
        num(o.pret_energie),
        num(o.valoare_componenta_fixa),
        num(o.valoare_factura_furnizor_fc),
        num(o.tarif_serviciu_distributie),
        o.valabilitate_oferta_start,
        o.valabilitate_oferta_stop,
      ]);
    }
    const preturi = lista.map((o) => num(o.pret_final)).filter((x) => x > 0).sort((a, b) => a - b);
    rezumat.push({ profil: p.cheie, zona: nume_zona, oferte: new Set(lista.map((o) => o.id_oferta)).size, min: preturi[0] ?? null, mediana: preturi[preturi.length >> 1] ?? null });
    await new Promise((r) => setTimeout(r, 800));
  }
}

if (oferte.length === 0) throw new Error('Zero oferte în toate zonele: API-ul s-a schimbat sau e căzut. Nu scriu fișier gol.');

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(
  outFile,
  JSON.stringify(
    {
      data: azi,
      sursa: 'Comparatorul ANRE, posf.ro/comparator (oferte-tip publice, joasă tensiune, preț nediferențiat)',
      profiluri: PROFILURI,
      zone: Object.fromEntries(zone),
      rezumat,
      // Un rând pe ofertă și zonă, coloanele în ordinea de mai jos (format compact: ~1.900 de rânduri pe săptămână).
      coloane: COLOANE,
      oferte,
    },
  ).replace(/\],\[/g, '],\n[') + '\n',
);

console.log(`Scris ${path.relative(process.cwd(), outFile)}: ${oferte.length} oferte, ${new Set(oferte.map((o) => o[2])).size} furnizori.`);
console.table(rezumat);
