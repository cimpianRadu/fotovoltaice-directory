// Dimensionarea și economia unui sistem fotovoltaic, într-un singur loc.
// Matematica stătea în CalculatorClient; acum o folosește și ecranul de succes
// din formularul de cerere, ca omul să vadă o estimare imediat după trimitere.
// Dacă apar două rezultate diferite pentru aceleași date, e un bug, nu o
// diferență de metodologie.
//
// Fără date noi: producția specifică vine din `pvgis-yields.json`, prețul din
// ofertele scanate (`lib/kit-price-curve`), restul sunt constante sursate mai jos.

import pvgisData from '@/data/pvgis-yields.json';
import type { KitPriceCurve, PricePoint } from './kit-price-curve';

export type Mounting = 'inclinat' | 'terasa' | 'sol';

const YIELDS = pvgisData.yields as Record<string, number>;
const FACTORS = pvgisData._factors as Record<Mounting, number>;

/** Județ nerecunoscut: media aproximativă a țării, ca să nu pice calculul. */
export const DEFAULT_YIELD = 1250;
export const SYSTEM_LIFETIME_YEARS = 25;
/** Degradarea anuală a panourilor, valoare uzuală de garanție. */
export const ANNUAL_DEGRADATION = 0.005;
export const M2_PER_KWP = 5;
/** Factor de emisii pentru energia din rețea, folosit doar la CO₂ evitat. */
export const KG_CO2_PER_KWH = 0.299;
/**
 * Tariful mediu folosit când omul își dă consumul în lei, nu în kWh. Intervalul
 * rezidențial post-liberalizare e ~1,03-1,48 RON/kWh, deci 1,30 stă la mijloc.
 * Îl ținem separat ca să fie evident că e o ipoteză, nu o măsurătoare.
 */
export const DEFAULT_TARIFF_RON_PER_KWH = 1.3;

export function yieldFor(judet: string, mounting: Mounting = 'inclinat'): number {
  const base = YIELDS[judet] ?? DEFAULT_YIELD;
  return Math.round(base * FACTORS[mounting]);
}

export interface EstimateInput {
  /** Consum lunar în kWh. */
  consumLunarKwh: number;
  judet: string;
  mounting?: Mounting;
  /** RON/kWh plătiți acum furnizorului. */
  tarif?: number;
  /** Cât din producție se consumă direct, 0-1. */
  autoconsum: number;
  /** RON/kWh pentru surplusul injectat în rețea. */
  pretSurplus?: number;
  /** Plafonul subvenției, în RON. Se aplică peste el și `subventieMaxCoverage`. */
  subventie?: number;
  /**
   * Cât din costul sistemului poate acoperi subvenția, 0-1. Casa Verde merge
   * până la 90%, beneficiarul pune întotdeauna minim 10%, deci o subvenție nu
   * poate face sistemul gratuit oricât de mare ar fi plafonul.
   */
  subventieMaxCoverage?: number;
  /** Putere impusă de utilizator, în kWp. Lipsă = o dimensionăm noi din consum. */
  putereKwp?: number;
}

export interface Estimate {
  kwp: number;
  yieldKwhPerKwp: number;
  suprafata: number;
  productieAnuala: number;
  autoconsumKwh: number;
  injectatKwh: number;
  investitieBruta: number;
  investitie: number;
  subventie: number;
  pricePerKwp: number;
  /** Intervalul real de ofertă, când prețul vine din date scanate. */
  pricePoint: PricePoint | null;
  economieAutoconsum: number;
  venitInjectat: number;
  economieAnuala: number;
  /** Ani până la recuperarea investiției; null dacă nu se recuperează în 25 de ani. */
  payback: number | null;
  totalProfit25: number;
  co2Tone: number;
}

/**
 * Peste pragul ăsta nu mai avem oferte scanate, iar un sistem comercial nu e un
 * kit de magazin: are racord trifazat, ATR și avize care nu apar în preț.
 */
export const SCRAPED_DATA_MAX_KWP = 20;

export function pricePerKwp(
  kwp: number,
  curve: KitPriceCurve,
): { value: number; point: PricePoint | null } {
  if (kwp <= SCRAPED_DATA_MAX_KWP) {
    const point = curve.points.find(
      (p) => kwp >= p.minKwp && (p.maxKwp === null || kwp < p.maxKwp),
    );
    if (point) return { value: point.median, point };
  }
  if (kwp < 50) return { value: 4500, point: null };
  if (kwp < 200) return { value: 3800, point: null };
  return { value: 3500, point: null };
}

export function estimate(input: EstimateInput, curve: KitPriceCurve): Estimate | null {
  const { consumLunarKwh, judet, mounting = 'inclinat', autoconsum } = input;
  const tarif = input.tarif ?? DEFAULT_TARIFF_RON_PER_KWH;
  const pretSurplus = input.pretSurplus ?? 0.3;

  if (!Number.isFinite(consumLunarKwh) || consumLunarKwh <= 0) return null;
  if (!Number.isFinite(tarif) || tarif <= 0) return null;

  const yieldKwhPerKwp = yieldFor(judet, mounting);
  const consumAnual = consumLunarKwh * 12;

  const kwpRaw = input.putereKwp && input.putereKwp > 0
    ? input.putereKwp
    : consumAnual / yieldKwhPerKwp;
  const kwp = Math.max(1, Math.round(kwpRaw * 10) / 10);

  const price = pricePerKwp(kwp, curve);
  const investitieBruta = Math.round(kwp * price.value);
  const plafon = Math.max(input.subventie ?? 0, 0);
  const subventie = Math.min(
    plafon,
    Math.round(investitieBruta * (input.subventieMaxCoverage ?? 1)),
  );
  const investitie = investitieBruta - subventie;

  const productieAnuala = Math.round(kwp * yieldKwhPerKwp);
  const autoconsumKwh = Math.round(productieAnuala * autoconsum);
  const injectatKwh = productieAnuala - autoconsumKwh;
  const economieAutoconsum = Math.round(autoconsumKwh * tarif);
  const venitInjectat = Math.round(injectatKwh * pretSurplus);
  const economieAnuala = economieAutoconsum + venitInjectat;

  let cumulativeNet = -investitie;
  let payback: number | null = null;
  let totalProfit25 = -investitie;
  for (let an = 1; an <= SYSTEM_LIFETIME_YEARS; an++) {
    const venitulAnuluiAcesta = economieAnuala * Math.pow(1 - ANNUAL_DEGRADATION, an - 1);
    cumulativeNet += venitulAnuluiAcesta;
    if (payback === null && cumulativeNet >= 0) {
      const remainingFromPrev = cumulativeNet - venitulAnuluiAcesta;
      payback = an - 1 + -remainingFromPrev / Math.max(venitulAnuluiAcesta, 1);
    }
    if (an === SYSTEM_LIFETIME_YEARS) totalProfit25 = cumulativeNet;
  }

  return {
    kwp,
    yieldKwhPerKwp,
    suprafata: Math.round(kwp * M2_PER_KWP),
    productieAnuala,
    autoconsumKwh,
    injectatKwh,
    investitieBruta,
    investitie,
    subventie,
    pricePerKwp: price.value,
    pricePoint: price.point,
    economieAutoconsum,
    venitInjectat,
    economieAnuala,
    payback,
    totalProfit25,
    co2Tone: Math.round((productieAnuala * KG_CO2_PER_KWH) / 100) / 10,
  };
}
