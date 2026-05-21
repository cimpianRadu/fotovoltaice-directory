'use client';

import Link from 'next/link';
import { useSegment, type SegmentView } from '@/components/segment/SegmentProvider';

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

function Check() {
  return <span className="text-green-600 font-bold shrink-0">&#10003;</span>;
}

interface DoorProps {
  view: SegmentView;
  onChoose: (v: SegmentView) => void;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: React.ReactNode;
  features: string[];
  ctaClass: string;
}

function Door({ view, onChoose, icon, iconBg, title, description, features, ctaClass }: DoorProps) {
  return (
    <Link
      href="/firme"
      onClick={() => onChoose(view)}
      className="group flex flex-col text-left bg-white rounded-xl sm:rounded-2xl p-4 sm:p-8 shadow-xl border-[3px] border-transparent hover:border-primary/30 hover:-translate-y-1 transition-all"
    >
      <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 ${iconBg}`}>
        {icon}
      </div>
      <h2 className="text-base sm:text-2xl font-extrabold text-gray-900 mb-1 sm:mb-2 leading-tight">{title}</h2>
      <p className="hidden sm:block text-sm text-gray-500 mb-5 flex-1 leading-relaxed">{description}</p>
      <ul className="hidden sm:block space-y-2.5 mb-6">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2.5 text-sm font-semibold text-gray-700">
            <Check />
            {f}
          </li>
        ))}
      </ul>
      <span
        className={`mt-auto inline-flex items-center justify-center gap-1.5 font-bold text-sm sm:text-base py-2.5 sm:py-3.5 px-2 rounded-lg sm:rounded-xl text-white w-full transition-colors ${ctaClass}`}
      >
        Caută instalatori
        <svg className="hidden sm:block w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
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
}: {
  comercialStats: SegmentStats;
  rezidentialStats: SegmentStats;
}) {
  const { segment, setSegment } = useSegment();
  const stats = segment === 'rezidential' ? rezidentialStats : comercialStats;

  return (
    <>
      <section className="bg-gradient-to-br from-secondary-dark via-secondary to-secondary-light text-white">
        <div className="max-w-5xl mx-auto px-4 py-8 sm:py-16 text-center">
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold mb-3 sm:mb-4 leading-tight">
            Instalatori Autorizați
            <br className="hidden sm:block" />
            <span className="text-primary-light"> Panouri Fotovoltaice România</span>
          </h1>
          <p className="text-sm sm:text-lg text-gray-300 mb-5 sm:mb-7 max-w-2xl mx-auto">
            Te ducem la instalatorul potrivit — alege dacă vrei panouri pentru casă sau pentru firmă.
          </p>

          {/* Live-data proof — verified, real data (segment-aware so counts never mislead) */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-7 sm:mb-9 text-xs sm:text-sm">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <strong className="font-semibold">{stats.count}</strong>
              <span className="text-gray-200">firme verificate</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
              <strong className="font-semibold">{stats.anre}</strong>
              <span className="text-gray-200">cu atestat ANRE verificat live</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
              <strong className="font-semibold">{stats.judete}</strong>
              <span className="text-gray-200">{stats.judete === 1 ? 'județ' : 'județe'}</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-5 max-w-3xl mx-auto">
            <Door
              view="rezidential"
              onChoose={setSegment}
              icon={<HouseIcon />}
              iconBg="bg-amber-100"
              title="Pentru casa mea"
              description={
                <>
                  Panouri pentru locuință și subvenția <strong>Casa Verde</strong>. Instalatori autorizați
                  aproape de tine.
                </>
              }
              features={['Casa Verde', 'Locuință', 'Prosumator']}
              ctaClass="bg-primary group-hover:bg-primary-dark"
            />
            <Door
              view="comercial"
              onChoose={setSegment}
              icon={<HallIcon />}
              iconBg="bg-blue-100"
              title="Pentru firma mea"
              description={
                <>
                  Hale, fabrici, clădiri comerciale. Instalatori verificați cu atestat <strong>ANRE</strong> și
                  Electric Up.
                </>
              }
              features={['Hală / Fabrică', 'Electric Up', 'ANRE C2A']}
              ctaClass="bg-secondary group-hover:bg-secondary-dark"
            />
          </div>
        </div>
      </section>

      {/* Benefits strip */}
      <section className="bg-surface border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-6 flex flex-wrap items-center justify-center gap-3 text-center">
          <span className="text-sm font-semibold text-gray-500 w-full sm:w-auto">
            După ce alegi, tot ce vezi e doar pentru tine:
          </span>
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
