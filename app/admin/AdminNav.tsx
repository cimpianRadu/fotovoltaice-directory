'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

const TABS = [
  { href: '/admin/crm', label: 'CRM' },
  { href: '/admin/firme', label: 'Instalatori' },
  { href: '/admin/analytics', label: 'Overview' },
  { href: '/admin/analytics/ghiduri', label: 'Ghiduri' },
  { href: '/admin/analytics/firme', label: 'Firme' },
  { href: '/admin/analytics/sponsori', label: 'Sponsori' },
  { href: '/admin/social', label: 'Social' },
];

export default function AdminNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const range = searchParams.get('range');
  const qs = range ? `?range=${range}` : '';

  // Pe pagina de login nu există unde naviga și nici de unde ieși.
  if (pathname === '/admin/login') return null;

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
      <form method="POST" action="/api/admin/logout">
        <button type="submit" className="pb-1 text-slate-400 transition hover:text-slate-900">
          Ieși
        </button>
      </form>
    </nav>
  );
}
