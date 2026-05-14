/**
 * Single source of truth for /publicitate pricing.
 *
 * Anywhere prices appear on the site (homepage banner, /publicitate page,
 * AdInquiryForm tier options, metadata, etc.) must import from here.
 * NEVER hardcode prices inline — schimbi într-un singur loc, se propagă peste tot.
 */

export type TierId = 'free' | 'basic' | 'plus' | 'premium' | 'bundle';

export interface Tier {
  id: TierId;
  label: string;
  /** Monthly price in EUR. 0 for free tier. */
  monthly: number;
  /** Annual price in EUR (typically monthly × 10 — 2 luni gratis). */
  annual: number;
  /** Short audience label (e.g. "Furnizori, distribuitori"). */
  audience: string;
  /** One-line tagline shown under tier name. */
  tagline: string;
}

export const PRICING: Record<TierId, Tier> = {
  free: {
    id: 'free',
    label: 'Free',
    monthly: 0,
    annual: 0,
    audience: 'Doar instalatori',
    tagline: 'Baza pe care e construit directorul',
  },
  basic: {
    id: 'basic',
    label: 'Basic',
    monthly: 19,
    annual: 190,
    audience: 'Furnizori, distribuitori, materiale',
    tagline: 'Slot în popup carousel — vizibil pe toate paginile site-ului',
  },
  plus: {
    id: 'plus',
    label: 'Plus',
    monthly: 39,
    annual: 390,
    audience: 'Doar instalatori',
    tagline: 'Vizibilitate prioritară pe județul tău + verificare ANRE',
  },
  premium: {
    id: 'premium',
    label: 'Premium',
    monthly: 79,
    annual: 790,
    audience: 'Doar instalatori',
    tagline: 'Expunere națională + profil complet',
  },
  bundle: {
    id: 'bundle',
    label: 'Național Plus',
    monthly: 99,
    annual: 990,
    audience: 'Pentru instalatori cu ambiție regională / națională',
    tagline: 'Plus + Premium simultan — județul tău + paginile globale',
  },
};

/** Bundle math derived from constants — never hardcode these. */
export const BUNDLE = {
  /** Sum of Plus + Premium if bought separately. */
  separateSum: PRICING.plus.monthly + PRICING.premium.monthly,
  /** Bundle price minus separate sum = euro saved per month. */
  monthlySavings: PRICING.plus.monthly + PRICING.premium.monthly - PRICING.bundle.monthly,
  /** Annual savings (× 12). */
  annualSavings:
    (PRICING.plus.monthly + PRICING.premium.monthly - PRICING.bundle.monthly) * 12,
  /** Discount percentage rounded to nearest integer. */
  discountPct: Math.round(
    ((PRICING.plus.monthly + PRICING.premium.monthly - PRICING.bundle.monthly) /
      (PRICING.plus.monthly + PRICING.premium.monthly)) *
      100,
  ),
};

/** Pool caps & SOV math per tier. Matches the actual placement infrastructure on site. */
export const SOV = {
  basic: {
    cap: 8, // max parteneri activi simultan în popup carousel
    rotationSeconds: 15,
    sovPct: Math.round(100 / 8), // ~12.5% when full
  },
  plus: {
    cap: 3, // max firme/județ
    capScope: 'județ' as const,
    sovPct: Math.round(100 / 3), // ~33% when full
  },
  premium: {
    cap: 5, // max firme național
    capScope: 'național' as const,
    sovPct: Math.round(100 / 5), // 20% when full
  },
};

/** TVA în România (B2B services). */
export const TVA_PCT = 21;

/** Helper — formatat preț pentru afișare. */
export function fmtPrice(monthly: number): string {
  return monthly === 0 ? '0 €' : `${monthly} €`;
}

/** Helper — sumar tier pentru form select (label cu preț). */
export function tierSelectLabel(tier: Tier): string {
  if (tier.monthly === 0) return `${tier.label} — gratuit (${tier.audience.toLowerCase()})`;
  return `${tier.label} — ${tier.monthly}€/lună (${tier.audience.toLowerCase()})`;
}
