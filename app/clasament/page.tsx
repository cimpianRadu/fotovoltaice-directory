import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import { generateBreadcrumbJsonLd, generateFAQJsonLd } from '@/lib/seo';
import { getCompanies, SITE_URL, type Company } from '@/lib/utils';
import { CRITERIA, MAX_SCORE, getBadge, getScoreLabel, rankCompanies } from '@/lib/scoring';
import CorrectionForm from '@/components/forms/CorrectionForm';

export const metadata: Metadata = {
  title: 'Clasament Firme Panouri Fotovoltaice România 2026 — 7 Criterii Verificabile',
  description:
    'Clasament transparent al firmelor de instalare panouri fotovoltaice din România. 7 criterii verificabile cu praguri fixe: cifră de afaceri, echipă, experiență, atestate ANRE, certificări ISO, capacitate proiect. Zero poziționare plătită.',
  alternates: { canonical: '/clasament' },
};

const FAQS = [
  {
    question: 'Cum se calculează scorul din clasament?',
    answer:
      'Fiecare firmă primește puncte pe 7 criterii independente, fiecare cu praguri fixe publice. Totalul maxim este 25 de puncte. De exemplu, o cifră de afaceri de peste 50 milioane RON aduce 4 puncte, un atestat ANRE C2A activ aduce 4 puncte, fiecare certificare ISO aduce 1 punct până la maxim 3. Pragurile sunt absolute (exprimate în RON, ani, MW) — nu relative la celelalte firme — deci scorul unei firme nu se schimbă când adăugăm sau scoatem firme din director.',
  },
  {
    question: 'De unde provin datele financiare?',
    answer:
      'Cifra de afaceri și numărul de angajați sunt extrase din bilanțurile publice depuse la Ministerul Finanțelor, agregate prin termene.ro. Anul înființării provine din Registrul Comerțului. Pentru fiecare firmă listăm CUI-ul oficial, deci datele pot fi verificate independent.',
  },
  {
    question: 'Ce înseamnă atestat ANRE C2A și de ce contează?',
    answer:
      'Atestatul ANRE C2A este emis de Autoritatea Națională de Reglementare în Energie și autorizează firma să proiecteze și execute instalații electrice de medie și înaltă tensiune. Pentru orice proiect fotovoltaic comercial peste 50 kWp care se conectează în rețea (prosumator, parc solar, hale industriale mari), C2A este obligatoriu. Fără el, firma poate instala doar sisteme rezidențiale mici. Verificăm statusul direct în portal.anre.ro și afișăm doar atestatele active.',
  },
  {
    question: 'De ce firma X nu apare în clasament?',
    answer:
      'Clasamentul include doar firmele adăugate în directorul nostru, iar selecția se face manual pe baza activității reale pe segmentul comercial/industrial. Dacă administrezi o firmă de instalare fotovoltaică cu experiență C&I care nu e listată, poți solicita adăugarea prin formularul de la /listeaza-firma.',
  },
  {
    question: 'Firmele plătesc ca să apară mai sus în clasament?',
    answer:
      'Nu. Poziția în clasament depinde exclusiv de scorul total calculat pe criteriile publice. Firmele marcate „Partener Verificat" apar într-o secțiune separată, deasupra clasamentului, clar etichetată — nu influențează ordinea din tabel.',
  },
  {
    question: 'Cât de des se actualizează clasamentul?',
    answer:
      'Datele ANRE se sincronizează săptămânal direct din portal.anre.ro. Datele financiare se actualizează trimestrial, după depunerea bilanțurilor oficiale. Ceilalți parametri (capacitate, certificări ISO) se revizuiesc la orice corectură primită prin formularul de jos.',
  },
  {
    question: 'Cum își poate o firmă corecta sau îmbunătăți scorul?',
    answer:
      'Folosește formularul „Datele nu sunt corecte?" de la finalul paginii. Trimite-ne documente care atestă modificarea (bilanț recent, atestat ANRE nou, certificat ISO etc.) și vom actualiza profilul. Nu schimbăm scorul fără dovezi verificabile.',
  },
];

function CompanyLogo({ company, size = 40 }: { company: Company; size?: number }) {
  const initials = company.name
    .split(/[\s-]+/)
    .filter((w) => w.length > 1 && w[0] === w[0].toUpperCase())
    .slice(0, 2)
    .map((w) => w[0])
    .join('');

  if (company.logo) {
    return (
      <Image
        src={company.logo}
        alt={`Logo ${company.name}`}
        width={size}
        height={size}
        className="rounded-lg object-contain bg-white flex-shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center text-secondary font-semibold text-sm flex-shrink-0"
      style={{ width: size, height: size }}
    >
      {initials}
    </div>
  );
}

export default function ClasamentPage() {
  const companies = getCompanies();
  const ranked = rankCompanies(companies);
  const companyOptions = ranked.map((c) => ({ slug: c.slug, name: `#${c.rank} ${c.name}` }));

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Clasament firme panouri fotovoltaice România 2026',
    numberOfItems: ranked.length,
    itemListElement: ranked.slice(0, 20).map((c) => ({
      '@type': 'ListItem',
      position: c.rank,
      url: `${SITE_URL}/firme/${c.slug}`,
      name: c.name,
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

      <div className="max-w-5xl mx-auto px-4 py-6">
        <Breadcrumbs items={[{ label: 'Clasament' }]} />

        {/* Hero */}
        <div className="mt-6 mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Clasament Firme Panouri Fotovoltaice România 2026
          </h1>
          <p className="text-gray-600 mt-3 max-w-3xl leading-relaxed">
            Cele <strong>{ranked.length}</strong> de firme din directorul nostru, scorate pe <strong>7 criterii
            verificabile</strong> cu praguri fixe. Fiecare criteriu aduce între 0 și 4 puncte,
            totalul maxim este <strong>{MAX_SCORE} de puncte</strong>. Scorurile sunt absolute —
            nu depind de cine mai e în listă.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <a href="#criterii" className="text-primary hover:underline font-medium">
              → Cum calculăm scorul
            </a>
            <span className="text-gray-300">·</span>
            <a href="#clasament" className="text-primary hover:underline font-medium">
              → Vezi clasamentul
            </a>
            <span className="text-gray-300">·</span>
            <a href="#intrebari" className="text-primary hover:underline font-medium">
              → Întrebări frecvente
            </a>
          </div>
        </div>

        {/* Ad slot — promo banner pentru firmele care vor să apară aici */}
        <section className="mb-10">
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

        {/* Criterii — visible by default */}
        <section id="criterii" className="mb-12 scroll-mt-20">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Cum calculăm scorul</h2>
          <p className="text-sm text-gray-500 mb-5">
            7 criterii, praguri fixe, maxim {MAX_SCORE} de puncte. Toate datele provin din surse publice.
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            {CRITERIA.map((crit) => (
              <div key={crit.id} className="bg-white border border-border rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{crit.icon}</span>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">{crit.label}</div>
                      <div className="text-xs text-gray-400">Sursă: {crit.source}</div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-primary-dark bg-primary/10 px-2 py-1 rounded-full whitespace-nowrap">
                    max {crit.maxPoints}p
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-3 leading-relaxed">{crit.description}</p>
                <div className="space-y-1">
                  {crit.tiers.map((tier) => (
                    <div
                      key={tier.label}
                      className="flex items-center justify-between text-xs py-1 px-2 rounded bg-surface"
                    >
                      <span className="text-gray-700">{tier.label}</span>
                      <span className="font-semibold text-gray-900 font-mono">
                        {tier.points > 0 ? `+${tier.points}` : '0'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Ranking */}
        <section id="clasament" className="mb-12 scroll-mt-20">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Clasamentul complet</h2>
            <span className="text-xs text-gray-400">
              Sortat după scor total, apoi după cifră de afaceri
            </span>
          </div>

          <div className="space-y-2">
            {ranked.map((company) => {
              const badge = getBadge(company.rank);
              const scoreLabel = getScoreLabel(company.total);
              return (
                <Link
                  key={company.slug}
                  href={`/firme/${company.slug}`}
                  className={`block bg-white border rounded-xl p-4 hover:shadow-md hover:border-primary/30 transition-all ${
                    company.rank <= 3 ? 'border-amber-200 bg-gradient-to-r from-amber-50/30 to-white' : 'border-border'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Rank */}
                    <div className="flex-shrink-0 w-10 text-center">
                      {badge ? (
                        <span
                          className={`inline-flex items-center justify-center text-sm font-bold rounded-full w-9 h-9 ${badge.color}`}
                        >
                          {company.rank}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm font-medium">#{company.rank}</span>
                      )}
                    </div>

                    {/* Logo + identity */}
                    <CompanyLogo company={company} size={44} />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                        {company.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {company.location.city}, {company.location.county}
                      </div>
                    </div>

                    {/* Score — big number */}
                    <div className="flex-shrink-0 text-right">
                      <div className="flex items-baseline justify-end gap-1">
                        <span className="text-2xl font-bold text-gray-900">{company.total}</span>
                        <span className="text-xs text-gray-400">/ {MAX_SCORE}</span>
                      </div>
                      <span
                        className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-0.5 ${scoreLabel.color}`}
                      >
                        {scoreLabel.label}
                      </span>
                    </div>
                  </div>

                  {/* Per-criterion breakdown */}
                  <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-1.5">
                    {CRITERIA.map((crit) => {
                      const pts = company.breakdown[crit.id] ?? 0;
                      const isMax = pts === crit.maxPoints && pts > 0;
                      const isZero = pts === 0;
                      const display = crit.display(company);
                      return (
                        <span
                          key={crit.id}
                          title={`${crit.label}: ${pts}/${crit.maxPoints} pct · ${display}`}
                          className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded ${
                            isZero
                              ? 'bg-gray-50 text-gray-400'
                              : isMax
                              ? 'bg-green-50 text-green-700'
                              : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          <span>{crit.icon}</span>
                          <span className="font-semibold">{pts}</span>
                          <span className="text-gray-400 hidden sm:inline">· {display}</span>
                        </span>
                      );
                    })}
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/firme"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              Vezi toate cele {ranked.length} de firme cu filtre după județ și specializare →
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

        {/* SEO / Metodologie extinsă */}
        <div className="prose prose-sm prose-gray max-w-none">
          <h2>Despre clasamentul firmelor de panouri fotovoltaice</h2>
          <p>
            Clasamentul include {ranked.length} de firme de instalare panouri fotovoltaice
            comerciale și industriale din România, scorate pe criterii obiective și verificabile
            independent. Spre deosebire de alte topuri, <strong>nu acceptăm plăți pentru
            poziționare</strong> — firmele marcate „Partener Verificat" apar separat, deasupra
            clasamentului, clar etichetate.
          </p>
          <p>
            Fiecare firmă primește un scor total din maxim {MAX_SCORE} de puncte, distribuite pe 7
            criterii: mărimea financiară (din bilanțurile depuse la Ministerul Finanțelor), echipa
            (angajați declarați oficial), experiența (ani de la înființare conform Registrului
            Comerțului), atestatele ANRE (extrase în timp real din portal.anre.ro), certificările
            ISO și capacitatea maximă de proiect declarată. <strong>Pragurile sunt fixe</strong> —
            exprimate în RON, ani sau MW — nu se recalibrează când adăugăm firme noi. Un scor mare
            înseamnă același lucru astăzi și peste un an.
          </p>
          <p>
            Pentru un proiect comercial mare (peste 50 kWp, cum ar fi hale industriale, parcuri
            logistice, centre comerciale), caută firme cu <strong>atestat ANRE C2A activ</strong>,
            cifră de afaceri de peste 15 milioane RON și capacitate declarată peste 500 kW.
            Pentru un proiect mai mic (rezidențial mare, magazine, clădiri de birouri sub 100 kWp),
            o firmă cu atestat <strong>ANRE B</strong> și 5–10 ani experiență poate fi suficientă.
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
