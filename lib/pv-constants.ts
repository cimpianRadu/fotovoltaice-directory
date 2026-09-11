/**
 * Constantele fotovoltaice folosite în mai multe locuri, într-un singur fișier
 * FĂRĂ dependențe de date.
 *
 * De ce există separat de `lib/pv-estimate.ts`: acela importă `pvgis-yields.json`
 * și `pvgis-monthly.json`, deci orice componentă client care voia doar tariful
 * implicit trăgea registrele în bundle. Alternativa practicată până acum era
 * rescrierea valorii pe loc, cu un comentariu „aceeași ca în pv-estimate" — care
 * ține exact până când una dintre ele se schimbă și cealaltă nu.
 *
 * Regula: dacă o constantă e nevoie în două module, locul ei e aici.
 */

/**
 * Producția specifică medie pe țară, kWh/kWp/an, pentru județele fără intrare
 * proprie în `pvgis-yields.json`.
 */
export const DEFAULT_YIELD = 1250;

/**
 * Tariful mediu folosit când omul își dă consumul în lei, nu în kWh. Intervalul
 * rezidențial post-liberalizare e ~1,03-1,48 RON/kWh, deci 1,30 stă la mijloc.
 * E o ipoteză, nu o măsurătoare.
 */
export const DEFAULT_TARIFF_RON_PER_KWH = 1.3;

/**
 * Forma sezonieră medie a producției pe țară: ce fracție din anul întreg cade în
 * fiecare lună, ianuarie → decembrie. Însumează 1.
 *
 * Provine din `data/pvgis-monthly.json` (PVGIS SARAH3, vezi `scripts/pvgis-monthly.mjs`),
 * ca medie a celor 42 de județe după normalizarea fiecăruia la totalul lui — adică
 * exact calculul pe care `pv-estimate` îl făcea la runtime pentru județele fără
 * intrare proprie. Scrisă aici ca douăsprezece numere, nu recalculată, ca să fie
 * folosibilă și din module care nu au voie să importe registrul.
 *
 * Regenerare, dacă se schimbă `pvgis-monthly.json`:
 *   node -e "const m=require('./data/pvgis-monthly.json').judete,a=Object.values(m);
 *   console.log(JSON.stringify([...Array(12)].map((_,i)=>Math.round(
 *     a.reduce((s,j)=>s+j.lunar[i]/j.lunar.reduce((x,y)=>x+y,0),0)/a.length*1e5)/1e5)))"
 *
 * Amplitudinea contează: decembrie e 3,66% din an, iulie 12,17%, adică de 3,3 ori
 * mai mult. Orice calcul care folosește media anuală în loc de forma asta
 * supraestimează iarna și subestimează vara.
 */
export const MONTHLY_SHARES = [
  0.03954, 0.04975, 0.08433, 0.10249, 0.11041, 0.11359, 0.12165, 0.1191, 0.09718, 0.07687, 0.04846,
  0.03662,
] as const;

/** Zilele fiecărei luni, an nebisect. Suma: 365. */
export const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;
