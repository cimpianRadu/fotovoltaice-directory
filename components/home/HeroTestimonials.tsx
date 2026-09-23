import Link from 'next/link';
import clienti from '@/data/testimoniale.json';
import firme from '@/data/testimoniale-firme.json';

// Banda de testimoniale din hero, pe navy. Stă în locul căutării (mutată sub
// parteneri pe 21 sept 2026): dovada socială prinde clientul lângă formular.
// Din 23 sept 2026 arată TOATE testimonialele, ale clienților și ale firmelor
// care au montat, în ordinea în care au venit. Rând orizontal cu scroll-snap:
// cu un singur card ocupă toată lățimea, de la al doilea încolo se derulează
// cu degetul. Fără autoplay.
// Regulile de conținut sunt în components/ClientTestimonial.tsx (clienți) și
// components/FirmTestimonial.tsx (firme).

type Card = {
  key: string;
  data: string;
  nota: number;
  badge: string;
  text: string;
  nume: string;
  href: string | null;
  meta: string;
  extra: string | null;
};

const cards: Card[] = [
  ...clienti.map((t) => ({
    key: `client-${t.id}`,
    data: t.data,
    nota: t.nota,
    badge: 'Contract semnat',
    text: t.text,
    nume: t.nume,
    href: null,
    meta: [t.tip, `${t.putere} kW`, t.judet].join(' · '),
    extra: `${t.oferte} oferte primite`,
  })),
  ...firme.map((t) => ({
    key: `firma-${t.id}-${t.firma}`,
    data: t.data,
    nota: t.nota,
    badge: 'Lucrare executată',
    text: t.text,
    nume: t.firma,
    href: t.slug ? `/firme/${t.slug}` : null,
    meta: [t.tip, `${t.putere} kW`, t.judet].join(' · '),
    extra: 'firma care a montat',
  })),
].sort((a, b) => a.data.localeCompare(b.data));

export default function HeroTestimonials() {
  if (cards.length === 0) return null;
  const single = cards.length === 1;

  return (
    <div className="mt-8 pt-6 border-t border-white/10 max-w-3xl mx-auto">
      <p className="text-xs font-semibold text-primary-light uppercase tracking-wider mb-3 text-center sm:text-left">
        Cum e experiența pe platformă
      </p>
      <div
        className={`flex gap-3 overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
          single ? '' : '-mx-4 px-4'
        }`}
      >
        {cards.map((t) => (
          <figure
            key={t.key}
            className={`snap-start shrink-0 rounded-xl bg-white shadow-lg p-4 sm:p-5 text-left ${
              single ? 'w-full' : 'w-[85%] sm:w-[70%]'
            }`}
          >
            <div className="flex items-center justify-between gap-3 mb-2.5">
              <div className="flex gap-0.5" aria-label={`Notă ${t.nota} din 5`}>
                {Array.from({ length: 5 }, (_, i) => (
                  <svg
                    key={i}
                    className={`w-4 h-4 ${i < t.nota ? 'text-primary' : 'text-gray-200'}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.07 3.29a1 1 0 00.95.69h3.46c.97 0 1.37 1.24.59 1.81l-2.8 2.03a1 1 0 00-.36 1.12l1.07 3.29c.3.92-.76 1.69-1.54 1.12l-2.8-2.03a1 1 0 00-1.18 0l-2.8 2.03c-.78.57-1.84-.2-1.54-1.12l1.07-3.29a1 1 0 00-.36-1.12L2.98 8.72c-.78-.57-.38-1.81.59-1.81h3.46a1 1 0 00.95-.69l1.07-3.29z" />
                  </svg>
                ))}
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                {t.badge}
              </span>
            </div>
            <blockquote className="text-sm sm:text-base leading-relaxed text-gray-900">„{t.text}”</blockquote>
            <figcaption className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs sm:text-sm">
              {t.href ? (
                <Link href={t.href} className="font-semibold text-gray-900 hover:text-primary-dark">
                  {t.nume}
                </Link>
              ) : (
                <span className="font-semibold text-gray-900">{t.nume}</span>
              )}
              <span className="text-gray-500">{t.meta}</span>
              {t.extra && (
                <>
                  <span className="text-gray-300">·</span>
                  <span className="text-gray-500">{t.extra}</span>
                </>
              )}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
