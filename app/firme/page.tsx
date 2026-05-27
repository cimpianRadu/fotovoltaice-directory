import { Suspense } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import FAQ from '@/components/seo/FAQ';
import { generateBreadcrumbJsonLd, generateFAQJsonLd } from '@/lib/seo';
import { getCompanies, getCoveredCounties, slugifyCounty, getCompaniesByCounty } from '@/lib/utils';
import CompanyListClient from './CompanyListClient';

const COMPANY_COUNT = getCompanies().length;
const COUNTY_COUNT = getCoveredCounties().length;

export const metadata: Metadata = {
  title: `Instalatori Panouri Fotovoltaice — Lista cu ${COMPANY_COUNT} Firme Autorizate ANRE 2026`,
  description: `Lista completă cu ${COMPANY_COUNT} instalatori autorizați ANRE de panouri fotovoltaice din România. Firme verificate, date financiare reale, acoperire în ${COUNTY_COUNT} județe. Compară și cere ofertă gratuită.`,
  alternates: { canonical: '/firme' },
};

const firmeFaqs = [
  {
    question: 'Care sunt firmele autorizate ANRE de panouri fotovoltaice?',
    answer: `Pe platforma noastră găsești o listă cu ${COMPANY_COUNT} de instalatori de panouri fotovoltaice din România, cu date verificate din registrele publice (ANRE, ONRC, termene.ro). Atestatul ANRE relevant pentru montajul sistemelor fotovoltaice este C1A sau C2A — îl poți verifica live pe fiecare profil sau pe pagina /verificare-anre.`,
  },
  {
    question: 'Cum verific dacă un instalator de panouri fotovoltaice este autorizat?',
    answer: 'Verifică atestatul ANRE (C1A pentru proiectare, C2A pentru execuție instalații de utilizare). Toate firmele listate aici au atestatul verificat live în registrul oficial ANRE — vezi badge-ul de pe fiecare profil sau folosește pagina /verificare-anre. Poți verifica și CUI-ul firmei în registrul ONRC.',
  },
  {
    question: 'Cum aleg cel mai bun instalator de panouri fotovoltaice?',
    answer: 'Compară instalatorii după: atestat ANRE valid, experiență pe proiecte similare (rezidențiale sau comerciale), certificări ISO, stabilitate financiară (cifră de afaceri, ani de activitate) și acoperire geografică. Solicită oferte de la cel puțin 3 firme înainte de a decide.',
  },
  {
    question: 'Listarea firmelor de pe platformă este gratuită pentru clienți?',
    answer: 'Da. Consultarea listei de instalatori, compararea firmelor și cererea de ofertă sunt complet gratuite. Primești oferte personalizate de la firmele care acoperă județul tău, fără cost și fără obligații.',
  },
];

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
            Instalatori Panouri Fotovoltaice — Lista Firmelor Autorizate ANRE
          </h1>
          <p className="text-gray-500 mt-2">
            {COMPANY_COUNT} firme verificate de instalare panouri fotovoltaice, cu acoperire în {COUNTY_COUNT} județe
          </p>
          <p className="text-sm text-gray-500 mt-3 max-w-3xl">
            Lista include {COMPANY_COUNT} de firme verificate de instalare panouri fotovoltaice și panouri solare
            din România, cu date reale din registrele publice (ANRE, ONRC, termene.ro). Compară instalatori
            autorizați ANRE după experiență, certificări, specializări și acoperire geografică. Filtrează după județ,
            specializare sau dimensiunea proiectului și solicită ofertă gratuită — totul gratuit și fără obligații.
          </p>
        </div>

        <Suspense fallback={<div className="text-center py-12 text-gray-400">Se încarcă...</div>}>
          <CompanyListClient />
        </Suspense>

        {/* SSR company index — crawlable list of all firms (the client list above bails to
            client render via useSearchParams, so this is the indexable directory content). */}
        <div className="mt-14 border-t border-border pt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            Toate firmele de instalare panouri fotovoltaice
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Director complet cu cei {COMPANY_COUNT} de instalatori autorizați, organizați pe județe
          </p>
          <div className="space-y-7">
            {getCoveredCounties()
              .sort((a, b) => a.localeCompare(b, 'ro'))
              .map((county) => {
                const companies = getCompaniesByCounty(county).sort((a, b) =>
                  a.name.localeCompare(b.name, 'ro')
                );
                return (
                  <div key={county}>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">
                      <Link
                        href={`/firme/judet/${slugifyCounty(county)}`}
                        className="hover:text-primary-dark"
                      >
                        Instalatori panouri fotovoltaice în {county}
                      </Link>{' '}
                      <span className="text-gray-400 font-normal">({companies.length})</span>
                    </h3>
                    <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
                      {companies.map((c) => (
                        <li key={c.slug}>
                          <Link
                            href={`/firme/${c.slug}`}
                            className="text-sm text-gray-600 hover:text-primary-dark hover:underline"
                          >
                            {c.name}
                            <span className="text-gray-400"> — {c.location.city}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
          </div>
        </div>

        {/* FAQ — national "firme autorizate ANRE" cluster */}
        <JsonLd data={generateFAQJsonLd(firmeFaqs)} />
        <div className="mt-12 border-t border-border pt-8">
          <FAQ items={firmeFaqs} title="Întrebări frecvente despre instalatorii de panouri fotovoltaice" />
        </div>

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
