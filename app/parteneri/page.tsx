import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import { generateBreadcrumbJsonLd } from '@/lib/seo';

// Indexul partenerilor. Există ca pagina /parteneri/electroprep să primească un
// link intern din footer: o pagină de partener la care nu duce nimic de pe site
// nu e găsită nici de oameni, nici de Google, iar schimbul de linkuri presupune
// că pagina noastră chiar contează.

export const metadata: Metadata = {
  title: 'Parteneri: unelte și servicii pentru prosumatori și instalatori',
  description:
    'Platformele partenere Instalatori Fotovoltaice: verificare ANRE și documente pentru electricieni, finanțare fără investiție proprie pentru firme.',
  alternates: { canonical: '/parteneri' },
};

const PARTNERS = [
  {
    href: '/parteneri/electroprep',
    name: 'ElectroPrep',
    tag: 'Pentru instalatori',
    description:
      'Actele pentru distribuitor (dosarul de prosumator, notificarea, procesele-verbale) completate în PDF și pregătirea colegilor pentru autorizația ANRE.',
  },
  {
    href: '/parteneri/helexia',
    name: 'Helexia',
    tag: 'Partener de finanțare',
    description:
      'Sisteme fotovoltaice pe firmă fără investiție proprie: Helexia finanțează, construiește și deține sistemul, cu economii garantate prin contract.',
  },
];

export default function ParteneriPage() {
  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: 'Acasă', url: '/' },
          { name: 'Parteneri', url: '/parteneri' },
        ])}
      />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Breadcrumbs items={[{ label: 'Parteneri' }]} />
        <header className="mt-6 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Parteneri</h1>
          <p className="text-gray-500 mt-3 text-lg">
            Platforme pe care le recomandăm prosumatorilor și firmelor de instalații, pentru ce nu
            facem noi.
          </p>
        </header>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PARTNERS.map((p) => (
            <li key={p.href}>
              <Link
                href={p.href}
                className="block h-full rounded-xl border border-border bg-white p-5 hover:border-primary/30 hover:shadow-sm transition-all"
              >
                <span className="text-[11px] font-semibold uppercase tracking-wide text-primary-dark">
                  {p.tag}
                </span>
                <h2 className="mt-1 text-lg font-bold text-gray-900">{p.name}</h2>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">{p.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
