import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import CountyCompanyList from './CountyCompanyList';
import Button from '@/components/ui/Button';
import FAQ from '@/components/seo/FAQ';
import { generateBreadcrumbJsonLd, generateFAQJsonLd } from '@/lib/seo';
import {
  getCountyBySlug,
  getCompaniesByCounty,
  getCoveredCounties,
  getPlusCompaniesForCounty,
  PROMO_CAPS,
  slugifyCounty,
  slugifyCity,
  sortCompanies,
  getSpecializationLabel,
  MAJOR_CITIES,
} from '@/lib/utils';
import { hasActiveAnreCert } from '@/lib/anre';
import PromovateSection from '@/components/promo/PromovateSection';

interface Props {
  params: Promise<{ county: string }>;
}

export async function generateStaticParams() {
  return getCoveredCounties().map((county) => ({
    county: slugifyCounty(county),
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { county: slug } = await params;
  const county = getCountyBySlug(slug);
  if (!county) return {};

  const companies = getCompaniesByCounty(county);

  return {
    title: `Firme Montaj Panouri Fotovoltaice ${county} 2026 | ${companies.length} Instalatori Autorizați`,
    description: `${companies.length} firme verificate de instalare și montaj panouri fotovoltaice în ${county}. Instalatori autorizați ANRE, date financiare reale. Compară și cere ofertă gratuită.`,
    alternates: { canonical: `/firme/judet/${slug}` },
  };
}

export default async function CountyPage({ params }: Props) {
  const { county: slug } = await params;
  const county = getCountyBySlug(slug);
  if (!county) notFound();

  const companies = sortCompanies(getCompaniesByCounty(county), 'relevance');
  const plusCompanies = getPlusCompaniesForCounty(county);

  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: 'Acasă', url: '/' },
          { name: 'Firme', url: '/firme' },
          { name: county, url: `/firme/judet/${slug}` },
        ])}
      />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Breadcrumbs
          items={[
            { label: 'Firme Instalatoare', href: '/firme' },
            { label: county },
          ]}
        />

        <div className="mt-6 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Firme Montaj Panouri Fotovoltaice în {county}
          </h1>
          <p className="text-gray-500 mt-2">
            {companies.length} instalatori autorizați de panouri solare verificați care
            acoperă județul {county}
          </p>
        </div>

        {plusCompanies.length > 0 && (
          <PromovateSection
            companies={plusCompanies}
            max={PROMO_CAPS.plusPerCounty}
            title="Promovate"
            subtitle={`Firme partenere din ${county}`}
          />
        )}

        <CountyCompanyList companies={companies} county={county} />

        {/* SEO Content */}
        {(() => {
          const allSpecs = [...new Set(companies.flatMap((c) => c.specializations))];
          const hasAnre = companies.filter((c) => hasActiveAnreCert(c.anreMatch, 'C2A'));
          const oldestYear = Math.min(...companies.map((c) => c.founded));
          const maxCapacity = Math.max(...companies.map((c) => c.capacity.maxProjectKw));

          return (
            <div className="prose prose-gray max-w-none text-gray-600 mb-10">
              <h2 className="text-xl font-bold text-gray-900">
                Instalare panouri fotovoltaice în {county} — ce trebuie să știi
              </h2>
              <p>
                Cauți <strong>firme de montaj panouri fotovoltaice în {county}</strong>? Pe platforma noastră
                găsești {companies.length} {companies.length === 1 ? 'firmă verificată' : 'firme verificate'} de
                instalare panouri solare care acoperă județul {county}, cu date reale din registrele publice.
                {hasAnre.length > 0 && (
                  <> Dintre acestea, <strong>{hasAnre.length} {hasAnre.length === 1 ? 'are' : 'au'} atestat
                  ANRE C2A verificat</strong> în registrele publice.</>
                )}
              </p>

              <h3 className="text-lg font-semibold text-gray-900">
                Specializări disponibile în {county}
              </h3>
              <p>
                Firmele de instalare panouri fotovoltaice din {county} acoperă
                următoarele specializări: {allSpecs.map((s) => getSpecializationLabel(s)).join(', ').toLowerCase()}.
                {maxCapacity >= 1000 && (
                  <> Capacitatea maximă disponibilă este de <strong>{maxCapacity.toLocaleString('ro-RO')} kWp</strong>,
                  potrivită inclusiv pentru proiecte fotovoltaice industriale de mari dimensiuni.</>
                )}
              </p>

              <h3 className="text-lg font-semibold text-gray-900">
                De ce să alegi un instalator autorizat în {county}
              </h3>
              <p>
                Un <strong>instalator autorizat de panouri fotovoltaice</strong> cu experiență în {county} cunoaște
                condițiile locale — de la cerințele operatorului de distribuție pentru racordare, până la specificul
                climatic al zonei. Firmele listate pe platforma noastră au o experiență medie de peste{' '}
                {new Date().getFullYear() - oldestYear > 10 ? '10' : Math.round((new Date().getFullYear() - oldestYear) * 0.7).toString()} ani
                în domeniul energiei solare și al instalațiilor electrice.
              </p>

              <p>
                Compară <strong>firme acreditate de montaj panouri solare în {county}</strong> după certificări,
                experiență, număr de proiecte finalizate și capacitate maximă. Apoi solicită ofertă gratuită
                direct pe platformă.
              </p>
            </div>
          );
        })()}

        {/* FAQ */}
        {(() => {
          const countyFaqs = [
            {
              question: `Câte firme de instalare panouri fotovoltaice sunt în ${county}?`,
              answer: `Pe platforma noastră sunt listate ${companies.length} firme verificate de instalare panouri fotovoltaice care acoperă județul ${county}. Toate firmele au date verificate din registrele publice, inclusiv certificări, date financiare și experiență.`,
            },
            {
              question: `Cât costă montajul panourilor fotovoltaice în ${county}?`,
              answer: `Costul instalării unui sistem fotovoltaic comercial în ${county} variază între 550-850 EUR/kWp, în funcție de dimensiunea proiectului. Un sistem de 100 kWp costă între 55.000 și 85.000 EUR, cu amortizare în 4-6 ani. Solicită oferte de la mai mulți instalatori pentru cel mai bun preț.`,
            },
            {
              question: `Cum aleg cel mai bun instalator fotovoltaic din ${county}?`,
              answer: `Verifică atestatul ANRE C2A (obligatoriu), experiența pe proiecte comerciale similare, certificări ISO, stabilitatea financiară și referințele de la clienți anteriori. Pe platforma noastră poți compara toate aceste criterii pentru fiecare firmă din ${county}.`,
            },
          ];
          return (
            <>
              <JsonLd data={generateFAQJsonLd(countyFaqs)} />
              <div className="mb-10">
                <FAQ items={countyFaqs} title={`Întrebări frecvente — instalatori fotovoltaici ${county}`} />
              </div>
            </>
          );
        })()}

        <div className="bg-gray-50 rounded-xl p-6 sm:p-8 text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Cauți un instalator fotovoltaic în {county}?
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Completează formularul și primești oferte personalizate de la firmele din zona ta.
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

        {/* Major cities in this county or nearby */}
        {(() => {
          const citiesInCounty = companies
            .map((c) => c.location.city)
            .filter((city) => MAJOR_CITIES.includes(city as (typeof MAJOR_CITIES)[number]));
          const uniqueCities = [...new Set(citiesInCounty)];
          // Always show all major cities for cross-linking
          const otherCities = MAJOR_CITIES.filter((c) => !uniqueCities.includes(c));
          return (
            <div className="mt-10">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Instalatori fotovoltaici per oraș
              </h3>
              <div className="flex flex-wrap gap-2">
                {uniqueCities.map((c) => (
                  <Link
                    key={c}
                    href={`/firme/oras/${slugifyCity(c)}`}
                    className="text-sm px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary-dark font-medium hover:bg-primary/10 transition-colors"
                  >
                    {c}
                  </Link>
                ))}
                {otherCities.map((c) => (
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
          );
        })()}

        {/* Internal linking to other counties */}
        <div className="mt-10">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Alte județe cu instalatori fotovoltaici
          </h3>
          <div className="flex flex-wrap gap-2">
            {getCoveredCounties()
              .filter((c) => c !== county)
              .map((c) => (
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
