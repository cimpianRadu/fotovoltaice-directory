/**
 * Dimensionarea bateriei și punctajul Casa Verde Baterii, în funcții pure.
 *
 * Două surse distincte, ținute separat intenționat:
 *
 * 1. **Dimensionarea** (`SIZING_TABLE`, `kwpNeeded`) e copiată din ghidul publicat
 *    `baterie-stocare-casa-backup-dimensionare-independenta-energetica-2026`.
 *    Nu recalculăm cu o formulă proprie: o a doua metodă ar începe să contrazică
 *    tabelul din articol în ziua în care una dintre ele se schimbă.
 *
 * 2. **Programul** (`PROGRAM`, `scoreFor`, `grantFor`) vine din Ordinul ministrului
 *    mediului nr. 1.904 din 11 septembrie 2026 pentru aprobarea Ghidului de
 *    finanțare a Programului privind sisteme de stocare energie electrică
 *    (Casa Verde Baterii), publicat în Monitorul Oficial nr. 775 din 14 septembrie
 *    2026 (în vigoare 14.09.2026), art. 5, 6, 16 și 19. Față de proiectul din 18
 *    august: minimul 12 -> 10 kWh, standardul de cost 1.250 -> 1.500 lei/kWh, iar
 *    puterea PV nu mai punctează.
 *
 *    **Punctajul (art. 19) e cel din Ordinul nr. 2.314 din 13 noiembrie 2026**,
 *    publicat în Monitorul Oficial nr. 953 din 16 noiembrie 2026, care a rescris
 *    art. 19 alin. (1), (4) și (9): trei criterii în loc de două. Contribuția
 *    proprie dă 10-35 de puncte, capacitatea maximum 40 (de la 15 kWh, nu 20), iar
 *    cine n-a mai avut finanțare publică pentru stocare primește 25. Formula veche
 *    (30 × contribuție/finanțare, max 50, plus 2,5 puncte/kWh, max 50) nu mai e în
 *    vigoare. Același ordin face eligibili și pe cei care au mai avut finanțare
 *    publică pentru un sistem de stocare, dacă cer bani pentru unul nou (art. 15).
 *
 *    Sesiunea: persoane fizice 20-25 noiembrie 2026 (Dispoziția AFM nr. 454 din
 *    6 noiembrie 2026). Sursa: https://www.afm.ro/baterii_ghid.php
 */

export interface SizingBracket {
  /** Limita superioară de consum lunar, în kWh. */
  maxKwhPerMonth: number;
  /** Capacitatea utilă recomandată, interval în kWh. */
  capacity: [number, number];
  /** Consumul seara-noapte estimat, interval în kWh. */
  evening: [number, number];
}

/** Tabelul de dimensionare publicat în ghid. Sursă unică de adevăr. */
export const SIZING_TABLE: SizingBracket[] = [
  { maxKwhPerMonth: 200, capacity: [5, 5], evening: [2, 3] },
  { maxKwhPerMonth: 300, capacity: [5, 7], evening: [3, 4.5] },
  { maxKwhPerMonth: 500, capacity: [7, 10], evening: [4.5, 7.5] },
  { maxKwhPerMonth: 800, capacity: [10, 15], evening: [7.5, 12] },
  { maxKwhPerMonth: Infinity, capacity: [15, 20], evening: [12, 18] },
];

/** Zile medii pe lună, ca să nu apară 30 într-un loc și 30,44 în altul. */
export const DAYS_PER_MONTH = 30.4;

/** Consum instantaneu pe scenariul „circuite critice" din ghid, în kW. */
export const CRITICAL_LOAD_KW = 0.6;

export function bracketFor(kwhPerMonth: number): SizingBracket {
  return SIZING_TABLE.find((b) => kwhPerMonth <= b.maxKwhPerMonth) ?? SIZING_TABLE[SIZING_TABLE.length - 1];
}

/**
 * Puterea PV necesară ca bateria să se umple din surplus, interpolată între
 * perechile din ghid: 5 kWh cere 5-6 kWp, 10 kWh cere 8-10, 15 kWh cere 10-12.
 */
export function kwpNeeded(capacityKwh: number): [number, number] {
  if (capacityKwh <= 5) return [5, 6];
  if (capacityKwh <= 10) return [5 + (capacityKwh - 5) * 0.6, 6 + (capacityKwh - 5) * 0.8];
  if (capacityKwh <= 15) return [8 + (capacityKwh - 10) * 0.4, 10 + (capacityKwh - 10) * 0.4];
  return [10 + (capacityKwh - 15) * 0.4, 12 + (capacityKwh - 15) * 0.4];
}

/** Inversa lui `kwpNeeded`: ce capacitate umple realist un sistem de P kWp. */
export function capacityForKwp(kwp: number): number {
  if (kwp <= 5) return kwp;
  if (kwp <= 8) return 5 + (kwp - 5) * (5 / 3);
  if (kwp <= 10) return 10 + (kwp - 8) * 2.5;
  return 15 + (kwp - 10) * 2.5;
}

/**
 * Pragul de la care spunem că sistemul susține bateria. Rotunjit la 0,5 kWp,
 * nu cu o toleranță inventată: articolul perechează 5 kWh cu 5-6 kWp, deci
 * 5 kWp e suficient pentru 5 kWh.
 */
export function supportThresholdKwp(capacityKwh: number): number {
  return Math.round(kwpNeeded(capacityKwh)[0] * 2) / 2;
}

/** Parametrii programului: Ordinul nr. 1.904/2026, cu punctajul din Ordinul nr. 2.314/2026. */
export const PROGRAM = {
  /** Capacitate minimă finanțabilă, în kWh (art. 16 alin. 2). */
  minKwh: 10,
  /** Standard de cost, lei/kWh cu TVA (art. 5 alin. 4). */
  costStandardPerKwh: 1500,
  /** Cota maximă de finanțare din valoarea proiectului (art. 5 alin. 2). */
  maxShare: 0.75,
  /** Plafon absolut, lei cu TVA (art. 5 alin. 2). */
  maxGrant: 15000,
  /** Contribuția proprie minimă obligatorie (art. 5 alin. 2). */
  minOwnShare: 0.25,
  /** Punctaj maxim pe fiecare criteriu (art. 19 alin. 4, forma din Ordinul 2.314/2026). */
  maxPoints: { contribution: 35, capacity: 40, noPriorFunding: 25 },
  /** Punctajul minim pe contribuție: formula are prag jos la 10 (art. 19 alin. 4 lit. a). */
  minContributionPoints: 10,
  /** Capacitatea de la care criteriul dă punctaj maxim: 4 × 15 − 20 = 40. */
  capacityForMaxPoints: 15,
  /** Cicluri minime de încărcare-descărcare (art. 16 alin. 2). */
  minCycles: 5000,
  /** Data la care MMAP a publicat forma consolidată. */
  consolidatedSince: '2026-09-09',
} as const;

export interface Score {
  contribution: number;
  capacity: number;
  /** 25 dacă solicitantul n-a mai avut finanțare publică pentru stocare, altfel 0. */
  noPriorFunding: number;
  total: number;
}

/**
 * Punctajul din art. 19 alin. (4), în forma din Ordinul nr. 2.314/2026.
 * `ownShare` e fracție (0,25 = 25%), nu procent.
 *
 * a) Contribuția: `max(10; min(35; 37,5 × contribuția proprie / valoarea
 *    solicitată de la AFM − 2,5))`. Ghidul scrie raportul în lei. Cum art. 5
 *    alin. (2) definește contribuția proprie ca diferența dintre valoarea totală
 *    a proiectului și finanțare, raportul e egal cu `ownShare / (1 − ownShare)`.
 *    La contribuția minimă de 25% raportul e 1/3 și ies 10 puncte; cele 35 se
 *    ating când contribuția e cel puțin egală cu suma cerută (50% din proiect).
 * b) Capacitatea: `4 × kWh − 20`, maximum 40 de la 15 kWh. La 10 kWh, 20.
 * c) Finanțări anterioare din fonduri publice pentru stocare: 25 de puncte
 *    pentru cine n-a avut, 0 pentru cine a avut.
 */
export function scoreFor(capacityKwh: number, ownShare: number, priorFunding = false): Score {
  const ratio = ownShare >= 1 ? Infinity : ownShare / (1 - ownShare);
  const contribution = Math.max(
    PROGRAM.minContributionPoints,
    Math.min(PROGRAM.maxPoints.contribution, 37.5 * ratio - 2.5)
  );
  const capacity = Math.max(0, Math.min(PROGRAM.maxPoints.capacity, 4 * capacityKwh - 20));
  const noPriorFunding = priorFunding ? 0 : PROGRAM.maxPoints.noPriorFunding;
  return { contribution, capacity, noPriorFunding, total: contribution + capacity + noPriorFunding };
}

export interface Grant {
  /** Cheltuiala recunoscută, după plafonarea la standardul de cost. */
  eligibleBase: number;
  /** Finanțarea maximă posibilă la capacitatea și costul date. */
  maxGrant: number;
  /** Contribuția proprie minimă, ca fracție din valoarea proiectului. */
  minOwnShare: number;
}

/**
 * Plafoanele din art. 5, aplicate simultan.
 *
 * Cei 75% se aplică aici pe baza deja plafonată la standardul de cost, lectura
 * prudentă. Forma consolidată a lămurit ce se întâmplă cu surplusul: ce depășește
 * standardul de cost intră în contribuția proprie (art. 5 alin. 5), dar tot nu
 * spune explicit dacă procentul se calculează pe factura totală sau pe baza
 * plafonată.
 */
export function grantFor(capacityKwh: number, projectCost: number): Grant {
  const eligibleBase = Math.min(projectCost, capacityKwh * PROGRAM.costStandardPerKwh);
  const maxGrant = Math.min(PROGRAM.maxGrant, PROGRAM.maxShare * eligibleBase);
  const minOwnShare =
    projectCost > 0 ? Math.max(PROGRAM.minOwnShare, (projectCost - maxGrant) / projectCost) : PROGRAM.minOwnShare;
  return { eligibleBase, maxGrant, minOwnShare };
}

/**
 * Profilurile de comparație publicate în articol, ca reper relativ. Toate pentru
 * un solicitant fără finanțare publică anterioară pentru stocare (cele 25 de
 * puncte incluse). Cifrele sunt alese rotunde: 12 kWh la 25% dă 63, 16 kWh cu
 * toți cei 15.000 lei (contribuție 37,5% la costul standard) dă 85.
 */
export const REFERENCE_PROFILES = [
  { label: 'Minimul programului', capacity: 10, ownShare: 0.25 },
  { label: 'Baterie medie, contribuție minimă', capacity: 12, ownShare: 0.25 },
  { label: 'Baterie de 16 kWh, toți cei 15.000 lei', capacity: 16, ownShare: 0.375 },
  { label: 'Maxim de punctaj', capacity: 15, ownShare: 0.5 },
] as const;

/** Contribuția de la care criteriul dă punctaj maxim: 37,5 × 0,5/0,5 − 2,5 = 35. */
export const OWN_SHARE_FOR_MAX_POINTS = 0.5;
