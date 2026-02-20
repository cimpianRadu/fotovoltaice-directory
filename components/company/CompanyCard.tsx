import Link from 'next/link';
import Badge from '@/components/ui/Badge';
import { type Company, getSpecializationLabel, formatNumber } from '@/lib/utils';

interface CompanyCardProps {
  company: Company;
  view?: 'grid' | 'list';
}

export default function CompanyCard({ company, view = 'grid' }: CompanyCardProps) {
  if (view === 'list') {
    return (
      <Link
        href={`/firme/${company.slug}`}
        className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all bg-white"
      >
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm">{company.name}</h3>
          <p className="text-xs text-gray-500">{company.location.city}, {company.location.county}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 shrink-0">
          <span>Până la {formatNumber(company.capacity.maxProjectKw)} kW</span>
          <span className="text-gray-300">|</span>
          <span>Din {company.founded}</span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/firme/${company.slug}`}
      className="flex flex-col p-5 rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all bg-white"
    >
      <h3 className="font-semibold text-gray-900 mb-1">{company.name}</h3>
      <p className="text-sm text-gray-500 mb-3">
        {company.location.city}, {company.location.county}
      </p>

      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{company.description}</p>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {company.specializations.slice(0, 3).map((spec) => (
          <Badge key={spec} variant="outline" size="sm">
            {getSpecializationLabel(spec)}
          </Badge>
        ))}
      </div>

      <div className="mt-auto pt-3 border-t border-border flex items-center justify-between text-xs text-gray-500">
        <span>Până la {formatNumber(company.capacity.maxProjectKw)} kW</span>
        <span>Din {company.founded}</span>
      </div>
    </Link>
  );
}
