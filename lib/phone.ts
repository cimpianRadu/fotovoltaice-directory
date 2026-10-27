// Telefonul din formulare (cererea clientului, listarea firmei, publicitatea,
// profilul din portal, revendicarea), verificat cu libphonenumber-js
// (metadatele Google, aceleași ca pe Android), nu cu reguli scrise de mână.
// În browser îl folosește components/ui/PhoneInput, pe server rutele API.
//
// De ce (27 oct 2026): în cererea clientului verificam doar că nu e gol, iar
// din 250 de cereri 5 aveau un număr la care nu se putea suna (11 cifre, numele
// scris în câmp). Numerele din străinătate trebuie să treacă: 7 din 250 erau din
// Anglia, Germania și Irlanda. Fără prefix, numărul e citit ca românesc, iar
// „0044…” trece și el, fiindcă 00 e prefixul internațional din România.

import { parsePhoneNumberFromString } from 'libphonenumber-js/min';

// Fără „tu” sau „dumneavoastră”: același mesaj apare și la clienți, și la firme.
export const PHONE_ERROR = 'Numărul nu pare corect. Pentru un număr din străinătate e nevoie de prefixul țării, de exemplu +44.';

/**
 * Numărul în forma în care îl salvăm, sau null dacă nu e valid. Cele românești
 * rămân ca până acum, „0740123456”; cele din străinătate, cu prefix: „+447496394586”.
 */
export function cleanPhone(raw: string): string | null {
  const phone = parsePhoneNumberFromString(raw, 'RO');
  if (!phone?.isValid()) return null;
  return phone.country === 'RO' ? `0${phone.nationalNumber}` : phone.number;
}
