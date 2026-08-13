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

const ALL_PARTNERS = partnersData.partners as Partner[];

const ACTIVE_PARTNERS: Partner[] = ALL_PARTNERS.filter((p) => p.active).slice(
  0,
  partnersData.maxActive,
);

const ROTATION_MS = partnersData.rotationSeconds * 1000;

/**
 * Aceeași previzualizare ca la `SponsorBanner`: `?preview=<slug>` arată un
 * partener cu `active: false` exact cum ar rula după semnare, iar slug-ul
 * rămâne în `sessionStorage` cât ține sesiunea. Fără asta nu poți arăta unui
 * prospect popup-ul lui înainte de contract decât publicându-l, ceea ce ar
 * însemna să-l dai gratis tuturor vizitatorilor.
 *
 * În preview nu pleacă niciun eveniment, ca cifrele din raportul lui să nu
 * conțină propriile lui vizite.
 */
const PREVIEW_KEY = 'sponsor-preview';

function readPreviewSlug(): string | null {
  const fromUrl = new URLSearchParams(window.location.search).get('preview');
  if (fromUrl === 'off') {
    sessionStorage.removeItem(PREVIEW_KEY);
    return null;
  }
  if (fromUrl) {
    sessionStorage.setItem(PREVIEW_KEY, fromUrl);
    return fromUrl;
  }
  return sessionStorage.getItem(PREVIEW_KEY);
}

export default function PartnerCarousel() {
  const [visible, setVisible] = useState(false);
  const [partners, setPartners] = useState<Partner[]>(ACTIVE_PARTNERS);
  const [preview, setPreview] = useState(false);
  // Start at 0 server-side (matches SSR) then randomize on client mount before
  // the popup becomes visible. This way every page load gets a different first
  // partner — without random start, partner at index N is only seen by visitors
  // who stay > N×rotationSeconds (e.g. with 3 partners + 15s, the 3rd appears
  // only after 30s, so short-bounce traffic never sees it).
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const previewSlug = readPreviewSlug();
    const pending = previewSlug
      ? ALL_PARTNERS.find((p) => p.slug === previewSlug && !p.active)
      : undefined;
    const list = pending ? [pending, ...ACTIVE_PARTNERS] : ACTIVE_PARTNERS;
    const isPreview = Boolean(pending);

    setPartners(list);
    setPreview(isPreview);

    if (list.length === 0) return;
    if (sessionStorage.getItem(STORAGE_KEY) === 'dismissed') return;

    // Random starting index — equal share-of-voice across page loads.
    // În preview pornim de la partenerul previzualizat, altfel prospectul ar
    // putea aștepta o rotație întreagă până să-și vadă propriul popup.
    const startIndex = isPreview ? 0 : Math.floor(Math.random() * list.length);
    setIndex(startIndex);

    const timer = setTimeout(() => {
      setVisible(true);
      if (isPreview) return;
      window.umami?.track('partner-carousel-view', {
        partner: list[startIndex]?.slug,
        position: startIndex + 1,
      });
    }, SHOW_AFTER_MS);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!visible) return;
    if (partners.length <= 1) return;

    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % partners.length);
    }, ROTATION_MS);

    return () => clearInterval(interval);
  }, [visible, partners]);

  const dismiss = () => {
    setVisible(false);
    sessionStorage.setItem(STORAGE_KEY, 'dismissed');
    if (preview) return;
    window.umami?.track('partner-carousel-dismiss', {
      partner: partners[index]?.slug,
    });
  };

  const handleClick = (partner: Partner) => {
    if (preview) return;
    window.umami?.track('partner-carousel-click', { partner: partner.slug });
  };

  const buildPartnerUrl = (partner: Partner) => {
    const pathname =
      typeof window !== 'undefined' && window.location.pathname
        ? window.location.pathname.replace(/^\/|\/$/g, '').replace(/\//g, '-') || 'home'
        : 'unknown';
    const sep = partner.url.includes('?') ? '&' : '?';
    return `${partner.url}${sep}utm_content=${encodeURIComponent(pathname)}`;
  };

  if (!visible || partners.length === 0) return null;

  const partner = partners[index];
  const total = partners.length;

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
        href={buildPartnerUrl(partner)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => handleClick(partner)}
        className="block p-4 pr-8 animate-[fadeIn_400ms_ease-out]"
      >
        <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5">Publicitate</p>
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
