import Image from 'next/image';
import type { Company } from '@/lib/utils';

interface CompanyHeaderProps {
  company: Company;
}

export default function CompanyHeader({ company }: CompanyHeaderProps) {
  const initials = company.name
    .split(/[\s-]+/)
    .filter(w => w.length > 1 && w[0] === w[0].toUpperCase())
    .slice(0, 2)
    .map(w => w[0])
    .join('');

  return (
    <div>
      <div className="flex items-center gap-4 mb-3">
        {company.logo ? (
          <Image
            src={company.logo}
            alt={`Logo ${company.name}`}
            width={56}
            height={56}
            className="rounded-xl object-contain bg-white"
            style={{ width: 56, height: 56 }}
          />
        ) : (
          <div className="rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center text-secondary font-bold text-lg" style={{ width: 56, height: 56 }}>
            {initials}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
          <p className="text-gray-500">
            {company.location.city}, {company.location.county} &middot; CUI: {company.cui}
          </p>
        </div>
      </div>

      <p className="text-gray-600 leading-relaxed">{company.description}</p>
    </div>
  );
}
