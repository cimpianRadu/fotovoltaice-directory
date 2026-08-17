import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import FAQ from '@/components/seo/FAQ';
import InstallerCta from '@/components/InstallerCta';
import SponsorBanner from '@/components/sponsor/SponsorBanner';
import { generateBreadcrumbJsonLd, generateFAQJsonLd } from '@/lib/seo';
import { getKitPriceCurve } from '@/lib/kit-price-curve';
import { formatCurrency } from '@/lib/utils-shared';

// Pagina acoperă clusterul „în rate", singurul gol comercial verificat cu volum:
// „panouri fotovoltaice în rate" 480 căutări/lună și „panouri solare în rate"
// 170, la un CPC de 2,3-2,7 euro, adică de trei ori mai mult decât pe „preț
// panouri fotovoltaice". Nu aveam nimic pe el.
//
// Ce NU face pagina, deliberat: nu publică dobânzi, DAE sau exemple de rate.
// Publicitatea la credit de consum are reguli proprii în România (OUG 50/2010),
// iar în clipa în care punem o rată pe pagină intrăm sub ele. Costul sistemului
// și amortizarea sunt terenul nostru și le putem susține cu date proprii;
// condițiile de creditare le prezintă finanțatorul, pe pagina lui.
//
// Sursa de atribuire e `finantare`, ca să se vadă separat în coloana K din Sheet.

const SURSA = 'finantare';

export const metadata: Metadata = {
  title: 'Panouri fotovoltaice în rate: ce opțiuni ai în 2026',
  description:
    'Cum îți poți instala panouri fotovoltaice în rate: credit bancar, plata în rate prin instalator, leasing pentru firme sau programe AFM. Cere oferte de la instalatori atestați ANRE.',
  alternates: { canonical: '/finantare' },
  openGraph: {
    type: 'article',
    url: '/finantare',
    title: 'Panouri fotovoltaice în rate: ce opțiuni ai în 2026',
    description:
      'Credit, rate prin instalator, leasing sau programe AFM. Ce presupune fiecare și cum ceri oferte de la instalatori atestați.',
  },
};

const faqs = [
  {
    question: 'Se pot instala panouri fotovoltaice în rate?',
    answer:
      'Da. Există patru rute uzuale: un credit de nevoi personale luat de dumneavoastră de la o bancă sau un IFN, plata în rate oferită direct de instalator prin partenerul lui de finanțare, leasingul (disponibil pentru firme, nu pentru persoane fizice) și programele de sprijin, care nu sunt finanțare, ci reduc suma de plată. Multe firme din platformă lucrează deja cu una dintre aceste variante.',
  },
  {
    question: 'Ce sumă trebuie finanțată, de fapt?',
    answer:
      'Depinde de puterea sistemului. Din ofertele publice pe care le urmărim, un sistem rezidențial cu montaj inclus se situează în intervalele afișate mai sus, pe kWp instalat. Un sistem de 5 kWp înseamnă tipic o investiție de ordinul zecilor de mii de lei, iar ce finanțați e diferența dintre acest cost și eventualul sprijin primit printr-un program.',
  },
  {
    question: 'Ce e mai bine, credit propriu sau rate prin instalator?',
    answer:
      'Nu există un răspuns unic și depinde de dobânda efectivă pe care o obțineți în fiecare variantă. Ratele prin instalator sunt de obicei mai rapide, pentru că dosarul se face odată cu comanda, dar costul total poate fi diferit de al unui credit negociat separat. Comparați întotdeauna DAE, nu rata lunară: o rată mică pe o perioadă lungă poate însemna un cost total mai mare.',
  },
  {
    question: 'Pot combina un credit cu Casa Verde sau alt program?',
    answer:
      'Da, iar în practică asta se face des: programul acoperă o parte din valoare, restul se finanțează. Atenție însă la calendar. Programele au sesiuni de înscriere și termene de finalizare, iar montajul trebuie făcut de un instalator eligibil în programul respectiv. Verificați condiția asta înainte de a semna orice.',
  },
  {
    question: 'Ce verifică finanțatorul înainte să aprobe?',
    answer:
      'În general vechimea la locul de muncă, nivelul venitului, vârsta și istoricul din Biroul de Credit. Condițiile exacte diferă de la un finanțator la altul și se schimbă în timp, așa că singura sursă corectă rămâne finanțatorul însuși. Noi nu facem analiză de credit și nu promitem aprobări.',
  },
  {
    question: 'Cum funcționează dacă cer o ofertă aici?',
    answer:
      'Completați formularul de cerere, iar la pasul de detalii alegeți ruta de finanțare care vi se potrivește. Cererea ajunge la firmele de instalare care acoperă zona dumneavoastră, iar dacă ați indicat că doriți finanțare, credit sau un program de sprijin, poate ajunge și la un partener de finanțare. Dacă ați indicat fonduri proprii, cererea nu se transmite niciunui finanțator.',
  },
];

const ROUTES = [
  {
    title: 'Credit luat de dumneavoastră',
    who: 'Persoane fizice',
    body: 'Un credit de nevoi personale de la o bancă sau un IFN, cu care plătiți instalatorul ca și cum ați plăti cash. Avantajul e că negociați separat costul finanțării și rămâneți liber să alegeți orice instalator. Dezavantajul e că faceți două demersuri în loc de unul.',
  },
  {
    title: 'Rate prin instalator',
    who: 'Persoane fizice',
    body: 'Instalatorul are un partener de finanțare, iar dosarul se face odată cu comanda. E ruta cea mai rapidă și cea mai simplă administrativ. Cereți întotdeauna costul total, nu doar rata lunară, ca să îl puteți compara cu un credit obținut pe cont propriu.',
  },
  {
    title: 'Leasing',
    who: 'Firme',
    body: 'Disponibil pentru persoane juridice. Sistemul rămâne în proprietatea finanțatorului până la achitarea integrală, iar ratele au un tratament contabil propriu. Pentru o firmă cu consum mare, economia lunară la energie poate acoperi o parte semnificativă din rată.',
  },
  {
    title: 'Programe de sprijin',
    who: 'Depinde de program',
    body: 'Casa Verde, Electric Up, fondurile pentru IMM-uri și cele agricole nu sunt finanțare, ci reduc suma pe care o aveți de plătit. Se pot combina cu un credit. Au sesiuni de înscriere, termene și liste de instalatori eligibili, deci calendarul contează la fel de mult ca banii.',
  },
];

export default function FinantarePage() {
  const curve = getKitPriceCurve();
  // Doar intervalele cu eșantion decent. 11-20 kWp stă pe 2 oferte și peste 20
  // kWp pe una, iar o mediană din 2 oferte nu e preț de piață. Le lăsăm afară
  // și spunem de ce, în loc să publicăm o cifră care pare solidă și nu e.
  const solidPoints = curve.points.filter((p) => p.offers >= 4);

  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: 'Acasă', url: '/' },
          { name: 'Finanțare', url: '/finantare' },
        ])}
      />
      <JsonLd data={generateFAQJsonLd(faqs)} />

      <article className="max-w-4xl mx-auto px-4 py-6">
        <Breadcrumbs items={[{ label: 'Finanțare' }]} />

        <div className="mt-6 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
            Panouri fotovoltaice în rate: ce opțiuni aveți în 2026
          </h1>
          <p className="text-gray-500 mt-3 text-lg">
            Patru rute prin care se plătește un sistem fotovoltaic fără să scoateți toată suma
            deodată, ce presupune fiecare și la ce să vă uitați înainte să semnați.
          </p>
        </div>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Cele patru rute</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {ROUTES.map((r) => (
              <div key={r.title} className="rounded-xl border border-border bg-white p-5">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <h3 className="font-bold text-gray-900">{r.title}</h3>
                  <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-primary-dark bg-primary/10 rounded-full px-2 py-0.5">
                    {r.who}
                  </span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{r.body}</p>
              </div>
            ))}
          </div>
        </section>

        <InstallerCta
          sursa={SURSA}
          title="Aflați întâi cât costă sistemul dumneavoastră"
          description="Înainte de orice discuție despre rate, aveți nevoie de o ofertă concretă. Spuneți-ne ce aveți nevoie și primiți oferte de la instalatori atestați ANRE din zona dumneavoastră."
          ctaLabel="Cere ofertă gratuit"
        />

        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Ce sumă se finanțează, de fapt</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            Rata depinde de suma finanțată, iar suma finanțată depinde de sistem. Mai jos e costul
            pe kWp instalat, cu montaj inclus, calculat din oferte publice ale magazinelor
            româneşti. Publicăm și câte oferte stau în spatele fiecărei cifre, pentru că o mediană
            din trei oferte nu înseamnă același lucru cu una din opt.
          </p>

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface text-left">
                <tr>
                  <th className="px-4 py-2.5 font-semibold text-gray-900 text-xs uppercase tracking-wide">
                    Dimensiune sistem
                  </th>
                  <th className="px-4 py-2.5 font-semibold text-gray-900 text-xs uppercase tracking-wide">
                    Mediană RON/kWp
                  </th>
                  <th className="px-4 py-2.5 font-semibold text-gray-900 text-xs uppercase tracking-wide">
                    Interval observat
                  </th>
                  <th className="px-4 py-2.5 font-semibold text-gray-900 text-xs uppercase tracking-wide">
                    Oferte
                  </th>
                </tr>
              </thead>
              <tbody>
                {solidPoints.map((p) => (
                  <tr key={p.label} className="hover:bg-surface/50 transition-colors">
                    <td className="px-4 py-2.5 text-gray-900 border-b border-border/50">{p.label}</td>
                    <td className="px-4 py-2.5 text-gray-900 font-semibold border-b border-border/50">
                      {formatCurrency(p.median)}
                    </td>
                    <td className="px-4 py-2.5 text-gray-600 border-b border-border/50">
                      {formatCurrency(p.min)} &ndash; {formatCurrency(p.max)}
                    </td>
                    <td className="px-4 py-2.5 text-gray-600 border-b border-border/50">{p.offers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-xs text-gray-500 leading-relaxed">
            Prețuri cu TVA 21%, aduse pe aceeași bază, doar oferte on-grid cu montaj inclus și fără
            baterie. Scanate pe {curve.scrapedAt}. Nu afișăm intervalele de peste 11 kWp: au sub
            patru oferte fiecare, prea puține ca o mediană să însemne ceva. Pentru un calcul pe
            consumul dumneavoastră, folosiți{' '}
            <Link href="/calculator-panouri-fotovoltaice" className="underline hover:text-gray-700">
              calculatorul
            </Link>
            .
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            De ce nu găsiți dobânzi și rate pe pagina asta
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Pentru că nu suntem finanțator și nu vrem să vă dăm cifre pe care nu le putem onora.
            Dobânzile, DAE-ul și condițiile de aprobare diferă de la un finanțator la altul, se
            schimbă în timp și depind de dosarul fiecăruia. Orice rată pe care am publica-o aici ar
            fi o ilustrare, nu o ofertă, iar în domeniul creditului diferența asta contează. Ce
            putem susține cu date proprii e costul sistemului, și pe acela îl publicăm mai sus, cu
            eșantionul la vedere.
          </p>
        </section>

        <div className="mb-10">
          <SponsorBanner position="finantare" />
        </div>

        <section id="faq" className="scroll-mt-20 mb-10">
          <FAQ items={faqs} title="Întrebări frecvente despre finanțare" />
        </section>

        <InstallerCta
          sursa={SURSA}
          title="Gata să cereți oferte?"
          description="Primiți oferte de la instalatori atestați ANRE din județul dumneavoastră. La pasul de detalii puteți spune ce rută de finanțare vă interesează, iar cererea ajunge la firmele potrivite situației."
          ctaLabel="Cere ofertă gratuit"
        />

        <div className="border-t border-border pt-8">
          <h3 className="font-bold text-gray-900 mb-4">Ghiduri legate</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href="/ghid/casa-verde-fotovoltaice-2026"
              className="p-4 rounded-lg border border-border hover:border-primary/30 hover:shadow-sm transition-all text-sm font-medium text-gray-900"
            >
              Casa Verde Fotovoltaice 2026
            </Link>
            <Link
              href="/ghid/electric-up-2026-ghid-aplicare"
              className="p-4 rounded-lg border border-border hover:border-primary/30 hover:shadow-sm transition-all text-sm font-medium text-gray-900"
            >
              Electric Up 2026: ghid de aplicare
            </Link>
            <Link
              href="/ghid/fonduri-nerambursabile-panouri-fotovoltaice-imm-2026"
              className="p-4 rounded-lg border border-border hover:border-primary/30 hover:shadow-sm transition-all text-sm font-medium text-gray-900"
            >
              Fonduri nerambursabile pentru IMM-uri
            </Link>
            <Link
              href="/calculator-panouri-fotovoltaice"
              className="p-4 rounded-lg border border-border hover:border-primary/30 hover:shadow-sm transition-all text-sm font-medium text-gray-900"
            >
              Calculator: cât costă și în cât se amortizează
            </Link>
          </div>
        </div>
      </article>
    </>
  );
}
