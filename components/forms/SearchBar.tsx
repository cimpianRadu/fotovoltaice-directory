'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCounties, getSpecializations } from '@/lib/utils';
import { trackEvent } from '@/lib/analytics';

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
      <select
        value={county}
        onChange={(e) => setCounty(e.target.value)}
        className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 bg-white focus:border-primary focus:ring-1 focus:ring-primary outline-none appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke-width%3D%222%22%20stroke%3D%22%236b7280%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22m19.5%208.25-7.5%207.5-7.5-7.5%22%20%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.5rem_center] bg-no-repeat pr-10"
      >
        <option value="">Toate județele</option>
        {counties.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <select
        value={specialization}
        onChange={(e) => setSpecialization(e.target.value)}
        className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 bg-white focus:border-primary focus:ring-1 focus:ring-primary outline-none appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke-width%3D%222%22%20stroke%3D%22%236b7280%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20d%3D%22m19.5%208.25-7.5%207.5-7.5-7.5%22%20%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem] bg-[right_0.5rem_center] bg-no-repeat pr-10"
      >
        <option value="">Toate specializările</option>
        {specializations.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>

      <button
        type="submit"
        className="bg-primary hover:bg-primary-dark text-white font-semibold px-6 py-3 rounded-lg transition-colors min-h-[44px]"
      >
        Caută
      </button>
    </form>
  );
}
