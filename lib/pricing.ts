/**
 * Single source of truth for /publicitate pricing.
 *
 * Anywhere prices appear on the site (homepage banner, /publicitate page,
 * AdInquiryForm tier options, metadata, etc.) must import from here.
 * NEVER hardcode prices inline — schimbi într-un singur loc, se propagă peste tot.
 *
 * Model simplificat (iunie 2026): Free (instalatori) + 3 opțiuni plătite —
 * Slot Popup (intrare), Premium (vizibilitate peste tot), Studiu de caz (la cerere).
 */

export type TierId = 'free' | 'popup' | 'premium' | 'casestudy';

export interface Tier {
  id: TierId;
  label: string;
  /** Monthly price in EUR. 0 for free tier. Ignored when `custom` is true. */
  monthly: number;
  /** Annual price in EUR (typically monthly × 10 — 2 luni gratis). */
  annual: number;
  /** True for offers quoted individually — no fixed price shown ("la cerere"). */
  custom?: boolean;
  /** Short audience label (e.g. "Instalatori"). */
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
    audience: 'Instalatori',
    tagline: 'Baza pe care e construit site-ul',
  },
  popup: {
    id: 'popup',
    label: 'Slot Popup',
    monthly: 19,
    annual: 190,
    audience: 'Instalatori, furnizori, distribuitori',
    tagline: 'Slot în bannerul promo (colț dreapta-jos) — vizibil pe toate paginile',
  },
  premium: {
    id: 'premium',
    label: 'Premium',
    monthly: 79,
    annual: 790,
    audience: 'Instalatori',
    tagline: 'Prezență premium — vizibilitate maximă — profil complet al firmei',
  },
  casestudy: {
    id: 'casestudy',
    label: 'Studiu de caz',
    monthly: 0,
    annual: 0,
    custom: true,
    audience: 'Instalatori',
    tagline: 'Articol colaborativ despre un proiect de-al tău, publicat pe site',
  },
};

/** Pool caps & SOV math per placement. Matches the actual placement infrastructure on site. */
export const SOV = {
  popup: {
    cap: 8, // max parteneri activi simultan în popup carousel
    rotationSeconds: 15,
    sovPct: Math.round(100 / 8), // ~12.5% when full
  },
  premium: {
    cap: 5, // max firme în pool-ul rotativ național
    sovPct: Math.round(100 / 5), // 20% when full
  },
};

/** TVA în România (B2B services). */
export const TVA_PCT = 21;

/** Helper — formatat preț pentru afișare. */
export function fmtPrice(tier: Tier): string {
  if (tier.custom) return 'La cerere';
  return tier.monthly === 0 ? '0 €' : `${tier.monthly} €`;
}

/** Helper — sumar tier pentru form select (label cu preț). */
export function tierSelectLabel(tier: Tier): string {
  if (tier.custom) return `${tier.label} — preț la cerere (${tier.audience.toLowerCase()})`;
  if (tier.monthly === 0) return `${tier.label} — gratuit (${tier.audience.toLowerCase()})`;
  return `${tier.label} — ${tier.monthly}€/lună (${tier.audience.toLowerCase()})`;
}
