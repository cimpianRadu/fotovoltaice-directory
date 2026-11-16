'use client';

import { useRouter } from 'next/navigation';

/**
 * Alegerea zilei pentru „ce s-a mișcat în portal în ziua X". Schimbarea datei
 * navighează direct, fără buton: e un filtru, nu un formular.
 */
export default function DayPicker({
  value,
  max,
  base,
}: {
  value: string;
  max: string;
  /** Adresa paginii fără zi (păstrează sortarea); ziua se adaugă ca `zi=`. */
  base: string;
}) {
  const router = useRouter();
  return (
    <input
      type="date"
      value={value}
      max={max}
      onChange={(e) => {
        const day = e.target.value;
        const sep = base.includes('?') ? '&' : '?';
        router.push(day ? `${base}${sep}zi=${day}` : base);
      }}
      className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
      aria-label="Alege ziua"
    />
  );
}
