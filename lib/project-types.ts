/**
 * Tipurile de proiect din formularul de cerere, scoase din LeadForm ca să poată
 * fi folosite și în afara lui.
 *
 * Motivul concret: heroul de pe homepage pune aceleași opțiuni direct în pagină
 * și trimite alegerea în `/cere-oferta?tip=…`. Dacă lista ar sta în două locuri,
 * un `value` schimbat într-unul din ele ar produce linkuri care ajung în
 * formular fără nicio potrivire, adică exact bugul pe care nu-l vezi la build.
 *
 * `value` NU se schimbă fără migrare: ajunge în coloana F din Sheet, e citit de
 * `getProjectTypeLabel` (lib/utils-shared) la afișarea cererilor și de
 * `lib/lead-match` la potrivirea cu firmele.
 *
 * Fișierul e importat de componente client, deci n-are voie să atingă
 * `lib/utils` sau `lib/anre` (vezi CLAUDE.md). N-are nicio dependință.
 */

export type Segment = 'comercial' | 'rezidential';

export interface ProjectType {
  value: string;
  label: string;
}

export const COMMERCIAL_PROJECT_TYPES: ProjectType[] = [
  { value: 'hala-industriala', label: 'Hală industrială' },
  { value: 'cladire-birouri', label: 'Clădire de birouri' },
  { value: 'parc-logistic', label: 'Parc logistic' },
  { value: 'agricol', label: 'Agricol (fermă, seră, depozit)' },
  { value: 'retail', label: 'Retail (magazin, centru comercial)' },
  { value: 'hotel', label: 'Hotel / Pensiune' },
  { value: 'institutie', label: 'Instituție publică' },
  { value: 'altele', label: 'Altele' },
];

export const RESIDENTIAL_PROJECT_TYPES: ProjectType[] = [
  { value: 'casa-individuala', label: 'Casă individuală' },
  { value: 'vila', label: 'Vilă' },
  { value: 'casa-vacanta', label: 'Casă de vacanță' },
  { value: 'apartament', label: 'Apartament / bloc' },
  { value: 'altele', label: 'Altele' },
];

/**
 * Segmentul căruia îi aparține un tip de proiect, sau `null` dacă nu se poate
 * spune. `altele` există în ambele liste cu aceeași valoare, deci e ambiguu prin
 * construcție: linkurile care preselectează un tip nu au voie să-l folosească.
 */
export function segmentForProjectType(value: string): Segment | null {
  if (value === 'altele') return null;
  if (RESIDENTIAL_PROJECT_TYPES.some((t) => t.value === value)) return 'rezidential';
  if (COMMERCIAL_PROJECT_TYPES.some((t) => t.value === value)) return 'comercial';
  return null;
}
