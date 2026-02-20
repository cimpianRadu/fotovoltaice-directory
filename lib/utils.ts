import companiesData from '@/data/companies.json';
import specializationsData from '@/data/specializations.json';
import countiesData from '@/data/counties.json';

export type Company = (typeof companiesData.companies)[number];
export type Specialization = (typeof specializationsData.specializations)[number];

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
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ro-RO').format(num);
}

export function getCertificationLabel(cert: string): string {
  const labels: Record<string, string> = {
    'ANRE-C2A': 'ANRE C2A',
    'ISO-9001': 'ISO 9001',
    'ISO-14001': 'ISO 14001',
    'ISO-45001': 'ISO 45001',
  };
  return labels[cert] ?? cert;
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
  const counties = new Set(companies.flatMap((c) => c.coverage));

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
    if (filters.county && !company.coverage.includes(filters.county)) {
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
    if (
      filters.certification &&
      !company.certifications.includes(filters.certification)
    ) {
      return false;
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
    default:
      // Relevance: featured first, then by projects
      return sorted.sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        if (a.verified !== b.verified) return a.verified ? -1 : 1;
        return b.capacity.projectsCompleted - a.capacity.projectsCompleted;
      });
  }
}

export const SITE_NAME = 'Instalatori Fotovoltaice România';
export const SITE_URL = 'https://instalatori-fotovoltaice.ro';
export const SITE_DESCRIPTION =
  'Director pentru firme de instalare panouri fotovoltaice comerciale și industriale din România. Găsește instalatorul potrivit pentru proiectul tău.';
