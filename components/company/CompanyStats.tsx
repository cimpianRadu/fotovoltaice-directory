import { formatNumber, type Company } from '@/lib/utils';

interface CompanyStatsProps {
  company: Company;
}

export default function CompanyStats({ company }: CompanyStatsProps) {
  const stats = [
    { label: 'Fondat', value: String(company.founded) },
    { label: 'Angajați', value: formatNumber(company.employees) },
    { label: 'Proiecte finalizate', value: formatNumber(company.capacity.projectsCompleted) },
    {
      label: 'Capacitate maximă',
      value: `${formatNumber(company.capacity.maxProjectKw)} kW`,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-surface rounded-lg p-4 text-center">
          <p className="text-lg font-bold text-secondary-dark">{stat.value}</p>
          <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
