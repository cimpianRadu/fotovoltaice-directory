import Link from 'next/link';
import Image from 'next/image';
import Badge from '@/components/ui/Badge';
import { type Company, getSpecializationLabel, formatNumber, formatShortDate } from '@/lib/utils';
import { getCompanyAnreCerts, getAnreCodeLabel } from '@/lib/anre';

function CompanyLogo({ company, size = 40 }: { company: Company; size?: number }) {
  const initials = company.name
    .split(/[\s-]+/)
    .filter(w => w.length > 1 && w[0] === w[0].toUpperCase())
    .slice(0, 2)
    .map(w => w[0])
    .join('');

  if (company.logo) {
    return (
      <Image
        src={company.logo}
        alt={`Logo ${company.name}`}
        width={size}
        height={size}
        className="rounded-lg object-contain bg-white"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center text-secondary font-semibold text-sm"
      style={{ width: size, height: size }}
    >
      {initials}
    </div>
  );
}

interface CompanyCardProps {
  company: Company;
  view?: 'grid' | 'list';
}

export default function CompanyCard({ company, view = 'grid' }: CompanyCardProps) {
  const anreCerts = getCompanyAnreCerts(company.anreMatch);

  if (view === 'list') {
    return (
      <Link
        href={`/firme/${company.slug}`}
        className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all bg-white"
      >
        <CompanyLogo company={company} size={32} />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-sm">{company.name}</h3>
          <p className="text-xs text-gray-500">{company.location.city}, {company.location.county}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 shrink-0">
          {anreCerts.map((cert) => (
            <Badge key={cert.code} variant={cert.code === 'C2A' ? 'success' : 'outline'} size="sm">
              {getAnreCodeLabel(cert.code)}
            </Badge>
          ))}
          <span>Până la {formatNumber(company.capacity.maxProjectKw)} kW</span>
          <span className="text-gray-300">|</span>
          <span>Din {company.founded}</span>
          {company.createdAt && (
            <>
              <span className="text-gray-300">|</span>
              <span>Adăugat {formatShortDate(company.createdAt)}</span>
            </>
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
      <div className="flex items-center gap-3 mb-3">
        <CompanyLogo company={company} size={40} />
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900">{company.name}</h3>
          <p className="text-sm text-gray-500">
            {company.location.city}, {company.location.county}
          </p>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{company.description}</p>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {company.specializations.slice(0, 3).map((spec) => (
          <Badge key={spec} variant="outline" size="sm">
            {getSpecializationLabel(spec)}
          </Badge>
        ))}
      </div>

      {anreCerts.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {anreCerts.map((cert) => (
            <Badge key={cert.code} variant={cert.code === 'C2A' ? 'success' : 'default'} size="sm">
              {getAnreCodeLabel(cert.code)}
            </Badge>
          ))}
        </div>
      )}

      <div className="mt-auto pt-3 border-t border-border text-xs text-gray-500">
        <div className="flex items-center justify-between">
          <span>Până la {formatNumber(company.capacity.maxProjectKw)} kW</span>
          <span>Din {company.founded}</span>
        </div>
        {company.createdAt && (
          <p className="mt-1 text-[11px] text-gray-400">
            Adăugat {formatShortDate(company.createdAt)}
          </p>
        )}
      </div>
    </Link>
  );
}
