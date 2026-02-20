import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import CompanyCard from '@/components/company/CompanyCard';
import Button from '@/components/ui/Button';
import { generateBreadcrumbJsonLd } from '@/lib/seo';
import {
  getCountyBySlug,
  getCompaniesByCounty,
  getCoveredCounties,
  slugifyCounty,
  sortCompanies,
} from '@/lib/utils';

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
    title: `Firme Instalare Panouri Fotovoltaice ${county} | ${companies.length} Instalatori`,
    description: `${companies.length} firme verificate de instalare panouri fotovoltaice în ${county}. Compară instalatori, certificări ANRE și solicită ofertă gratuită.`,
    alternates: { canonical: `/firme/judet/${slug}` },
  };
}

export default async function CountyPage({ params }: Props) {
  const { county: slug } = await params;
  const county = getCountyBySlug(slug);
  if (!county) notFound();

  const companies = sortCompanies(getCompaniesByCounty(county), 'relevance');

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
            Firme Instalare Fotovoltaice în {county}
          </h1>
          <p className="text-gray-500 mt-2">
            {companies.length} {companies.length === 1 ? 'firmă verificată' : 'firme verificate'} care
            acoperă județul {county}
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-10">
          {companies.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>

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
