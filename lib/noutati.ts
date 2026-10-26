// Noutățile platformei pentru firme (26 oct 2026): într-un modal deschis din
// meniu (firma logată) și din portal, cu bulină pentru ce n-a văzut firma, și în
// rezumatul de luni, câte au intrat în săptămâna dinainte.
//
// Intră doar ce vede sau primește o firmă (cereri, portal, emailuri), scris ca
// ce primește ea, nu cum funcționează pe dinăuntru. Intrarea se adaugă în același
// commit cu schimbarea: o listă rămasă în urmă arată a platformă abandonată.
//
// Fără importuri din lib/utils sau lib/sheets: fișierul ajunge în bundle-ul
// clientului pe fiecare pagină, prin headerul site-ului.

import noutatiData from '@/data/noutati.json';

export interface Noutate {
  /** YYYY-MM-DD, ziua în care a ajuns pe site. */
  data: string;
  titlu: string;
  text: string;
  /** Cale relativă, ca „/cereri” sau „/portal#alerte”. */
  link?: string;
  linkText?: string;
}

/** Cele mai noi primele. */
export const NOUTATI: Noutate[] = [...(noutatiData as Noutate[])].sort((a, b) => b.data.localeCompare(a.data));

/** Ziua din București ca YYYY-MM-DD, deplasată cu `offsetDays`. */
export function bucharestDay(now = new Date(), offsetDays = 0): string {
  const today = now.toLocaleDateString('en-CA', { timeZone: 'Europe/Bucharest' });
  if (!offsetDays) return today;
  const d = new Date(`${today}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

/**
 * Pentru rezumatul de luni: noutățile din cele 7 zile dinaintea ediției, fără
 * ziua ei. Rezumatul pleacă la 08:00, deci ce ajunge pe site lunea intră în
 * ediția următoare și nu se pierde între două.
 */
export function noutatiForWeeklyDigest(now = new Date()): Noutate[] {
  const today = bucharestDay(now);
  const from = bucharestDay(now, -7);
  return NOUTATI.filter((n) => n.data >= from && n.data < today);
}
