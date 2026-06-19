'use client';

import Link from 'next/link';
import { useSegment, type SegmentView } from '@/components/segment/SegmentProvider';
import { trackEvent } from '@/lib/analytics';
import HomeHeroSearch, { type FirmIndexItem, type CountyIndexItem } from './HomeHeroSearch';

function HouseIcon() {
  return (
    <svg width="42" height="42" viewBox="0 0 48 48" fill="none" aria-hidden>
      <circle cx="39" cy="10" r="4.5" fill="#f59e0b" />
      <rect x="13" y="23" width="22" height="17" rx="1.5" fill="#1e3a5f" />
      <rect x="20.5" y="31" width="7" height="9" rx="1" fill="#fbbf24" />
      <rect x="16" y="26.5" width="4" height="4" rx="0.6" fill="#fbbf24" />
      <path d="M9.5 24 L24 12.5 L38.5 24 Z" fill="#f59e0b" />
      <path
        d="M24 13.5 V23 M16.5 18.7 H31.5"
        stroke="#fff"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.65"
      />
    </svg>
  );
}

function HallIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 48 48" fill="none" aria-hidden>
      <rect x="7" y="23" width="34" height="17" rx="1.5" fill="#1e3a5f" />
      <rect x="11" y="31" width="6" height="9" rx="0.8" fill="#fbbf24" />
      <rect x="21" y="28" width="4" height="4" rx="0.5" fill="#2d5180" />
      <rect x="28" y="28" width="4" height="4" rx="0.5" fill="#2d5180" />
      <rect x="35" y="28" width="4" height="4" rx="0.5" fill="#2d5180" />
      <path d="M10 23 L37 23 L41 16 L14 16 Z" fill="#f59e0b" />
      <path
        d="M18 16 L14.7 22.4 M26 16 L23 22.4 M34 16 L31.3 22.4 M15.2 19.3 L38 19.3"
        stroke="#fff"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
}

interface DoorProps {
  view: SegmentView;
  onChoose: (v: SegmentView) => void;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  features: string[];
  ctaClass: string;
}

function Door({ view, onChoose, icon, iconBg, title, features, ctaClass }: DoorProps) {
  return (
    <Link
      href="/firme"
      onClick={() => onChoose(view)}
      className="group flex flex-col text-left bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-xl border-[3px] border-transparent hover:border-primary/30 hover:-translate-y-1 transition-all"
    >
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
          {icon}
        </div>
        <h2 className="text-base sm:text-lg font-extrabold text-gray-900 leading-tight">{title}</h2>
      </div>
      <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4 leading-relaxed">{features.join(' · ')}</p>
      <span
        className={`mt-auto inline-flex items-center justify-center gap-1.5 font-bold text-sm py-2.5 sm:py-3 px-2 rounded-lg sm:rounded-xl text-white w-full transition-colors ${ctaClass}`}
      >
        Caută instalatori
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </span>
    </Link>
  );
}

interface SegmentStats {
  count: number;
  anre: number;
  judete: number;
}

export default function HomeSegmentHero({
  comercialStats,
  rezidentialStats,
  firms,
  counties,
  topCounties,
}: {
  comercialStats: SegmentStats;
  rezidentialStats: SegmentStats;
  firms: FirmIndexItem[];
  counties: CountyIndexItem[];
  topCounties: CountyIndexItem[];
}) {
  const { segment, setSegment } = useSegment();
  const stats = segment === 'rezidential' ? rezidentialStats : comercialStats;

  function choose(view: SegmentView) {
    setSegment(view);
    trackEvent('segment_selected', { segment: view, source: 'home_door' });
  }

  return (
    <>
      <section className="bg-gradient-to-br from-secondary-dark via-secondary to-secondary-light text-white">
        <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12 text-center">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-2 sm:mb-3 leading-tight">
            Instalatori Panouri Fotovoltaice
            <span className="text-primary-light"> Autorizați în România</span>
          </h1>
          <p className="text-sm sm:text-lg text-gray-300 mb-5 sm:mb-6 max-w-2xl mx-auto">
            Găsește unul verificat lângă tine — date reale din registrele oficiale.
          </p>

          {/* Fuzzy search — by firm name, with county fallback (routes to indexable pages) */}
          <HomeHeroSearch firms={firms} counties={counties} />

          {/* County pills — crawlable internal links to /firme/judet/* (UX shortcut + SEO) */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4 max-w-xl mx-auto">
            <span className="text-xs text-gray-400 self-center">Caută rapid:</span>
            {topCounties.map((c) => (
              <Link
                key={c.slug}
                href={`/firme/judet/${c.slug}`}
                className="text-xs sm:text-sm text-secondary-dark bg-white hover:bg-gray-100 rounded-full px-3 py-1 transition-colors"
              >
                {c.name}
              </Link>
            ))}
            <Link
              href="/firme"
              className="text-xs sm:text-sm text-primary-light hover:text-primary self-center font-medium transition-colors"
            >
              toate firmele &rarr;
            </Link>
          </div>

          {/* Live-data proof — single discreet trust line (full proof lives in the „De ce" section) */}
          <div className="flex justify-center mt-5 mb-7 sm:mb-9">
            <span className="inline-flex items-center gap-2 text-xs sm:text-sm text-gray-200">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />
              <span>
                <strong className="font-semibold text-white">{stats.count}</strong> instalatori verificați
                {' · '}
                <strong className="font-semibold text-white">{stats.anre}</strong> cu atestat ANRE confirmat live
              </span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-5 max-w-3xl mx-auto">
            <Door
              view="rezidential"
              onChoose={choose}
              icon={<HouseIcon />}
              iconBg="bg-amber-100"
              title="Pentru casa mea"
              features={['Locuință', 'Prosumator', 'Casa Verde']}
              ctaClass="bg-primary group-hover:bg-primary-dark"
            />
            <Door
              view="comercial"
              onChoose={choose}
              icon={<HallIcon />}
              iconBg="bg-blue-100"
              title="Pentru firma mea"
              features={['Hală / Fabrică', 'Electric Up', 'ANRE C2A']}
              ctaClass="bg-secondary group-hover:bg-secondary-dark"
            />
          </div>
        </div>
      </section>

      {/* Benefits strip */}
      <section className="bg-surface border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-6 flex flex-wrap items-center justify-center gap-3 text-center">
          {['Firme din zona ta', 'Calculator potrivit', 'Ghiduri pe înțelesul tău'].map((b) => (
            <span
              key={b}
              className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 bg-white border border-border rounded-full px-4 py-2"
            >
              <span className="text-green-600 font-bold">&#10003;</span>
              {b}
            </span>
          ))}
        </div>
      </section>
    </>
  );
}
