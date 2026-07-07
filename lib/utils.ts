// Funcțiile care depind de companies.json (~300 KB) stau AICI. Helpers-ele pure
// (tipuri, formatare, filtre, counties/specializations) stau în lib/utils-shared.ts
// și sunt re-exportate mai jos — componentele CLIENT importă din utils-shared ca să
// nu tragă directorul de firme în bundle pe pagini care nu afișează lista.
import companiesDataRaw from '@/data/companies.json';
import {
  type Company,
  type Segment,
  companyMatchesSegment,
  hasPlusPlacement,
  hasPremiumPlacement,
  PROMO_CAPS,
  slugifyCity,
} from '@/lib/utils-shared';

export * from '@/lib/utils-shared';

const companiesData = { companies: companiesDataRaw.companies as unknown as Company[] };

export function getPlusCompaniesForCounty(county: string): Company[] {
  return companiesData.companies
    .filter((c) => c.location.county === county && hasPlusPlacement(c))
    .slice(0, PROMO_CAPS.plusPerCounty);
}

export function getPlusCompaniesForAnre(): Company[] {
  return companiesData.companies.filter(hasPlusPlacement).slice(0, PROMO_CAPS.plusOnAnre);
}

export function getPremiumCompanies(): Company[] {
  return companiesData.companies.filter(hasPremiumPlacement).slice(0, PROMO_CAPS.premiumPool);
}

export function getCompanies(): Company[] {
  return companiesData.companies;
}

export function getCompanyBySlug(slug: string): Company | undefined {
  return companiesData.companies.find((c) => c.slug === slug);
}

export function getFeaturedCompanies(): Company[] {
  return companiesData.companies.filter((c) => c.featured);
}

export function getCompaniesBySegment(view: Segment | null | undefined): Company[] {
  return companiesData.companies.filter((c) => companyMatchesSegment(c, view));
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
