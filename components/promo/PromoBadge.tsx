import type { PromoTier } from '@/lib/utils';

export function PromovatBadge() {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary-dark">
      ★ Promovat
    </span>
  );
}

export function PremiumBadge() {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-secondary/10 text-secondary-dark">
      ★ Premium
    </span>
  );
}

export function TierBadge({ tier }: { tier: PromoTier | undefined }) {
  if (tier === 'premium' || tier === 'bundle') return <PremiumBadge />;
  if (tier === 'plus') return <PromovatBadge />;
  return null;
}
