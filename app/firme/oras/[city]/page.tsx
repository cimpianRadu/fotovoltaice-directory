import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import CompanyCard from '@/components/company/CompanyCard';
import Button from '@/components/ui/Button';
import FAQ from '@/components/seo/FAQ';
import { generateBreadcrumbJsonLd, generateFAQJsonLd } from '@/lib/seo';
import {
  getCityBySlug,
  getCompaniesByCityArea,
  getCompaniesByCity,
  getCoveredCounties,
  slugifyCity,
  slugifyCounty,
  sortCompanies,
  getSpecializationLabel,
  MAJOR_CITIES,
} from '@/lib/utils';
import { hasActiveAnreCert } from '@/lib/anre';

interface Props {
  params: Promise<{ city: string }>;
}

export async function generateStaticParams() {
  return MAJOR_CITIES.map((city) => ({
    city: slugifyCity(city),
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city: slug } = await params;
  const city = getCityBySlug(slug);
  if (!city || !MAJOR_CITIES.includes(city as (typeof MAJOR_CITIES)[number])) return {};

  const companies = getCompaniesByCityArea(city);

  return {
    title: `Firme Montaj Panouri Fotovoltaice ${city} 2026 | ${companies.length} Instalatori`,
    description: `${companies.length} firme verificate de instalare și montaj panouri fotovoltaice în ${city}. Instalatori autorizați ANRE cu experiență. Compară și cere ofertă gratuită.`,
    alternates: { canonical: `/firme/oras/${slug}` },
  };
}

export default async function CityPage({ params }: Props) {
  const { city: slug } = await params;
  const city = getCityBySlug(slug);
  if (!city || !MAJOR_CITIES.includes(city as (typeof MAJOR_CITIES)[number])) notFound();

  const companiesHQ = getCompaniesByCity(city);
  const companiesArea = sortCompanies(getCompaniesByCityArea(city), 'relevance');
  const allSpecs = [...new Set(companiesArea.flatMap((c) => c.specializations))];
  const hasAnre = companiesArea.filter((c) => hasActiveAnreCert(c.anreMatch, 'C2A'));
  const maxCapacity = Math.max(...companiesArea.map((c) => c.capacity.maxProjectKw));

  const faqs = [
    {
      question: `Câte firme de instalare panouri fotovoltaice sunt în ${city}?`,
      answer: `${companiesHQ.length} firme au sediul în ${city}, iar în total ${companiesArea.length} firme verificate de pe platforma noastră acoperă zona ${city}${hasAnre.length > 0 ? `. Dintre acestea, ${hasAnre.length} au atestat ANRE C2A` : ''}.`,
    },
    {
      question: `Cât costă instalarea panourilor fotovoltaice în ${city}?`,
      answer: `Costul unui sistem fotovoltaic comercial în ${city} variază între 550-850 EUR/kWp instalat. Un sistem de 100 kWp pentru o hală sau clădire de birouri costă între 55.000 și 85.000 EUR, cu amortizare în 4-6 ani.`,
    },
    {
      question: `Ce instalator fotovoltaic recomandați în ${city}?`,
      answer: `Recomandăm să compari minim 3 instalatori din ${city} pe baza atestatelor ANRE, experienței pe proiecte similare, stabilității financiare și referințelor. Pe platforma noastră poți vedea toate aceste informații pentru fiecare firmă.`,
    },
    {
      question: `Cât durează montajul panourilor fotovoltaice în ${city}?`,
      answer: `De la evaluarea inițială până la punerea în funcțiune, procesul durează 4-12 săptămâni. Durata depinde de dimensiunea sistemului, obținerea avizelor de racordare și complexitatea instalației.`,
    },
  ];

  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: 'Acasă', url: '/' },
          { name: 'Firme', url: '/firme' },
          { name: city, url: `/firme/oras/${slug}` },
        ])}
      />
      <JsonLd data={generateFAQJsonLd(faqs)} />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Breadcrumbs
          items={[
            { label: 'Firme Instalatoare', href: '/firme' },
            { label: city },
          ]}
        />

        <div className="mt-6 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Firme Montaj Panouri Fotovoltaice {city}
          </h1>
          <p className="text-gray-500 mt-2">
            {companiesArea.length} instalatori autorizați de panouri solare care acoperă zona {city}
            {companiesHQ.length > 0 && companiesHQ.length < companiesArea.length && (
              <> ({companiesHQ.length} cu sediul în {city})</>
            )}
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-10">
          {companiesArea.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>

        {/* SEO Content */}
        <div className="prose prose-gray max-w-none text-gray-600 mb-10">
          <h2 className="text-xl font-bold text-gray-900">
            Instalare panouri fotovoltaice în {city} — ghid complet
          </h2>
          <p>
            Cauți <strong>firme de montaj panouri fotovoltaice în {city}</strong>? Pe platforma noastră
            găsești {companiesArea.length} firme verificate de instalare panouri solare care acoperă
            zona {city}, cu date reale din registrele publice.
            {hasAnre.length > 0 && (
              <> Dintre acestea, <strong>{hasAnre.length} {hasAnre.length === 1 ? 'deține' : 'dețin'} atestat
              ANRE C2A verificat</strong> în registrele publice.</>
            )}
          </p>

          <h3 className="text-lg font-semibold text-gray-900">
            Servicii de montaj panouri solare în {city}
          </h3>
          <p>
            Instalatorii fotovoltaici din {city} oferă servicii complete de proiectare, montaj și punere în funcțiune
            a sistemelor fotovoltaice pentru: {allSpecs.map((s) => getSpecializationLabel(s)).join(', ').toLowerCase()}.
            {maxCapacity >= 1000 && (
              <> Capacitatea maximă disponibilă ajunge la <strong>{maxCapacity.toLocaleString('ro-RO')} kWp</strong>,
              acoperind inclusiv proiecte fotovoltaice industriale de mari dimensiuni.</>
            )}
          </p>

          <h3 className="text-lg font-semibold text-gray-900">
            De ce să alegi un instalator local din {city}
          </h3>
          <p>
            Un <strong>instalator autorizat de panouri fotovoltaice din {city}</strong> cunoaște
            cerințele locale ale operatorului de distribuție, specificul urbanistic și condițiile climatice
            ale zonei. Proximitatea geografică asigură și intervenții rapide pentru mentenanță și service post-instalare.
          </p>

          <p>
            Compară <strong>firme acreditate de instalare panouri solare în {city}</strong> după certificări,
            experiență, proiecte finalizate și capacitate. Solicită ofertă gratuită direct pe platformă.
          </p>
        </div>

        {/* FAQ */}
        <div className="mb-10">
          <FAQ items={faqs} title={`Întrebări frecvente — panouri fotovoltaice ${city}`} />
        </div>

        <div className="bg-gray-50 rounded-xl p-6 sm:p-8 text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Cauți un instalator fotovoltaic în {city}?
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Completează formularul și primești oferte personalizate de la firmele din {city}.
          </p>
          <Button href="/cere-oferta" size="lg">
            Cere Ofertă Gratuită
          </Button>
        </div>

        {/* Related guides */}
        <div className="mt-10">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Ghiduri utile
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/ghid/cum-alegi-instalator-fotovoltaic"
              className="text-sm px-4 py-3 rounded-lg border border-border text-gray-700 hover:border-primary/30 hover:text-primary-dark transition-colors bg-white"
            >
              Cum Alegi Instalatorul Potrivit
            </Link>
            <Link
              href="/ghid/cost-sistem-fotovoltaic-comercial"
              className="text-sm px-4 py-3 rounded-lg border border-border text-gray-700 hover:border-primary/30 hover:text-primary-dark transition-colors bg-white"
            >
              Cât Costă un Sistem Fotovoltaic
            </Link>
            <Link
              href="/ghid/subventii-panouri-fotovoltaice"
              className="text-sm px-4 py-3 rounded-lg border border-border text-gray-700 hover:border-primary/30 hover:text-primary-dark transition-colors bg-white"
            >
              Subvenții Panouri Fotovoltaice 2026
            </Link>
          </div>
        </div>

        {/* Internal linking to other cities */}
        <div className="mt-10">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Instalatori fotovoltaici în alte orașe
          </h3>
          <div className="flex flex-wrap gap-2">
            {MAJOR_CITIES
              .filter((c) => c !== city)
              .map((c) => (
                <Link
                  key={c}
                  href={`/firme/oras/${slugifyCity(c)}`}
                  className="text-sm px-3 py-1.5 rounded-full border border-border text-gray-600 hover:border-primary/30 hover:text-primary-dark transition-colors"
                >
                  {c}
                </Link>
              ))}
          </div>
        </div>

        {/* Link to county page */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Toate județele
          </h3>
          <div className="flex flex-wrap gap-2">
            {getCoveredCounties().map((c) => (
              <Link
                key={c}
                href={`/firme/judet/${slugifyCounty(c)}`}
                className="text-sm px-3 py-1.5 rounded-full border border-border text-gray-600 hover:border-primary/30 hover:text-primary-dark transition-colors"
              >
                {c}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
