// Watt AI pentru firmele logate (19 nov 2026): ce se poate importa și din
// componentele client. Fără server-only, fără Sheets.

/** Câte mesaje poate trimite o firmă pe zi (ora României). Limita ține costul în frâu. */
export const WATT_FIRME_MESAJE_PE_ZI = 5;

/** Gratuit până la sfârșitul zilei de 10 decembrie 2026, ora României. După, bula dispare. */
export const WATT_FIRME_PANA = '2026-12-10T22:00:00Z';

export const WATT_FIRME_MAX_CARACTERE = 800;

export interface WattFirmeMesaj {
  rol: 'firma' | 'asistent';
  text: string;
  la: string;
  /** Mesajul e un anunț trimis de Radu din /admin, nu o replică a modelului. */
  anunt?: boolean;
  /** Uneltele chemate pentru replica asta (doar în /admin, pentru evaluări). */
  unelte?: string[];
}

/** Ce primește bula la încărcare. */
export interface WattFirmeStare {
  pornit: boolean;
  numeFirma?: string;
  mesaje?: WattFirmeMesaj[];
  ramase?: number;
  /** Anunțul încă nevăzut de firmă: punct pe bulă și primul mesaj la deschidere. */
  anunt?: { id: number; text: string } | null;
}

/** Balonul de salut de deasupra bulei, până când firma o deschide sau îl închide. */
export const SALUT_WATT_FIRME =
  'Bună ziua! Sunt Watt AI. Vă spun ce cereri vi se potrivesc acum, ce au confirmat clienții și cum funcționează platforma.';

export function wattFirmeActiv(acum = new Date()): boolean {
  return acum.getTime() < new Date(WATT_FIRME_PANA).getTime();
}

/** Primul mesaj, când firma n-a vorbit încă cu Watt. Același text și în istoricul modelului. */
export function introWattFirme(numeFirma: string): string {
  const salut = numeFirma ? `Bună ziua, ${numeFirma}!` : 'Bună ziua!';
  return `${salut} Sunt Watt AI, asistentul platformei. Vă pot spune care cereri deschise vi se potrivesc cel mai bine acum, ce au confirmat clienții la cererile preluate de dumneavoastră, cum funcționează platforma și ce scrie în ghidul nostru despre Casa Verde Baterii. Aveți ${WATT_FIRME_MESAJE_PE_ZI} mesaje pe zi, gratuit până pe 10 decembrie.`;
}
