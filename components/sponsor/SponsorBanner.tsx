'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef } from 'react';
import sponsorsData from '@/data/sponsors.json';

declare global {
  interface Window {
    umami?: { track: (event: string, data?: Record<string, unknown>) => void };
  }
}

/**
 * Slot de partener, vândut separat de listarea din director: partenerii NU sunt
 * firme din `companies.json` și nu trebuie să ajungă niciodată acolo. Directorul
 * își ține valoarea din faptul că fiecare firmă listată e un instalator real cu
 * atestat ANRE verificat; un furnizor sau un broker afișat ca „firmă recomandată"
 * ar strica exact asta.
 *
 * Ca să adaugi un partener: o intrare în `data/sponsors.json`, fără cod. Logo-ul
 * trebuie să existe ca fișier (altfel next/image dă 400 și iese imagine ruptă).
 *
 * `messages` are câte un text pe audiență, pentru că paginile site-ului se citesc
 * de două publicuri diferite: clientul care își pune panouri și instalatorul care
 * caută de lucru. Un partener care e relevant pentru amândoi (finanțare pentru
 * clienți, asigurări și garanții de bună execuție pentru firme) are nevoie de
 * mesaje diferite, altfel jumătate din plasări vorbesc pe lângă cine citește.
 * Poziția din pagină decide singură care mesaj se afișează.
 *
 * `positions` e diferența dintre pachete, scrisă în date, nu în cod: un partener
 * obișnuit primește o listă de pagini, Premium primește `"all"`, adică inclusiv
 * cele două plasări cu cea mai mare intenție, feedul de cereri (unde citesc doar
 * instalatori) și ecranul de după trimiterea unei cereri (unde omul tocmai a
 * convertit). Ca să vinzi Premium, aia trebuie să fie o diferență reală.
 */
export type SponsorAudience = 'client' | 'instalator';

export type SponsorPosition =
  | 'homepage'
  | 'ghid-index'
  | 'ghid-topic'
  | 'clasament'
  | 'calculator'
  | 'firme'
  | 'cere-oferta-confirmare'
  | 'cereri'
  | 'listeaza-firma';

// Cine citește pagina, nu ce conține pagina. Paginile de instalatori sunt cele
// unde ajunge o firmă care caută de lucru sau se ocupă de propria prezență:
// feedul de cereri, formularul de listare, verificarea atestatului.
const POSITION_AUDIENCE: Record<SponsorPosition, SponsorAudience> = {
  homepage: 'client',
  'ghid-index': 'client',
  'ghid-topic': 'client',
  clasament: 'client',
  calculator: 'client',
  firme: 'client',
  'cere-oferta-confirmare': 'client',
  cereri: 'instalator',
  'listeaza-firma': 'instalator',
};

interface Sponsor {
  slug: string;
  name: string;
  location: string;
  logo: string;
  baseUrl: string;
  active: boolean;
  /** `"all"` = pachet Premium, apare pe toate plasările. */
  positions: string[] | 'all';
  messages: Record<string, string>;
}

const ALL_SPONSORS = (sponsorsData.sponsors as Sponsor[]).filter((s) => s.active);

function buildUrl(baseUrl: string, position: SponsorPosition, audience: SponsorAudience) {
  const params = new URLSearchParams({
    utm_source: 'instalatori-fotovoltaice',
    utm_medium: 'sponsor-banner',
    utm_campaign: 'listing-sponsor',
    utm_content: position,
    utm_term: audience,
  });
  return `${baseUrl}?${params.toString()}`;
}

export default function SponsorBanner({
  position,
  title = 'Parteneri Recomandați',
}: {
  position: SponsorPosition;
  title?: string;
}) {
  const audience = POSITION_AUDIENCE[position];
  // Memoizat: fără asta lista are altă identitate la fiecare render, iar efectul
  // de mai jos ar reconstrui observerul la nesfârșit.
  const sponsors = useMemo(
    () =>
      ALL_SPONSORS.filter((s) => s.positions === 'all' || s.positions.includes(position)),
    [position],
  );

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
                sponsor: sponsor.slug,
                position,
                audience,
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
  }, [position, audience, sponsors]);

  // Niciun partener pe audiența asta. Slotul nu dispare, devine anunț propriu:
  // un spațiu gol nu se poate vinde, iar cine ar cumpăra trebuie să vadă unde
  // ar apărea. Fără logo inventat și fără partener fictiv.
  if (sponsors.length === 0) {
    return (
      <a
        href="/publicitate"
        className="block rounded-xl border border-dashed border-primary/30 bg-primary/5 p-5 text-center transition-colors hover:border-primary/50 hover:bg-primary/10"
      >
        <p className="text-[10px] uppercase tracking-wider text-gray-400">Publicitate</p>
        <p className="mt-1 text-sm font-semibold text-primary-dark">Spațiu disponibil</p>
        <p className="mt-1 text-xs text-gray-600 leading-relaxed">
          {audience === 'instalator'
            ? 'Vinzi echipamente sau servicii pentru instalatori? Aici te văd firmele care caută lucrări.'
            : 'Firma ta aici, în fața oamenilor care caută un instalator. Vezi pachetele →'}
        </p>
      </a>
    );
  }

  return (
    <div ref={ref} className="rounded-xl border border-primary/15 bg-primary/5 p-5">
      <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">Publicitate</p>
      <p className="text-xs font-semibold text-primary-dark uppercase tracking-wider mb-3">
        {title}
      </p>
      <div className="space-y-2.5">
        {sponsors.map((sponsor) => (
          <a
            key={sponsor.slug}
            href={buildUrl(sponsor.baseUrl, position, audience)}
            target="_blank"
            rel="noopener noreferrer sponsored"
            data-umami-event="sponsor-click"
            data-umami-event-sponsor={sponsor.slug}
            data-umami-event-position={position}
            data-umami-event-audience={audience}
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
              <p className="text-xs text-gray-500 truncate">
                {sponsor.messages[audience] ?? sponsor.messages.client}
              </p>
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
