'use client';

import Link from 'next/link';
import { useSegment } from '@/components/segment/SegmentProvider';
import { trackEvent } from '@/lib/analytics';

interface Props {
  comercialCount: number;
  rezidentialCount: number;
}

export default function HomeOfertaBand({ comercialCount, rezidentialCount }: Props) {
  const { segment } = useSegment();
  const count = segment === 'rezidential' ? rezidentialCount : comercialCount;
  const de = count >= 20 ? 'de ' : ''; // RO: "128 de instalatori" vs "7 instalatori"

  return (
    <section className="max-w-7xl mx-auto px-4 pt-10">
      <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            Cauți instalatori de panouri fotovoltaice?
          </h2>
          <p className="text-gray-600 mt-1">
            <strong className="text-gray-900">{count}</strong> {de}instalatori cu atestat ANRE verificat. Trimite o cerere și o transmitem celor activi în zona ta, care revin cu oferte — gratuit, fără obligații.
          </p>
        </div>
        <Link
          href="/cere-oferta"
          onClick={() => trackEvent('cere_oferta_click', { segment, source: 'home_band' })}
          className="shrink-0 inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold px-6 py-3 rounded-lg transition-colors"
        >
          Cere Ofertă
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </div>
    </section>
  );
}
