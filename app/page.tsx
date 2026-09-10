import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { existsSync } from 'fs';
import { join } from 'path';

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
import FAQ from '@/components/seo/FAQ';
import JsonLd from '@/components/seo/JsonLd';
import HomeLeadHero from '@/components/home/HomeLeadHero';
import CalculatorTabs from '@/components/home/CalculatorTabs';
import { getKitPriceCurve } from '@/lib/kit-price-curve';
import SponsorBanner from '@/components/sponsor/SponsorBanner';
import PremiumPoolSection from '@/components/promo/PremiumPoolSection';
import { getCompanies, getCoveredCounties, getPremiumCompanies, getCompaniesByCounty, slugifyCounty } from '@/lib/utils';
import {
  calendarAgeDays,
  cerereAgeLabel,
  getProjectTypeLabel,
  getFinancingShort,
  getFinancingTone,
  type FinancingTone,
} from '@/lib/utils-shared';
import { getPublicLeads, getLeadsSince, getClaims, type PublicLead } from '@/lib/sheets';
import { generateOrganizationJsonLd, generateFAQJsonLd } from '@/lib/seo';
import { PRICING } from '@/lib/pricing';
import HomeFinantareCta from '@/components/home/HomeFinantareCta';
import HomeInstalatoriCta from '@/components/home/HomeInstalatoriCta';
import guidesData from '@/data/guides.json';

// Teaser-ul de cereri vine din Google Sheets — regenerare la 5 minute, ca /cereri.
export const revalidate = 300;


const COMPANY_COUNT = getCompanies().length;
const COUNTY_COUNT = getCoveredCounties().length;
const ANRE_COUNT = getCompanies().filter((c) => c.anreMatch !== null).length;

// Lightweight client search index — firm name → page, county → judet page
const FIRM_INDEX = getCompanies().map((c) => ({ name: c.name, slug: c.slug }));
const COUNTY_INDEX = getCoveredCounties().map((name) => ({ name, slug: slugifyCounty(name) }));
const TOP_COUNTIES = getCoveredCounties()
  .map((name) => ({ name, slug: slugifyCounty(name), count: getCompaniesByCounty(name).length }))
  .sort((a, b) => b.count - a.count)
  .slice(0, 6)
  .map(({ name, slug }) => ({ name, slug }));

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

// Banda de cereri stă pe navy, deci tonurile de finanțare au nevoie de variante
// deschise. Perechea de mai jos ține aceleași trei stări ca pe /cereri.
const HOME_FINANCING_TEXT: Record<FinancingTone, string> = {
  ready: 'text-emerald-300',
  credit: 'text-sky-300',
  program: 'text-amber-300',
  unknown: 'text-white/50',
};

const HOME_FINANCING_DOT: Record<FinancingTone, string> = {
  ready: 'bg-emerald-400',
  credit: 'bg-sky-400',
  program: 'bg-amber-400',
  unknown: 'bg-white/30',
};

export default async function HomePage() {
  const hasPremium = getPremiumCompanies().length > 0;

  // Fail-open: fără credențiale Sheets (build local) secțiunea de cereri dispare.
  let cereri: PublicLead[] = [];
  let cereriTotal = 0;
  try {
    const leads = await getPublicLeads();
    cereriTotal = leads.length;
    cereri = leads.slice(0, 3);
  } catch (err) {
    console.error('[home] failed to load cereri teaser:', err);
  }

  // Dovada de activitate din capul paginii. Înainte stăteau acolo numărul de
  // instalatori și cel de atestate, adică inventar: câți sunt în raft. Cifrele
  // de mai jos spun altceva, că platforma chiar se mișcă în ambele sensuri, iar
  // pentru omul care tocmai a aterizat aia e întrebarea, nu câte firme avem.
  //
  // Ce NU punem aici, deliberat: „oferte trimise". Depinde de firmă să bifeze
  // „ofertat" în portal, iar la 25 aug 2026 erau 8 din 86 de revendicări. O
  // cifră pe care n-o controlăm și care arată mai rău decât e realitatea.
  //
  // Și de ce scrie „preluări", nu „contactări": o revendicare înseamnă că firma a
  // luat cererea, nu că a și sunat. Coloana „Contactat la" era completată la UNA
  // din 86 pe 25 aug 2026, deci „contactări" ar fi o afirmație pe care n-o putem
  // susține dacă ne-o cere cineva.
  //
  // Atestatul ANRE nu se pierde: rămâne în subtitlul de deasupra și în secțiunea
  // „De ce", unde e argumentat, nu doar numărat.
  let activity: { cereri: number; preluari: number } | null = null;
  try {
    const [toate, claims] = await Promise.all([getLeadsSince(new Date(0)), getClaims()]);
    // Ascunsele și duplicatele nu sunt cereri, sunt zgomot de registru.
    const reale = toate.filter((l) => l.status !== 'Ascuns' && !l.duplicatAl);
    if (reale.length > 0) {
      activity = { cereri: reale.length, preluari: claims.length };
    }
  } catch (err) {
    console.error('[home] failed to load activity stats:', err);
  }

  return (
    <>
      <JsonLd data={generateOrganizationJsonLd()} />
      <JsonLd data={generateFAQJsonLd(homeFaqs)} />

      {/* Hero — pasul 1 al formularului, direct în pagină. Vezi HomeLeadHero
          pentru cifrele care au scos ușile „Casa mea / Firma mea" de aici. */}
      <HomeLeadHero
        firms={FIRM_INDEX}
        counties={COUNTY_INDEX}
        topCounties={TOP_COUNTIES}
        activity={activity}
        installerCount={COMPANY_COUNT}
        anreCount={ANRE_COUNT}
      />

      {/* Sponsor. Prima oprire după hero, din 3 sept 2026. Înainte stătea deasupra
          titlului „Instalatori Recomandați", la 35% din pagină: pe telefon asta
          înseamnă 3,6 ecrane de derulat, adică un slot plătit pe care majoritatea
          vizitatorilor de pe mobil nu îl vedea niciodată. Regula care l-a pus acolo
          rămâne respectată — un partener care nu e instalator nu are voie să apară
          sub titlul „Instalatori Recomandați", fiindcă s-ar citi ca firmă
          recomandată din director — doar că acum e mult deasupra lui. */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <SponsorBanner position="homepage" />
      </section>

      {/* Cereri active, mutate sub hero pe 25 aug 2026, în locul celor trei bife
          generice („Firme din zona ta", „Calculator potrivit", „Ghiduri pe înțelesul
          tău"), care nu spuneau nimic verificabil.

          Textul secțiunii e scris pentru CLIENT, nu pentru instalator: butonul mare
          duce în formularul de ofertă, iar titlul vorbește despre cererea LUI. Prima
          variantă zicea „Pentru firme de instalare, revendici cererea" imediat sub un
          hero care promite oferte clientului, iar cele două audiențe lipite una de
          alta se anulau.

          Cardurile în schimb duc din 3 sept 2026 în cererea respectivă din feed
          (`/cereri?cerere=<id>`), nu tot în formular: cine dă click pe o cerere
          anume vrea cererea aia, iar un click care ateriza în formularul de ofertă
          era o promisiune ruptă. Instalatorul ajunge direct la butonul de
          revendicare; clientul ajunge într-o pagină care îi explică ce e feedul și
          îi dă înapoi linkul spre Cere Ofertă. */}
      {cereri.length > 0 && (
        <section className="bg-secondary">
          <div className="max-w-7xl mx-auto px-4 py-14">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
              <div>
                <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
                  Cereri primite recent
                </p>
                <h2 className="text-2xl font-bold text-white">
                  {cereriTotal} de cereri de ofertă în așteptare
                </h2>
                <p className="text-white/70 mt-1 text-sm">
                  Oameni care caută instalator chiar acum. Cererea dumneavoastră ajunge în aceeași
                  listă, la firmele cu atestat ANRE din județ.
                </p>
              </div>
              <Link
                href="/cere-oferta?sursa=home-cereri"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors"
              >
                Cere și dumneavoastră o ofertă
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {cereri.map((c) => (
                <Link
                  key={c.id}
                  href={`/cereri?cerere=${encodeURIComponent(c.id)}`}
                  className="rounded-xl bg-white/5 border border-white/10 hover:border-primary/50 hover:bg-white/10 transition-all p-4"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        c.segment === 'rezidential'
                          ? 'bg-emerald-400/15 text-emerald-300'
                          : 'bg-primary/20 text-primary'
                      }`}
                    >
                      {c.segment === 'rezidential' ? 'Rezidențial' : 'Comercial'}
                    </span>
                    <span className="text-xs text-white/50">{cerereAgeLabel(calendarAgeDays(c.id))}</span>
                  </div>
                  <p className="font-semibold text-white text-sm">{getProjectTypeLabel(c.tipProiect)}</p>
                  <p className="text-white/60 text-sm mt-0.5">
                    {[c.judet, c.putere ? `${c.putere} kW` : null, c.suprafata ? `${c.suprafata} mp` : null]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                  {/* Aceeași informație ca pe /cereri, dar pe fundal navy: tonurile
                      din LeadCard sunt pentru fundal alb și n-ar avea contrast aici. */}
                  {c.finantare && (
                    <p
                      className={`mt-1.5 flex items-center gap-1.5 text-xs font-medium ${
                        HOME_FINANCING_TEXT[getFinancingTone(c.finantare)]
                      }`}
                    >
                      <span
                        aria-hidden
                        className={`h-1.5 w-1.5 rounded-full ${
                          HOME_FINANCING_DOT[getFinancingTone(c.finantare)]
                        }`}
                      />
                      {getFinancingShort(c.finantare)}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Banda pentru instalatori, urcată aici pe 10 septembrie 2026. Înainte,
          singurul lucru adresat firmelor stătea la finalul paginii („Listează-ți
          firma gratuit"), iar /pentru-instalatori, pagina care chiar explică
          înțelegerea, a primit 3 vizualizări în 30 de zile fiindcă nu ducea nimic
          spre ea. Stă imediat sub cererile reale, fiindcă ăsta e argumentul: omul
          tocmai a văzut cine cere oferte chiar acum.

          Nu e o a doua pâlnie pusă peste cea de client: heroul și banda de cereri
          vorbesc cu clientul, asta e o singură bandă, o singură dată. */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="rounded-2xl border-2 border-primary/25 bg-primary/5 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div>
            <p className="text-xs font-semibold text-primary-dark uppercase tracking-wider mb-1.5">
              Pentru firme de instalare
            </p>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Cererile ajung la firmele din județul lor
            </h2>
            <p className="text-gray-600 mt-1.5 text-sm leading-relaxed max-w-xl">
              Vedeți cererile din județele dumneavoastră, le preluați pe cele care vă interesează și
              vorbiți direct cu omul. Listarea, preluarea cererilor și portalul sunt gratuite.
            </p>
          </div>
          <div className="shrink-0 flex flex-col items-start sm:items-end gap-2">
            <HomeInstalatoriCta />
            <Link
              href="/listeaza-firma"
              className="text-xs font-medium text-gray-500 hover:text-primary-dark transition-colors"
            >
              sau listați-vă firma direct &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Companies — Premium pool when available, else promote ad packages */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        {/* Două taburi în loc de două carduri stivuite. Curba de preț se
            citește pe server, fișierul de scrape nu are ce căuta în bundle-ul
            clientului. Widgetul de baterii primește linkul spre ghid, fiindcă aici
            omul dă peste el fără să fi citit despre program. */}
        <div className="mb-10">
          <CalculatorTabs
            priceCurve={getKitPriceCurve()}
            batteryGuideHref="/ghid/casa-verde-baterii-2026-program-stocare-afm"
          />
        </div>

        {hasPremium ? (
          <>
            <PremiumPoolSection
              title="Instalatori de Panouri Fotovoltaice Recomandați"
              subtitle="Firme partenere Premium — verificate cu atestat ANRE și experiență dovedită"
            />
            <div className="text-center">
              <Link
                href="/firme"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary-dark hover:text-primary transition-colors"
              >
                Vezi toate firmele &rarr;
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Instalatori de Panouri Fotovoltaice Recomandați</h2>
              <p className="text-gray-500 mt-1">Firme verificate cu atestat ANRE și experiență dovedită</p>
            </div>

            <Link
              href="/publicitate"
              className="block rounded-xl border-2 border-primary/30 bg-primary/5 p-5 sm:p-6 hover:border-primary/50 hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between gap-4 mb-2">
                <p className="text-xs font-semibold text-primary-dark uppercase tracking-wider">
                  Promovează-ți firma pe platformă
                </p>
                <span className="text-xs text-primary-dark font-medium group-hover:underline hidden sm:inline">
                  Vezi pachetele &rarr;
                </span>
              </div>
              <p className="text-sm text-gray-700 leading-relaxed">
                Listare <strong>gratuită</strong> pentru instalatori. Pentru vizibilitate mai mare: Slot Popup <strong>{PRICING.popup.monthly}€</strong>, Premium <strong>{PRICING.premium.monthly}€</strong> (peste tot pe site) sau un studiu de caz colaborativ. Audiență 100% nișată B2B fotovoltaic.
              </p>
            </Link>

            <div className="mt-6 text-center">
              <Link
                href="/firme"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary-dark hover:text-primary transition-colors"
              >
                Vezi toate firmele &rarr;
              </Link>
            </div>
          </>
        )}
      </section>


      {/* Finanțare pentru firme. Stătea la 53% din pagină, după secțiunea „De ce",
          adică unde n-o găsea nimeni. Mutată aici pe 25 aug 2026, la ~20%, imediat
          după banda de ofertă: alternează și cromatic, navy după surface.

          Prima variantă punea două carduri egale, casă și
          firmă, cu programele AFM în față — și dilua exact ce vrem promovat aici,
          variantele private pe care stau partenerii de pe /finantare/firme. Programele
          rămân în pagina de finanțare și în ghidurile lor, unde sunt argumentate.

          Varianta rezidențială nu dispare, coboară la o linie de subsol: n-are ce căuta
          la egalitate cu blocul B2B, dar nici nu vrem să rupem legătura spre ea.

          Butonul duce în /finantare, nu în /finantare/firme. Pe 26 aug 2026 secțiunea
          asta a plecat în producție cu linkul spre /finantare/firme, dar pagina aia a
          rămas necommitată până confirmă partenerul cum arată, deci homepage-ul a
          trimis într-un 404. Când pagina pentru firme intră live, aici se schimbă un
          singur `href`. */}
      <section className="bg-secondary">
        <div className="max-w-7xl mx-auto px-4 py-14">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
              Pentru firme
            </p>
            <h2 className="text-2xl font-bold text-white">
              Soluții de finanțare pentru proiecte fotovoltaice
            </h2>
            <p className="text-white/70 mt-2 text-sm leading-relaxed">
              Un sistem pe hală, depozit sau fabrică nu se plătește obligatoriu dintr-o dată.
              Diferența dintre ele nu e dobânda, ci cine rămâne proprietar și ce scoateți din
              buzunar la început.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 mt-7">
            {[
              {
                title: 'Leasing financiar',
                upfront: 'Avans',
                body: 'Finanțatorul cumpără sistemul, dumneavoastră plătiți rate. Bunul finanțat garantează contractul, deci de obicei fără garanții în plus.',
              },
              {
                title: 'Credit de investiții',
                upfront: 'Avans și garanții',
                body: 'Sistemul e al firmei din prima zi. Analiza e mai grea, dar costul total al finanțării poate ieși mai mic.',
              },
              {
                title: 'ESCO și leasing operațional',
                upfront: 'Zero',
                body: 'Un investitor terț finanțează, construiește și deține sistemul, iar firma plătește lunar pentru energia produsă sau pe baza economiilor garantate prin contract.',
                highlight: true,
              },
            ].map((r) => (
              <div
                key={r.title}
                className="rounded-xl border border-white/10 bg-white/5 p-5 transition-colors hover:border-primary/40 hover:bg-white/10"
              >
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    r.highlight ? 'bg-primary/25 text-primary' : 'bg-white/10 text-white/70'
                  }`}
                >
                  {r.upfront}
                </span>
                <h3 className="mt-3 font-bold text-white">{r.title}</h3>
                <p className="mt-1.5 text-sm text-white/60 leading-relaxed">{r.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
            <HomeFinantareCta href="/finantare">Compară variantele</HomeFinantareCta>
          </div>
        </div>
      </section>


      {/* Încredere + verificare ANRE, strâns pe 10 septembrie 2026 dintr-un bloc
          pe două coloane (text lung, trei statistici, patru bife și un card mare)
          într-o singură bandă. Bifele repetau ce scrie deja în hero și în fișele
          de firmă; ce nu se găsea altundeva e verificatorul ANRE, care rămâne cu
          buton propriu. */}
      <section className="bg-surface border-y border-border">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-12">
            <div className="lg:flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Date verificate, nu liste copiate
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed max-w-xl">
                Fiecare firmă are CUI verificat în registre publice, cifre financiare din
                bilanțurile oficiale și atestatul ANRE confirmat live din portal.anre.ro, nu copiat
                o dată și lăsat să se învechească.
              </p>
              <div className="grid grid-cols-3 gap-3 mt-6 max-w-md">
                <div className="text-center p-3 rounded-lg bg-white border border-border">
                  <div className="text-2xl font-bold text-primary-dark">{COMPANY_COUNT}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Firme verificate</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-white border border-border">
                  <div className="text-2xl font-bold text-primary-dark">{ANRE_COUNT}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Cu atestat ANRE</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-white border border-border">
                  <div className="text-2xl font-bold text-primary-dark">{COUNTY_COUNT}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Județe acoperite</div>
                </div>
              </div>
            </div>

            <div className="lg:w-80 shrink-0 bg-white rounded-2xl border border-border shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-1.5">Verificare atestat ANRE</h3>
              <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                Căutați o firmă după nume sau CUI și vedeți certificările direct din registrul
                oficial. Gratuit, și pentru firme care nu sunt pe platformă.
              </p>
              <Link
                href="/verificare-anre"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors"
              >
                Verificați un instalator
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <p className="text-xs text-gray-400 mt-3">Date în timp real din portal.anre.ro</p>
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

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <FAQ items={homeFaqs} title="Întrebări Frecvente" />
      </section>

    </>
  );
}
