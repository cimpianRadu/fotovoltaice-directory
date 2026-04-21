'use client';

import { useMemo, useState } from 'react';
import CompanyCard from '@/components/company/CompanyCard';
import { type Company, fuzzyMatchCompanyName } from '@/lib/utils';

interface Props {
  companies: Company[];
  county: string;
}

export default function CountyCompanyList({ companies, county }: Props) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return companies;
    return companies.filter((c) => fuzzyMatchCompanyName(c.name, query));
  }, [companies, query]);

  return (
    <>
      <div className="mb-5 max-w-md">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
            />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Caută firmă în ${county}...`}
            className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        {query.trim() && (
          <p className="text-xs text-gray-500 mt-2">
            {filtered.length} din {companies.length} firme
          </p>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-10 mb-10">
          <p className="text-gray-500 text-sm">Nicio firmă nu corespunde căutării.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-10">
          {filtered.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>
      )}
    </>
  );
}
