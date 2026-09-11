/**
 * Cât economisești efectiv cu o baterie, în lei. Funcții pure.
 *
 * Perechea lui `battery-sizing.ts`: acela răspunde „ce capacitate îmi trebuie și
 * ce punctaj fac", ăsta răspunde „și ce câștig din asta". Sunt ținute separat
 * fiindcă au surse diferite: dimensionarea și programul vin din ghid și din
 * proiectul AFM, economia se calculează din tarife.
 *
 * ⚠️ Regula acestui fișier: nicio constantă fără sursă. Fiecare cifră de mai jos
 * e citată dintr-un ghid deja publicat pe site, nu estimată aici. Dacă cifra se
 * schimbă în ghid, se schimbă și aici, nu invers.
 *
 * Modelul, în două rânduri: bateria nu produce energie, ci mută energie ieftină
 * (surplusul de zi, care altfel pleacă în rețea la preț mic) în intervalul scump
 * (seara, când cumperi la preț de factură). Câștigul e diferența dintre cele
 * două prețuri, pe cantitatea pe care o poate muta efectiv.
 */

import { bracketFor, DAYS_PER_MONTH } from './battery-sizing';
import { DEFAULT_YIELD, DEFAULT_TARIFF_RON_PER_KWH, MONTHLY_SHARES, DAYS_IN_MONTH } from './pv-constants';

/**
 * Randamentul dus-întors al sistemului complet (invertor + BMS), nu al celulei.
 * Ghidul `baterie-stocare-casa-backup-dimensionare-independenta-energetica-2026`:
 * „Bateriile LFP moderne au 95-98% round-trip la nivel de celulă, dar sistemul
 * complet (invertor + BMS) scade la 88-92%." Mijlocul intervalului.
 */
export const ROUND_TRIP = 0.9;

/**
 * Cât din capacitatea nominală se folosește efectiv. Ghidul
 * `stocare-energie-baterii-firme`, tabelul de tehnologii: LFP are DoD 90-100%
 * (Huawei LUNA2000 e dat cu 100%). Mijlocul intervalului, prudent.
 *
 * Contează fiindcă în pasul 2 omul scrie capacitatea NOMINALĂ, cea pe care o
 * cere programul, nu cea utilizabilă.
 */
export const USABLE_FRACTION = 0.95;

/**
 * Cât din producția de peste zi se consumă pe loc, fără baterie. Ghidul
 * `baterie-3-5-10-kw-dimensionare-dupa-puterea-sistemului`: „Într-un rezidențial
 * mediu fără persoane acasă la prânz, autoconsumul instant fără baterie e
 * ~20-30%." Mijlocul intervalului.
 */
export const INSTANT_SELF_CONSUMPTION = 0.25;

/**
 * Producția specifică medie pe țară, kWh/kWp/an, și prețul implicit la care
 * CUMPERI, lei/kWh cu tot cu rețea și taxe. Amândouă din `lib/pv-constants.ts`,
 * modulul fără dependențe de date: `pv-estimate` le exportă tot de acolo, deci
 * calculatorul de sistem și cel de baterii nu mai pot ajunge la cifre diferite.
 */
export const DEFAULT_YIELD_KWH_PER_KWP = DEFAULT_YIELD;
export const DEFAULT_BUY_PRICE = DEFAULT_TARIFF_RON_PER_KWH;

/**
 * Prețul implicit la care RECUPEREZI energia injectată, lei/kWh.
 *
 * Nu e un preț de vânzare inventat. Legea nr. 160/2026, art. 73¹ alin. (3):
 * pentru prosumatorii sub 200 kW furnizorul compensează cantitativ „la prețul
 * energiei active din contract", explicit FĂRĂ componenta de furnizare, TVA,
 * transport, distribuție, servicii de sistem, cogenerare, certificate verzi și
 * acciză. Valoarea de aici e prețul energiei active publicat în ghidul nostru
 * `de-ce-creste-pretul-energiei-2026` (Electrica, fără TVA).
 *
 * De ce contează că e 0,745 și nu 0,40: sub compensare cantitativă surplusul NU
 * se pierde la un preț de nimic, se recuperează aproape de prețul energiei.
 * Diferența pe care o salvează bateria sunt componentele de rețea și taxele, nu
 * tot tariful. Un calculator care pune 0,40 aici face bateria să pară de două
 * ori mai rentabilă decât e sub regimul valabil azi.
 */
export const DEFAULT_INJECTION_PRICE = 0.745;

export interface SavingsInput {
  /** Consumul lunar al casei, kWh. */
  consumLunarKwh: number;
  /** Puterea instalată a panourilor, kWp. */
  kwp: number;
  /** Capacitatea nominală a bateriei, kWh (cea din program). */
  capacityKwh: number;
  /** Prețul la care cumperi din rețea, lei/kWh. */
  buyPrice: number;
  /** Cât recuperezi pentru 1 kWh injectat, lei/kWh. */
  injectionPrice: number;
}

/** Ce anume limitează economia la capacitatea curentă. */
export type Limiter = 'baterie' | 'panouri' | 'consum';

export interface Savings {
  /** Producția fotovoltaică medie, kWh/zi. */
  productionPerDay: number;
  /** Surplusul care ar pleca în rețea fără baterie, kWh/zi. */
  surplusPerDay: number;
  /** Consumul de seară-noapte pe care bateria îl poate acoperi, kWh/zi. */
  eveningPerDay: number;
  /** Capacitatea efectiv utilizabilă, kWh. */
  usableKwh: number;
  /** Energia încărcată în baterie, kWh/zi. */
  storedPerDay: number;
  /** Energia scoasă din baterie și consumată, kWh/zi (după randament). */
  deliveredPerDay: number;
  /** Câștigul net, lei/an. */
  perYear: number;
  /** Câștigul net, lei/lună. */
  perMonth: number;
  /** Ce limitează economia acum. */
  limiter: Limiter;
  /**
   * Capacitatea nominală de la care economia nu mai crește, kWh. `null` dacă
   * bateria e încă sub prag, adică fiecare kWh în plus încă aduce ceva.
   */
  saturationKwh: number;
  /** Bateria e deja peste pragul de saturație. */
  saturated: boolean;
}

/**
 * Câștigul pe un kWh încărcat în baterie.
 *
 * Contabilitatea, pas cu pas, pentru 1 kWh de surplus:
 * - fără baterie l-ai fi injectat și ai fi încasat `injectionPrice`;
 * - cu baterie nu-l mai injectezi (pierzi `injectionPrice`), dar scoți din el
 *   `ROUND_TRIP` kWh pe care nu-i mai cumperi (economisești `ROUND_TRIP × buyPrice`).
 *
 * Deci net = `ROUND_TRIP × buyPrice − injectionPrice`, NU `(buyPrice − injectionPrice)`.
 * Randamentul se aplică doar părții pe care o recuperezi, nu diferenței întregi.
 */
export function marginPerStoredKwh(buyPrice: number, injectionPrice: number): number {
  return ROUND_TRIP * buyPrice - injectionPrice;
}

/**
 * Câți lei pe an aduce bateria.
 *
 * Cantitatea mutată zilnic e minimul a trei limite, și tocmai de-aici iese
 * pragul de saturație: de la capacitatea la care bateria nu mai e limita, kWh-ul
 * în plus nu mai are ce muta.
 *
 * Calculul se face **lună cu lună**, nu pe media anuală. Producția variază de la
 * 3,66% din an în decembrie la 12,17% în iulie, iar `min()` e concav: minimul
 * mediilor e mai mare decât media minimelor.
 *
 * Cât contează, măsurat pe o grilă de scenarii față de varianta pe medie: zero
 * acolo unde panourile sunt generoase față de consum (5 kWp la 300 kWh/lună,
 * 10 kWp la 600 — surplusul nu e limita nici în decembrie), dar până la **−14%**
 * unde sistemul e mic față de consum (4 kWp la 800 kWh/lună). Adică exact la
 * oamenii cărora li se vinde o baterie ca să „acopere" un sistem subdimensionat,
 * unde o supraestimare ar fi fost și cea mai scumpă.
 */
export function savingsFor({
  consumLunarKwh,
  kwp,
  capacityKwh,
  buyPrice,
  injectionPrice,
}: SavingsInput): Savings {
  const consumPerDay = consumLunarKwh / DAYS_PER_MONTH;
  const yearlyProduction = kwp * DEFAULT_YIELD_KWH_PER_KWP;

  // Consumul de seară-noapte, mijlocul intervalului din tabelul de dimensionare.
  //
  // Nu capătul de jos, deși ar fi părut prudent: la 300 kWh/lună capătul de jos
  // înseamnă 30% din consumul zilnic, sub intervalul de 40-60% pe care îl dă
  // chiar ghidul `casa-verde-baterii-2026-program-stocare-afm` pentru o casă
  // tipică. Mijlocul cade în interval (38-61% pe tot tabelul) și e consecvent cu
  // celelalte constante de aici, luate toate la mijloc.
  const evening = bracketFor(consumLunarKwh).evening;
  const eveningPerDay = Math.min((evening[0] + evening[1]) / 2, consumPerDay);

  const usableKwh = capacityKwh * USABLE_FRACTION;

  // Ca să acoperi `eveningPerDay` kWh de consum trebuie să încarci mai mult,
  // fiindcă randamentul se pierde la ieșire. De-aia se împarte, nu se compară direct.
  const eveningAsCharge = eveningPerDay / ROUND_TRIP;

  // Consumul îl ținem constant pe an, deși nici el nu e: nu avem un profil lunar
  // de consum sursat, iar unul inventat ar strica exact ce repară sezonalitatea
  // producției. Producția o știm din PVGIS, consumul nu.
  let perYear = 0;
  let storedWeighted = 0;
  let surplusWeighted = 0;
  let productionWeighted = 0;

  for (let m = 0; m < 12; m++) {
    const days = DAYS_IN_MONTH[m];
    const productionPerDay = (yearlyProduction * MONTHLY_SHARES[m]) / days;
    const instant = Math.min(productionPerDay * INSTANT_SELF_CONSUMPTION, consumPerDay);
    const surplusPerDay = Math.max(0, productionPerDay - instant);

    const stored = Math.max(0, Math.min(surplusPerDay, usableKwh, eveningAsCharge));
    const delivered = stored * ROUND_TRIP;

    perYear += (delivered * buyPrice - stored * injectionPrice) * days;
    storedWeighted += stored * days;
    surplusWeighted += surplusPerDay * days;
    productionWeighted += productionPerDay * days;
  }

  const storedPerDay = storedWeighted / 365;
  const surplusPerDay = surplusWeighted / 365;

  // Pragul de saturație se citește pe o lună de mijloc, nu pe medie: e cifra pe
  // care omul o compară cu bateria din ofertă, iar una calculată pe iulie ar
  // spune că merită o baterie care iarna stă goală. Aprilie și septembrie sunt
  // cele mai apropiate de media anuală (10,2% și 9,7% dintr-un an de 8,33%/lună).
  const aprilPerDay = (yearlyProduction * MONTHLY_SHARES[3]) / DAYS_IN_MONTH[3];
  const aprilSurplus = Math.max(
    0,
    aprilPerDay - Math.min(aprilPerDay * INSTANT_SELF_CONSUMPTION, consumPerDay),
  );
  const otherLimit = Math.min(aprilSurplus, eveningAsCharge);
  const saturationKwh = otherLimit / USABLE_FRACTION;

  const limiter: Limiter =
    usableKwh < otherLimit ? 'baterie' : aprilSurplus <= eveningAsCharge ? 'panouri' : 'consum';

  return {
    productionPerDay: productionWeighted / 365,
    surplusPerDay,
    eveningPerDay,
    usableKwh,
    storedPerDay,
    deliveredPerDay: storedPerDay * ROUND_TRIP,
    perYear,
    perMonth: perYear / 12,
    limiter,
    saturationKwh,
    saturated: capacityKwh > saturationKwh,
  };
}

/**
 * În câți ani se întoarce investiția. `null` când economia e zero sau negativă
 * (se întâmplă real: la un preț de injecție apropiat de cel de cumpărare,
 * randamentul pierdut costă mai mult decât câștigă bateria).
 */
export function paybackYears(cost: number, perYear: number): number | null {
  if (perYear <= 0 || cost <= 0) return null;
  return cost / perYear;
}
