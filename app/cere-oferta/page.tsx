import type { Metadata } from 'next';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import LeadForm from '@/components/forms/LeadForm';
import SegmentNotice from './SegmentNotice';
import SponsorBanner from '@/components/sponsor/SponsorBanner';
import { generateBreadcrumbJsonLd } from '@/lib/seo';
import companiesData from '@/data/companies.json';

export const metadata: Metadata = {
  title: 'Cere Ofertă Gratuită - Instalatori Fotovoltaice',
  description:
    'Completează formularul și primești oferte personalizate de la instalatori verificați de panouri fotovoltaice comerciale din zona ta.',
  alternates: { canonical: '/cere-oferta' },
};

export default async function CereOfertaPage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string }>;
}) {
  const { company: companySlug } = await searchParams;
  const preselected = companySlug
    ? companiesData.companies.find((c) => c.slug === companySlug)
    : undefined;

  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: 'Acasă', url: '/' },
          { name: 'Cere Ofertă', url: '/cere-oferta' },
        ])}
      />

      <div className="max-w-3xl mx-auto px-4 py-6">
        <Breadcrumbs items={[{ label: 'Cere Ofertă' }]} />

        <div className="mt-6 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Cere Ofertă Gratuită
          </h1>
          <p className="text-gray-500 mt-2">
            Completează formularul de mai jos, iar noi trimitem cererea ta către instalatorii verificați din zona ta. Serviciul este gratuit și fără obligații.
          </p>
        </div>

        <SegmentNotice />

        {preselected && (
          <div className="mb-4 rounded-lg bg-primary/5 border border-primary/20 px-4 py-3 text-sm text-gray-700">
            Cerere pentru <span className="font-semibold text-gray-900">{preselected.name}</span>
            {preselected.location?.county ? ` (${preselected.location.county})` : ''}. Vei putea primi oferte și de la alți instalatori potriviți din zona ta.
          </div>
        )}

        <div className="bg-white rounded-xl border border-border p-6">
          <LeadForm preselectedCompany={preselected?.name} />
        </div>

        <div className="mt-6 bg-surface rounded-xl p-5 border border-border">
          <h2 className="font-semibold text-gray-900 mb-2">Cum funcționează?</h2>
          <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
            <li>Completezi formularul cu detaliile proiectului tău</li>
            <li>Trimitem cererea ta către instalatorii potriviți de pe platformă, din zona ta</li>
            <li>Instalatorii interesați te contactează cu oferte, pe care le compari și alegi</li>
          </ol>
        </div>

        {/* Sub form, nu deasupra: pagina există ca să convertească cererea,
            partenerul (finanțare/leasing) e relevant abia după ce omul s-a
            hotărât să ceară oferte. */}
        <div className="mt-6">
          <SponsorBanner position="cere-oferta" />
        </div>
      </div>
    </>
  );
}
