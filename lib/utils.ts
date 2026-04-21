import companiesDataRaw from '@/data/companies.json';
import specializationsData from '@/data/specializations.json';
import countiesData from '@/data/counties.json';
import { hasActiveAnreCert } from './anre';

export interface Company {
  id: string;
  slug: string;
  name: string;
  cui: string;
  logo?: string;
  description: string;
  founded: number;
  employees: number;
  location: { city: string; county: string; address: string };
  contact: { phone: string; email: string; website: string };
  coverage: string[];
  specializations: string[];
  certifications: string[];
  capacity: { minProjectKw: number; maxProjectKw: number; projectsCompleted: number };
  financials: { year: number; revenue: number; profit: number };
  tags: string[];
  featured: boolean;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
  anreMatch: { societate: string; judet: string } | null;
}
export type Specialization = (typeof specializationsData.specializations)[number];

const companiesData = { companies: companiesDataRaw.companies as unknown as Company[] };

export function getCompanies(): Company[] {
  return companiesData.companies;
}

export function getCompanyBySlug(slug: string): Company | undefined {
  return companiesData.companies.find((c) => c.slug === slug);
}

export function getFeaturedCompanies(): Company[] {
  return companiesData.companies.filter((c) => c.featured);
}

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

export function getTotalStats() {
  const companies = companiesData.companies;
  const totalMW =
    companies.reduce((sum, c) => sum + c.capacity.maxProjectKw, 0) / 1000;
  const totalProjects = companies.reduce(
    (sum, c) => sum + c.capacity.projectsCompleted,
    0
  );
  const counties = new Set(companies.map((c) => c.location.county));

  return {
    companiesCount: companies.length,
    totalMW: Math.round(totalMW),
    totalProjects,
    countiesCount: counties.size,
  };
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

export function getCompaniesByCounty(county: string): Company[] {
  return companiesData.companies.filter((c) => c.location.county === county);
}

export function getCoveredCounties(): string[] {
  const covered = new Set<string>();
  for (const c of companiesData.companies) {
    covered.add(c.location.county);
  }
  return Array.from(covered).sort((a, b) => a.localeCompare(b, 'ro'));
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

export function getCityBySlug(slug: string): string | undefined {
  const cities = getCoveredCities();
  return cities.find((c) => slugifyCity(c) === slug);
}

export function getCompaniesByCity(city: string): Company[] {
  return companiesData.companies.filter((c) => c.location.city === city);
}

export function getCompaniesByCityArea(city: string): Company[] {
  // Returns companies headquartered in the city OR in the same county as the city
  const companiesInCity = companiesData.companies.filter((c) => c.location.city === city);
  const counties = [...new Set(companiesInCity.map((c) => c.location.county))];
  const companiesInArea = companiesData.companies.filter(
    (c) => counties.includes(c.location.county)
  );
  // Deduplicate and put city-based companies first
  const seen = new Set<string>();
  const result: Company[] = [];
  for (const c of [...companiesInCity, ...companiesInArea]) {
    if (!seen.has(c.id)) {
      seen.add(c.id);
      result.push(c);
    }
  }
  return result;
}

export function getCoveredCities(): string[] {
  const cities = new Set<string>();
  for (const c of companiesData.companies) {
    cities.add(c.location.city);
  }
  return Array.from(cities).sort((a, b) => a.localeCompare(b, 'ro'));
}

// Major cities that get dedicated pages (enough search volume)
export const MAJOR_CITIES = [
  'București', 'Cluj-Napoca', 'Timișoara', 'Iași', 'Brașov', 'Craiova', 'Sibiu', 'Oradea',
] as const;

export const SITE_NAME = 'Instalatori Fotovoltaice România';
export const SITE_URL = 'https://instalatori-fotovoltaice.ro';
export const SITE_DESCRIPTION =
  'Platforma #1 pentru firme de instalare panouri fotovoltaice comerciale și industriale din România. Găsește instalatorul potrivit pentru proiectul tău.';
