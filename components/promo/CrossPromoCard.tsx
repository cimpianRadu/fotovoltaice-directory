'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

declare global {
  interface Window {
    umami?: { track: (event: string, data?: Record<string, unknown>) => void };
  }
}

const STORAGE_KEY = 'promo-cross-reviewqr-v1';
const SHOW_AFTER_MS = 15_000;

export default function CrossPromoCard() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(STORAGE_KEY) === 'dismissed') return;

    const timer = setTimeout(() => {
      setVisible(true);
      window.umami?.track('cross-promo-view', { target: 'reviewqr' });
    }, SHOW_AFTER_MS);

    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    setVisible(false);
    sessionStorage.setItem(STORAGE_KEY, 'dismissed');
    window.umami?.track('cross-promo-dismiss', { target: 'reviewqr' });
  };

  const handleClick = () => {
    window.umami?.track('cross-promo-click', { target: 'reviewqr' });
  };

  if (!visible) return null;

  return (
    <div
      role="complementary"
      aria-label="Alt proiect"
      className="hidden md:block fixed bottom-4 right-4 z-40 w-[320px] rounded-xl border border-gray-200 bg-white shadow-lg animate-[fadeInUp_300ms_ease-out]"
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Închide"
        className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <a
        href="https://www.reviewqr.app/?utm_source=instalatori-fotovoltaice&utm_medium=cross-promo&utm_campaign=sidebar"
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className="block p-4 pr-8"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
          Partener
        </p>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
            <Image
              src="/images/partners/reviewqr.svg"
              alt="ReviewQR"
              width={32}
              height={32}
              className="w-8 h-8"
            />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm">ReviewQR</p>
            <p className="text-xs text-gray-600 leading-snug mt-0.5">
              Generează coduri QR pentru recenzii Google — util pentru firmele de instalare.
            </p>
            <p className="text-xs font-semibold text-amber-700 mt-2">Încearcă gratuit →</p>
          </div>
        </div>
      </a>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
