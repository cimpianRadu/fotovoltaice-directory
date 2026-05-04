import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import { generateBreadcrumbJsonLd, generateFAQJsonLd } from '@/lib/seo';
import { getCompanies, SITE_URL } from '@/lib/utils';
import { getCompanyAnreCerts, PV_RELEVANT_CODES } from '@/lib/anre';
import CorrectionForm from '@/components/forms/CorrectionForm';
import ClasamentTable from '@/components/clasament/ClasamentTable';
import PremiumPoolSection from '@/components/promo/PremiumPoolSection';

export const metadata: Metadata = {
  title: 'Clasament Firme Panouri Fotovoltaice România 2026 — Sortare după Cifră, Angajați, Atestate ANRE',
  description:
    'Clasament transparent al firmelor de instalare panouri fotovoltaice din România. Sortare după cifră de afaceri, profit, număr de angajați și filtrare după atestate ANRE active (C2A, C1A, B). Date din bilanțurile publice și portal.anre.ro.',
  alternates: { canonical: '/clasament' },
};

const FAQS = [
  {
    question: 'Cum e ordonat clasamentul?',
    answer:
      'Implicit, firmele sunt sortate descrescător după cifra de afaceri din ultimul an fiscal disponibil. Poți schimba sortarea în orice moment — după profit net, marjă, număr de angajați, anul înființării sau alfabetic — făcând click pe antetul coloanei respective. Nu există un „scor agregat" arbitrar: tu alegi ce criteriu contează pentru proiectul tău.',
  },
  {
    question: 'De unde provin datele financiare?',
    answer:
      'Cifra de afaceri, profitul net și numărul de angajați sunt extrase din bilanțurile oficiale depuse la Ministerul Finanțelor (mfinante.gov.ro), agregate prin API-ul targetare.ro. Anul înființării provine din Registrul Comerțului. Pentru fiecare firmă listăm CUI-ul, deci datele pot fi verificate independent.',
  },
  {
    question: 'De ce majoritatea datelor sunt pentru 2024 și nu 2025?',
    answer:
      'În România, firmele au obligația să depună bilanțul anual la ANAF până pe 30 mai a anului următor. Asta înseamnă că în aprilie 2026, ultimul an fiscal cu bilanțuri complete și publice la Ministerul Finanțelor este 2024 — firmele depun chiar acum raportările pentru 2025. Câteva firme care au depus deja (early filers) apar în tabel cu date 2025 — poți vedea anul exact sub fiecare cifră de afaceri. Refacem extragerea datelor vara 2026, când majoritatea bilanțurilor 2025 vor fi publice.',
  },
  {
    question: 'Ce înseamnă atestatele ANRE și cum le folosesc la filtrare?',
    answer:
      'Atestatele ANRE sunt emise de Autoritatea Națională de Reglementare în Energie și autorizează firma să proiecteze și execute instalații electrice. Pentru proiecte fotovoltaice comerciale contează în principal C2A (medie și înaltă tensiune, obligatoriu peste 50 kWp conectat la rețea), C1A (joasă și medie tensiune), B (proiectare) și BP/BE (proiectare/execuție pentru anumite categorii). Bifează codurile dorite în filtru — vei vedea doar firmele care le au pe toate active simultan. Statusul se verifică direct în portal.anre.ro.',
  },
  {
    question: 'De ce firma X nu apare în clasament?',
    answer:
      'Clasamentul include toate firmele adăugate în directorul nostru. Selecția firmelor se face manual pe baza activității reale pe segmentul comercial/industrial și a unui atestat ANRE valid. Dacă administrezi o firmă de instalare fotovoltaică cu experiență C&I care nu e listată, poți solicita adăugarea prin formularul de la /listeaza-firma.',
  },
  {
    question: 'Firmele plătesc ca să apară mai sus?',
    answer:
      'Nu. Ordinea depinde exclusiv de coloana după care sortezi — date obiective din surse publice. Firmele marcate „Partener Verificat" apar într-o secțiune separată, deasupra tabelului, clar etichetată, și nu influențează ordinea din tabel.',
  },
  {
    question: 'Cât de des se actualizează datele?',
    answer:
      'Datele ANRE se sincronizează periodic direct din portal.anre.ro. Datele financiare se actualizează după depunerea bilanțurilor oficiale (de obicei anual, primăvara). Dacă observi o eroare sau informație învechită, folosește formularul de corectură de la finalul paginii.',
  },
  {
    question: 'Cum aleg firma potrivită pentru proiectul meu?',
    answer:
      'Pentru proiecte mari (hale industriale, parcuri logistice, centre comerciale peste 50 kWp) filtrează după C2A activ și sortează descrescător după cifra de afaceri — firme mari au de obicei echipe și capacitate operațională. Pentru proiecte mai mici (clădiri de birouri, magazine sub 100 kWp) o firmă cu C1A și 5+ angajați poate fi suficientă. Marja de profit (coloana Marjă) e un bun indicator de sănătate financiară pe termen lung — peste 5% e solid.',
  },
];

export default function ClasamentPage() {
  const companies = getCompanies();

  // Build rows with derived data
  const rows = companies.map((c) => {
    const certs = getCompanyAnreCerts(c.anreMatch);
    const activeCerts = new Set(certs.map((x) => x.code));
    const revenue = c.financials?.revenue ?? 0;
    const profit = c.financials?.profit ?? 0;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
    return {
      slug: c.slug,
      name: c.name,
      logo: c.logo || '',
      city: c.location.city,
      county: c.location.county,
      revenue,
      profit,
      margin,
      employees: c.employees || 0,
      founded: c.founded || 0,
      activeCerts,
      financialYear: c.financials?.year ?? 0,
    };
  });

  // Default display order for JSON-LD ItemList: revenue desc (matches table default)
  const byRevenue = [...rows].sort((a, b) => b.revenue - a.revenue);

  // Unique counties, sorted
  const counties = Array.from(new Set(rows.map((r) => r.county))).sort((a, b) =>
    a.localeCompare(b, 'ro'),
  );

  const companyOptions = byRevenue.map((r) => ({ slug: r.slug, name: r.name }));

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Clasament firme panouri fotovoltaice România 2026',
    numberOfItems: byRevenue.length,
    itemListElement: byRevenue.slice(0, 20).map((r, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/firme/${r.slug}`,
      name: r.name,
    })),
  };

  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: 'Acasă', url: '/' },
          { name: 'Clasament', url: '/clasament' },
        ])}
      />
      <JsonLd data={itemListJsonLd} />
      <JsonLd data={generateFAQJsonLd(FAQS)} />

      <div className="max-w-6xl mx-auto px-4 py-6">
        <Breadcrumbs items={[{ label: 'Clasament' }]} />

        {/* Hero */}
        <div className="mt-6 mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Clasament Firme Panouri Fotovoltaice România 2026
          </h1>
          <p className="text-gray-600 mt-3 max-w-3xl leading-relaxed">
            Cele <strong>{rows.length}</strong> de firme din directorul nostru, cu date reale din bilanțurile
            publice depuse la Ministerul Finanțelor și atestatele ANRE active din portal.anre.ro.
            Sortează după criteriul care te interesează — <strong>cifră de afaceri</strong>, <strong>profit</strong>,{' '}
            <strong>marjă</strong>, <strong>angajați</strong> sau <strong>anul înființării</strong> — și filtrează după județ
            și atestate ANRE. Fără scoruri arbitrare, fără poziționare plătită.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <a href="#clasament" className="text-primary hover:underline font-medium">
              → Mergi la tabel
            </a>
            <span className="text-gray-300">·</span>
            <a href="#intrebari" className="text-primary hover:underline font-medium">
              → Întrebări frecvente
            </a>
            <span className="text-gray-300">·</span>
            <a href="#corectie" className="text-primary hover:underline font-medium">
              → Raportează o corectură
            </a>
          </div>
        </div>

        {/* Ad slot — promo banner pentru firmele care vor să apară aici */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
              ★ Spațiu publicitar
            </span>
            <span className="text-xs text-gray-400">Vizibilitate maximă, deasupra clasamentului</span>
          </div>
          <Link
            href="/publicitate"
            className="group block p-6 bg-gradient-to-br from-amber-50 via-white to-amber-50/40 border-2 border-dashed border-amber-300 rounded-xl hover:border-amber-400 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 text-base mb-1">
                  Firma ta poate fi aici
                </div>
                <div className="text-sm text-gray-600">
                  Pagina de clasament e una dintre cele mai vizitate secțiuni. Rezervă-ți locul pentru vizibilitate prioritară și acces la lead-uri calificate.
                </div>
              </div>
              <span className="text-sm font-semibold text-amber-700 group-hover:text-amber-800 whitespace-nowrap">
                Află mai multe →
              </span>
            </div>
          </Link>
        </section>

        <PremiumPoolSection
          title="Parteneri Verificați"
          subtitle="Firme partenere ale platformei — apar separat, nu influențează ordinea din tabel"
        />

        {/* Table */}
        <section id="clasament" className="mb-12 scroll-mt-20">
          <ClasamentTable rows={byRevenue} counties={counties} />

          <div className="mt-6 text-center">
            <Link
              href="/firme"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              Vezi toate cele {rows.length} de firme cu filtre după specializare și alte criterii →
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section id="intrebari" className="mb-12 scroll-mt-20">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Întrebări frecvente</h2>
          <div className="space-y-3">
            {FAQS.map((faq) => (
              <details
                key={faq.question}
                className="bg-white border border-border rounded-xl p-4 group"
              >
                <summary className="font-semibold text-gray-900 text-sm cursor-pointer list-none flex justify-between items-start gap-3">
                  <span>{faq.question}</span>
                  <span className="text-primary flex-shrink-0 group-open:rotate-45 transition-transform">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm text-gray-600 leading-relaxed">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Correction Form */}
        <section className="mb-12 bg-white rounded-xl border-2 border-primary/20 p-6" id="corectie">
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-gray-900">
              Datele nu sunt corecte? Spune-ne.
            </h2>
            <p className="text-sm text-gray-500 mt-1 max-w-xl mx-auto">
              Dacă firma ta apare în clasament și datele sunt învechite, trimite o corectură. Verificăm
              și actualizăm informațiile pe baza documentelor oficiale.
            </p>
          </div>
          <div className="max-w-lg mx-auto">
            <CorrectionForm companies={companyOptions} />
          </div>
        </section>

        {/* SEO / Metodologie */}
        <div className="prose prose-sm prose-gray max-w-none">
          <h2>Despre clasamentul firmelor de panouri fotovoltaice</h2>
          <p>
            Clasamentul include {rows.length} de firme de instalare panouri fotovoltaice
            comerciale și industriale din România, cu date reale și verificabile independent.
            Spre deosebire de alte topuri, <strong>nu acceptăm plăți pentru poziționare</strong> —
            firmele marcate „Partener Verificat" apar separat, deasupra tabelului, clar etichetate.
          </p>
          <p>
            Tabelul afișează <strong>cifra de afaceri</strong>, <strong>profitul net</strong>,{' '}
            <strong>marja de profit</strong>, <strong>numărul de angajați</strong> și <strong>anul înființării</strong>{' '}
            — extrase din bilanțurile depuse la Ministerul Finanțelor și Registrul Comerțului — plus
            atestatele ANRE active (verificate în portal.anre.ro). Poți schimba sortarea făcând click
            pe antetul oricărei coloane și poți filtra după județ, cifră minimă sau combinații de
            atestate ANRE ({PV_RELEVANT_CODES.join(', ')}).
          </p>
          <p>
            Pentru un proiect comercial mare (peste 50 kWp — hale industriale, parcuri logistice,
            centre comerciale), caută firme cu <strong>atestat ANRE C2A activ</strong>, cifră de
            afaceri de peste 15 milioane RON și echipă de minim 20 de angajați. Pentru un proiect
            mai mic (clădiri de birouri, magazine sub 100 kWp), o firmă cu atestat{' '}
            <strong>C1A sau B</strong> și 5–10 ani experiență poate fi suficientă. Marja de profit
            peste 5% este un bun indicator de sănătate financiară pe termen lung.
          </p>
          <p>
            Citește și <Link href="/ghid/cum-alegi-instalator-fotovoltaic" className="text-primary hover:underline">ghidul
            nostru despre cum alegi instalatorul fotovoltaic potrivit</Link> sau consultă <Link href="/firme" className="text-primary hover:underline">
            lista completă de firme</Link> cu filtre după județ, specializare și atestate.
          </p>
        </div>
      </div>
    </>
  );
}
