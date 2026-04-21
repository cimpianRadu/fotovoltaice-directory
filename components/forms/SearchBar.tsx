'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCounties, getSpecializations } from '@/lib/utils';
import { trackEvent } from '@/lib/analytics';
import SearchableSelect from '@/components/ui/SearchableSelect';

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [county, setCounty] = useState('');
  const [specialization, setSpecialization] = useState('');
  const counties = getCounties();
  const specializations = getSpecializations();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (county) params.set('judet', county);
    if (specialization) params.set('specializare', specialization);

    trackEvent('search_performed', { query: `${query} ${county} ${specialization}`.trim() });
    router.push(`/firme?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSearch} className="flex flex-col gap-3 w-full max-w-2xl">
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
          placeholder="Caută firmă după nume (ex: Simtel, EnergoBit)..."
          className="w-full pl-10 pr-3 py-3 rounded-lg text-gray-900 placeholder-gray-400 bg-white border border-transparent focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchableSelect
          name="county"
          value={county}
          onValueChange={setCounty}
          options={counties.map((c) => ({ value: c, label: c }))}
          placeholder="Toate județele"
          className="flex-1"
        />

        <SearchableSelect
          name="specialization"
          value={specialization}
          onValueChange={setSpecialization}
          options={specializations.map((s) => ({ value: s.id, label: s.label }))}
          placeholder="Toate specializările"
          className="flex-1"
        />

        <button
          type="submit"
          className="bg-primary hover:bg-primary-dark text-white font-semibold px-6 py-3 rounded-lg transition-colors min-h-[44px]"
        >
          Caută
        </button>
      </div>
    </form>
  );
}
