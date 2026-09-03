import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import InstallerCta from '@/components/InstallerCta';
import { generateBreadcrumbJsonLd } from '@/lib/seo';

// Pagină de PARTENER, nu listare în director. Diferența nu e cosmetică:
// `companies.json` promite instalator real cu atestat ANRE verificat, iar
// Helexia nu are atestat (0 potriviri în `anre-atestate.json`, 9.609 înregistrări,
// verificat 25 aug 2026) pentru că nu e instalator, e investitor și EPC.
//
// Pusă pe șablonul de firmă, ar fi ieșit cu exact cele două câmpuri de
// credibilitate goale, lângă 185 de firme care le au completate. Aici arată ce
// are cu adevărat: portofoliul grupului și modelul de business.
//
// NEVER-INVENT: fiecare cifră de mai jos are sursa lângă ea, iar sursele sunt
// site-ul lor și comunicatul Voltalia. Cifrele de grup sunt marcate ca fiind de
// grup, nu din România, tocmai ca să nu pară că au 347 MW montați aici.
//
// Nimic despre ANRE, ISO sau certificări nu apare pe pagină, pentru că nu am
// putut confirma niciunul. Politicile de calitate și SSM publicate de ei sunt
// documente interne, nu certificate emise de un organism.
//
// Corecție 25 aug 2026: prima versiune spunea „firma plătește energia produsă",
// adică modelul PPA. NU e ce descriu ei. Pe helexia.ro/finantare mecanismul e
// contract de performanță energetică pe ECONOMII garantate: ei estimează
// economiile, le monitorizează, rambursează diferența dacă ies mai mici și
// primesc bonus dacă ies mai mari. Cuvintele lor: „investitor terț",
// „dezvoltatorul proiectului și apoi proprietarul", „EPC, Finanțarea
// proiectului, Operarea și Întreținerea pe toată durata contractului".

export const metadata: Metadata = {
  title: 'Helexia România: fotovoltaic pe firmă fără investiție proprie',
  description:
    'Helexia finanțează, construiește și deține sisteme fotovoltaice pe acoperișul clienților, cu economii de energie garantate prin contract de performanță energetică. Partener de finanțare al platformei.',
  alternates: { canonical: '/parteneri/helexia' },
  robots: { index: false, follow: true },
};

const FACTS = [
  { label: 'Proiecte fotovoltaice, la nivel de grup', value: '1.250' },
  { label: 'MW instalați, la nivel de grup', value: '347' },
  { label: 'Acoperișuri puse în funcțiune în România', value: '28' },
  { label: 'MW în România', value: '12,8' },
];

const STEPS = [
  {
    title: 'Analiza consumului',
    body: 'Se uită la factura și la profilul de consum, ca să vadă dacă un sistem pe acoperiș, pe copertină sau la sol chiar iese mai ieftin decât energia din rețea.',
  },
  {
    title: 'Ei investesc, ei construiesc',
    body: 'Helexia răspunde de proiect cap-coadă: inginerie, achiziție, construcție (EPC) și finanțarea proiectului. Firma nu scoate bani la început.',
  },
  {
    title: 'Ei rămân proprietari și operează',
    body: 'Helexia e dezvoltatorul proiectului și apoi proprietarul lui, iar operarea și întreținerea rămân la ei pe toată durata contractului. Firma nu are pe cap nici defecțiunile, nici monitorizarea.',
  },
  {
    title: 'Economiile sunt garantate prin contract',
    body: 'Prin contract de performanță energetică. Helexia calculează economiile estimate, apoi monitorizează consumul și le compară cu cele prevăzute în contract. Dacă firma economisește mai puțin decât s-a prevăzut, diferența se rambursează; dacă economisește mai mult, Helexia primește un bonus.',
  },
];

export default function HelexiaPage() {
  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: 'Acasă', url: '/' },
          { name: 'Parteneri', url: '/parteneri/helexia' },
          { name: 'Helexia', url: '/parteneri/helexia' },
        ])}
      />

      <article className="max-w-4xl mx-auto px-4 py-6">
        <Breadcrumbs items={[{ label: 'Parteneri' }, { label: 'Helexia' }]} />

        <header className="mt-6 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Image
              src="/logos/helexia.svg"
              alt="Helexia"
              width={160}
              height={34}
              className="h-8 w-auto"
            />
            <span className="text-[11px] font-semibold uppercase tracking-wide text-primary-dark bg-primary/10 rounded-full px-2.5 py-1">
              Partener de finanțare
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
            Helexia România: fotovoltaic pe firmă, fără investiție proprie
          </h1>
          <p className="text-gray-500 mt-3 text-lg">
            Helexia finanțează proiectul, îl construiește, rămâne proprietarul lui și îl
            operează pe toată durata contractului. Firma nu scoate bani la început, iar
            economiile de energie sunt garantate prin contract.
          </p>
        </header>

        <section className="mb-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {FACTS.map((f) => (
              <div key={f.label} className="rounded-xl border border-border bg-white p-4">
                <p className="text-2xl font-bold text-secondary">{f.value}</p>
                <p className="mt-1 text-xs text-gray-500 leading-snug">{f.label}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-gray-500 leading-relaxed">
            Cifrele de grup sunt la 31 decembrie 2023, publicate de Helexia. Cele din România
            sunt din comunicatul Voltalia privind acoperișurile puse în funcțiune aici. Helexia
            face parte din grupul Helexia, subsidiară a Voltalia.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Cum funcționează</h2>
          <ol className="space-y-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-4 rounded-xl border border-border bg-white p-5">
                <span className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary-dark">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-bold text-gray-900">{s.title}</h3>
                  <p className="mt-1 text-sm text-gray-600 leading-relaxed">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="mb-10 rounded-xl border border-border bg-surface/60 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">
            Ce nu e Helexia, ca să fie clar
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Nu e o firmă din directorul nostru și nu apare în{' '}
            <Link href="/firme" className="underline hover:text-gray-700">
              lista celor 185 de instalatori verificați
            </Link>
            . Nu are atestat ANRE de instalator, pentru că nu execută în nume propriu lucrarea de
            instalații electrice; e investitor și antreprenor general, iar partea atestată se
            execută prin subcontractor. Dacă vă interesează un instalator atestat care să vă
            monteze sistemul cumpărat de dumneavoastră, mergeți în{' '}
            <Link href="/firme?segment=comercial" className="underline hover:text-gray-700">
              director
            </Link>
            , nu aici. Varianta asta e pentru cazul opus: nu vreți să cumpărați deloc sistemul.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Date de identificare</h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <tbody>
                {[
                  ['Helexia Servicii Energetice SRL', 'CUI 46740902'],
                  ['Helexia Development Romania SRL', 'CUI 45670400'],
                  ['Sediu', 'Str. Dr. Iacob Felix 63, București'],
                  ['Site', 'helexia.ro'],
                ].map(([k, v]) => (
                  <tr key={k} className="hover:bg-surface/50 transition-colors">
                    <td className="px-4 py-2.5 text-gray-600 border-b border-border/50">{k}</td>
                    <td className="px-4 py-2.5 font-medium text-gray-900 border-b border-border/50">
                      {v}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <a
            href="https://helexia.ro"
            target="_blank"
            rel="noopener noreferrer nofollow sponsored"
            data-umami-event="partener-site-click"
            data-umami-event-partener="helexia"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-secondary hover:text-primary-dark transition-colors"
          >
            Vedeți site-ul Helexia
            <span aria-hidden="true">&rarr;</span>
          </a>
        </section>

        <InstallerCta
          sursa="partener/helexia"
          segment="comercial"
          title="Nu sunteți sigur ce variantă vi se potrivește?"
          description="Cereți întâi o ofertă de la instalatori atestați ANRE din județul dumneavoastră. Cu o valoare fermă în mână puteți compara corect cumpărarea, leasingul și varianta fără investiție proprie."
          ctaLabel="Cere oferte gratuit"
        />

        <div className="border-t border-border pt-8">
          <h3 className="font-bold text-gray-900 mb-4">Legate</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { href: '/finantare/firme', label: 'Cele patru variante de finanțare, comparate' },
              {
                href: '/ghid/sisteme-fotovoltaice-comerciale-2026-pillar-decident-firma',
                label: 'Sisteme fotovoltaice comerciale: ghidul decidentului',
              },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="p-4 rounded-lg border border-border hover:border-primary/30 hover:shadow-sm transition-all text-sm font-medium text-gray-900"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </article>
    </>
  );
}
