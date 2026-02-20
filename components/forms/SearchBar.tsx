'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCounties, getSpecializations } from '@/lib/utils';
import { trackEvent } from '@/lib/analytics';
import SearchableSelect from '@/components/ui/SearchableSelect';

export default function SearchBar() {
  const router = useRouter();
  const [county, setCounty] = useState('');
  const [specialization, setSpecialization] = useState('');
  const counties = getCounties();
  const specializations = getSpecializations();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (county) params.set('judet', county);
    if (specialization) params.set('specializare', specialization);

    trackEvent('search_performed', { query: `${county} ${specialization}`.trim() });
    router.push(`/firme?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 w-full max-w-2xl">
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
    </form>
  );
}
