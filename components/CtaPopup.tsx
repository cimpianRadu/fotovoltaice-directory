'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { trackEvent } from '@/lib/analytics';

// Desktop-only nudge, pinned bottom-left (bottom-right is the partner carousel,
// mobile bottom is the segment toggle + header CTA). Appears after the reader
// scrolls a bit or a short delay, and stays dismissed per-browser via
// localStorage. Analytics: click only (no impression/dismiss tracking).
const STORAGE_KEY = 'cta-popup-dismissed';
// `/portal` e ecranul firmei logate: acolo cititorul e instalatorul, nu
// clientul, iar „cauți un instalator?" e o ofertă adresată altcuiva.
const HIDE_ON = ['/cere-oferta', '/listeaza-firma', '/publicitate', '/portal'];

export default function CtaPopup() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  const hiddenHere = HIDE_ON.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (hiddenHere) return;
    if (localStorage.getItem(STORAGE_KEY)) return;

    let done = false;
    const show = () => {
      if (done) return;
      done = true;
      setVisible(true);
      window.removeEventListener('scroll', onScroll);
    };
    const onScroll = () => {
      const scrolled = window.scrollY / (document.body.scrollHeight - window.innerHeight || 1);
      if (scrolled > 0.4) show();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    const timer = setTimeout(show, 10000); // fallback if they don't scroll much

    return () => {
      window.removeEventListener('scroll', onScroll);
      clearTimeout(timer);
    };
  }, [hiddenHere, pathname]);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* private mode: just hide for this session */
    }
  }

  if (hiddenHere || !visible) return null;

  return (
    <div className="hidden md:block fixed bottom-4 left-4 z-40 w-[380px] rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden animate-[fadeInUp_300ms_ease-out]">
      <div className="h-1 bg-primary" />
      <button
        onClick={dismiss}
        aria-label="Închide"
        className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition z-10"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="p-5">
        <div className="flex items-center gap-2 mb-2.5">
          <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary-dark">
            <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </span>
          <span className="text-xs font-semibold uppercase tracking-wide text-primary-dark">Cere o ofertă</span>
        </div>

        <h3 className="font-semibold text-secondary-dark text-[17px] mb-1.5">
          Cauți un instalator pentru proiectul tău?
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed mb-3.5">
          Completează formularul, iar noi îl trimitem instalatorilor din zona ta. Cei interesați te contactează și alegi cea mai bună ofertă.
        </p>

        <ul className="flex flex-col gap-1.5 mb-4">
          {[
            'Instalatori verificați, cu atestat ANRE',
            'Firme care instalează în zona ta',
            '100% gratuit, completezi în 2 minute',
          ].map((t) => (
            <li key={t} className="flex items-center gap-2 text-[13px] text-gray-700">
              <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {t}
            </li>
          ))}
        </ul>

        <Link
          href="/cere-oferta"
          onClick={() => {
            trackEvent('cere_oferta_click', { source: 'popup' });
            dismiss();
          }}
          className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold text-[15px] py-2.5 rounded-lg transition-colors"
        >
          <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Cere ofertă
        </Link>
      </div>
    </div>
  );
}
