#!/usr/bin/env node
/**
 * Paza acordurilor firmelor (20 nov 2026): textul unui acord nu se schimbă pe
 * tăcute. Firmele bifează „termeni” și „comision” la o versiune anume
 * (`lib/acorduri-shared.ts`); dacă textul se schimbă și versiunea rămâne,
 * nu mai știm ce au acceptat. Scriptul calculează o amprentă pentru fiecare
 * acord din textele care îl compun și o compară cu `data/acorduri-amprente.json`.
 *
 * Ce intră în amprentă:
 *   comision  intrarea `comision` din ACORDURI (fără `schimbari`), grila,
 *             termenul de plată, bifa din formularul de revendicare și
 *             secțiunea 8 din /termeni-conditii (de la id="comision" la id="watt-ai")
 *   termeni   intrarea `termeni` din ACORDURI (fără `schimbari`), restul paginii
 *             /termeni-conditii și limitele afișate acolo din cod
 * Spațiile se comprimă, deci o reformatare nu contează.
 *
 *   node scripts/acorduri-amprenta.mjs                        verifică (la prebuild); iese cu 1 la diferență
 *   node scripts/acorduri-amprenta.mjs --versiune-noua        după ce ai crescut versiunea unui acord
 *   node scripts/acorduri-amprenta.mjs --corectura "motiv"    textul s-a schimbat fără efect asupra
 *                                                             drepturilor (greșeală de tipar, formulare);
 *                                                             rămâne scris în fișier, cu motivul
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const FISIER = path.join(ROOT, 'data/acorduri-amprente.json');
const citeste = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const strans = (s) => s.replace(/\s+/g, ' ').trim();

function intre(text, start, stop, eticheta) {
  const i = text.indexOf(start);
  const j = stop ? text.indexOf(stop, i + start.length) : text.length;
  if (i < 0 || j < 0) throw new Error(`Nu găsesc ${eticheta} („${start}”). Scriptul trebuie actualizat odată cu fișierul.`);
  return text.slice(i, j);
}

function constanta(fisier, nume) {
  const m = new RegExp(`export const ${nume} = ([^;]+);`).exec(citeste(fisier));
  if (!m) throw new Error(`Nu găsesc ${nume} în ${fisier}.`);
  return `${nume}=${m[1]}`;
}

function surse() {
  const shared = citeste('lib/acorduri-shared.ts');
  const termeni = citeste('app/termeni-conditii/page.tsx');
  const sectiune8 = intre(termeni, '<h2 id="comision">', '<h2 id="watt-ai">', 'secțiunea 8 din termeni');
  return {
    comision: [
      intre(shared, "id: 'comision',", 'schimbari:', 'acordul comision'),
      intre(shared, 'export const COMISION_TERMEN_PLATA_ZILE', ';', 'termenul de plată'),
      intre(shared, 'export const GRILA_COMISION', '] as const;', 'grila'),
      intre(shared, 'export const BIFA_FORMULAR_REVENDICARE', '`;', 'bifa din formular'),
      sectiune8,
    ],
    termeni: [
      intre(shared, "id: 'termeni',", 'schimbari:', 'acordul termeni'),
      termeni.replace(sectiune8, ''),
      constanta('lib/sheets-shared.ts', 'MAX_ACTIVE_CLAIMS_PER_FIRM'),
      constanta('lib/watt-firme-shared.ts', 'WATT_FIRME_MESAJE_PE_ZI'),
    ],
  };
}

function versiuni() {
  const shared = citeste('lib/acorduri-shared.ts');
  const out = {};
  for (const id of ['termeni', 'comision']) {
    const m = new RegExp(`id: '${id}',\\s*versiune: '([^']+)'`).exec(shared);
    if (!m) throw new Error(`Nu găsesc versiunea acordului ${id} în lib/acorduri-shared.ts.`);
    out[id] = m[1];
  }
  return out;
}

const amprenta = (bucati) =>
  createHash('sha256').update(bucati.map(strans).join('\n---\n')).digest('hex').slice(0, 16);

const azi = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Bucharest' }).format(new Date());
const args = process.argv.slice(2);
const mod = args.includes('--versiune-noua') ? 'versiune' : args.includes('--corectura') ? 'corectura' : 'verifica';
const motiv = mod === 'corectura' ? (args[args.indexOf('--corectura') + 1] || '').trim() : '';

const salvat = JSON.parse(readFileSync(FISIER, 'utf8'));
const v = versiuni();
const s = surse();
const probleme = [];
let schimbat = false;

for (const id of ['termeni', 'comision']) {
  const acum = amprenta(s[id]);
  const vechi = salvat[id];
  if (vechi?.versiune === v[id] && vechi.amprenta === acum) continue;

  if (vechi?.versiune !== v[id]) {
    if (mod === 'versiune') {
      salvat[id] = { versiune: v[id], amprenta: acum, inregistrat: azi, corecturi: [] };
      schimbat = true;
      console.log(`✓ ${id}: versiunea ${v[id]} înregistrată.`);
    } else {
      probleme.push(
        `${id}: versiunea din cod e ${v[id]}, iar cea înregistrată ${vechi?.versiune ?? '(niciuna)'}.\n` +
          '  Rulează: node scripts/acorduri-amprenta.mjs --versiune-noua',
      );
    }
    continue;
  }

  // Aceeași versiune, text diferit.
  if (mod === 'corectura') {
    if (!motiv) {
      probleme.push(`${id}: --corectura cere un motiv, de ex. --corectura "greșeală de tipar în §8"`);
      continue;
    }
    vechi.corecturi = [...(vechi.corecturi || []), { data: azi, motiv, amprenta: acum }];
    vechi.amprenta = acum;
    schimbat = true;
    console.log(`✓ ${id}: corectură notată („${motiv}”), versiunea rămâne ${v[id]}.`);
  } else {
    probleme.push(
      `${id}: textul acordului s-a schimbat, dar versiunea a rămas ${v[id]}. Firmele au bifat textul vechi.\n` +
        '  • Schimbare de fond (preț, termen de plată, reguli, Watt AI): crește `versiune` și scrie `schimbari`\n' +
        '    în lib/acorduri-shared.ts, apoi rulează: node scripts/acorduri-amprenta.mjs --versiune-noua\n' +
        '    (toate firmele vor vedea din nou modalul).\n' +
        '  • Doar corectură, fără efect asupra drepturilor: node scripts/acorduri-amprenta.mjs --corectura "motiv"',
    );
  }
}

if (schimbat) writeFileSync(FISIER, `${JSON.stringify(salvat, null, 2)}\n`);
if (probleme.length) {
  console.error(`\n✗ Acordurile firmelor:\n\n${probleme.join('\n\n')}\n`);
  process.exit(1);
}
if (!schimbat) console.log('✓ acordurile firmelor: textele corespund versiunilor.');
