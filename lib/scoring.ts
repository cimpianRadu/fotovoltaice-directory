import type { Company } from './utils';
import { hasActiveAnreCert, getCompanyAnreCerts } from './anre';

// Absolute-threshold scoring system. Each criterion awards a fixed number of
// points based on public, verifiable data. Scores DO NOT change when other
// companies are added/removed — every threshold is anchored in real-world units
// (RON, years, MW), not in the current dataset's min/max.

export interface CriterionTier {
  points: number;
  label: string;
}

export interface Criterion {
  id: string;
  label: string;
  icon: string;
  description: string;
  source: string;
  maxPoints: number;
  tiers: CriterionTier[];
  score: (c: Company) => number;
  display: (c: Company) => string;
}

const currentYear = new Date().getFullYear();

function formatCompactCurrency(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1e9).toFixed(1)} mld. RON`;
  if (n >= 1_000_000) return `${(n / 1e6).toFixed(1)} mil. RON`;
  if (n >= 1_000) return `${Math.round(n / 1e3)}k RON`;
  return `${n} RON`;
}

function formatCapacity(kw: number): string {
  if (kw >= 1000) return `${(kw / 1000).toFixed(kw % 1000 === 0 ? 0 : 1)} MW`;
  return `${kw} kW`;
}

export const CRITERIA: Criterion[] = [
  {
    id: 'revenue',
    label: 'Mărime financiară',
    icon: '💰',
    description: 'Cifră de afaceri din bilanțul public',
    source: 'termene.ro',
    maxPoints: 4,
    tiers: [
      { points: 4, label: 'peste 50 mil. RON' },
      { points: 3, label: '15 – 50 mil. RON' },
      { points: 2, label: '5 – 15 mil. RON' },
      { points: 1, label: 'sub 5 mil. RON' },
    ],
    score: (c) => {
      const r = c.financials.revenue;
      if (r >= 50_000_000) return 4;
      if (r >= 15_000_000) return 3;
      if (r >= 5_000_000) return 2;
      if (r > 0) return 1;
      return 0;
    },
    display: (c) => (c.financials.revenue > 0 ? formatCompactCurrency(c.financials.revenue) : '—'),
  },
  {
    id: 'employees',
    label: 'Echipă',
    icon: '👥',
    description: 'Număr de angajați declarați oficial',
    source: 'termene.ro',
    maxPoints: 4,
    tiers: [
      { points: 4, label: 'peste 100 angajați' },
      { points: 3, label: '50 – 100' },
      { points: 2, label: '20 – 50' },
      { points: 1, label: 'sub 20' },
    ],
    score: (c) => {
      const e = c.employees;
      if (e >= 100) return 4;
      if (e >= 50) return 3;
      if (e >= 20) return 2;
      if (e > 0) return 1;
      return 0;
    },
    display: (c) => (c.employees > 0 ? `${c.employees}` : '—'),
  },
  {
    id: 'experience',
    label: 'Experiență',
    icon: '📅',
    description: 'Ani de la înființarea firmei',
    source: 'Registrul Comerțului',
    maxPoints: 4,
    tiers: [
      { points: 4, label: 'peste 15 ani' },
      { points: 3, label: '10 – 15 ani' },
      { points: 2, label: '5 – 10 ani' },
      { points: 1, label: 'sub 5 ani' },
    ],
    score: (c) => {
      if (c.founded <= 0) return 0;
      const y = currentYear - c.founded;
      if (y >= 15) return 4;
      if (y >= 10) return 3;
      if (y >= 5) return 2;
      return 1;
    },
    display: (c) => (c.founded > 0 ? `${currentYear - c.founded} ani` : '—'),
  },
  {
    id: 'anre_c2a',
    label: 'Atestat ANRE C2A',
    icon: '⚡',
    description: 'Atestat activ pentru proiecte >50 kWp (medie/înaltă tensiune)',
    source: 'portal.anre.ro',
    maxPoints: 4,
    tiers: [
      { points: 4, label: 'Are atestat C2A activ' },
      { points: 0, label: 'Nu are' },
    ],
    score: (c) => (hasActiveAnreCert(c.anreMatch, 'C2A') ? 4 : 0),
    display: (c) => (hasActiveAnreCert(c.anreMatch, 'C2A') ? 'C2A ✓' : '—'),
  },
  {
    id: 'anre_low',
    label: 'Atestat ANRE B / C1A',
    icon: '🔌',
    description: 'Atestat JT sau proiectare MT/IT (complementar C2A)',
    source: 'portal.anre.ro',
    maxPoints: 2,
    tiers: [
      { points: 2, label: 'Are atestat' },
      { points: 0, label: 'Nu are' },
    ],
    score: (c) =>
      hasActiveAnreCert(c.anreMatch, 'B') ||
      hasActiveAnreCert(c.anreMatch, 'C1A') ||
      hasActiveAnreCert(c.anreMatch, 'BP') ||
      hasActiveAnreCert(c.anreMatch, 'BE')
        ? 2
        : 0,
    display: (c) => {
      const codes = getCompanyAnreCerts(c.anreMatch)
        .map((x) => x.code)
        .filter((x) => x !== 'C2A');
      return codes.length ? codes.join(', ') : '—';
    },
  },
  {
    id: 'iso',
    label: 'Certificări ISO',
    icon: '🏅',
    description: 'ISO 9001 (calitate), 14001 (mediu), 45001 (SSM)',
    source: 'Site oficial firmă',
    maxPoints: 3,
    tiers: [
      { points: 3, label: '3 certificări ISO' },
      { points: 2, label: '2 certificări' },
      { points: 1, label: '1 certificare' },
      { points: 0, label: 'niciuna' },
    ],
    score: (c) => Math.min(3, (c.certifications || []).filter((x) => x.startsWith('ISO-')).length),
    display: (c) => {
      const n = (c.certifications || []).filter((x) => x.startsWith('ISO-')).length;
      return n > 0 ? `${n}×` : '—';
    },
  },
  {
    id: 'capacity',
    label: 'Capacitate proiect',
    icon: '🔋',
    description: 'Capacitate maximă proiect declarată',
    source: 'Site oficial firmă',
    maxPoints: 4,
    tiers: [
      { points: 4, label: 'peste 1 MW' },
      { points: 3, label: '500 kW – 1 MW' },
      { points: 2, label: '100 – 500 kW' },
      { points: 1, label: 'sub 100 kW' },
    ],
    score: (c) => {
      const k = c.capacity.maxProjectKw;
      if (k >= 1000) return 4;
      if (k >= 500) return 3;
      if (k >= 100) return 2;
      if (k > 0) return 1;
      return 0;
    },
    display: (c) => (c.capacity.maxProjectKw > 0 ? formatCapacity(c.capacity.maxProjectKw) : '—'),
  },
];

export const MAX_SCORE = CRITERIA.reduce((sum, c) => sum + c.maxPoints, 0);

export interface RankedCompany extends Company {
  total: number;
  rank: number;
  breakdown: Record<string, number>;
}

export function rankCompanies(companies: Company[]): RankedCompany[] {
  const scored: RankedCompany[] = companies.map((c) => {
    const breakdown: Record<string, number> = {};
    let total = 0;
    for (const crit of CRITERIA) {
      const pts = crit.score(c);
      breakdown[crit.id] = pts;
      total += pts;
    }
    return { ...c, total, rank: 0, breakdown };
  });

  scored.sort((a, b) => b.total - a.total || b.financials.revenue - a.financials.revenue);
  scored.forEach((c, i) => {
    c.rank = i + 1;
  });

  return scored;
}

export function getBadge(rank: number): { label: string; color: string } | null {
  if (rank === 1) return { label: '#1', color: 'bg-amber-500 text-white' };
  if (rank === 2) return { label: '#2', color: 'bg-gray-400 text-white' };
  if (rank === 3) return { label: '#3', color: 'bg-amber-700 text-white' };
  if (rank <= 5) return { label: 'Top 5', color: 'bg-primary/10 text-primary-dark' };
  if (rank <= 10) return { label: 'Top 10', color: 'bg-secondary/10 text-secondary-dark' };
  return null;
}

export function getScoreLabel(total: number): { label: string; color: string } {
  const pct = total / MAX_SCORE;
  if (pct >= 0.8) return { label: 'Excelent', color: 'bg-green-100 text-green-800' };
  if (pct >= 0.6) return { label: 'Foarte bun', color: 'bg-emerald-50 text-emerald-700' };
  if (pct >= 0.4) return { label: 'Solid', color: 'bg-blue-50 text-blue-700' };
  return { label: 'În creștere', color: 'bg-gray-100 text-gray-600' };
}
