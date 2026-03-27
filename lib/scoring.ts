import type { Company } from './utils';

export interface RankedCompany extends Company {
  score: number;
  rank: number;
  scoreBreakdown: {
    revenue: number;
    employees: number;
    experience: number;
    certifications: number;
    capacity: number;
  };
}

const WEIGHTS = {
  revenue: 30,
  employees: 20,
  experience: 20,
  certifications: 15,
  capacity: 15,
};

function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return Math.min(1, Math.max(0, (value - min) / (max - min)));
}

export function rankCompanies(companies: Company[]): RankedCompany[] {
  if (companies.length === 0) return [];

  const currentYear = new Date().getFullYear();

  // Compute ranges for normalization
  const revenues = companies.map((c) => c.financials.revenue);
  const employees = companies.map((c) => c.employees);
  const experiences = companies.map((c) => (c.founded > 0 ? currentYear - c.founded : 0));
  const capacities = companies.map((c) => c.capacity.maxProjectKw);
  const certCounts = companies.map((c) => c.certifications.length);

  const ranges = {
    revenue: { min: Math.min(...revenues), max: Math.max(...revenues) },
    employees: { min: Math.min(...employees), max: Math.max(...employees) },
    experience: { min: Math.min(...experiences), max: Math.max(...experiences) },
    capacity: { min: Math.min(...capacities), max: Math.max(...capacities) },
    certifications: { min: Math.min(...certCounts), max: Math.max(...certCounts) },
  };

  const scored = companies.map((company) => {
    const yearsExp = company.founded > 0 ? currentYear - company.founded : 0;

    const breakdown = {
      revenue: Math.round(normalize(company.financials.revenue, ranges.revenue.min, ranges.revenue.max) * WEIGHTS.revenue),
      employees: Math.round(normalize(company.employees, ranges.employees.min, ranges.employees.max) * WEIGHTS.employees),
      experience: Math.round(normalize(yearsExp, ranges.experience.min, ranges.experience.max) * WEIGHTS.experience),
      certifications: Math.round(normalize(company.certifications.length, ranges.certifications.min, ranges.certifications.max) * WEIGHTS.certifications),
      capacity: Math.round(normalize(company.capacity.maxProjectKw, ranges.capacity.min, ranges.capacity.max) * WEIGHTS.capacity),
    };

    const score = breakdown.revenue + breakdown.employees + breakdown.experience + breakdown.certifications + breakdown.capacity;

    return {
      ...company,
      score,
      rank: 0,
      scoreBreakdown: breakdown,
    };
  });

  // Sort by score descending, then by revenue as tiebreaker
  scored.sort((a, b) => b.score - a.score || b.financials.revenue - a.financials.revenue);

  // Assign ranks
  scored.forEach((company, i) => {
    company.rank = i + 1;
  });

  return scored;
}

export function getBadge(rank: number): { label: string; color: string } | null {
  if (rank === 1) return { label: '#1', color: 'bg-amber-500 text-white' };
  if (rank === 2) return { label: '#2', color: 'bg-gray-400 text-white' };
  if (rank === 3) return { label: '#3', color: 'bg-amber-700 text-white' };
  if (rank <= 5) return { label: `Top 5`, color: 'bg-primary/10 text-primary-dark' };
  if (rank <= 10) return { label: `Top 10`, color: 'bg-secondary/10 text-secondary-dark' };
  if (rank <= 20) return { label: `Top 20`, color: 'bg-gray-100 text-gray-600' };
  return null;
}

export const METHODOLOGY = {
  title: 'Cum se calculează scorul?',
  description:
    'Clasamentul este generat automat pe baza datelor publice din registrele oficiale românești. Scorul maxim este 100 de puncte.',
  criteria: [
    { name: 'Cifră de afaceri', weight: WEIGHTS.revenue, source: 'termene.ro / listafirme.eu' },
    { name: 'Număr angajați', weight: WEIGHTS.employees, source: 'termene.ro' },
    { name: 'Ani de experiență', weight: WEIGHTS.experience, source: 'Registrul Comerțului' },
    { name: 'Certificări (ANRE, ISO)', weight: WEIGHTS.certifications, source: 'ANRE, site oficial firmă' },
    { name: 'Capacitate maximă proiect', weight: WEIGHTS.capacity, source: 'Site oficial firmă' },
  ],
};
