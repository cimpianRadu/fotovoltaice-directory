import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import CompanyHeader from '@/components/company/CompanyHeader';
import CompanyStats from '@/components/company/CompanyStats';
import CompanyContact from '@/components/company/CompanyContact';
import Badge from '@/components/ui/Badge';
import {
  getCompanyBySlug,
  getCompanies,
  getSpecializationLabel,
  getCertificationLabel,
  getTagLabel,
} from '@/lib/utils';
import { generateLocalBusinessJsonLd, generateBreadcrumbJsonLd } from '@/lib/seo';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getCompanies().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const company = getCompanyBySlug(slug);
  if (!company) return {};

  return {
    title: `${company.name} - Instalator Panouri Fotovoltaice`,
    description: `${company.name} din ${company.location.city} - ${company.description.slice(0, 150)}`,
    openGraph: {
      title: company.name,
      description: company.description,
    },
  };
}

export default async function CompanyDetailPage({ params }: Props) {
  const { slug } = await params;
  const company = getCompanyBySlug(slug);
  if (!company) notFound();

  const financialHealth =
    company.financials.profit > 0
      ? company.financials.profit / company.financials.revenue > 0.1
        ? 'Solidă'
        : 'Bună'
      : 'N/A';

  return (
    <>
      <JsonLd data={generateLocalBusinessJsonLd(company)} />
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: 'Acasă', url: '/' },
          { name: 'Firme', url: '/firme' },
          { name: company.name, url: `/firme/${company.slug}` },
        ])}
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Breadcrumbs
          items={[
            { label: 'Firme Instalatoare', href: '/firme' },
            { label: company.name },
          ]}
        />

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            <CompanyHeader company={company} />
            <CompanyStats company={company} />

            {/* Specializations */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-3">Specializări</h2>
              <div className="flex flex-wrap gap-2">
                {company.specializations.map((spec) => (
                  <Badge key={spec} variant="primary" size="md">
                    {getSpecializationLabel(spec)}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Coverage */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-3">Acoperire Județe</h2>
              <div className="flex flex-wrap gap-2">
                {company.coverage.map((county) => (
                  <Badge key={county} variant="outline" size="md">
                    {county}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Certifications */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-3">Certificări</h2>
              <div className="flex flex-wrap gap-2">
                {company.certifications.map((cert) => (
                  <Badge key={cert} variant="success" size="md">
                    {getCertificationLabel(cert)}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Tags */}
            {company.tags.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-3">Caracteristici</h2>
                <div className="flex flex-wrap gap-2">
                  {company.tags.map((tag) => (
                    <Badge key={tag} variant="default" size="md">
                      {getTagLabel(tag)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Financial Stability */}
            <div className="bg-surface rounded-xl p-5 border border-border">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Stabilitate Financiară</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Anul raportării</p>
                  <p className="font-semibold text-gray-900">{company.financials.year}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Indicator</p>
                  <p className={`font-semibold ${financialHealth === 'Solidă' ? 'text-green-600' : financialHealth === 'Bună' ? 'text-yellow-600' : 'text-gray-500'}`}>
                    {financialHealth}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <CompanyContact company={company} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
