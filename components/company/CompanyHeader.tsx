import Badge from '@/components/ui/Badge';
import type { Company } from '@/lib/utils';

interface CompanyHeaderProps {
  company: Company;
}

export default function CompanyHeader({ company }: CompanyHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start gap-4">
      <div className="w-16 h-16 rounded-xl bg-surface flex items-center justify-center shrink-0">
        <span className="text-2xl font-bold text-primary-dark">
          {company.name.charAt(0)}
        </span>
      </div>

      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
          {company.verified && (
            <Badge variant="success">Verificat</Badge>
          )}
          {company.featured && (
            <Badge variant="primary">Recomandat</Badge>
          )}
        </div>

        <p className="text-gray-500 mb-2">
          {company.location.city}, {company.location.county} &middot; CUI: {company.cui}
        </p>

        <p className="text-gray-600 leading-relaxed">{company.description}</p>
      </div>
    </div>
  );
}
