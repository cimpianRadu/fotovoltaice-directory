import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { existsSync } from 'fs';
import { join } from 'path';
import SearchBar from '@/components/forms/SearchBar';

const HERO_IMAGE_EXTENSIONS = ['webp', 'png', 'jpg'];

function getHeroImage(slug: string): string | null {
  for (const ext of HERO_IMAGE_EXTENSIONS) {
    const filename = `${slug}.${ext}`;
    if (existsSync(join(process.cwd(), 'public', 'images', 'guides', filename))) {
      return `/images/guides/${filename}`;
    }
  }
  return null;
}
import CompanyCard from '@/components/company/CompanyCard';
import FAQ from '@/components/seo/FAQ';
import JsonLd from '@/components/seo/JsonLd';
import WaitlistForm from '@/components/forms/WaitlistForm';
import SponsorBanner from '@/components/sponsor/SponsorBanner';
import { getCompanies, getCoveredCounties, getFeaturedCompanies } from '@/lib/utils';
import { generateOrganizationJsonLd, generateFAQJsonLd } from '@/lib/seo';
import guidesData from '@/data/guides.json';

const COMPANY_COUNT = getCompanies().length;
const COUNTY_COUNT = getCoveredCounties().length;
const ANRE_COUNT = getCompanies().filter((c) => c.anreMatch !== null).length;

export const metadata: Metadata = {
  alternates: {
    canonical: '/',
  },
};

const homeFaqs = [
  {
    question: 'Cum găsesc un instalator autorizat de panouri fotovoltaice în România?',
    answer: `Pe instalatori-fotovoltaice.ro poți compara ${COMPANY_COUNT} de firme de instalare panouri fotovoltaice verificate, cu date din registre publice. Filtrează după județ, specializare și certificări ANRE pentru a găsi instalatorul potrivit.`,
  },
  {
    question: 'Ce certificări trebuie să aibă un instalator de panouri fotovoltaice?',
    answer:
      'Un instalator autorizat trebuie să dețină atestat ANRE tip C2A (obligatoriu pentru sisteme fotovoltaice comerciale), și ideal certificări ISO 9001 (calitate) și ISO 14001 (mediu). Pe platforma noastră poți verifica certificările fiecărei firme.',
  },
  {
    question: 'Cât costă instalarea unui sistem fotovoltaic comercial?',
    answer:
      'Costul variază între 600-900 EUR/kWp instalat, în funcție de dimensiunea sistemului. Un sistem de 100 kWp pentru o hală medie costă între 65.000 și 85.000 EUR, cu amortizare în 4-6 ani. Cere ofertă de la mai mulți instalatori pentru cel mai bun preț.',
  },
  {
    question: 'Cât durează instalarea unui sistem fotovoltaic comercial?',
    answer:
      'De la evaluare până la punerea în funcțiune, procesul durează 4-12 săptămâni, în funcție de dimensiunea proiectului și de obținerea avizelor necesare.',
  },
  {
    question: 'Ce garanții primesc de la instalatorul de panouri fotovoltaice?',
    answer:
      'Standard: 25-30 ani pe panouri (garanție de performanță), 10-12 ani pe invertoare, 5-10 ani pe manoperă. Instalatorii autorizați de pe platforma noastră oferă garanții extinse și contract de mentenanță.',
  },
  {
    question: 'Cum funcționează statutul de prosumator pentru firme?',
    answer:
      'Ca prosumator comercial, produceți energie pentru consum propriu și vindeți surplusul la prețul pieței. Capacitatea maximă este de 400 kWp fără licență ANRE. Un instalator autorizat vă ajută cu dosarul de prosumator.',
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
        <div className="max-w-7xl mx-auto px-4 py-10 sm:py-20 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
            Instalatori Autorizați
            <br className="hidden sm:block" />
            <span className="text-primary-light"> Panouri Fotovoltaice România</span>
          </h1>
          <p className="text-base sm:text-lg text-gray-300 mb-6 max-w-2xl mx-auto">
            Găsește instalatori verificați pentru hale industriale, fabrici, clădiri de birouri și spații comerciale.
          </p>

          {/* Live-data proof bar — what distinguishes us from generic directories */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8 text-xs sm:text-sm">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <strong className="font-semibold">{COMPANY_COUNT}</strong>
              <span className="text-gray-200">firme listate</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
              <strong className="font-semibold">{ANRE_COUNT}</strong>
              <span className="text-gray-200">cu ANRE C2A verificat live</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
              <strong className="font-semibold">{COUNTY_COUNT}</strong>
              <span className="text-gray-200">județe</span>
            </span>
          </div>

          <div className="flex justify-center mb-4">
            <SearchBar />
          </div>

          <p className="text-xs text-gray-300">
            Date verificate din registre publice — ANRE, CUI, situații financiare
          </p>

        </div>
      </section>

      {/* Promo Banner — Premium Profile Preview */}
      <section className="max-w-7xl mx-auto px-4 pt-8">
        <Link
          href="/publicitate"
          className="block rounded-xl border-2 border-primary/30 bg-primary/5 p-4 sm:p-5 hover:border-primary/50 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between gap-4 mb-3">
            <p className="text-xs font-semibold text-primary-dark uppercase tracking-wider">
              Profil Premium — Exemplu
            </p>
            <span className="text-xs text-primary-dark font-medium group-hover:underline hidden sm:inline">
              Află mai multe &rarr;
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 sm:p-4 rounded-lg bg-white border border-primary/20">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-primary-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-0.5">
                <p className="text-sm font-semibold text-gray-900">Exemplu Promovare</p>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                  &#10003; Partener Verificat
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary-dark">
                  &#9733; Premium
                </span>
              </div>
              <p className="text-xs text-gray-500">Firma ta poate fi promovată aici</p>
              <p className="text-sm font-bold text-primary-dark mt-1 sm:hidden">De la 49 EUR/lună + TVA</p>
            </div>
            <div className="hidden sm:flex flex-col items-end shrink-0 text-right">
              <p className="text-xs text-gray-500">De la</p>
              <p className="text-sm font-bold text-primary-dark">49 EUR/lună</p>
              <p className="text-xs text-gray-500">+ TVA</p>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-2 text-center sm:text-left">
            Poziție prioritară &middot; Lead-uri din &quot;Cere Ofertă&quot; &middot; Badge verificat &middot; Statistici profil
          </p>
        </Link>
      </section>

      {/* Featured Companies */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Instalatori de Panouri Fotovoltaice Recomandați</h2>
            <p className="text-gray-500 mt-1">Firme verificate cu atestat ANRE și experiență dovedită</p>
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

      {/* Why trust us + ANRE Verification */}
      <section className="bg-surface border-y border-border">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: text + stats */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                De ce instalatori-fotovoltaice.ro
              </h2>
              <p className="text-gray-600 mb-6">
                Cauți un <strong>instalator de panouri fotovoltaice</strong> pentru firma ta? Pe platforma noastră găsești <strong>{COMPANY_COUNT} de firme verificate</strong> cu date din registrele oficiale. Fiecare firmă are CUI verificat, certificări ANRE confirmate live din portal.anre.ro și date financiare publice.
              </p>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-3 rounded-lg bg-white border border-border">
                  <div className="text-2xl font-bold text-primary-dark">{COMPANY_COUNT}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Firme verificate</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-white border border-border">
                  <div className="text-2xl font-bold text-primary-dark">{ANRE_COUNT}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Cu ANRE C2A</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-white border border-border">
                  <div className="text-2xl font-bold text-primary-dark">{COUNTY_COUNT}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Județe acoperite</div>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2"><span className="text-green-600 font-bold">&#10003;</span> Atestat ANRE C2A verificat pe portal.anre.ro</div>
                <div className="flex items-center gap-2"><span className="text-green-600 font-bold">&#10003;</span> Date financiare din registre publice oficiale</div>
                <div className="flex items-center gap-2"><span className="text-green-600 font-bold">&#10003;</span> Acoperire în {COUNTY_COUNT} județe, filtrare după specializare</div>
                <div className="flex items-center gap-2"><span className="text-green-600 font-bold">&#10003;</span> Ofertă gratuită direct pe platformă</div>
              </div>
            </div>

            {/* Right: ANRE Verification CTA card */}
            <div className="bg-white rounded-2xl border border-border shadow-sm p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Verificare Atestat ANRE</h3>
              <p className="text-gray-500 mb-6 text-sm">
                Verifică gratuit dacă un instalator are atestat ANRE valid. Caută după nume sau CUI și vezi certificările direct din registrul oficial.
              </p>
              <Link
                href="/verificare-anre"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                Verifică un instalator
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <p className="text-xs text-gray-400 mt-4">Date în timp real din portal.anre.ro</p>
            </div>
          </div>
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
              .filter((g) => g.published !== false)
              .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
              .slice(0, 3)
              .map((guide) => {
                const heroImage = getHeroImage(guide.slug);
                return (
                  <Link
                    key={guide.slug}
                    href={`/ghid/${guide.slug}`}
                    className="flex flex-col rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all bg-white overflow-hidden"
                  >
                    {heroImage && (
                      <Image
                        src={heroImage}
                        alt={guide.title}
                        width={600}
                        height={315}
                        className="w-full h-40 object-cover"
                      />
                    )}
                    <div className="p-5">
                      <h3 className="font-semibold text-gray-900 mb-2 text-sm leading-snug">
                        {guide.title}
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-2">{guide.heroDescription}</p>
                    </div>
                  </Link>
                );
              })}
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

      {/* Sponsor */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="max-w-sm mx-auto">
          <SponsorBanner />
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <FAQ items={homeFaqs} title="Întrebări Frecvente" />
      </section>

      {/* DOMINANT CTA — listează firma (single next-step for visitors who are companies) */}
      <section className="bg-gradient-to-br from-primary/10 via-primary/5 to-white border-y border-primary/20">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:py-20 text-center">
          <p className="text-sm font-semibold text-primary-dark uppercase tracking-wider mb-3">
            Pentru firme de instalare
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            Ești firmă de instalare fotovoltaică?
          </h2>
          <p className="text-base text-gray-600 mb-8 max-w-xl mx-auto">
            Listează-ți firma gratuit și fii vizibil pentru managerii care caută instalatori autorizați ANRE în zona ta.
          </p>
          <Link
            href="/listeaza-firma"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold text-base px-8 min-h-[52px] rounded-lg transition-colors shadow-sm"
          >
            Listează-ți Firma Gratuit
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
          <p className="text-xs text-gray-500 mt-4">Fără carduri, fără contract — gata în 5 minute</p>
        </div>
      </section>

      {/* Waitlist Rezidential — compact, sub footer area, nu CTA dominant */}
      <section className="bg-surface border-t border-border">
        <div className="max-w-3xl mx-auto px-4 py-8 sm:py-10 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-left">
          <div className="flex-1">
            <p className="text-xs font-semibold text-primary-dark uppercase tracking-wider mb-1">
              În curând · Rezidențial
            </p>
            <p className="text-sm text-gray-700">
              <strong>Cauți panouri pentru casă?</strong> Lansăm în curând platforma pentru rezidențial.
            </p>
          </div>
          <div className="shrink-0">
            <WaitlistForm />
          </div>
        </div>
      </section>
    </>
  );
}
