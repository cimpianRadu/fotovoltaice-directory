// Helpers "ușoare" — tipuri, formatare, filtre — fără companies.json.
// Componentele CLIENT importă de AICI (sau din lib/anre-certs), nu din lib/utils,
// ca să nu tragă directorul de firme (~300 KB) în bundle pe pagini care nu-l afișează.
// lib/utils re-exportă totul de aici, deci codul server poate importa oricare din ele.
import specializationsData from '@/data/specializations.json';
import countiesData from '@/data/counties.json';
import { hasActiveAnreCert } from '@/lib/anre-certs';

// Model simplificat (iunie 2026): listare Free + Slot Popup (carousel, infra separată
// în PartnerCarousel) + Premium. Premium = vizibilitate "peste tot" — acoperă atât
// plasarea pe județ/ANRE cât și pool-ul global. „Studiu de caz" e o ofertă de conținut,
// nu un promoTier de card.
export type PromoTier = 'free' | 'popup' | 'premium';

// Market segment a company serves. Drives the "Casă vs Firmă" split across the site.
// 'ambele' = serves both residential and commercial.
export type Segment = 'comercial' | 'rezidential' | 'ambele';

export interface CompanySocials {
  facebook?: string;
  linkedin?: string;
  instagram?: string;
  youtube?: string;
}

// Recenzie publicată pe pagina firmei. Provenance contează: o recenzie ajunsă la noi
// prin platformă (clientul a venit din /cere-oferta) nu e același lucru cu una
// transmisă de firmă. `source` e obligatoriu ca să putem eticheta onest fiecare
// recenzie în UI, iar textul se publică doar cu acordul clientului.
export type TestimonialSource = 'platforma' | 'firma';

export interface Testimonial {
  // Numele afișat, așa cum a aprobat clientul: „Maria P." sau numele firmei client.
  author: string;
  text: string;
  // ISO date (YYYY-MM-DD) — când a fost dată recenzia, nu când am publicat-o.
  date: string;
  // Nota 1-5. Opțională: multe recenzii vin ca text liber, fără notă.
  rating?: number;
  // Oraș sau județ al proiectului.
  location?: string;
  // Capacitatea instalată, când clientul o confirmă.
  projectKw?: number;
  source: TestimonialSource;
}

export interface FinancialYear {
  year: number;
  revenue: number;
  profit: number;
  employees?: number;
}

export interface Company {
  id: string;
  slug: string;
  name: string;
  cui: string;
  logo?: string;
  description: string;
  longDescription?: string;
  founded: number;
  employees: number;
  location: { city: string; county: string; address: string };
  contact: { phone: string; email: string; website: string };
  socials?: CompanySocials;
  coverage: string[];
  specializations: string[];
  certifications: string[];
  capacity: { minProjectKw: number; maxProjectKw: number; projectsCompleted: number };
  financials: {
    year: number;
    revenue: number;
    profit: number;
    // Bilanțurile ANAF pe ultimii ani, cel mai vechi primul. Scris de
    // scripts/refresh-financials.js; absent pe firmele fără date în API.
    history?: FinancialYear[];
  };
  tags: string[];
  featured: boolean;
  verified: boolean;
  promoTier?: PromoTier;
  createdAt: string;
  updatedAt: string;
  anreMatch: { societate: string; judet: string } | null;
  // Market segment served. Defaults to 'comercial' when absent (legacy entries).
  segment?: Segment;
  // Recenzii de la clienți, publicate manual după acordul clientului. Absent pe
  // majoritatea firmelor.
  testimonials?: Testimonial[];
}

// Normalize a company's segment, treating legacy entries (no field) as commercial.
export function getCompanySegment(c: Company): Segment {
  return c.segment ?? 'comercial';
}

// Does a company belong in the given view? 'ambele' shows in both. A null/undefined
// view (no choice made yet) shows everything.
export function companyMatchesSegment(c: Company, view: Segment | null | undefined): boolean {
  if (!view) return true;
  const s = getCompanySegment(c);
  return s === 'ambele' || s === view;
}

export const PROMO_CAPS = {
  popup: 8, // max parteneri în popup carousel (infra PartnerCarousel)
  plusPerCounty: 3, // max firme Premium în „Promovate" pe pagina județului
  plusOnAnre: 5, // max firme Premium featured pe /verificare-anre
  premiumPool: 5, // max firme Premium în pool-ul global
} as const;

// Premium acoperă „peste tot": atât plasarea pe județ/ANRE (fostul Plus) cât și
// pool-ul global. Ambele helper-e întorc true pentru 'premium' — păstrate separat
// pentru claritate la punctele de plasare diferite.
export function hasPlusPlacement(c: Company): boolean {
  return c.promoTier === 'premium';
}

export function hasPremiumPlacement(c: Company): boolean {
  return c.promoTier === 'premium';
}

export type Specialization = (typeof specializationsData.specializations)[number];

export function getSpecializations(): Specialization[] {
  return specializationsData.specializations;
}

export function getSpecializationLabel(id: string): string {
  const spec = specializationsData.specializations.find((s) => s.id === id);
  return spec?.label ?? id;
}

export function getCounties(): string[] {
  return countiesData.counties;
}

// Slugurile tipProiect din LeadForm (comercial + rezidențial) → etichete de afișat.
// Folosit pe /cereri și în notificările de revendicare.
export function getProjectTypeLabel(slug: string): string {
  const labels: Record<string, string> = {
    'hala-industriala': 'Hală industrială',
    'cladire-birouri': 'Clădire de birouri',
    'parc-logistic': 'Parc logistic',
    'agricol': 'Agricol (fermă, seră, depozit)',
    'retail': 'Retail (magazin, centru comercial)',
    'hotel': 'Hotel / Pensiune',
    'institutie': 'Instituție publică',
    'casa-individuala': 'Casă individuală',
    'vila': 'Vilă',
    'casa-vacanta': 'Casă de vacanță',
    'apartament': 'Apartament / bloc',
    'altele': 'Alt tip de proiect',
  };
  return labels[slug] ?? slug;
}

// Tip acoperiș + fazare: cerute de instalatori ca să poată oferta fără un tur
// telefonic prealabil (feedback JTS Instal Construct, iulie 2026). Listele diferă
// pe segment — o hală industrială n-are șindrilă. „Panouri sandwich" stă totuși
// pe ambele: anexele și garajele pe structură metalică de la case sunt frecvente
// în rural (feedback instalator, august 2026).
export const ROOF_TYPES_REZIDENTIAL = [
  { value: 'tigla-ceramica', label: 'Țiglă ceramică sau din beton' },
  { value: 'tabla', label: 'Tablă (fălțuită sau trapezoidală)' },
  { value: 'panouri-sandwich', label: 'Panouri sandwich' },
  { value: 'terasa', label: 'Terasă / acoperiș plat cu membrană' },
  // Adăugată pe 25 aug 2026, după o cerere din Cluj: un om de la bloc care voia
  // panouri pe terasa lui a bifat „Terasă / acoperiș plat", singurul lucru care
  // semăna, iar firma citea „acoperișul blocului" — cu totul altă lucrare și
  // alte avize.
  { value: 'balcon-terasa-apartament', label: 'Balcon / terasa apartamentului' },
  { value: 'sindrila', label: 'Șindrilă bituminoasă' },
  { value: 'azbociment', label: 'Azbociment / eternit' },
  { value: 'la-sol', label: 'La sol (curte sau teren)' },
  { value: 'carport', label: 'Carport / parcare acoperită' },
  { value: 'nu-stiu', label: 'Altul / nu știu' },
] as const;

// Valorile comune celor două liste folosesc aceeași etichetă intenționat:
// ROOF_LABELS le indexează după slug, iar etichete divergente ar face afișajul
// de pe /cereri să depindă de ordinea de construire a mapei.

export const ROOF_TYPES_COMERCIAL = [
  { value: 'tabla-cutata', label: 'Tablă cutată / trapezoidală' },
  { value: 'panouri-sandwich', label: 'Panouri sandwich' },
  { value: 'terasa', label: 'Terasă / acoperiș plat cu membrană' },
  { value: 'beton', label: 'Planșeu de beton' },
  { value: 'tigla-ceramica', label: 'Țiglă ceramică sau din beton' },
  { value: 'azbociment', label: 'Azbociment / eternit' },
  { value: 'la-sol', label: 'La sol (curte sau teren)' },
  { value: 'carport', label: 'Carport / parcare acoperită' },
  { value: 'nu-stiu', label: 'Altul / nu știu' },
] as const;

export const PHASE_TYPES = [
  { value: 'monofazat', label: 'Monofazat (o fază)' },
  { value: 'trifazat', label: 'Trifazat (trei faze)' },
  { value: 'nu-stiu', label: 'Nu știu' },
] as const;

/**
 * Branșamentul electric la locul instalării, cerut de instalatori pe 18 aug
 * 2026: „unii pun cerere și nici măcar n-au branșament făcut". Fără el nu se
 * poate racorda nimic, deci schimbă complet discuția și termenul, nu doar
 * prețul. „Nu știu" e răspuns valid: pe o casă cumpărată recent chiar nu se
 * știe fără să te uiți la contract.
 */
export const CONNECTION_OPTIONS = [
  { value: 'da', label: 'Da, există branșament' },
  { value: 'nu', label: 'Nu, trebuie făcut' },
  { value: 'nu-stiu', label: 'Nu știu' },
] as const;

export function getConnectionLabel(slug: string): string {
  return CONNECTION_OPTIONS.find((o) => o.value === slug)?.label ?? slug;
}

/** Varianta scurtă, pentru cardurile din feed și pastilele din portal. */
export function getConnectionShort(slug: string): string {
  if (slug === 'da') return 'Da';
  if (slug === 'nu') return 'Nu, de făcut';
  return 'Nu știe';
}

const ROOF_LABELS: Record<string, string> = Object.fromEntries(
  [...ROOF_TYPES_REZIDENTIAL, ...ROOF_TYPES_COMERCIAL].map((o) => [o.value, o.label]),
);

export function getRoofTypeLabel(slug: string): string {
  return ROOF_LABELS[slug] ?? slug;
}

export function getPhaseLabel(slug: string): string {
  return PHASE_TYPES.find((o) => o.value === slug)?.label ?? slug;
}

// Ruta de finanțare (iulie 2026). Separă clientul care cumpără acum de cel care
// așteaptă un program, iar diferența e mare: Casa Verde Fotovoltaice nu are
// sesiune deschisă în 2026, iar ghidul pentru baterii nu era publicat la 27 iul.
// Fără câmpul ăsta, instalatorul sună la nimereală, dă peste clienți care
// așteaptă, și încetează să mai sune. Listele diferă pe segment: Casa Verde e
// pentru persoane fizice, Electric Up pentru IMM.
// „Fonduri proprii" și „caută finanțare" sunt intenționat separate: sunt doi
// clienți diferiți. Unul cumpără acum, celălalt cumpără dacă îi iese creditul,
// iar amestecate într-o singură opțiune semnalul se pierde exact acolo unde
// contează, la trimiterea cererii mai departe.
export const FINANCING_REZIDENTIAL = [
  { value: 'fonduri-proprii', label: 'Fonduri proprii' },
  { value: 'credit', label: 'Vreau finanțare sau credit' },
  { value: 'casa-verde', label: 'Aștept Casa Verde (AFM)' },
  { value: 'afm-baterii', label: 'Baterii prin AFM (am deja panouri)' },
  { value: 'nu-stiu', label: 'Nu știu încă, vreau să aflu' },
] as const;

export const FINANCING_COMERCIAL = [
  { value: 'fonduri-proprii', label: 'Fonduri proprii' },
  { value: 'credit', label: 'Vreau finanțare sau credit' },
  { value: 'electric-up', label: 'Electric Up' },
  { value: 'alt-program', label: 'Alt program (Fond Modernizare, SME Eco-Tech, AFIR)' },
  { value: 'nu-stiu', label: 'Nu știu încă, vreau să aflu' },
] as const;

// Ca la ROOF_*: valorile comune celor două liste au aceeași etichetă, altfel
// afișajul ar depinde de ordinea de construire a mapei.
const FINANCING_LABELS: Record<string, string> = Object.fromEntries(
  [...FINANCING_REZIDENTIAL, ...FINANCING_COMERCIAL].map((o) => [o.value, o.label]),
);

// Etichete scurte pentru chip-uri (card /cereri, card CRM).
const FINANCING_SHORT: Record<string, string> = {
  'fonduri-proprii': 'Fonduri proprii',
  credit: 'Caută finanțare',
  'casa-verde': 'Așteaptă Casa Verde',
  'afm-baterii': 'Baterii prin AFM',
  'electric-up': 'Electric Up',
  'alt-program': 'Alt program',
  'nu-stiu': 'Nu știe încă',
};

/**
 * `ready` = cumpără pe banii lui, `credit` = cumpără dacă îi iese finanțarea,
 * `program` = depinde de o sesiune care poate să nu fie deschisă, `unknown` = nu
 * s-a lămurit. Sunt patru pentru că fiecare cere alt următor pas din partea ta.
 */
export type FinancingTone = 'ready' | 'credit' | 'program' | 'unknown';

export function getFinancingLabel(slug: string): string {
  return FINANCING_LABELS[slug] ?? slug;
}

export function getFinancingShort(slug: string): string {
  return FINANCING_SHORT[slug] ?? slug;
}

export function getFinancingTone(slug: string): FinancingTone {
  if (slug === 'fonduri-proprii') return 'ready';
  if (slug === 'credit') return 'credit';
  if (!slug || slug === 'nu-stiu') return 'unknown';
  return 'program';
}

// Baterie, stație de încărcare, termen (aug 2026) — câmpurile care fac o cerere
// „ofertabilă pe orb": fără ele, prețul variază cu zeci de mii de lei (o baterie
// dublează proiectul) iar firmele nu pot estima nimic din feedul anonimizat.
export const STORAGE_OPTIONS = [
  { value: 'da', label: 'Da, vreau și baterie' },
  { value: 'nu', label: 'Nu' },
  { value: 'nu-stiu', label: 'Nu m-am hotărât' },
] as const;

export const WALLBOX_OPTIONS = [
  { value: 'da', label: 'Da' },
  { value: 'nu', label: 'Nu' },
  { value: 'nu-stiu', label: 'Nu m-am hotărât' },
] as const;

// „Mă informez" e opțiune onestă intenționat: separă clientul care cumpără de
// cel care compară prețuri, exact ca la finanțare. O cerere „mă informez" e tot
// o cerere, dar firma știe să n-o sune de trei ori pe zi.
/**
 * Ce lucrare vrea, de fapt. Adăugat pe 25 aug 2026 fiindcă feedul nu avea cum să
 * exprime „am deja panouri, vreau doar baterie": omul era obligat să scrie ceva
 * în câmpul de putere și scria orice. Un prosumator din București cu 6 kW montați
 * a trecut acolo „15", crezând că așa se încadrează la Casa Verde Baterii, iar
 * cardul îl arăta firmelor ca pe o cerere de sistem de 15 kW.
 *
 * Sunt cel puțin șase cereri de retrofit în feed (Bihor, Ilfov, Constanța,
 * Ialomița, Timiș, Brăila), iar Casa Verde Baterii abia se deschide.
 */
export const WORK_TYPES = [
  { value: 'sistem-nou', label: 'Sistem fotovoltaic nou (panouri + invertor)' },
  { value: 'doar-baterie', label: 'Doar baterie de stocare (am deja panouri)' },
  { value: 'extindere', label: 'Extindere sau modernizare a unui sistem existent' },
] as const;

/** Eticheta scurtă, pentru cardul din /cereri unde spațiul e puțin. */
const WORK_TYPE_SHORT: Record<string, string> = {
  'sistem-nou': 'Sistem nou',
  'doar-baterie': 'Doar baterie',
  extindere: 'Extindere sistem',
};

export function getWorkTypeLabel(slug: string): string {
  return WORK_TYPES.find((o) => o.value === slug)?.label ?? slug;
}

export function getWorkTypeShort(slug: string): string {
  return WORK_TYPE_SHORT[slug] ?? slug;
}

/** Lucrările pe un sistem care există deja: puterea declarată e a lui, nu a cererii. */
export function isRetrofit(tipLucrare: string): boolean {
  return tipLucrare === 'doar-baterie' || tipLucrare === 'extindere';
}

export const TIMELINE_OPTIONS = [
  { value: 'cat-mai-repede', label: 'Cât mai repede' },
  { value: '1-3-luni', label: 'În 1-3 luni' },
  { value: 'peste-3-luni', label: 'Peste 3 luni' },
  { value: 'ma-informez', label: 'Deocamdată mă informez' },
] as const;

// Intervalul în care clientul vrea să fie sunat (aug 2026). Nu e un detaliu de
// proiect, e singura variabilă din formular care atinge direct problema
// măsurată: din cei 7 clienți întrebați dacă i-a sunat vreo firmă, 5 au spus nu.
// Un om sunat când poate răspunde e un om care răspunde.
export const CALL_WINDOW_OPTIONS = [
  { value: 'dimineata', label: 'Dimineața (9-12)' },
  { value: 'dupa-amiaza', label: 'După-amiaza (12-17)' },
  { value: 'seara', label: 'Seara (17-20)' },
  { value: 'oricand', label: 'Oricând' },
] as const;

export function getCallWindowLabel(slug: string): string {
  return CALL_WINDOW_OPTIONS.find((o) => o.value === slug)?.label ?? slug;
}

const YES_NO_LABELS: Record<string, string> = {
  da: 'Da',
  nu: 'Nu',
  'nu-stiu': 'Nehotărât',
};

export function getYesNoLabel(slug: string): string {
  return YES_NO_LABELS[slug] ?? slug;
}

export function getTimelineLabel(slug: string): string {
  return TIMELINE_OPTIONS.find((o) => o.value === slug)?.label ?? slug;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency: 'RON',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ro-RO').format(num);
}

// Vârsta unei cereri în zile CALENDARISTICE pe ora României, nu în ferestre
// glisante de 24h: o cerere de ieri seara e „ieri" din prima clipă a zilei de
// azi, nu abia după ce trec 24 de ore de la trimitere. en-CA dă „YYYY-MM-DD",
// pe care Date.parse îl citește ca miezul nopții UTC, deci diferența e mereu
// un multiplu exact de zile.
const RO_DAY = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Bucharest',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function calendarAgeDays(iso: string, now: Date = new Date()): number {
  const midnight = (d: Date) => Date.parse(RO_DAY.format(d));
  return Math.round((midnight(now) - midnight(new Date(iso))) / 86_400_000);
}

export function cerereAgeLabel(days: number): string {
  if (days <= 0) return 'azi';
  if (days === 1) return 'ieri';
  return `acum ${days} zile`;
}

const RO_MONTHS_SHORT = ['ian', 'feb', 'mar', 'apr', 'mai', 'iun', 'iul', 'aug', 'sep', 'oct', 'noi', 'dec'];

export function formatShortDate(iso: string | undefined | null): string {
  if (!iso) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return '';
  const year = m[1];
  const month = RO_MONTHS_SHORT[parseInt(m[2], 10) - 1];
  const day = parseInt(m[3], 10);
  return `${day} ${month} ${year}`;
}

// Fuzzy-match a company by name: diacritic-insensitive, token-based substring match,
// ignoring common legal suffixes (S.R.L., S.A.). Returns true if every token in the
// normalized query appears as a substring of the normalized candidate.
export function normalizeCompanyName(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(s\.?r\.?l\.?|s\.?a\.?)\b/g, '')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function fuzzyMatchCompanyName(name: string, query: string): boolean {
  const q = normalizeCompanyName(query);
  if (!q) return true;
  const n = normalizeCompanyName(name);
  const tokens = q.split(' ').filter(Boolean);
  return tokens.every((t) => n.includes(t));
}

export function getCertificationLabel(cert: string): string {
  const labels: Record<string, string> = {
    'ANRE-C2A': 'ANRE C2A',
    'ANRE-B': 'ANRE B',
    'ISO-9001': 'ISO 9001',
    'ISO-14001': 'ISO 14001',
    'ISO-45001': 'ISO 45001',
  };
  return labels[cert] ?? cert;
}

export function getCertificationDescription(cert: string): string {
  const descriptions: Record<string, string> = {
    'ANRE-C2A': 'Atestat pentru proiectare și executare instalații electrice exterioare (medie/înaltă tensiune). Necesar pentru proiecte comerciale și industriale peste 50 kWp.',
    'ANRE-B': 'Atestat pentru executare instalații electrice de joasă tensiune. Acoperă proiecte rezidențiale și comerciale mici (sub 50 kWp).',
    'ISO-9001': 'Sistem de management al calității conform standardului internațional ISO 9001.',
    'ISO-14001': 'Sistem de management de mediu conform standardului internațional ISO 14001.',
    'ISO-45001': 'Sistem de management al sănătății și securității ocupaționale conform ISO 45001.',
  };
  return descriptions[cert] ?? '';
}

export function isAnreCertification(cert: string): boolean {
  return cert.startsWith('ANRE-');
}

export function getTagLabel(tag: string): string {
  const labels: Record<string, string> = {
    'experienta-10-ani': 'Experiență 10+ ani',
    'proiecte-mari': 'Proiecte mari (>500kW)',
    'mentenanta-inclusa': 'Mentenanță inclusă',
    'finantare-disponibila': 'Finanțare disponibilă',
    'garantie-extinsa': 'Garanție extinsă',
    'monitorizare-inclusa': 'Monitorizare inclusă',
  };
  return labels[tag] ?? tag;
}

export function filterCompanies(
  companies: Company[],
  filters: {
    county?: string;
    specialization?: string;
    minCapacity?: number;
    certification?: string;
    tag?: string;
    search?: string;
  }
): Company[] {
  return companies.filter((company) => {
    if (filters.county && company.location.county !== filters.county) {
      return false;
    }
    if (
      filters.specialization &&
      !company.specializations.includes(filters.specialization)
    ) {
      return false;
    }
    if (
      filters.minCapacity &&
      company.capacity.maxProjectKw < filters.minCapacity
    ) {
      return false;
    }
    if (filters.certification) {
      if (filters.certification.startsWith('ANRE-')) {
        const code = filters.certification.replace(/^ANRE-/, '');
        if (!hasActiveAnreCert(company.anreMatch, code)) return false;
      } else if (!company.certifications.includes(filters.certification)) {
        return false;
      }
    }
    if (filters.tag && !company.tags.includes(filters.tag)) {
      return false;
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      return (
        company.name.toLowerCase().includes(q) ||
        company.description.toLowerCase().includes(q) ||
        company.location.city.toLowerCase().includes(q) ||
        company.location.county.toLowerCase().includes(q)
      );
    }
    return true;
  });
}

export function sortCompanies(
  companies: Company[],
  sortBy: string
): Company[] {
  const sorted = [...companies];
  switch (sortBy) {
    case 'projects':
      return sorted.sort(
        (a, b) => b.capacity.projectsCompleted - a.capacity.projectsCompleted
      );
    case 'founded':
      return sorted.sort((a, b) => a.founded - b.founded);
    case 'capacity':
      return sorted.sort(
        (a, b) => b.capacity.maxProjectKw - a.capacity.maxProjectKw
      );
    case 'newest':
      return sorted.sort((a, b) =>
        (b.createdAt || '').localeCompare(a.createdAt || '')
      );
    default:
      // Relevance: featured first, then by projects
      return sorted.sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        if (a.verified !== b.verified) return a.verified ? -1 : 1;
        return b.capacity.projectsCompleted - a.capacity.projectsCompleted;
      });
  }
}

export function slugifyCounty(county: string): string {
  return county
    .toLowerCase()
    .replace(/ă/g, 'a')
    .replace(/â/g, 'a')
    .replace(/î/g, 'i')
    .replace(/ș/g, 's')
    .replace(/ț/g, 't')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function getCountyBySlug(slug: string): string | undefined {
  return countiesData.counties.find((c) => slugifyCounty(c) === slug);
}

export function slugifyCity(city: string): string {
  return city
    .toLowerCase()
    .replace(/ă/g, 'a')
    .replace(/â/g, 'a')
    .replace(/î/g, 'i')
    .replace(/ș/g, 's')
    .replace(/ț/g, 't')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Major cities that get dedicated pages (enough search volume)
export const MAJOR_CITIES = [
  'București', 'Cluj-Napoca', 'Timișoara', 'Iași', 'Brașov', 'Craiova', 'Sibiu', 'Oradea',
] as const;

export const SITE_NAME = 'Instalatori Fotovoltaice România';
export const SITE_URL = 'https://instalatori-fotovoltaice.ro';
export const SITE_DESCRIPTION =
  'Platforma #1 pentru firme de instalare panouri fotovoltaice comerciale și industriale din România. Găsește instalatorul potrivit pentru proiectul tău.';
