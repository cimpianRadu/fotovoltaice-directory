'use client';

import Link from 'next/link';
import { trackEvent } from '@/lib/analytics';
import {
  COMMERCIAL_PROJECT_TYPES,
  RESIDENTIAL_PROJECT_TYPES,
} from '@/lib/project-types';
import HeroTestimonials from './HeroTestimonials';

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
  /** Toate cererile și preluările de la început. `null` dacă Sheets n-a răspuns. */
  activity: { cereri: number; preluari: number } | null;
  /** Fallback pentru linia de dovadă când activitatea lipsește. */
  installerCount: number;
  anreCount: number;
  /** Blocul de cereri recente, randat pe server în `app/page.tsx`. */
  requests: React.ReactNode;
}

export default function HomeLeadHero({
  activity,
  installerCount,
  anreCount,
  requests,
}: Props) {
  function pick(tip: string, segment: 'rezidential' | 'comercial') {
    trackEvent('home_hero_project_pick', { tip, segment });
  }

  return (
    <section className="bg-gradient-to-br from-secondary-dark via-secondary to-secondary-light text-white">
      {/* Pe telefon heroul e strâns (11 nov 2026, cerut de Radu): titlu mai mic,
          carduri pe un rând cu pictograma lângă text, chipsurile comerciale pe un
          singur rând care se derulează, iar cererile recente urcă înaintea
          testimonialelor. Înainte, cererile începeau abia la al doilea ecran și
          instalatorul care intra de pe telefon nu le vedea. */}
      <div className="max-w-5xl mx-auto px-4 py-5 sm:py-10">
        <div className="text-center">
          <h1 className="text-xl sm:text-3xl lg:text-4xl font-extrabold mb-1.5 sm:mb-3 leading-tight">
            Primiți oferte pentru sistemul dumneavoastră fotovoltaic
            <span className="text-primary-light"> de la instalatori verificați</span>
          </h1>
          <p className="text-[13px] sm:text-lg text-gray-300 mb-4 sm:mb-5 max-w-4xl mx-auto leading-snug">
            Lăsați o cerere și o trimitem instalatorilor autorizați din zona dumneavoastră.
            Gratuit și fără obligații.
          </p>
        </div>

        {/* Pasul 1 al formularului, mutat în hero. Cardurile duc direct în
            /cere-oferta cu tipul deja ales. Pictograma stă lângă text pe orice
            ecran: pe telefon, cu ea deasupra, cele patru carduri luau 200 px. */}
        <div>
          <p className="text-sm sm:text-base font-semibold text-white mb-2 sm:mb-3 text-center sm:text-left">
            Ce fel de sistem aveți nevoie?
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {HERO_RESIDENTIAL.map((t) => (
              <Link
                key={t.value}
                href={hrefFor(t.value, 'rezidential')}
                onClick={() => pick(t.value, 'rezidential')}
                className="group flex flex-row items-center justify-center gap-2 sm:gap-2.5 rounded-xl bg-white/95 hover:bg-white px-2.5 py-2 sm:px-3 sm:py-3 border border-white/40 hover:border-primary hover:-translate-y-0.5 transition-all min-h-[48px] sm:min-h-[60px] text-center"
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

          {/* Comercialul: 5 din 62 de cereri, deci un rând de chipsuri, nu carduri.
              Pe telefon un singur rând care se derulează orizontal (11 nov 2026):
              pe trei rânduri, chipsurile împingeau cererile recente sub ecran.
              Marginile negative lasă rândul să curgă până la marginea ecranului,
              ca ultimul chip tăiat să arate că mai urmează ceva. */}
          <div className="mt-2.5 sm:mt-3 -mx-4 px-4 sm:mx-0 sm:px-0 flex flex-nowrap sm:flex-wrap lg:flex-nowrap items-center sm:justify-start gap-2 overflow-x-auto sm:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <span className="text-xs text-gray-400 self-center whitespace-nowrap">Pentru firmă:</span>
            {HERO_COMMERCIAL.map((t) => (
              <Link
                key={t.value}
                href={hrefFor(t.value, 'comercial')}
                onClick={() => pick(t.value, 'comercial')}
                className="shrink-0 text-xs sm:text-sm whitespace-nowrap text-white/90 bg-white/10 hover:bg-white/20 border border-white/15 rounded-full px-3 py-1.5 transition-colors"
              >
                {heroLabel(t)}
              </Link>
            ))}
            <Link
              href="/cere-oferta?sursa=home-hero-altele"
              onClick={() => trackEvent('home_hero_project_pick', { tip: 'altele', segment: 'nespecificat' })}
              className="shrink-0 text-xs sm:text-sm whitespace-nowrap text-primary-light hover:text-primary font-medium px-1 py-1.5 transition-colors"
            >
              altceva &rarr;
            </Link>
          </div>

          {/* Dovada că platforma se mișcă, nu că are inventar. Fallback pe numărul
              de instalatori dacă Sheets nu răspunde. */}
          <div className="flex justify-center sm:justify-start mt-3">
            <span className="inline-flex items-center gap-2 text-xs sm:text-sm text-gray-200">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />
              {activity ? (
                <span>
                  <strong className="font-semibold text-white">{activity.cereri}</strong> de cereri
                  primite până acum
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

        <div className="flex flex-col">
          {/* Testimonialele, în locul căutării din 21 sept 2026: dovada că cererea
              ajunge la un contract semnat stă lângă formular. Căutarea după firmă
              sau județ e acum sub parteneri, în HomeFindInstaller. Pe telefon vin
              după cererile recente (11 nov 2026), pe desktop rămân înaintea lor. */}
          <div className="order-2 sm:order-1">
            <HeroTestimonials />
          </div>

          {/* Ușa firmelor, la baza heroului, din 1 nov 2026 chiar cererile: Sus ar
              concura cu cererea clientului, care e treaba paginii; jos de tot ar fi
              la fel de invizibilă ca linkul din subsol. Aici o vede și cine intră pe
              brand sau după un telefon, adică exact traficul direct al homepage-ului. */}
          <div className="order-1 sm:order-2">{requests}</div>
        </div>
      </div>
    </section>
  );
}
