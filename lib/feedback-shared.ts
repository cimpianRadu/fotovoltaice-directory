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

export const STUDIU_CAZ_OPTIONS: Option[] = [
  { value: 'da', label: 'Da, cu numele firmei' },
  { value: 'da-fara-nume', label: 'Da, dar fără numele firmei' },
  { value: 'nu', label: 'Nu' },
];

export const PANA_LA_SEMNARE_OPTIONS: Option[] = [
  { value: 'sub-o-saptamana', label: 'Sub o săptămână' },
  { value: '1-2-saptamani', label: '1–2 săptămâni' },
  { value: '2-4-saptamani', label: '2–4 săptămâni' },
  { value: 'peste-o-luna', label: 'Peste o lună' },
];

export const DATE_CORECTE_OPTIONS: Option[] = [
  { value: 'da', label: 'Da, corecte' },
  { value: 'partial', label: 'Parțial' },
  { value: 'nu', label: 'Nu' },
];

export const CLIENT_HOTARAT_OPTIONS: Option[] = [
  { value: 'hotarat', label: 'Era deja hotărât' },
  { value: 'compara', label: 'Compara oferte' },
  { value: 'convins', label: 'A trebuit convins' },
];

export const BATERIE_OPTIONS: Option[] = [
  { value: 'da', label: 'Da' },
  { value: 'nu', label: 'Nu' },
];

export const SATISFACTIE_VALUES = ['1', '2', '3', '4', '5'] as const;

export const FEEDBACK_TEXT_MAX = 2000;

export function isOption(options: Option[], value: unknown): value is string {
  return typeof value === 'string' && options.some((o) => o.value === value);
}
