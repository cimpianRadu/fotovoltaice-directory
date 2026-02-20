import { Suspense } from 'react';
import type { Metadata } from 'next';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import { generateBreadcrumbJsonLd } from '@/lib/seo';
import CompanyListClient from './CompanyListClient';

export const metadata: Metadata = {
  title: 'Firme Instalare Panouri Fotovoltaice | Director Instalatori',
  description:
    'Director complet cu firme verificate de instalare panouri fotovoltaice pentru hale industriale, clădiri de birouri, parcuri logistice și spații comerciale.',
};

export default function FirmePage() {
  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: 'Acasă', url: '/' },
          { name: 'Firme', url: '/firme' },
        ])}
      />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Breadcrumbs items={[{ label: 'Firme Instalatoare' }]} />

        <div className="mt-6 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Firme Instalare Fotovoltaice Comerciale
          </h1>
          <p className="text-gray-500 mt-2">
            Găsește instalatorul potrivit pentru proiectul tău industrial sau comercial
          </p>
        </div>

        <Suspense fallback={<div className="text-center py-12 text-gray-400">Se încarcă...</div>}>
          <CompanyListClient />
        </Suspense>
      </div>
    </>
  );
}
