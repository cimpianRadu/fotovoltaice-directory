// Punctajul estimativ Casa Verde Baterii al unei cereri (16 nov 2026, cerut de
// Radu): afișat clientului după trimitere și în cont, și firmei pe card.
//
// Cifra e cea pe care o dă simulatorul de pe site (components/BatteryWidget) la
// capacitatea cerută de client, cu setările lui de pornire:
//  - costul proiectului = capacitatea × costul standard, 1.500 lei/kWh;
//  - finanțarea cea mai mare posibilă: 75%, dar cel mult 15.000 lei. Peste
//    ~13,3 kWh plafonul urcă singur contribuția proprie (la 15 kWh, 33,4%), iar
//    simulatorul o rotunjește în sus la o zecime de procent, ca aici;
//  - criteriul „capacitate”: 4 × kWh − 20, cel mult 40, de la 15 kWh;
//  - criteriul „contribuție”: între 10 și 35 de puncte;
//  - criteriul „finanțări anterioare”: socotim cele 25 de puncte ale celui care
//    n-a mai avut finanțare publică pentru stocare. Din cerere nu știm dacă a
//    avut, deci interfața o spune explicit lângă cifră.
// Formula e cea din Ordinul nr. 2.314 din 13 noiembrie 2026 (art. 19 alin. 4),
// care a înlocuit-o pe cea cu două criterii de câte 50 de puncte.
// Contribuția reală și prețul real al bateriei nu le știm din cerere, de aici
// „estimativ” și steluța din interfață.
//
// Ce NU se poate spune: dacă punctajul ajunge. Pragul de admitere se află abia
// după sesiune, deci nicăieri „șanse mari” sau „șanse mici”, iar peste tot unde
// apare cifra scrie că e doar informativă și că nu e o garanție (cerut explicit
// de Radu, 16 nov).
//
// Pe 16 nov: 97 de cereri pe AFM baterii, 68 cu capacitatea completată (2 sub
// 10 kWh, 19 la 10–14,9, 29 la 15–19,9, 18 la 20 sau mai mult).
//
// Fără alte importuri decât lib/battery-sizing (funcții pure): ajunge și în
// componentele de client.

import { PROGRAM, grantFor, scoreFor } from './battery-sizing';

export interface CvbScenario {
  /** Contribuția proprie, ca fracție din valoarea proiectului. */
  ownShare: number;
  capacityPoints: number;
  contributionPoints: number;
  /** Cele 25 de puncte ale celui fără finanțare publică anterioară pentru stocare. */
  noPriorFundingPoints: number;
  total: number;
}

export interface CvbEstimate extends CvbScenario {
  /** Capacitatea cerută de client, în kWh. */
  kwh: number;
  /** Sub pragul programului (10 kWh): cererea nu intră la punctaj în forma asta. */
  eligible: boolean;
  /** Capacitatea a atins deja maximul criteriului (15 kWh sau mai mult). */
  capacityMaxed: boolean;
}

/** „15”, „13,8”: capacitatea scrisă de client, cu virgulă sau cu punct. */
function parseKwh(raw: string | undefined | null): number {
  const n = Number.parseFloat(String(raw ?? '').replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Contribuția minimă la costul standard, rotunjită în sus ca în simulator. */
function minOwnShareAtStandardCost(kwh: number): number {
  const g = grantFor(kwh, kwh * PROGRAM.costStandardPerKwh);
  return Math.max(PROGRAM.minOwnShare, Math.ceil(g.minOwnShare * 1000) / 1000);
}

/**
 * Punctajul la o capacitate și o contribuție date. Fără contribuție: minimul
 * posibil la costul standard, ca simulatorul la pornire.
 */
export function cvbScenario(kwh: number, ownShare?: number): CvbScenario {
  const share = Math.max(ownShare ?? 0, minOwnShareAtStandardCost(kwh));
  const s = scoreFor(kwh, share);
  return {
    ownShare: share,
    capacityPoints: s.capacity,
    contributionPoints: s.contribution,
    noPriorFundingPoints: s.noPriorFunding,
    total: s.total,
  };
}

/**
 * Null când cererea nu e pe Casa Verde Baterii sau clientul n-a spus ce
 * capacitate vrea: fără cifra lui nu estimăm nimic.
 */
export function cvbEstimate(l: { finantare?: string; capacitateBaterie?: string }): CvbEstimate | null {
  if ((l.finantare || '').trim() !== 'afm-baterii') return null;
  const kwh = parseKwh(l.capacitateBaterie);
  if (!kwh) return null;
  return {
    kwh,
    eligible: kwh >= PROGRAM.minKwh,
    capacityMaxed: kwh >= PROGRAM.capacityForMaxPoints,
    ...cvbScenario(kwh),
  };
}

/** Cifre cu virgulă românească și fără zecimale inutile: 81,3 · 55 · 13,8. */
export function fmtCvb(n: number): string {
  return (Math.round(n * 10) / 10).toString().replace('.', ',');
}
