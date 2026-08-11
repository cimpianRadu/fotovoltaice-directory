// Curba de preț a calculatorului, derivată din ofertele reale scanate în
// `data/kit-prices.json` (scripts/scrape-kit-prices.mjs), nu din medii scrise
// de mână. Rulează pe server: fișierul de scrape are ~54 KB și nu are ce căuta
// în bundle-ul clientului, așa că pagina pasează rezultatul ca prop.
//
// Se iau în calcul DOAR ofertele comparabile între ele: on-grid, cu montaj
// inclus, fără baterie.
//
// Prețul folosit e `pretCuTva21Ron`, produs de `scripts/normalize-kit-prices.mjs`,
// NU `pretRon`. Motivul: `pretRon` e prețul afișat, iar magazinele îl afișează
// pe baze diferite (unul fără TVA, unul cu cota de 9% ieșită din uz pentru
// panouri din 1 august 2025, două cu 21% inclus). O verificare anterioară care
// se uita doar la flagul `tvaInclus` lăsa prețurile VoltGrid cu 9% în mediană,
// adică cu ~11% sub valoarea reală.

import kitPrices from '@/data/kit-prices.json';

interface ScrapedProduct {
  tip?: string;
  marime?: number;
  pretRon?: number;
  /** Prețul adus la TVA 21%. null dacă baza magazinului nu e verificată. */
  pretCuTva21Ron?: number | null;
  includeMontaj?: string;
  includeBaterie?: boolean;
  tvaInclus?: boolean;
}

export interface PricePoint {
  /** Eticheta intervalului de putere, pentru afișare. */
  label: string;
  /** Marginile intervalului, în kWp. `maxKwp` null = deschis la dreapta. */
  minKwp: number;
  maxKwp: number | null;
  /** Mediana RON/kWp, TVA inclus, cu montaj. */
  median: number;
  min: number;
  max: number;
  /** Câte oferte stau în spatele intervalului, ca să se vadă cât de subțire e. */
  offers: number;
}

/**
 * Intervalele pe care agregăm. Un punct pe fiecare mărime exactă ar da mediane
 * calculate dintr-o singură ofertă; grupate, fiecare interval se sprijină pe
 * mai multe magazine.
 */
const BUCKETS: { label: string; minKwp: number; maxKwp: number | null }[] = [
  { label: 'până în 4 kWp', minKwp: 0, maxKwp: 4 },
  { label: '4 - 7 kWp', minKwp: 4, maxKwp: 7 },
  { label: '7 - 11 kWp', minKwp: 7, maxKwp: 11 },
  { label: '11 - 20 kWp', minKwp: 11, maxKwp: 20 },
  { label: 'peste 20 kWp', minKwp: 20, maxKwp: null },
];

export interface KitPriceCurve {
  scrapedAt: string;
  points: PricePoint[];
  /** Câte magazine distincte au contribuit cu cel puțin o ofertă comparabilă. */
  stores: number;
  totalOffers: number;
}

function median(values: number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

export function getKitPriceCurve(): KitPriceCurve {
  const offers: { kwp: number; perKwp: number; store: string }[] = [];

  for (const source of kitPrices.sources as { store: string; produse?: ScrapedProduct[] }[]) {
    for (const p of source.produse || []) {
      if (p.tip !== 'on-grid') continue;
      if (p.includeMontaj !== 'da') continue;
      if (p.includeBaterie) continue;
      // Fără preț normalizat, oferta iese din calcul. Un magazin cu bază de TVA
      // neverificată nu are voie să intre în mediană doar fiindcă are un preț.
      if (!p.marime || !p.pretCuTva21Ron) continue;

      offers.push({
        kwp: p.marime,
        perKwp: Math.round(p.pretCuTva21Ron / p.marime),
        store: source.store,
      });
    }
  }

  // Scraperul își semnalează singur outlierii (vezi `warnings`), dar filtrăm
  // independent: o listare greșită de tipul „instalație de 1 kW" la preț de
  // sistem întreg ar trage mediana intervalului ei cu totul aiurea.
  const globalMedian = median(offers.map((o) => o.perKwp));
  const kept = offers.filter(
    (o) => o.perKwp <= globalMedian * 2.5 && o.perKwp >= globalMedian * 0.4,
  );

  const points: PricePoint[] = [];
  for (const b of BUCKETS) {
    const inBucket = kept.filter(
      (o) => o.kwp >= b.minKwp && (b.maxKwp === null || o.kwp < b.maxKwp),
    );
    if (!inBucket.length) continue;
    const values = inBucket.map((o) => o.perKwp);
    points.push({
      label: b.label,
      minKwp: b.minKwp,
      maxKwp: b.maxKwp,
      median: median(values),
      min: Math.min(...values),
      max: Math.max(...values),
      offers: inBucket.length,
    });
  }

  return {
    scrapedAt: kitPrices.scrapedAt as string,
    points,
    stores: new Set(kept.map((o) => o.store)).size,
    totalOffers: kept.length,
  };
}

/** Mediana RON/kWp pentru o putere dată, din intervalul în care cade. */
export function medianPricePerKwp(curve: KitPriceCurve, kwp: number): PricePoint | null {
  return (
    curve.points.find((p) => kwp >= p.minKwp && (p.maxKwp === null || kwp < p.maxKwp)) ??
    curve.points[curve.points.length - 1] ??
    null
  );
}
