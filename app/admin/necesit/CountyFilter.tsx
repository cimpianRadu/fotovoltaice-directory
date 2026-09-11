'use client';

import { useRouter } from 'next/navigation';
import SearchableSelect from '@/components/ui/SearchableSelect';

/**
 * Județul e singurul filtru cu prea multe valori pentru pastile (41). Navighează
 * prin URL, ca restul filtrelor paginii — starea rămâne în link, deci o listă de
 * apeluri pe un județ se poate ține deschisă într-un tab.
 */
export default function CountyFilter({
  counties,
  value,
  filtru,
}: {
  counties: { value: string; label: string }[];
  value: string;
  filtru?: string;
}) {
  const router = useRouter();

  return (
    <div className="w-full sm:w-72">
      <SearchableSelect
        name="judet"
        options={[{ value: '', label: 'Toate județele' }, ...counties]}
        value={value}
        placeholder="Toate județele"
        onValueChange={(v) => {
          const qs = new URLSearchParams();
          if (v) qs.set('judet', v);
          if (filtru) qs.set('filtru', filtru);
          const q = qs.toString();
          router.push(q ? `/admin/necesit?${q}` : '/admin/necesit');
        }}
      />
    </div>
  );
}
