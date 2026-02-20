import type { Company } from '@/lib/utils';

interface CompanyHeaderProps {
  company: Company;
}

export default function CompanyHeader({ company }: CompanyHeaderProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">{company.name}</h1>

      <p className="text-gray-500 mb-3">
        {company.location.city}, {company.location.county} &middot; CUI: {company.cui}
      </p>

      <p className="text-gray-600 leading-relaxed">{company.description}</p>
    </div>
  );
}
