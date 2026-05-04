import CompanyCard from '@/components/company/CompanyCard';
import PromoRotator from './PromoRotator';
import { getPremiumCompanies, PROMO_CAPS } from '@/lib/utils';

interface PremiumPoolSectionProps {
  title?: string;
  subtitle?: string;
  max?: number;
  variant?: 'compact' | 'full';
}

export default function PremiumPoolSection({
  title = 'Firme Recomandate',
  subtitle = 'Instalatori Premium — verificați și autorizați ANRE',
  max,
  variant = 'full',
}: PremiumPoolSectionProps) {
  const companies = getPremiumCompanies();
  if (companies.length === 0) return null;

  const displayMax = max ?? PROMO_CAPS.premiumPool;
  const sharePct = Math.round(100 / Math.min(companies.length, displayMax));

  if (variant === 'compact') {
    return (
      <div className="rounded-xl border border-secondary/20 bg-secondary/5 p-4">
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <p className="text-xs font-semibold uppercase tracking-wider text-secondary-dark">
            ★ {title}
          </p>
          <p className="text-[10px] text-gray-500">
            ~{sharePct}% share · rotație random
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <PromoRotator
            items={companies}
            max={Math.min(displayMax, 2)}
            keyOf={(c) => c.id}
            render={(c) => <CompanyCard company={c} />}
          />
        </div>
      </div>
    );
  }

  return (
    <section className="my-10">
      <div className="rounded-xl border border-secondary/20 bg-linear-to-br from-secondary/5 via-white to-primary/5 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-secondary-dark">
              ★ {title}
            </p>
            <p className="text-sm text-gray-700 mt-0.5">{subtitle}</p>
          </div>
          <p className="text-[10px] text-gray-500">
            Pool max {PROMO_CAPS.premiumPool} firme · ~{sharePct}% share fiecare · rotație random
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <PromoRotator
            items={companies}
            max={displayMax}
            keyOf={(c) => c.id}
            render={(c) => <CompanyCard company={c} />}
          />
        </div>
      </div>
    </section>
  );
}
