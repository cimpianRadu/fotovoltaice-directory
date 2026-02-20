import type { Metadata } from 'next';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import ListingForm from '@/components/forms/ListingForm';
import { generateBreadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Listează-ți Firma - Instalatori Fotovoltaice România',
  description:
    'Ești instalator de panouri fotovoltaice? Listează-ți firma gratuit în directorul nostru și fii vizibil pentru clienții care caută instalatori în zona ta.',
  alternates: { canonical: '/listeaza-firma' },
};

export default function ListeazaFirmaPage() {
  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: 'Acasă', url: '/' },
          { name: 'Listează-ți Firma', url: '/listeaza-firma' },
        ])}
      />

      <div className="max-w-3xl mx-auto px-4 py-6">
        <Breadcrumbs items={[{ label: 'Listează-ți Firma' }]} />

        <div className="mt-6 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Listează-ți Firma în Director
          </h1>
          <p className="text-gray-500 mt-2">
            Completează formularul de mai jos pentru a adăuga firma ta în directorul de instalatori fotovoltaice. Listarea este gratuită.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-border p-6">
          <ListingForm />
        </div>

        <div className="mt-6 bg-surface rounded-xl p-5 border border-border">
          <h2 className="font-semibold text-gray-900 mb-3">De ce să te listezi?</h2>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5">1.</span>
              <span><strong>Vizibilitate</strong> — Profilul tău apare în căutările clienților din zona ta</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5">2.</span>
              <span><strong>Credibilitate</strong> — Certificările și proiectele tale sunt prezentate profesional</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5">3.</span>
              <span><strong>Contact direct</strong> — Clienții te pot contacta direct prin telefon, email sau site</span>
            </li>
          </ul>
        </div>
      </div>
    </>
  );
}
