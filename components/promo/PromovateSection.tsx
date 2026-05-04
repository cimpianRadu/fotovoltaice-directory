import CompanyCard from '@/components/company/CompanyCard';
import PromoRotator from './PromoRotator';
import type { Company } from '@/lib/utils';

interface PromovateSectionProps {
  companies: Company[];
  max: number;
  title?: string;
  subtitle?: string;
  shareLabel?: string;
}

export default function PromovateSection({
  companies,
  max,
  title = 'Promovate',
  subtitle,
  shareLabel,
}: PromovateSectionProps) {
  if (companies.length === 0) return null;

  const sharePct = Math.round(100 / Math.min(companies.length, max));

  return (
    <section className="mb-8">
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary-dark">
              ★ {title}
            </p>
            {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          </div>
          <p className="text-[10px] text-gray-500">
            {shareLabel ?? `Max ${max} firme · ~${sharePct}% share fiecare · rotație random`}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <PromoRotator
            items={companies}
            max={max}
            keyOf={(c) => c.id}
            render={(c) => <CompanyCard company={c} />}
          />
        </div>
      </div>
    </section>
  );
}
