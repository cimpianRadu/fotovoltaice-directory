// Partea contului de client care se vede și din browser (lib/client-account.ts e
// doar pentru server): variantele de răspuns pe fiecare firmă și plafonul de
// retrimiteri. Aceleași valori de ambele părți, o singură sursă.

export const FIRM_REPORT_OPTIONS = [
  { value: 'nesunat', label: 'Nu m-a sunat' },
  { value: 'sunat', label: 'M-a sunat, n-am primit ofertă' },
  { value: 'oferta', label: 'Am primit ofertă' },
  // Radu, 23 oct 2026: „trebuie și o opțiune de «oferta nu mi-a convenit»”.
  { value: 'refuzat', label: 'Oferta nu mi-a convenit' },
  { value: 'semnat', label: 'Am semnat cu ei' },
] as const;
export type FirmReport = (typeof FIRM_REPORT_OPTIONS)[number]['value'];

export function isFirmReport(s: unknown): s is FirmReport {
  return typeof s === 'string' && FIRM_REPORT_OPTIONS.some((o) => o.value === s);
}

/** De ce nu i-a convenit oferta. Opțional; ajunge în nota din CRM. */
export const REFUZ_REASON_OPTIONS = [
  { value: 'scump', label: 'Prea scumpă' },
  { value: 'solutie', label: 'Nu mi s-a potrivit soluția propusă' },
  { value: 'incredere', label: 'Nu m-a convins firma' },
  { value: 'altceva', label: 'Alt motiv' },
] as const;
export type RefuzReason = (typeof REFUZ_REASON_OPTIONS)[number]['value'];

export function isRefuzReason(s: unknown): s is RefuzReason {
  return typeof s === 'string' && REFUZ_REASON_OPTIONS.some((o) => o.value === s);
}

/** O notiță a clientului despre o firmă (30 oct 2026), și câte poate lăsa pe o cerere. */
export const NOTE_MAX = 1000;
export const NOTES_PER_LEAD = 100;

/** „Încă vreau oferte”: de 2 ori în 7 zile (Radu, 23 oct 2026). */
export const BUMPS_PER_WEEK = 2;
