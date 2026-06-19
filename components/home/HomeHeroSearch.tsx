'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { trackEvent } from '@/lib/analytics';

export interface FirmIndexItem {
  name: string;
  slug: string;
}
export interface CountyIndexItem {
  name: string;
  slug: string;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/ă/g, 'a')
    .replace(/â/g, 'a')
    .replace(/î/g, 'i')
    .replace(/ș/g, 's')
    .replace(/ț/g, 't')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

interface Props {
  firms: FirmIndexItem[];
  counties: CountyIndexItem[];
}

export default function HomeHeroSearch({ firms, counties }: Props) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const nq = normalize(q);

  const results = useMemo(() => {
    if (nq.length < 2) return { firms: [], counties: [] };
    const firmMatches = firms.filter((f) => normalize(f.name).includes(nq)).slice(0, 6);
    const countyMatches = counties.filter((c) => normalize(c.name).includes(nq)).slice(0, 3);
    return { firms: firmMatches, counties: countyMatches };
  }, [nq, firms, counties]);

  const hasResults = results.firms.length + results.counties.length > 0;

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  function go(href: string, kind: 'firm' | 'county') {
    trackEvent('hero_search_select', { kind, query: nq });
    router.push(href);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (results.counties[0]) go(`/firme/judet/${results.counties[0].slug}`, 'county');
    else if (results.firms[0]) go(`/firme/${results.firms[0].slug}`, 'firm');
    else router.push('/firme');
  }

  return (
    <div ref={boxRef} className="relative max-w-xl mx-auto text-left">
      <form
        onSubmit={onSubmit}
        className="flex items-center gap-2 bg-white rounded-xl p-2 pl-3.5 shadow-xl"
      >
        <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Caută o firmă după nume…"
          aria-label="Caută o firmă de instalare panouri fotovoltaice"
          className="flex-1 min-w-0 bg-transparent text-sm sm:text-base text-gray-800 placeholder-gray-400 outline-none h-8"
        />
        <button
          type="submit"
          className="shrink-0 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-lg px-4 py-2 transition-colors"
        >
          Caută
        </button>
      </form>

      {open && nq.length >= 2 && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] bg-white rounded-xl shadow-2xl overflow-hidden z-20 border border-gray-100">
          {!hasResults && (
            <div className="px-4 py-3 text-sm text-gray-500">
              Niciun rezultat pentru „{q}".{' '}
              <Link href="/firme" className="text-primary-dark font-medium hover:underline">
                Vezi toate firmele &rarr;
              </Link>
            </div>
          )}

          {results.counties.length > 0 && (
            <div>
              <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Județ
              </div>
              {results.counties.map((c) => (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => go(`/firme/judet/${c.slug}`, 'county')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-amber-50 transition-colors"
                >
                  <svg className="w-4 h-4 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  <span className="text-sm text-gray-900">Instalatori în {c.name}</span>
                </button>
              ))}
            </div>
          )}

          {results.firms.length > 0 && (
            <div>
              <div className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 border-t border-gray-100">
                Firme
              </div>
              {results.firms.map((f) => (
                <button
                  key={f.slug}
                  type="button"
                  onClick={() => go(`/firme/${f.slug}`, 'firm')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
                  </svg>
                  <span className="text-sm text-gray-900 truncate">{f.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
