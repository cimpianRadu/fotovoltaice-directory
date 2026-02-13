import type { Metadata } from 'next';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import LeadForm from '@/components/forms/LeadForm';
import { generateBreadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Cere Ofertă Gratuită - Panouri Fotovoltaice Comerciale',
  description:
    'Completează formularul și primești oferte personalizate de la instalatori verificați de panouri fotovoltaice comerciale din zona ta.',
};

export default function CereOfertaPage() {
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
            Completează formularul de mai jos și vei fi contactat de instalatori verificați din zona ta. Serviciul este gratuit și fără obligații.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-border p-6">
          <LeadForm />
        </div>

        <div className="mt-6 bg-surface rounded-xl p-5 border border-border">
          <h2 className="font-semibold text-gray-900 mb-2">Cum funcționează?</h2>
          <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
            <li>Completezi formularul cu detaliile proiectului tău</li>
            <li>Primești oferte de la instalatori verificați din zona ta</li>
            <li>Compari ofertele și alegi cel mai potrivit instalator</li>
          </ol>
        </div>
      </div>
    </>
  );
}
