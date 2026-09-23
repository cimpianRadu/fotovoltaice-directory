'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

// Caruselul de testimoniale din hero. Un card pe ecran, săgeți pe laterale (de
// la sm în sus), puncte dedesubt, swipe pe mobil prin scroll-snap. Derulare
// automată la 7 s, oprită la hover, focus, după orice atingere a userului, în
// tab ascuns și la prefers-reduced-motion. Cardurile vin gata calculate din
// lib/testimoniale.ts prin componente server, ca bundle-ul client să nu tragă
// JSON-urile. `tone` alege culorile punctelor și contorului: „dark” pe navy
// (hero), „light” pe fundal alb (/pentru-instalatori).

export type TestimonialCard = {
  key: string;
  nota: number;
  badge: string;
  text: string;
  nume: string;
  href: string | null;
  meta: string;
  extra: string | null;
};

const AUTOPLAY_MS = 7000;

function Stars({ nota }: { nota: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`Notă ${nota} din 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${i < nota ? 'text-primary' : 'text-gray-200'}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.07 3.29a1 1 0 00.95.69h3.46c.97 0 1.37 1.24.59 1.81l-2.8 2.03a1 1 0 00-.36 1.12l1.07 3.29c.3.92-.76 1.69-1.54 1.12l-2.8-2.03a1 1 0 00-1.18 0l-2.8 2.03c-.78.57-1.84-.2-1.54-1.12l1.07-3.29a1 1 0 00-.36-1.12L2.98 8.72c-.78-.57-.38-1.81.59-1.81h3.46a1 1 0 00.95-.69l1.07-3.29z" />
        </svg>
      ))}
    </div>
  );
}

function Arrow({ dir, onClick, disabled }: { dir: 'prev' | 'next'; onClick: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === 'prev' ? 'Testimonialul anterior' : 'Testimonialul următor'}
      className={`hidden sm:flex absolute top-1/2 -translate-y-1/2 ${
        dir === 'prev' ? '-left-5 lg:-left-6' : '-right-5 lg:-right-6'
      } w-10 h-10 items-center justify-center rounded-full bg-white text-secondary shadow-lg ring-1 ring-black/5 transition hover:bg-primary hover:text-white disabled:opacity-0 disabled:pointer-events-none`}
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d={dir === 'prev' ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'} />
      </svg>
    </button>
  );
}

export default function TestimonialCarousel({ cards, tone = 'dark' }: { cards: TestimonialCard[]; tone?: 'dark' | 'light' }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touched = useRef(false);
  const many = cards.length > 1;

  const goTo = useCallback(
    (i: number, smooth = true) => {
      const el = trackRef.current;
      if (!el) return;
      const n = ((i % cards.length) + cards.length) % cards.length;
      el.scrollTo({ left: n * el.clientWidth, behavior: smooth ? 'smooth' : 'auto' });
    },
    [cards.length],
  );

  // Indexul activ urmărește poziția reală de scroll (și swipe-ul de pe mobil).
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onScroll = () => setIndex(Math.round(el.scrollLeft / el.clientWidth));
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!many || paused || touched.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => {
      if (document.hidden) return;
      goTo(index + 1);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [many, paused, index, goTo]);

  const stopAutoplay = () => {
    touched.current = true;
    setPaused(true);
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => {
        if (!touched.current) setPaused(false);
      }}
      onFocusCapture={() => setPaused(true)}
      onTouchStart={stopAutoplay}
      onPointerDown={stopAutoplay}
    >
      <div
        ref={trackRef}
        className="flex overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden rounded-xl"
        aria-roledescription="carusel"
        aria-label="Testimoniale"
      >
        {cards.map((t, i) => (
          <figure
            key={t.key}
            className={`snap-start shrink-0 w-full rounded-xl bg-white p-4 sm:p-5 text-left flex flex-col ${
              tone === 'dark' ? 'shadow-lg' : 'border border-border shadow-sm'
            }`}
            aria-hidden={many && i !== index ? true : undefined}
          >
            <div className="flex items-center justify-between gap-3 mb-2.5">
              <Stars nota={t.nota} />
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                {t.badge}
              </span>
            </div>
            <blockquote className="text-sm sm:text-base leading-relaxed text-gray-900">„{t.text}”</blockquote>
            <figcaption className="mt-auto pt-3 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs sm:text-sm">
              {t.href ? (
                <Link href={t.href} className="font-semibold text-gray-900 hover:text-primary-dark" tabIndex={many && i !== index ? -1 : undefined}>
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

      {many && (
        <>
          <Arrow dir="prev" onClick={() => { stopAutoplay(); goTo(index - 1); }} disabled={index === 0} />
          <Arrow dir="next" onClick={() => { stopAutoplay(); goTo(index + 1); }} disabled={index === cards.length - 1} />
          <div className="mt-3 flex items-center justify-center gap-3">
            <div className="flex items-center gap-2" role="tablist" aria-label="Alege testimonialul">
              {cards.map((t, i) => (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Testimonialul ${i + 1} din ${cards.length}`}
                  onClick={() => { stopAutoplay(); goTo(i); }}
                  className={`h-2 rounded-full transition-all ${
                    i === index
                      ? 'w-6 bg-primary'
                      : tone === 'dark'
                        ? 'w-2 bg-white/40 hover:bg-white/70'
                        : 'w-2 bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
            <span
              className={`text-xs font-medium tabular-nums ${tone === 'dark' ? 'text-white/60' : 'text-gray-500'}`}
              aria-live="polite"
            >
              {index + 1} din {cards.length}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
