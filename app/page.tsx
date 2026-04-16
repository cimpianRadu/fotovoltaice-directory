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
    question: 'Cum găsesc un instalator autorizat de panouri fotovoltaice în România?',
    answer:
      'Pe instalatori-fotovoltaice.ro poți compara 45 de firme de instalare panouri fotovoltaice verificate, cu date din registre publice. Filtrează după județ, specializare și certificări ANRE pentru a găsi instalatorul potrivit.',
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
        <div className="max-w-7xl mx-auto px-4 py-16 sm:py-24 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
            Instalatori Autorizați
            <br className="hidden sm:block" />
            <span className="text-primary-light"> Panouri Fotovoltaice România</span>
          </h1>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            Găsește instalatori de panouri fotovoltaice verificați pentru hale industriale, fabrici, clădiri de birouri și spații comerciale. 45 firme cu atestat ANRE din 41 de județe.
          </p>

          <div className="flex justify-center mb-8">
            <SearchBar />
          </div>

        </div>
      </section>

      {/* Promo Banner — Premium Profile Preview */}
      <section className="max-w-7xl mx-auto px-4 pt-8">
        <Link
          href="/publicitate"
          className="block rounded-xl border-2 border-primary/30 bg-primary/5 p-4 sm:p-5 hover:border-primary/50 hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between gap-4 mb-3">
            <p className="text-[10px] sm:text-xs font-semibold text-primary-dark uppercase tracking-wider">
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
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200">
                  &#10003; Partener Verificat
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary-dark">
                  &#9733; Premium
                </span>
              </div>
              <p className="text-xs text-gray-500">Firma ta poate fi promovată aici</p>
            </div>
            <div className="hidden sm:flex flex-col items-end shrink-0 text-right">
              <p className="text-xs text-gray-400">De la</p>
              <p className="text-sm font-bold text-primary-dark">49 EUR/lună</p>
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-2 text-center sm:text-left">
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

      {/* SEO Content + Stats + ANRE Verification */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="max-w-4xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Cum găsești instalatori autorizați de panouri fotovoltaice în România
          </h2>
          <div className="prose prose-gray max-w-none text-gray-600 space-y-4">
            <p>
              Cauți un <strong>instalator de panouri fotovoltaice</strong> pentru firma ta? Alegerea unui
              instalator autorizat ANRE cu experiență în sisteme fotovoltaice comerciale și industriale
              poate face diferența între un sistem care funcționează optim 25+ ani și unul care generează
              probleme din primul an.
            </p>
            <p>
              Pe <strong>instalatori-fotovoltaice.ro</strong> găsești <strong>45 de instalatori autorizați
              de panouri fotovoltaice</strong> din România, verificați cu date reale din registrele oficiale.
              Fiecare firmă are CUI verificat, date financiare publice și informații despre certificări ANRE,
              specializări și acoperire geografică în 41 de județe.
            </p>
          </div>
        </div>

        {/* Stats + ANRE CTA row */}
        <div className="mt-8 grid sm:grid-cols-4 gap-4 max-w-4xl">
          <div className="text-center p-4 rounded-xl bg-surface border border-border">
            <div className="text-3xl font-bold text-primary-dark">45</div>
            <div className="text-sm text-gray-500 mt-1">Firme verificate</div>
          </div>
          <div className="text-center p-4 rounded-xl bg-surface border border-border">
            <div className="text-3xl font-bold text-primary-dark">28</div>
            <div className="text-sm text-gray-500 mt-1">Cu atestat ANRE C2A</div>
          </div>
          <div className="text-center p-4 rounded-xl bg-surface border border-border">
            <div className="text-3xl font-bold text-primary-dark">41</div>
            <div className="text-sm text-gray-500 mt-1">Județe acoperite</div>
          </div>
          <Link
            href="/verificare-anre"
            className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-secondary/20 bg-secondary-dark/5 hover:border-secondary/40 hover:shadow-md transition-all text-center group"
          >
            <svg className="w-7 h-7 text-secondary-dark mb-1 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            <div className="text-sm font-semibold text-secondary-dark">Verifică ANRE</div>
            <div className="text-xs text-gray-500">Caută după CUI sau nume</div>
          </Link>
        </div>

        <div className="max-w-4xl mt-8">
          <div className="prose prose-gray max-w-none text-gray-600 space-y-4">
            <p>
              Spre deosebire de alte surse, nu listăm firme pe baza plăților sau a
              auto-declarațiilor. Toate datele sunt colectate din surse publice — <em>termene.ro</em>,{' '}
              <em>listafirme.eu</em>, <em>anre.ro</em> și site-urile oficiale ale firmelor. Poți
              compara instalatori de panouri fotovoltaice după experiență, certificări, număr de angajați
              și cifra de afaceri, apoi solicita ofertă gratuită direct pe platformă.
            </p>

            <h3 className="text-lg font-semibold text-gray-900 mt-8">Ce verificăm la fiecare instalator de sisteme fotovoltaice</h3>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>Atestat ANRE C2A</strong> — obligatoriu pentru instalarea panourilor fotovoltaice comerciale</li>
              <li><strong>Date financiare reale</strong> — cifra de afaceri și profit din registre publice oficiale</li>
              <li><strong>Experiență dovedită</strong> — an de înființare, număr de angajați, proiecte finalizate</li>
              <li><strong>Acoperire geografică</strong> — în ce județe operează fiecare firmă de instalare</li>
              <li><strong>Specializări</strong> — hale industriale, birouri, retail, agricol, parcuri logistice</li>
            </ul>
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

      {/* CTA for companies */}
      <section className="bg-primary/5 border-y border-primary/10">
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Ești firmă de instalare panouri fotovoltaice?</h2>
          <p className="text-gray-600 mb-6 max-w-lg mx-auto">
            Listează-ți firma pe platforma noastră și fii vizibil pentru clienții care caută instalatori autorizați de panouri fotovoltaice în zona ta. Înscrierea este gratuită.
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
