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
  title: `Firme Autorizate Panouri Fotovoltaice 2026 — ${COMPANY_COUNT} Instalatori ANRE pentru Montaj și Instalare`,
  description: `Lista completă cu ${COMPANY_COUNT} firme autorizate ANRE pentru montaj și instalare panouri fotovoltaice din România. Instalatori verificați, date financiare reale, acoperire ${COUNTY_COUNT} județe. Cere ofertă gratuită.`,
  alternates: { canonical: '/firme' },
};

const firmeFaqs = [
  {
    question: 'Care sunt firmele autorizate ANRE pentru panouri fotovoltaice?',
    answer: `Pe platformă găsești lista cu ${COMPANY_COUNT} firme autorizate ANRE pentru montaj și instalare panouri fotovoltaice din România, cu date verificate în registrele publice (ANRE, ONRC, termene.ro). Atestatul ANRE relevant pentru execuția unei centrale fotovoltaice este **C1A** (proiectare) sau **C2A** (execuție instalații de utilizare ≤ 1 kV). Îl verifici live pe fiecare profil sau pe pagina /verificare-anre.`,
  },
  {
    question: 'Care e diferența între firme autorizate ANRE și firme autorizate AFM?',
    answer: 'Sunt două autorizări distincte cu rol diferit. **ANRE** (Autoritatea Națională de Reglementare în Energie) emite atestatul tehnic obligatoriu prin lege pentru ORICE firmă care execută racordări la rețeaua de distribuție — fără atestat ANRE C1A/C2A, instalația nu poate fi pusă în funcțiune ca prosumator. **AFM** (Administrația Fondului pentru Mediu) validează firmele care pot înscrie clienți în programul Casa Verde Fotovoltaice — e o validare administrativă pentru gestionarea subvenției, nu o licență tehnică. O firmă poate avea ANRE fără AFM (instalează, dar tu nu primești subvenția prin ea), sau AFM fără ANRE (poate aplica dosarul, dar nu execută legal). Pentru un sistem cu subvenție, alegi firma cu **ambele** validări active.',
  },
  {
    question: 'Cum verific dacă un instalator de panouri fotovoltaice este autorizat?',
    answer: 'Verifică atestatul ANRE (C1A pentru proiectare, C2A pentru execuție instalații de utilizare). Toate firmele listate aici au atestatul verificat live în registrul oficial ANRE — vezi badge-ul de pe fiecare profil sau folosește pagina /verificare-anre. Verifică și CUI-ul firmei în registrul ONRC pentru bilanț, dată înființare și stare activă.',
  },
  {
    question: 'Cum aleg cea mai bună firmă autorizată pentru montajul panourilor fotovoltaice?',
    answer: 'Compară firmele după 5 criterii: (1) atestat ANRE C1A sau C2A activ, (2) experiență pe proiecte similare (rezidențial casă/comercial hală), (3) certificări ISO 9001/14001/45001, (4) stabilitate financiară (cifră de afaceri > 5× valoarea contractului, profit pozitiv consistent, ani de activitate), (5) acoperire geografică reală în județul tău. Cere oferte de la minim 3 firme înainte de a decide.',
  },
  {
    question: 'Listarea firmelor de pe platformă este gratuită pentru clienți?',
    answer: 'Da. Consultarea listei de instalatori autorizați, compararea firmelor și cererea de ofertă sunt complet gratuite. Primești oferte personalizate de la firmele care acoperă județul tău, fără cost și fără obligații.',
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
            Firme Autorizate Panouri Fotovoltaice — Lista cu {COMPANY_COUNT} Instalatori ANRE pentru Montaj și Instalare
          </h1>
          <p className="text-gray-500 mt-2">
            {COMPANY_COUNT} firme autorizate ANRE pentru montaj panouri fotovoltaice, cu acoperire în {COUNTY_COUNT} județe
          </p>
          <p className="text-sm text-gray-500 mt-3 max-w-3xl">
            Lista cu {COMPANY_COUNT} firme autorizate ANRE pentru instalare panouri fotovoltaice și panouri solare
            din România — atestat C1A sau C2A verificat live în registrul oficial, plus date financiare reale din
            registrele publice (ONRC, termene.ro). Compară instalatori autorizați ANRE după experiență, certificări
            ISO, specializări (rezidențial/comercial) și acoperire geografică. Filtrează după județ, segment sau
            dimensiunea proiectului și solicită ofertă gratuită — fără cost, fără obligații.
          </p>
        </div>

        <Suspense fallback={<div className="text-center py-12 text-gray-400">Se încarcă...</div>}>
          <CompanyListClient />
        </Suspense>

        {/* SSR company index — crawlable list of all firms (the client list above bails to
            client render via useSearchParams, so this is the indexable directory content). */}
        <div className="mt-14 border-t border-border pt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            Toate firmele autorizate ANRE pentru montaj panouri fotovoltaice
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Director complet cu cele {COMPANY_COUNT} firme autorizate de instalare panouri fotovoltaice, organizate pe județe
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
