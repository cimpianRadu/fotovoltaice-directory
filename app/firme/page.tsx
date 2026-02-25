import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import { generateBreadcrumbJsonLd } from '@/lib/seo';
import { getCoveredCounties, slugifyCounty, getCompaniesByCounty } from '@/lib/utils';
import CompanyListClient from './CompanyListClient';

export const metadata: Metadata = {
  title: 'Firme Instalare Panouri Fotovoltaice | Director Instalatori',
  description:
    'Platformă completă cu firme verificate de instalare panouri fotovoltaice pentru hale industriale, clădiri de birouri, parcuri logistice și spații comerciale.',
  alternates: { canonical: '/firme' },
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

        {/* County links for PSEO / internal linking */}
        <div className="mt-12 border-t border-border pt-8">
          <h2 className="text-lg font-bold text-gray-900 mb-2">
            Instalatori Fotovoltaici per Județ
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Găsește firme de instalare panouri fotovoltaice în județul tău
          </p>
          <div className="flex flex-wrap gap-2">
            {getCoveredCounties()
              .sort()
              .map((county) => {
                const count = getCompaniesByCounty(county).length;
                return (
                  <Link
                    key={county}
                    href={`/firme/judet/${slugifyCounty(county)}`}
                    className="text-sm px-3 py-1.5 rounded-full border border-border text-gray-600 hover:border-primary/30 hover:text-primary-dark transition-colors"
                  >
                    {county}{' '}
                    <span className="text-gray-400">({count})</span>
                  </Link>
                );
              })}
          </div>
        </div>
      </div>
    </>
  );
}
