'use client';

import Image from 'next/image';
import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    umami?: { track: (event: string, data?: Record<string, unknown>) => void };
  }
}

export type SponsorPosition = 'homepage' | 'ghid-index' | 'ghid-topic';

const sponsors = [
  {
    name: 'Diodor',
    description: 'Materiale electrice și echipamente fotovoltaice',
    logo: '/logos/diodor.png',
    url: 'https://diodor.ro?utm_source=instalatori-fotovoltaice&utm_medium=sponsor&utm_campaign=listing-sponsor',
    location: 'Cluj-Napoca',
  },
];

export default function SponsorBanner({ position }: { position: SponsorPosition }) {
  const ref = useRef<HTMLDivElement>(null);
  const tracked = useRef(false);

  useEffect(() => {
    if (sponsors.length === 0) return;
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !tracked.current) {
            tracked.current = true;
            sponsors.forEach((sponsor) => {
              window.umami?.track('sponsor-impression', {
                sponsor: sponsor.name.toLowerCase(),
                position,
              });
            });
            obs.disconnect();
          }
        });
      },
      { threshold: 0.5 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [position]);

  if (sponsors.length === 0) return null;

  return (
    <div ref={ref} className="rounded-xl border border-primary/15 bg-primary/5 p-5">
      <p className="text-xs font-semibold text-primary-dark uppercase tracking-wider mb-3">
        Furnizori Recomandați
      </p>
      <div className="space-y-2.5">
        {sponsors.map((sponsor) => (
          <a
            key={sponsor.name}
            href={sponsor.url}
            target="_blank"
            rel="noopener noreferrer"
            data-umami-event="sponsor-click"
            data-umami-event-sponsor={sponsor.name.toLowerCase()}
            data-umami-event-position={position}
            className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-100 hover:border-primary/30 hover:shadow-sm transition-all group"
          >
            <Image
              src={sponsor.logo}
              alt={sponsor.name}
              width={48}
              height={48}
              className="w-12 h-12 rounded object-contain shrink-0"
            />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-dark transition-colors">
                {sponsor.name}
              </p>
              <p className="text-xs text-gray-500 truncate">{sponsor.description}</p>
            </div>
            <svg
              className="w-4 h-4 text-gray-300 group-hover:text-primary shrink-0 ml-auto transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        ))}
      </div>
      <a
        href="/publicitate"
        className="block mt-3 text-xs text-gray-500 hover:text-primary-dark transition-colors text-center"
      >
        Firma ta aici? Află mai multe →
      </a>
    </div>
  );
}
