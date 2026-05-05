'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

const TABS = [
  { href: '/admin/analytics', label: 'Overview' },
  { href: '/admin/analytics/ghiduri', label: 'Ghiduri' },
  { href: '/admin/analytics/sponsori', label: 'Sponsori' },
];

export default function AdminNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const range = searchParams.get('range');
  const qs = range ? `?range=${range}` : '';

  return (
    <nav className="flex items-center gap-4 text-sm text-slate-600">
      {TABS.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={`${t.href}${qs}`}
            className={`pb-1 border-b-2 transition ${
              active
                ? 'text-slate-900 border-slate-900 font-medium'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
