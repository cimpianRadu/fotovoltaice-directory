// Dimensionarea și economia unui sistem fotovoltaic, într-un singur loc.
// Matematica stătea în CalculatorClient; acum o folosește și ecranul de succes
// din formularul de cerere, ca omul să vadă o estimare imediat după trimitere.
// Dacă apar două rezultate diferite pentru aceleași date, e un bug, nu o
// diferență de metodologie.
//
// Fără date noi: producția specifică vine din `pvgis-yields.json`, prețul din
// ofertele scanate (`lib/kit-price-curve`), restul sunt constante sursate mai jos.

import pvgisData from '@/data/pvgis-yields.json';
import pvgisMonthly from '@/data/pvgis-monthly.json';
import type { KitPriceCurve, PricePoint } from './kit-price-curve';

export type Mounting = 'inclinat' | 'terasa' | 'sol';

const YIELDS = pvgisData.yields as Record<string, number>;
const FACTORS = pvgisData._factors as Record<Mounting, number>;

export const MONTH_LABELS = ['ian', 'feb', 'mar', 'apr', 'mai', 'iun', 'iul', 'aug', 'sep', 'oct', 'noi', 'dec'] as const;

/**
 * Forma sezonieră a producției, pe județ: ce fracție din anul întreg cade în
 * fiecare lună. Vine din `pvgis-monthly.json` (PVGIS SARAH3, vezi
 * `scripts/pvgis-monthly.mjs`), ~13 KB în bundle, numai numere.
 *
 * Se ia de acolo DOAR forma, nu și totalul: totalul anual rămâne cel din
 * `pvgis-yields.json`, pe care calculatorul îl folosea deja. Cele două fișiere
 * nu sunt identice pe patru județe (Constanța, Tulcea, Covasna, Caraș-Severin
 * diferă cu ~5%), iar dacă am lua de aici și totalul, aceeași pagină ar afișa
 * două producții anuale diferite. Fracțiile sunt însă practic aceleași, fiindcă
 * ele descriu unghiul soarelui, nu iradiația absolută.
 */
const MONTHLY = pvgisMonthly.judete as Record<string, { lunar: number[] }>;

/** Media țării, pentru județele fără intrare proprie. Calculată o singură dată. */
const DEFAULT_SHARES = (() => {
  const all = Object.values(MONTHLY);
  const sums = MONTH_LABELS.map((_, i) =>
    all.reduce((acc, j) => acc + j.lunar[i] / j.lunar.reduce((a, b) => a + b, 0), 0) / all.length,
  );
  return sums;
})();

export function monthlyShares(judet: string): number[] {
  const entry = MONTHLY[judet];
  if (!entry) return DEFAULT_SHARES;
  const total = entry.lunar.reduce((a, b) => a + b, 0);
  return entry.lunar.map((v) => v / total);
}

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

/**
 * Dimensionarea, într-un singur loc: câți kWp acoperă pe hârtie consumul anual.
 * O foloseau `estimate()` și calculatorul; din 25 aug 2026 o folosește și feedul
 * de cereri, ca reperul afișat firmei să fie exact cifra din calculator.
 */
export function sizeKwp(consumLunarKwh: number, judet: string, mounting: Mounting = 'inclinat'): number {
  const kwpRaw = (consumLunarKwh * 12) / yieldFor(judet, mounting);
  return Math.max(1, Math.round(kwpRaw * 10) / 10);
}

/** Unitatea în care omul își știe consumul: kWh de pe factură sau lei plătiți. */
export type ConsumBasis = 'kwh' | 'lei';

export interface ConsumLunar {
  /** Cifra dată de client, în unitatea lui. */
  valoare: number;
  basis: ConsumBasis;
  /** Consumul în kWh/lună. Egal cu `valoare` la basis 'kwh'. */
  kwhLunar: number;
  /** Cum se scrie pe ecran: „250 lei/lună" sau „300 kWh/lună". */
  label: string;
}

// Convenția românească: punctul și spațiul separă miile („15.000", „15 000"),
// virgula e zecimală. Fără regula asta „15.000 kWh" se citea 15 kWh.
const NUM = String.raw`\d[\d.\u00a0 ]*(?:,\d+)?`;
const CONSUM_RANGE = new RegExp(`(${NUM})\\s*(?:-|–|—|la)\\s*(${NUM})`);
const CONSUM_NUMBER = new RegExp(`(${NUM})`);

const toNumber = (raw: string): number =>
  Number(raw.replace(/[.\u00a0\s]/g, '').replace(',', '.'));

/**
 * Citește consumul lunar dintr-un câmp care a fost text liber până pe 25 aug
 * 2026. În Sheet stau alături „300kw", „500 lei lunar", „170kwh" și „250 lei",
 * iar firma care citea cardul nu putea spune dacă e lunar sau anual, în kWh sau
 * în lei.
 *
 * Unitatea trebuie SCRISĂ. Un număr gol („30", „1800") ar putea fi și una, și
 * alta, iar între ele e un factor de zece: mai bine niciun reper decât unul
 * inventat. De aceea formularul cere acum unitatea explicit.
 */
export function parseConsumLunar(raw: string): ConsumLunar | null {
  const text = (raw || '').trim().toLowerCase();
  if (!text) return null;

  const range = text.match(CONSUM_RANGE);
  const single = text.match(CONSUM_NUMBER);
  // „300-400 kw" e un interval real scris de om: mijlocul lui e mai onest decât
  // oricare capăt.
  const valoare = range
    ? (toNumber(range[1]) + toNumber(range[2])) / 2
    : single
      ? toNumber(single[1])
      : NaN;
  if (!Number.isFinite(valoare) || valoare <= 0) return null;

  const basis: ConsumBasis | null = /lei|ron/.test(text)
    ? 'lei'
    : /kw/.test(text)
      ? 'kwh'
      : null;
  if (!basis) return null;

  // Câmpul cere consumul lunar, dar unii scriu totalul pe an („15.000 kWh pe
  // an"). Când o spun explicit, îi credem și împărțim; altfel diferența ar fi
  // de douăsprezece ori.
  const perAn = /(?:pe |\/ ?)an|anual/.test(text);
  const lunar = perAn ? valoare / 12 : valoare;

  const kwhLunar = basis === 'kwh' ? lunar : lunar / DEFAULT_TARIFF_RON_PER_KWH;
  const rotunjit = Math.round(lunar);
  return {
    valoare: lunar,
    basis,
    kwhLunar,
    label: basis === 'kwh' ? `${rotunjit} kWh/lună` : `${rotunjit} lei/lună`,
  };
}

/** Terasa are propriul factor de producție; restul acoperișurilor sunt înclinate. */
export function mountingForRoof(tipAcoperis: string): Mounting {
  return tipAcoperis === 'terasa' ? 'terasa' : 'inclinat';
}

export interface EstimateInput {
  /** Consum lunar în kWh. */
  consumLunarKwh: number;
  judet: string;
  mounting?: Mounting;
  /** RON/kWh plătiți acum furnizorului. */
  tarif?: number;
  /**
   * Cât se consumă direct, 0-1. Se aplică la producție cât timp sistemul e
   * dimensionat pe consum; peste consum se aplică la consum — vezi plafonul din
   * `estimate()`.
   */
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
  /** Producția lunii, kWh, ianuarie -> decembrie. Însumează `productieAnuala`. */
  productieLunara: number[];
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

  const kwp = input.putereKwp && input.putereKwp > 0
    ? Math.max(1, Math.round(input.putereKwp * 10) / 10)
    : sizeKwp(consumLunarKwh, judet, mounting);

  const price = pricePerKwp(kwp, curve);
  const investitieBruta = Math.round(kwp * price.value);
  const plafon = Math.max(input.subventie ?? 0, 0);
  const subventie = Math.min(
    plafon,
    Math.round(investitieBruta * (input.subventieMaxCoverage ?? 1)),
  );
  const investitie = investitieBruta - subventie;

  const productieAnuala = Math.round(kwp * yieldKwhPerKwp);
  const productieLunara = monthlyShares(judet).map((share) => Math.round(productieAnuala * share));
  // Autoconsumul se plafonează la consum. Orele în care omul e acasă și pornește
  // ceva nu se înmulțesc odată cu panourile: peste consum, cota se aplică la
  // cât folosește el, nu la cât produce acoperișul. Fără plafon, un sistem de
  // 15 kWp pus la un consum de 3.600 kWh/an ieșea cu o „economie" de aproape
  // două ori factura lui anuală (găsit pe o cerere reală, 25 aug 2026).
  const consumAnual = consumLunarKwh * 12;
  const autoconsumKwh = Math.round(autoconsum * Math.min(productieAnuala, consumAnual));
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
    productieLunara,
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
