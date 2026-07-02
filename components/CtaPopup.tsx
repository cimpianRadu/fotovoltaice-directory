'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { trackEvent } from '@/lib/analytics';

// Desktop-only nudge, pinned bottom-left (bottom-right is the partner carousel,
// mobile bottom is the segment toggle + header CTA). Appears after the reader
// scrolls a bit or a short delay, and stays dismissed per-browser via
// localStorage. Hidden on the pages where it would be redundant.
const STORAGE_KEY = 'cta-popup-dismissed';
const HIDE_ON = ['/cere-oferta', '/listeaza-firma', '/publicitate'];

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
    <div className="hidden md:block fixed bottom-4 left-4 z-40 w-[330px] rounded-xl border border-gray-200 bg-white shadow-lg animate-[fadeInUp_300ms_ease-out]">
      <button
        onClick={dismiss}
        aria-label="Închide"
        className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition z-10"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <div className="p-4">
        <p className="font-semibold text-secondary-dark text-sm mb-1">Ai un proiect fotovoltaic?</p>
        <p className="text-sm text-gray-600 mb-3">
          Primește oferte gratuite de la instalatori atestați ANRE din zona ta.
        </p>
        <Link
          href="/cere-oferta"
          onClick={() => {
            trackEvent('cere_oferta_click', { source: 'popup' });
            dismiss();
          }}
          className="inline-flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Cere ofertă
        </Link>
      </div>
    </div>
  );
}
