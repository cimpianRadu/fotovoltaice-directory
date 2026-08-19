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
 * 2. **Programul** (`PROGRAM`, `scoreFor`, `grantFor`) vine din proiectul de ghid
 *    AFM intrat în consultare publică pe 18 august 2026, art. 5, 7 și 19.
 *    ⚠️ Proiect, nu act final. Orice afișare a acestor cifre trebuie însoțită de
 *    mențiunea că se pot schimba până la publicarea ghidului definitiv.
 *
 * Formulele de mai jos reproduc exact cele 8 repere numerice publicate în
 * articolul nostru (4 profiluri de punctaj + 4 praguri de finanțare).
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

/** Parametrii programului, din proiectul de ghid AFM (consultare 18.08.2026). */
export const PROGRAM = {
  /** Capacitate minimă finanțabilă, în kWh. */
  minKwh: 12,
  /** Standard de cost, lei/kWh cu TVA (art. 5 alin. 4). */
  costStandardPerKwh: 1250,
  /** Cota maximă de finanțare din valoarea proiectului (art. 5 alin. 2). */
  maxShare: 0.75,
  /** Plafon absolut, lei cu TVA (art. 5 alin. 2). */
  maxGrant: 15000,
  /** Contribuția proprie minimă obligatorie (art. 7, definiții). */
  minOwnShare: 0.25,
  /** Punctaj maxim pe fiecare criteriu (art. 19). */
  maxPoints: { contribution: 40, capacity: 40, pv: 20 },
  /** Data la care proiectul a intrat în consultare publică. */
  consultationSince: '2026-08-18',
} as const;

export interface Score {
  contribution: number;
  capacity: number;
  pv: number;
  total: number;
}

/** Punctajul din art. 19. `ownShare` e fracție (0,25 = 25%), nu procent. */
export function scoreFor(capacityKwh: number, pvKw: number, ownShare: number): Score {
  const contribution = Math.max(0, Math.min(PROGRAM.maxPoints.contribution, 80 * ownShare - 10));
  const capacity = Math.min(PROGRAM.maxPoints.capacity, capacityKwh);
  const pv = Math.min(PROGRAM.maxPoints.pv, pvKw);
  return { contribution, capacity, pv, total: contribution + capacity + pv };
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
 * prudentă. Proiectul de ghid nu precizează explicit dacă procentul se calculează
 * pe factura totală sau pe baza plafonată; articolul semnalează ambiguitatea.
 */
export function grantFor(capacityKwh: number, projectCost: number): Grant {
  const eligibleBase = Math.min(projectCost, capacityKwh * PROGRAM.costStandardPerKwh);
  const maxGrant = Math.min(PROGRAM.maxGrant, PROGRAM.maxShare * eligibleBase);
  const minOwnShare =
    projectCost > 0 ? Math.max(PROGRAM.minOwnShare, (projectCost - maxGrant) / projectCost) : PROGRAM.minOwnShare;
  return { eligibleBase, maxGrant, minOwnShare };
}

/** Profilurile de comparație publicate în articol, ca reper relativ. */
export const REFERENCE_PROFILES = [
  { label: 'Prosumator rezidențial tipic', capacity: 12, pv: 5, ownShare: 0.25 },
  { label: 'Casă mare, sistem generos', capacity: 16, pv: 8, ownShare: 0.4 },
  { label: 'Plătește majoritar din buzunar', capacity: 20, pv: 10, ownShare: 0.625 },
  { label: 'Maxim teoretic', capacity: 40, pv: 20, ownShare: 0.625 },
] as const;

/** Contribuția de la care criteriul dă punctaj maxim: 80 × 0,625 − 10 = 40. */
export const OWN_SHARE_FOR_MAX_POINTS = 0.625;
