import Link from 'next/link';
import type { RangePreset } from '@/lib/umami';

const PRESETS: { value: RangePreset; label: string }[] = [
  { value: 'this-month', label: 'Luna curentă' },
  { value: 'last-month', label: 'Luna trecută' },
  { value: 'last-30d', label: 'Ultimele 30 zile' },
  { value: 'last-7d', label: 'Ultimele 7 zile' },
];

export default function RangePicker({
  pathname,
  preset,
}: {
  pathname: string;
  preset: RangePreset;
}) {
  return (
    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
      {PRESETS.map((p) => (
        <Link
          key={p.value}
          href={`${pathname}?range=${p.value}`}
          className={`px-3 py-1.5 text-xs rounded-md transition ${
            preset === p.value
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {p.label}
        </Link>
      ))}
    </div>
  );
}

export function resolvePreset(value: string | undefined): RangePreset {
  return (PRESETS.find((p) => p.value === value)?.value ?? 'this-month') as RangePreset;
}
