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

// Cifrele vin din comunicatul lor de presă din 20 noiembrie 2024, nu din
// pagina „despre noi": acolo secțiunea „Despre Helexia" e mai nouă decât
// cifrele afișate pe prima pagină (1.250 de proiecte și 347 MW, la 31 dec
// 2023) și, întâmplător, și mai favorabilă. Sursa e a lor, verificabilă.
const FACTS = [
  { label: 'Proiecte fotovoltaice finalizate, la nivel de grup', value: '1.785' },
  { label: 'MW în operare, la nivel de grup', value: '386' },
  { label: 'Magazine echipate în România', value: '28' },
  { label: 'MW instalați în România', value: '12,8' },
];

// Pașii sunt scriși cu verbele din propria lor descriere („se ocupă de proiect
// de la început până la sfârșit", „dezvoltatorul proiectului și apoi
// proprietarul", „vă rambursăm diferența"), la persoana a doua ca peste tot pe
// site. Titlurile spun ce fac, nu ce sunt.
const STEPS = [
  {
    title: 'Analizează consumul și acoperișul',
    body: 'Se uită la factura și la profilul de consum și calculează economiile pe care le puteți face cu un sistem pe acoperiș, pe copertină sau la sol.',
  },
  {
    title: 'Finanțează și construiește',
    body: 'Helexia răspunde de proiect de la început până la sfârșit: inginerie, achiziție, construcție și finanțarea proiectului. Firma dumneavoastră nu scoate bani la început și nu se ocupă de execuție.',
  },
  {
    title: 'Rămâne proprietar și se ocupă de operare',
    body: 'Helexia e dezvoltatorul proiectului și apoi proprietarul lui, iar operarea și întreținerea rămân la ei pe toată durata contractului. Nu aveți pe cap nici defecțiunile, nici monitorizarea.',
  },
  {
    title: 'Garantează economiile prin contract',
    body: 'Prin contract de performanță energetică: calculează economiile estimate, apoi monitorizează consumul real și îl compară cu ce scrie în contract. Dacă economisiți mai puțin decât s-a prevăzut, vă rambursează diferența; dacă economisiți mai mult, primesc un bonus.',
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
          {/* Formularea e a lor, de pe helexia.ro/finantare: „se ocupă de proiect de
              la început până la sfârșit", ca firma clientului „să se concentreze pe
              activitatea de bază". Prima versiune spunea „Firma nu scoate bani la
              început", care se citea și ca și cum Helexia nu ar investi. */}
          <p className="text-gray-500 mt-3 text-lg">
            Pionier în tranziția energetică din 2010 și prezentă în România din 2022, Helexia se
            ocupă de proiect de la început până la sfârșit: inginerie, achiziție și construcție,
            finanțarea proiectului, apoi operarea și întreținerea pe toată durata contractului.
            Firma dumneavoastră rămâne concentrată pe activitatea ei, fără să imobilizeze
            capital, iar economiile de energie sunt garantate prin contract.
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
            Cifrele sunt din comunicatul Helexia din 20 noiembrie 2024: la nivel de grup, peste
            1.785 de proiecte fotovoltaice finalizate și 386 MW în operare, cu peste 470 de
            angajați în 11 țări. Cele din România sunt din același comunicat. Helexia e filială
            a Voltalia (Euronext Paris) și lucrează în România din 2022.
          </p>
        </section>

        {/* Referințele cântăresc mai mult decât orice descriere: sunt nume pe care
            decidentul le cunoaște, iar cifrele vin din comunicatul lor, deci le pot
            verifica singuri. Lipseau cu totul din prima versiune a paginii. */}
        <section className="mb-10 rounded-xl border border-secondary/15 bg-secondary/[0.03] p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Ce au făcut în România</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            În septembrie 2024 au inaugurat 28 de magazine Auchan și Leroy Merlin echipate cu
            peste 27.000 de panouri fotovoltaice, 12,8 MW pe mai bine de 63.000 mp de acoperiș.
            Instalațiile acoperă între 20 și 30% din consumul fiecărui magazin, adică peste
            14.000 MWh pe an și peste 8.000 de tone de CO<sub>2</sub> evitate anual.
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Sursa: comunicatul de presă Helexia, 20 noiembrie 2024.
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

        {/* Aceleași fapte ca în prima versiune (nu e în director, nu are atestat
            ANRE de instalator), dar spuse ca rol în proiect. Distincția rămâne
            necesară: directorul promite instalator real cu atestat verificat, iar
            un investitor afișat ca „firmă recomandată" ar strica exact asta. Ce se
            schimbă e că partenerul e prezentat pentru ce face, nu pentru ce nu e. */}
        <section className="mb-10 rounded-xl border border-border bg-surface/60 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">
            Ce rol are Helexia și cui i se potrivește
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            Helexia e investitor și antreprenor general: aduce banii, răspunde de proiect
            cap-coadă și rămâne proprietarul sistemului. Partea de instalații electrice, cea
            care cere atestat ANRE, se execută prin subcontractori. De aceea o găsiți aici, ca
            partener de finanțare, și nu în{' '}
            <Link href="/firme" className="underline hover:text-gray-700">
              directorul celor 185 de instalatori verificați
            </Link>
            : sunt două roluri diferite în același proiect.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed mt-3">
            Vi se potrivește dacă vreți factura mai mică fără să scoateți bani din firmă și
            fără să vă ocupați de operare. Dacă aveți deja bugetul pentru sistem, Helexia poate
            dezvolta doar proiectul, fără partea de finanțare. Iar dacă vreți să cumpărați
            dumneavoastră sistemul și să vi-l monteze o firmă din zonă, aveți{' '}
            <Link href="/firme?segment=comercial" className="underline hover:text-gray-700">
              instalatorii atestați din director
            </Link>
            .
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
                  ['Sediu', 'Betahaus, Str. Dr. Iacob Felix 63, etaj 12, București'],
                  ['Email', 'romania.info@helexia.eu'],
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
          title="Vreți să comparați cu varianta clasică?"
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
