// Asistentul de după cerere: ce se poate importa și din componentele client.
// Fără `server-only`, fără Sheets, fără registre mari. Calculele vin din
// `battery-sizing` (tabelul din ghidul publicat și parametrii programului), nu
// din ce „știe” modelul: rezumatul pe care îl citește firma trebuie să spună
// același lucru ca ghidul nostru.

import { PROGRAM, bracketFor, kwpNeeded } from './battery-sizing';

/** Lucrările din pilot (12 nov 2026). Restul cererilor nu văd asistentul. */
export const ASISTENT_TIPURI = ['doar-baterie', 'extindere'] as const;

/** Câte mesaje poate trimite clientul pe o cerere. Peste, asistentul se oprește. */
export const ASISTENT_MAX_MESAJE = 16;
export const ASISTENT_MAX_CARACTERE = 1000;

/** Ce a confirmat clientul în conversație. Toate câmpurile sunt opționale. */
export interface AsistentDate {
  fazare?: 'monofazat' | 'trifazat' | 'nu-stie';
  /** Marca și modelul invertorului, cum le-a scris clientul. */
  invertor?: string;
  invertorHibrid?: 'da' | 'nu' | 'nu-stie';
  putereSistemKwp?: number;
  /** Bateria pe care o are deja, dacă are. */
  bateriePrezentaKwh?: number;
  consumLunarKwh?: number;
  capacitateDoritaKwh?: number;
  /** De ce vrea capacitatea asta: punctajul programului, backup, consum seara. */
  motivCapacitate?: string;
  deschisExtindere?: 'da' | 'nu' | 'poate';
  programCvb?: 'da' | 'nu' | 'nu-stie';
  /** Ce vrea clientul să afle de la firmă, sau ce trebuie verificat la fața locului. */
  intrebariPentruFirma?: string[];
  /** 2-3 propoziții pentru firmă, scrise de asistent. */
  rezumat?: string;
}

/** Câmpurile din cerere de care are nevoie asistentul (instantaneu din Sheets). */
export interface AsistentCerere {
  tipLucrare: string;
  judet: string;
  putere: string;
  capacitateBaterie: string;
  consumLunar: string;
  fazare: string;
  finantare: string;
  termen: string;
  buget: string;
  scop: string;
  tipAcoperis: string;
  mesaj: string;
}

export interface RezumatSemnal {
  tip: 'atentie' | 'info';
  text: string;
}

export interface RezumatCerere {
  rezumat: string;
  confirmate: { eticheta: string; valoare: string }[];
  semnale: RezumatSemnal[];
  intrebari: string[];
  actualizatLa: string;
}

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ','));

function numar(raw: string | undefined): number | null {
  if (!raw) return null;
  const m = raw.replace(',', '.').match(/\d+(\.\d+)?/);
  const n = m ? parseFloat(m[0]) : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Consumul din formular („350 kWh”, „250 lei”) în kWh pe lună. Leii la 1,30 lei/kWh, ca în calculator. */
function consumKwh(raw: string | undefined): number | null {
  const n = numar(raw);
  if (n === null) return null;
  return /lei/i.test(raw || '') ? n / 1.3 : n;
}

/**
 * Valorile cu care se lucrează: ce a confirmat clientul în conversație bate
 * ce scrisese în formular, fiindcă e mai nou și a fost întrebat explicit.
 */
export function valoriEfective(cerere: AsistentCerere, date: AsistentDate) {
  return {
    putereKwp: date.putereSistemKwp ?? numar(cerere.putere),
    capacitateKwh: date.capacitateDoritaKwh ?? numar(cerere.capacitateBaterie),
    consumKwh: date.consumLunarKwh ?? consumKwh(cerere.consumLunar),
    fazare: date.fazare ?? (cerere.fazare as AsistentDate['fazare'] | ''),
    cvb: date.programCvb === 'da' || (date.programCvb === undefined && cerere.finantare === 'afm-baterii'),
  };
}

/** Semnalele pe care le calculăm noi, din tabelul ghidului și din regulile programului. */
export function semnaleCerere(cerere: AsistentCerere, date: AsistentDate): RezumatSemnal[] {
  const v = valoriEfective(cerere, date);
  const out: RezumatSemnal[] = [];

  if (v.capacitateKwh && v.putereKwp) {
    const [min] = kwpNeeded(v.capacitateKwh);
    if (v.putereKwp < min) {
      const extindere =
        date.deschisExtindere === 'da'
          ? ' Clientul e deschis la extinderea sistemului.'
          : date.deschisExtindere === 'poate'
            ? ' Clientul ar lua în calcul o extindere.'
            : date.deschisExtindere === 'nu'
              ? ' Clientul nu vrea extindere.'
              : '';
      out.push({
        tip: 'atentie',
        text: `Bateria de ${fmt(v.capacitateKwh)} kWh se umple din surplus de la aproximativ ${fmt(min)} kWp (tabelul din ghidul nostru), iar sistemul are ${fmt(v.putereKwp)} kWp.${extindere}`,
      });
    }
  }

  if (v.cvb && v.capacitateKwh && v.capacitateKwh < PROGRAM.minKwh) {
    out.push({
      tip: 'atentie',
      text: `Casa Verde Baterii finanțează de la ${PROGRAM.minKwh} kWh, iar clientul cere ${fmt(v.capacitateKwh)} kWh.`,
    });
  }

  if (v.cvb && date.invertorHibrid === 'nu') {
    out.push({
      tip: 'atentie',
      text: 'Invertorul actual nu e hibrid, iar în Casa Verde Baterii invertorul hibrid nu e cheltuială eligibilă: îl plătește clientul.',
    });
  }

  if (v.fazare === 'nu-stie' || !v.fazare) {
    out.push({ tip: 'info', text: 'Fazarea (mono sau trifazat) nu e confirmată.' });
  }

  if (v.consumKwh && v.capacitateKwh) {
    const [a, b] = bracketFor(v.consumKwh).capacity;
    const interval = a === b ? `${a} kWh` : `${a}–${b} kWh`;
    if (v.capacitateKwh > b || v.capacitateKwh < a) {
      out.push({
        tip: 'info',
        text: `La un consum de ${Math.round(v.consumKwh)} kWh pe lună, tabelul din ghid dă ${interval}; clientul cere ${fmt(v.capacitateKwh)} kWh${date.motivCapacitate ? ` (${date.motivCapacitate})` : ''}.`,
      });
    }
  }

  return out;
}

const FAZARE: Record<string, string> = { monofazat: 'monofazat', trifazat: 'trifazat', 'nu-stie': 'nu știe' };
const DA_NU: Record<string, string> = { da: 'da', nu: 'nu', poate: 'poate', 'nu-stie': 'nu știe' };

/** Rezumatul pe care îl vede firma. `null` dacă clientul n-a confirmat încă nimic. */
export function rezumatCerere(
  cerere: AsistentCerere,
  date: AsistentDate,
  actualizatLa: string,
): RezumatCerere | null {
  const confirmate: RezumatCerere['confirmate'] = [];
  const add = (eticheta: string, valoare: string | undefined) => {
    if (valoare) confirmate.push({ eticheta, valoare });
  };
  add('Invertor', date.invertor);
  add('Invertor hibrid', date.invertorHibrid && DA_NU[date.invertorHibrid]);
  add('Fazare', date.fazare && FAZARE[date.fazare]);
  add('Sistem existent', date.putereSistemKwp ? `${fmt(date.putereSistemKwp)} kWp` : undefined);
  add('Baterie existentă', date.bateriePrezentaKwh ? `${fmt(date.bateriePrezentaKwh)} kWh` : undefined);
  add('Consum lunar', date.consumLunarKwh ? `${Math.round(date.consumLunarKwh)} kWh` : undefined);
  add('Capacitate dorită', date.capacitateDoritaKwh ? `${fmt(date.capacitateDoritaKwh)} kWh` : undefined);
  add('De ce capacitatea asta', date.motivCapacitate);
  add('Extindere sistem', date.deschisExtindere && DA_NU[date.deschisExtindere]);
  add('Casa Verde Baterii', date.programCvb && DA_NU[date.programCvb]);

  const intrebari = (date.intrebariPentruFirma || []).filter(Boolean);
  if (!confirmate.length && !intrebari.length && !date.rezumat) return null;

  return {
    rezumat: date.rezumat || '',
    confirmate,
    semnale: semnaleCerere(cerere, date),
    intrebari,
    actualizatLa,
  };
}
