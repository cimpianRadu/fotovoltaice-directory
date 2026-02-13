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
        className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all bg-white"
      >
        <div className="flex items-center gap-3 sm:w-64 shrink-0">
          <div className="w-12 h-12 rounded-lg bg-surface flex items-center justify-center shrink-0">
            <span className="text-lg font-bold text-primary-dark">
              {company.name.charAt(0)}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">{company.name}</h3>
            <p className="text-xs text-gray-500">{company.location.city}, {company.location.county}</p>
          </div>
        </div>

        <div className="flex-1 flex flex-wrap items-center gap-4 text-xs text-gray-600">
          <span>{formatNumber(company.capacity.projectsCompleted)} proiecte</span>
          <span>Până la {formatNumber(company.capacity.maxProjectKw)} kW</span>
          <span>Din {company.founded}</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {company.specializations.slice(0, 3).map((spec) => (
            <Badge key={spec} variant="outline" size="sm">
              {getSpecializationLabel(spec)}
            </Badge>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {company.verified && (
            <Badge variant="success" size="sm">Verificat</Badge>
          )}
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/firme/${company.slug}`}
      className="flex flex-col p-5 rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all bg-white"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-12 h-12 rounded-lg bg-surface flex items-center justify-center">
          <span className="text-lg font-bold text-primary-dark">
            {company.name.charAt(0)}
          </span>
        </div>
        {company.verified && (
          <Badge variant="success" size="sm">Verificat</Badge>
        )}
      </div>

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

      <div className="mt-auto pt-3 border-t border-border grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-lg font-bold text-secondary-dark">
            {formatNumber(company.capacity.projectsCompleted)}
          </p>
          <p className="text-xs text-gray-500">Proiecte</p>
        </div>
        <div>
          <p className="text-lg font-bold text-secondary-dark">
            {formatNumber(company.capacity.maxProjectKw)}
          </p>
          <p className="text-xs text-gray-500">kW max</p>
        </div>
        <div>
          <p className="text-lg font-bold text-secondary-dark">{company.founded}</p>
          <p className="text-xs text-gray-500">Fondat</p>
        </div>
      </div>
    </Link>
  );
}
