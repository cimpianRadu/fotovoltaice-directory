import Link from 'next/link';

const SECTIONS = [
  {
    href: '/admin/crm',
    label: 'CRM',
    desc: 'Cereri, listări și revendicări din Sheets, într-un singur loc.',
  },
  {
    href: '/admin/social',
    label: 'Social',
    desc: 'Pipeline postări: coadă, întârziate, postate, idei. Sursa: data/social-schedule.json.',
  },
  {
    href: '/admin/analytics',
    label: 'Analytics · Overview',
    desc: 'Vizitatori, pagini și referrers din Umami.',
  },
  {
    href: '/admin/analytics/ghiduri',
    label: 'Analytics · Ghiduri',
    desc: 'Ce ghiduri trag trafic.',
  },
  {
    href: '/admin/analytics/firme',
    label: 'Analytics · Firme',
    desc: 'Ce profile de firmă sunt vizitate.',
  },
  {
    href: '/admin/analytics/sponsori',
    label: 'Analytics · Sponsori',
    desc: 'Afișări și click-uri pe bannerele de sponsor.',
  },
];

export default function AdminHome() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Admin</h1>
        <p className="text-sm text-slate-500 mt-1">Panourile interne ale platformei.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="rounded-lg border border-slate-200 bg-white px-4 py-3 transition hover:border-slate-400"
          >
            <div className="font-medium text-slate-900">{s.label}</div>
            <p className="text-sm text-slate-500 mt-1">{s.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
