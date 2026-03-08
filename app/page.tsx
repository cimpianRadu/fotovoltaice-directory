import type { Metadata } from 'next';
import Link from 'next/link';
import SearchBar from '@/components/forms/SearchBar';
import CompanyCard from '@/components/company/CompanyCard';
import FAQ from '@/components/seo/FAQ';
import JsonLd from '@/components/seo/JsonLd';
import WaitlistForm from '@/components/forms/WaitlistForm';
import { getFeaturedCompanies } from '@/lib/utils';
import { generateOrganizationJsonLd, generateFAQJsonLd } from '@/lib/seo';
import guidesData from '@/data/guides.json';

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
};

const homeFaqs = [
  {
    question: 'Cât costă un sistem fotovoltaic pentru o hală industrială?',
    answer:
      'Costul variază între 600-900 EUR/kWp instalat, în funcție de dimensiunea sistemului. Un sistem de 100 kWp pentru o hală medie costă între 65.000 și 85.000 EUR, cu amortizare în 4-6 ani.',
  },
  {
    question: 'Ce certificări trebuie să aibă un instalator?',
    answer:
      'Un instalator profesionist trebuie să dețină atestat ANRE tip C2A (obligatoriu pentru sisteme comerciale), și ideal certificări ISO 9001 (calitate) și ISO 14001 (mediu).',
  },
  {
    question: 'Cât durează instalarea unui sistem fotovoltaic comercial?',
    answer:
      'De la evaluare până la punerea în funcțiune, procesul durează 4-12 săptămâni, în funcție de dimensiunea proiectului și de obținerea avizelor necesare.',
  },
  {
    question: 'Ce garanții primesc?',
    answer:
      'Standard: 25-30 ani pe panouri (garanție de performanță), 10-12 ani pe invertoare, 5-10 ani pe manoperă. Unii instalatori de pe platforma noastră oferă garanții extinse.',
  },
  {
    question: 'Cum funcționează statutul de prosumator pentru firme?',
    answer:
      'Ca prosumator comercial, produceți energie pentru consum propriu și vindeți surplusul la prețul pieței. Capacitatea maximă este de 400 kWp fără licență ANRE. Veniturile pot fi scutite de impozit.',
  },
];

export default function HomePage() {
  const featured = getFeaturedCompanies();

  return (
    <>
      <JsonLd data={generateOrganizationJsonLd()} />
      <JsonLd data={generateFAQJsonLd(homeFaqs)} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-secondary-dark via-secondary to-secondary-light text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:py-24 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
            Instalatori Panouri Fotovoltaice
            <br className="hidden sm:block" />
            <span className="text-primary-light"> Comerciale și Industriale</span>
          </h1>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            Platforma #1 pentru firme de instalare panouri fotovoltaice pe hale, fabrici, clădiri de birouri și spații comerciale din România.
          </p>

          <div className="flex justify-center mb-8">
            <SearchBar />
          </div>

        </div>
      </section>

      {/* Featured Companies */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Firme Recomandate</h2>
            <p className="text-gray-500 mt-1">Instalatori verificați cu experiență dovedită</p>
          </div>
          <Link
            href="/firme"
            className="hidden sm:inline-flex text-sm font-medium text-primary-dark hover:text-primary transition-colors"
          >
            Vezi toate firmele &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {featured.slice(0, 6).map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/firme"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary-dark hover:text-primary transition-colors"
          >
            Vezi toate firmele &rarr;
          </Link>
        </div>
      </section>

      {/* Guides */}
      <section className="bg-surface border-y border-border">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Ghiduri Utile</h2>
              <p className="text-gray-500 mt-1">Informații verificate pentru decizii informate</p>
            </div>
            <Link
              href="/ghid"
              className="hidden sm:inline-flex text-sm font-medium text-primary-dark hover:text-primary transition-colors"
            >
              Toate ghidurile &rarr;
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...guidesData.guides]
              .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
              .slice(0, 3)
              .map((guide) => (
                <Link
                  key={guide.slug}
                  href={`/ghid/${guide.slug}`}
                  className="flex flex-col p-5 rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all bg-white"
                >
                  <h3 className="font-semibold text-gray-900 mb-2 text-sm leading-snug">
                    {guide.title}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-2">{guide.heroDescription}</p>
                </Link>
              ))}
          </div>

          <div className="mt-6 text-center sm:hidden">
            <Link
              href="/ghid"
              className="text-sm font-medium text-primary-dark hover:text-primary transition-colors"
            >
              Toate ghidurile &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* CTA for companies */}
      <section className="bg-primary/5 border-y border-primary/10">
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Ești instalator fotovoltaic?</h2>
          <p className="text-gray-600 mb-6 max-w-lg mx-auto">
            Listează-ți firma pe platforma noastră și fii vizibil pentru clienții care caută instalatori în zona ta. Înscrierea este gratuită.
          </p>
          <Link
            href="/listeaza-firma"
            className="inline-flex items-center bg-primary hover:bg-primary-dark text-white font-semibold px-8 py-3 rounded-lg transition-colors"
          >
            Listează-ți Firma Gratuit
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <FAQ items={homeFaqs} title="Întrebări Frecvente" />
      </section>

      {/* Waitlist Rezidential */}
      <section className="bg-surface border-t border-border">
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <p className="text-sm font-medium text-primary-dark mb-2">În curând</p>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Cauți panouri fotovoltaice pentru casă?
          </h2>
          <p className="text-gray-600 mb-6">
            Lansăm în curând platforma pentru rezidențial. Înscrie-te pentru a fi notificat.
          </p>
          <div className="flex justify-center">
            <WaitlistForm />
          </div>
        </div>
      </section>
    </>
  );
}
