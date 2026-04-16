import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import CompanyHeader from '@/components/company/CompanyHeader';
import CompanyStats from '@/components/company/CompanyStats';
import CompanyContact from '@/components/company/CompanyContact';
import Badge from '@/components/ui/Badge';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import {
  getCompanyBySlug,
  getCompanies,
  getSpecializationLabel,
  getCertificationLabel,
  getCertificationDescription,
  getTagLabel,
} from '@/lib/utils';
import { generateLocalBusinessJsonLd, generateBreadcrumbJsonLd } from '@/lib/seo';
import guidesData from '@/data/guides.json';

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
    alternates: { canonical: `/firme/${slug}` },
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
              {company.certifications.length > 0 ? (
                <div className="space-y-3">
                  {company.certifications.map((cert) => (
                    <div key={cert} className="flex items-start gap-3 p-3 rounded-lg bg-surface border border-border">
                      <Badge variant={cert.startsWith('ANRE-') ? 'success' : 'primary'} size="md">
                        {getCertificationLabel(cert)}
                      </Badge>
                      <p className="text-sm text-gray-600 pt-0.5">
                        {getCertificationDescription(cert)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Nicio certificare ANRE sau ISO confirmată.</p>
              )}
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

            {/* Data correction notice */}
            <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 flex items-start gap-3">
              <span className="text-blue-500 mt-0.5 shrink-0" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                </svg>
              </span>
              <p className="text-sm text-blue-800">
                Datele sunt incorecte sau incomplete?{' '}
                <a href="mailto:contact@instalatori-fotovoltaice.ro?subject=Actualizare%20profil%20{encodeURIComponent(company.name)}" className="font-medium underline hover:text-blue-900">
                  Contactează-ne
                </a>{' '}
                și le actualizăm imediat.
              </p>
            </div>

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
            <div className="sticky top-20 space-y-4">
              <CompanyContact company={company} />

              {/* CTA */}
              <div className="bg-primary/5 border border-primary/10 rounded-xl p-5 text-center">
                <p className="text-sm font-medium text-gray-900 mb-2">Vrei ofertă pentru proiectul tău?</p>
                <Button href="/cere-oferta" size="md" className="w-full">
                  Cere Ofertă Gratuită
                </Button>
              </div>

              {/* Related guides */}
              {(() => {
                const relatedGuides = guidesData.guides.filter((g) =>
                  g.relatedSpecializations?.some((s: string) => company.specializations.includes(s))
                );
                if (relatedGuides.length === 0) return null;
                return (
                  <div className="bg-white border border-border rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Ghiduri relevante</h3>
                    <ul className="space-y-2">
                      {relatedGuides.slice(0, 3).map((guide) => (
                        <li key={guide.slug}>
                          <Link
                            href={`/ghid/${guide.slug}`}
                            className="text-sm text-primary-dark hover:underline"
                          >
                            {guide.title.split(' - ')[0]}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
