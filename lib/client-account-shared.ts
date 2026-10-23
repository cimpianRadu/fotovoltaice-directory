// Partea contului de client care se vede și din browser (lib/client-account.ts e
// doar pentru server): variantele de răspuns pe fiecare firmă și plafonul de
// retrimiteri. Aceleași valori de ambele părți, o singură sursă.

export const FIRM_REPORT_OPTIONS = [
  { value: 'nesunat', label: 'Nu m-a sunat' },
  { value: 'sunat', label: 'M-a sunat, n-am primit ofertă' },
  { value: 'oferta', label: 'Am primit ofertă' },
  { value: 'semnat', label: 'Am semnat cu ei' },
] as const;
export type FirmReport = (typeof FIRM_REPORT_OPTIONS)[number]['value'];

export function isFirmReport(s: unknown): s is FirmReport {
  return typeof s === 'string' && FIRM_REPORT_OPTIONS.some((o) => o.value === s);
}

/** „Încă vreau oferte”: de 2 ori în 7 zile (Radu, 23 oct 2026). */
export const BUMPS_PER_WEEK = 2;
