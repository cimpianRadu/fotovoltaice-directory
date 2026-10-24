'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

// Meniul pe grupuri (24 oct 2026): erau 18 taburi pe un rând, care nu mai
// încăpeau. Paginile au rămas la adresele lor, doar se așază sub un grup; al
// doilea rând arată paginile grupului deschis.
const GROUPS: { label: string; tabs: { href: string; label: string }[] }[] = [
  { label: 'Azi', tabs: [{ href: '/admin/azi', label: 'Azi' }] },
  {
    label: 'Cereri',
    tabs: [
      { href: '/admin/cereri', label: 'Toate cererile' },
      { href: '/admin/informez', label: 'Se informează' },
      { href: '/admin/emailuri', label: 'Emailuri către clienți' },
      { href: '/admin/cont-client', label: 'Experiment cont client' },
      { href: '/admin/crm', label: 'CRM vechi' },
    ],
  },
  {
    label: 'Instalatori',
    tabs: [
      { href: '/admin/firme', label: 'CRM firme' },
      { href: '/admin/portal', label: 'Conturi portal' },
      { href: '/admin/necesit', label: 'De pe necesit' },
      { href: '/admin/tinta', label: 'Țintă' },
    ],
  },
  {
    label: 'Documente',
    tabs: [
      { href: '/admin/documente', label: 'Documente' },
      { href: '/admin/comision', label: 'Comision' },
    ],
  },
  {
    label: 'Parteneri',
    tabs: [
      { href: '/admin/sponsori', label: 'Sponsori' },
      { href: '/admin/analytics/sponsori', label: 'Rapoarte' },
    ],
  },
  {
    label: 'Analytics',
    tabs: [
      { href: '/admin/analytics', label: 'Overview' },
      { href: '/admin/analytics/ghiduri', label: 'Ghiduri' },
      { href: '/admin/analytics/firme', label: 'Firme' },
    ],
  },
  { label: 'Social', tabs: [{ href: '/admin/social', label: 'Social' }] },
  { label: 'Teste', tabs: [{ href: '/admin/teste', label: 'Teste' }] },
];

/** Tabul cu cea mai lungă potrivire: /admin/analytics/sponsori/raport/x e la Parteneri, nu la Overview. */
function activeTab(pathname: string): string | null {
  let best: string | null = null;
  for (const g of GROUPS) {
    for (const t of g.tabs) {
      const hit = pathname === t.href || pathname.startsWith(`${t.href}/`);
      if (hit && (!best || t.href.length > best.length)) best = t.href;
    }
  }
  return best;
}

export default function AdminNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const range = searchParams.get('range');
  const qs = range ? `?range=${range}` : '';

  const tab = activeTab(pathname);
  const group = GROUPS.find((g) => g.tabs.some((t) => t.href === tab));

  return (
    <div className="border-b border-slate-200 bg-white print:hidden">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex min-w-0 items-center gap-6">
          <Link href="/admin" className="text-sm font-semibold text-slate-900">
            Admin
          </Link>
          {/* Pe pagina de login nu există unde naviga și nici de unde ieși. */}
          {pathname !== '/admin/login' && (
            <nav className="flex items-center gap-4 overflow-x-auto text-sm whitespace-nowrap text-slate-600">
              {GROUPS.map((g) => {
                const active = g === group;
                return (
                  <Link
                    key={g.label}
                    href={`${g.tabs[0].href}${qs}`}
                    className={`border-b-2 pb-1 transition ${
                      active
                        ? 'border-slate-900 font-medium text-slate-900'
                        : 'border-transparent hover:text-slate-900'
                    }`}
                  >
                    {g.label}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-4 text-xs">
          {pathname !== '/admin/login' && (
            <form method="POST" action="/api/admin/logout">
              <button type="submit" className="text-slate-400 transition hover:text-slate-900">
                Ieși
              </button>
            </form>
          )}
          <Link href="/" className="whitespace-nowrap text-slate-500 hover:text-slate-900">
            ← site public
          </Link>
        </div>
      </div>
      {group && group.tabs.length > 1 && (
        <div className="border-t border-slate-100 bg-slate-50/60">
          <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-1.5 text-xs whitespace-nowrap">
            {group.tabs.map((t) => (
              <Link
                key={t.href}
                href={`${t.href}${qs}`}
                className={`rounded-md px-2.5 py-1 transition ${
                  t.href === tab
                    ? 'bg-white font-medium text-slate-900 shadow-sm ring-1 ring-slate-200'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {t.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
