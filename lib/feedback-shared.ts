// Opțiunile din formularele de feedback, comune paginii (client) și API-ului.
// Valorile (slug-urile) se scriu în Sheets, etichetele doar se afișează.

export type FeedbackRole = 'client' | 'firma';

type Option = { value: string; label: string };

export const OFERTE_OPTIONS: Option[] = [
  { value: '0', label: 'Niciuna' },
  { value: '1', label: 'Una' },
  { value: '2', label: 'Două' },
  { value: '3', label: 'Trei' },
  { value: '4+', label: 'Patru sau mai multe' },
];

export const PRIMUL_CONTACT_OPTIONS: Option[] = [
  { value: 'aceeasi-zi', label: 'În aceeași zi' },
  { value: '1-2-zile', label: 'În 1–2 zile' },
  { value: '3-7-zile', label: 'În 3–7 zile' },
  { value: 'peste-o-saptamana', label: 'După mai mult de o săptămână' },
];

// Consimțământul de publicare: ce apare public e scris explicit sub întrebare
// și în /termeni-conditii#testimoniale. Valoarea se scrie în Sheets ca atare.
export const TESTIMONIAL_OPTIONS: Option[] = [
  { value: 'da', label: 'Da, cu numele meu' },
  { value: 'da-fara-nume', label: 'Da, dar fără nume' },
  { value: 'nu', label: 'Nu' },
];

export const FIRM_TESTIMONIAL_OPTIONS: Option[] = [
  { value: 'da', label: 'Da, cu numele firmei' },
  { value: 'da-fara-nume', label: 'Da, dar fără numele firmei' },
  { value: 'nu', label: 'Nu' },
];

export const DATE_CORECTE_OPTIONS: Option[] = [
  { value: 'da', label: 'Da, corecte' },
  { value: 'partial', label: 'Parțial' },
  { value: 'nu', label: 'Nu' },
];

// Ce a putut face firma cu datele din cerere, fără alte întrebări (16 sept
// 2026): măsura reală a utilității formularului, nu a clientului.
export const DATE_UTILE_OPTIONS: Option[] = [
  { value: 'oferta-direct', label: 'Am făcut oferta direct din cerere' },
  { value: 'sunat-detalii', label: 'A trebuit să sun pentru detalii' },
  { value: 'vizita', label: 'A fost nevoie de vizită la fața locului' },
];

// Ce a lipsit din cerere; se pot bifa mai multe, valorile se scriu în Sheets
// separate prin virgulă.
export const DATE_LIPSA_OPTIONS: Option[] = [
  { value: 'buget', label: 'Bugetul clientului' },
  { value: 'poze', label: 'Poze cu acoperișul' },
  { value: 'consum', label: 'Consumul real / factura' },
  { value: 'adresa', label: 'Adresa exactă' },
  { value: 'disponibilitate', label: 'Când poate fi sunat' },
  { value: 'nimic', label: 'Nimic, a fost suficient' },
];

export const SATISFACTIE_VALUES = ['1', '2', '3', '4', '5'] as const;

export const FEEDBACK_TEXT_MAX = 2000;

export function isOption(options: Option[], value: unknown): value is string {
  return typeof value === 'string' && options.some((o) => o.value === value);
}
