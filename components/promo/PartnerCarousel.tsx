'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import partnersData from '@/data/partners.json';

declare global {
  interface Window {
    umami?: { track: (event: string, data?: Record<string, unknown>) => void };
  }
}

const STORAGE_KEY = 'partner-carousel-dismissed-v1';
const SHOW_AFTER_MS = 15_000;

type Partner = {
  slug: string;
  name: string;
  description: string;
  cta: string;
  logo: string;
  url: string;
  active: boolean;
};

const ACTIVE_PARTNERS: Partner[] = (partnersData.partners as Partner[])
  .filter((p) => p.active)
  .slice(0, partnersData.maxActive);

const ROTATION_MS = partnersData.rotationSeconds * 1000;

export default function PartnerCarousel() {
  const [visible, setVisible] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (ACTIVE_PARTNERS.length === 0) return;
    if (sessionStorage.getItem(STORAGE_KEY) === 'dismissed') return;

    const timer = setTimeout(() => {
      setVisible(true);
      window.umami?.track('partner-carousel-view', {
        partner: ACTIVE_PARTNERS[0]?.slug,
      });
    }, SHOW_AFTER_MS);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!visible) return;
    if (ACTIVE_PARTNERS.length <= 1) return;

    const interval = setInterval(() => {
      setIndex((prev) => {
        const next = (prev + 1) % ACTIVE_PARTNERS.length;
        window.umami?.track('partner-carousel-rotate', {
          partner: ACTIVE_PARTNERS[next]?.slug,
        });
        return next;
      });
    }, ROTATION_MS);

    return () => clearInterval(interval);
  }, [visible]);

  const dismiss = () => {
    setVisible(false);
    sessionStorage.setItem(STORAGE_KEY, 'dismissed');
    window.umami?.track('partner-carousel-dismiss', {
      partner: ACTIVE_PARTNERS[index]?.slug,
    });
  };

  const handleClick = (partner: Partner) => {
    window.umami?.track('partner-carousel-click', { partner: partner.slug });
  };

  if (!visible || ACTIVE_PARTNERS.length === 0) return null;

  const partner = ACTIVE_PARTNERS[index];
  const total = ACTIVE_PARTNERS.length;

  return (
    <div
      role="complementary"
      aria-label="Parteneri"
      className="hidden md:block fixed bottom-4 right-4 z-40 w-[320px] rounded-xl border border-gray-200 bg-white shadow-lg animate-[fadeInUp_300ms_ease-out]"
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Închide"
        className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition z-10"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <a
        key={partner.slug}
        href={partner.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => handleClick(partner)}
        className="block p-4 pr-8 animate-[fadeIn_400ms_ease-out]"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
          Partener {total > 1 && <span className="text-gray-300 font-normal normal-case tracking-normal">· {index + 1}/{total}</span>}
        </p>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
            <Image
              src={partner.logo}
              alt={partner.name}
              width={32}
              height={32}
              className="w-8 h-8 object-contain"
            />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm">{partner.name}</p>
            <p className="text-xs text-gray-600 leading-snug mt-0.5">{partner.description}</p>
            <p className="text-xs font-semibold text-amber-700 mt-2">{partner.cta}</p>
          </div>
        </div>
      </a>

      {total > 1 && (
        <div className="px-4 pb-3">
          <div
            key={`progress-${index}`}
            className="h-0.5 bg-gray-100 rounded overflow-hidden"
            aria-hidden="true"
          >
            <div className="h-full bg-amber-500/70 rounded animate-[carouselProgress_15s_linear]" />
          </div>
        </div>
      )}

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
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes carouselProgress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
