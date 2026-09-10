'use client';

import Link from 'next/link';
import { trackEvent } from '@/lib/analytics';
import {
  COMMERCIAL_PROJECT_TYPES,
  RESIDENTIAL_PROJECT_TYPES,
} from '@/lib/project-types';
import HomeHeroSearch, { type FirmIndexItem, type CountyIndexItem } from './HomeHeroSearch';

/**
 * Heroul homepage-ului, refăcut pe 10 septembrie 2026.
 *
 * Ce înlocuiește: două „uși" (Casa mea / Firma mea) care duceau amândouă în
 * director. În 30 de zile au produs 27 de clickuri, iar homepage-ul a intrat cu
 * ZERO în atribuirea cererilor (44 de cereri cu pagină de intrare cunoscută,
 * niciuna pe „/"). Ușile puneau o întrebare, o salvau într-un cookie și apoi
 * cereau omului să caute singur mai departe.
 *
 * Ce face acum: pune primul pas al formularului direct în pagină. Alegerea
 * pleacă în `/cere-oferta?tip=…&segment=…`, unde LeadForm o preia și deschide
 * formularul la pasul de zonă. Un tap în loc de: alege segmentul, intră în
 * director, găsește CTA-ul, deschide formularul, alege iar tipul.
 *
 * Cardurile mari sunt cele rezidențiale fiindcă 57 din 62 de cereri din ultimele
 * 30 de zile sunt pentru casă. Comercialul rămâne pe un rând de chipsuri: 8% din
 * cereri, dar e segmentul pe care e construit directorul, deci nu dispare.
 */

/**
 * Etichetele din hero sunt mai scurte decât cele din formular. `value` rămâne
 * neatins, el ajunge în Sheet; se schimbă doar ce citește omul, fiindcă
 * „Agricol (fermă, seră, depozit)" pe un chip de 375px iese pe două rânduri.
 */
const HERO_LABELS: Record<string, string> = {
  'casa-individuala': 'Casă',
  vila: 'Vilă',
  'casa-vacanta': 'Casă de vacanță',
  apartament: 'Apartament',
  'hala-industriala': 'Hală industrială',
  'cladire-birouri': 'Birouri',
  'parc-logistic': 'Parc logistic',
  agricol: 'Fermă sau seră',
  retail: 'Magazin',
  hotel: 'Hotel sau pensiune',
  institutie: 'Instituție publică',
};

const heroLabel = (t: { value: string; label: string }) => HERO_LABELS[t.value] ?? t.label;

const HERO_RESIDENTIAL = RESIDENTIAL_PROJECT_TYPES.filter((t) => t.value !== 'altele');
const HERO_COMMERCIAL = COMMERCIAL_PROJECT_TYPES.filter((t) => t.value !== 'altele');

/** Câte o pictogramă pe card. Patru forme simple, aceleași două culori de brand. */
const CARD_ICONS: Record<string, React.ReactNode> = {
  'casa-individuala': (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" aria-hidden>
      <path d="M4 11.5 12 5l8 6.5V20H4z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M10 20v-4.5h4V20" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  ),
  vila: (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" aria-hidden>
      <path d="M3 11 9 6.5 15 11v9H3z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M15 13h6v7h-6" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M6.5 14.5h2M6.5 17.5h2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  'casa-vacanta': (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" aria-hidden>
      <path d="M12 4.5 4.5 20h15z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M12 12.5 8.5 20h7z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  ),
  apartament: (
    <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" aria-hidden>
      <path d="M5 4h14v16H5z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M9 8h1.5M13.5 8H15M9 12h1.5M13.5 12H15M11 20v-4h2v4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
};

function hrefFor(tip: string, segment: 'rezidential' | 'comercial') {
  return `/cere-oferta?tip=${tip}&segment=${segment}&sursa=home-hero`;
}

interface Props {
  firms: FirmIndexItem[];
  counties: CountyIndexItem[];
  topCounties: CountyIndexItem[];
  /** Cereri și preluări din ultimele 30 de zile. `null` dacă Sheets n-a răspuns. */
  activity: { cereri: number; preluari: number } | null;
  /** Fallback pentru linia de dovadă când activitatea lipsește. */
  installerCount: number;
  anreCount: number;
}

export default function HomeLeadHero({
  firms,
  counties,
  topCounties,
  activity,
  installerCount,
  anreCount,
}: Props) {
  function pick(tip: string, segment: 'rezidential' | 'comercial') {
    trackEvent('home_hero_project_pick', { tip, segment });
  }

  return (
    <section className="bg-gradient-to-br from-secondary-dark via-secondary to-secondary-light text-white">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-2 sm:mb-3 leading-tight">
            Primiți oferte pentru sistemul dumneavoastră fotovoltaic
            <span className="text-primary-light"> de la instalatori verificați</span>
          </h1>
          <p className="text-sm sm:text-lg text-gray-300 mb-6 max-w-2xl mx-auto">
            Lăsați o cerere și o trimitem instalatorilor autorizați din zona dumneavoastră.
            Gratuit și fără obligații.
          </p>
        </div>

        {/* Pasul 1 al formularului, mutat în hero. Cardurile duc direct în
            /cere-oferta cu tipul deja ales. */}
        <div className="max-w-3xl mx-auto">
          <p className="text-sm sm:text-base font-semibold text-white mb-3 text-center sm:text-left">
            Ce fel de sistem aveți nevoie?
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {HERO_RESIDENTIAL.map((t) => (
              <Link
                key={t.value}
                href={hrefFor(t.value, 'rezidential')}
                onClick={() => pick(t.value, 'rezidential')}
                className="group flex flex-col items-center justify-center gap-2 rounded-xl bg-white/95 hover:bg-white px-3 py-4 border border-white/40 hover:border-primary hover:-translate-y-0.5 transition-all min-h-[92px] text-center"
              >
                <span className="text-secondary group-hover:text-primary-dark transition-colors">
                  {CARD_ICONS[t.value]}
                </span>
                <span className="text-sm font-bold text-gray-900 leading-tight">
                  {heroLabel(t)}
                </span>
              </Link>
            ))}
          </div>

          {/* Comercialul: 5 din 62 de cereri, deci un rând de chipsuri, nu carduri. */}
          <div className="mt-3.5 flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <span className="text-xs text-gray-400 self-center">Pentru firmă:</span>
            {HERO_COMMERCIAL.map((t) => (
              <Link
                key={t.value}
                href={hrefFor(t.value, 'comercial')}
                onClick={() => pick(t.value, 'comercial')}
                className="text-xs sm:text-sm text-white/90 bg-white/10 hover:bg-white/20 border border-white/15 rounded-full px-3 py-1.5 transition-colors"
              >
                {heroLabel(t)}
              </Link>
            ))}
            <Link
              href="/cere-oferta?sursa=home-hero-altele"
              onClick={() => trackEvent('home_hero_project_pick', { tip: 'altele', segment: 'nespecificat' })}
              className="text-xs sm:text-sm text-primary-light hover:text-primary font-medium px-1 py-1.5 transition-colors"
            >
              altceva &rarr;
            </Link>
          </div>

          {/* Dovada că platforma se mișcă, nu că are inventar. Fallback pe numărul
              de instalatori dacă Sheets nu răspunde. */}
          <div className="flex justify-center sm:justify-start mt-5">
            <span className="inline-flex items-center gap-2 text-xs sm:text-sm text-gray-200">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />
              {activity ? (
                <span>
                  <strong className="font-semibold text-white">{activity.cereri}</strong> de cereri
                  primite în ultimele 30 de zile
                  {' · '}
                  <strong className="font-semibold text-white">{activity.preluari}</strong> preluări
                  de la firme
                </span>
              ) : (
                <span>
                  <strong className="font-semibold text-white">{installerCount}</strong> instalatori
                  verificați
                  {' · '}
                  <strong className="font-semibold text-white">{anreCount}</strong> cu atestat ANRE
                  confirmat live
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Drumul celălalt: cine caută o firmă anume sau județul lui. Paginile de
            județ au adus 18 din cele 44 de cereri cu atribuire, deci rămân sus. */}
        <div className="mt-8 pt-6 border-t border-white/10 max-w-3xl mx-auto">
          <p className="text-xs text-gray-400 mb-3 text-center sm:text-left">
            Sau căutați direct un instalator
          </p>
          <HomeHeroSearch firms={firms} counties={counties} />
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
            {topCounties.map((c) => (
              <Link
                key={c.slug}
                href={`/firme/judet/${c.slug}`}
                onClick={() => trackEvent('hero_pill_click', { county: c.name })}
                className="text-xs sm:text-sm text-secondary-dark bg-white hover:bg-gray-100 rounded-full px-3 py-1 transition-colors"
              >
                {c.name}
              </Link>
            ))}
            <Link
              href="/firme"
              onClick={() => trackEvent('hero_pill_click', { county: 'toate' })}
              className="text-xs sm:text-sm text-primary-light hover:text-primary self-center font-medium transition-colors"
            >
              toate firmele &rarr;
            </Link>
          </div>
        </div>

        {/* Ușa firmelor, la baza heroului. Sus ar concura cu cererea, care e
            treaba paginii; jos de tot ar fi la fel de invizibilă ca linkul din
            subsol. Aici o vede și cine intră pe brand sau după un telefon, adică
            exact traficul direct pe care îl are homepage-ul.

            Pe amber, nu pe alb translucid: prima variantă (10 sept) se topea în
            navy și se citea ca o notă de subsol. Cardurile de deasupra rămân albe
            și pline, deci banda nu le fură atenția, doar încetează să dispară. */}
        <div className="mt-8 max-w-3xl mx-auto">
          <Link
            href="/pentru-instalatori"
            onClick={() => trackEvent('pentru_instalatori_click', { source: 'home_hero' })}
            className="group flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-5 rounded-xl border border-primary/45 bg-primary/10 hover:bg-primary/15 px-4 sm:px-5 py-4 transition-colors"
          >
            <span className="text-sm sm:text-base text-white leading-snug text-center sm:text-left">
              <strong className="font-bold">Sunteți instalator?</strong> Preluați cereri gratuit de
              pe platformă.
            </span>
            <span className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-primary group-hover:bg-primary-dark text-white font-semibold text-sm px-4 py-2.5 transition-colors">
              Vedeți cum funcționează
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
