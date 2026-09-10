'use client';

import Link from 'next/link';
import { trackEvent } from '@/lib/analytics';

// Butonul benzii „Sunteți instalator?" de pe homepage. Componentă separată din
// același motiv ca HomeFinantareCta: pagina e server component, iar `trackEvent`
// cere onClick.
//
// Evenimentul are `source` fiindcă spre /pentru-instalatori se va ajunge și din
// alte locuri (bara de navigație o are deja); fără el n-am ști care plasare
// aduce firmele.
export default function HomeInstalatoriCta() {
  return (
    <Link
      href="/pentru-instalatori"
      onClick={() => trackEvent('pentru_instalatori_click', { source: 'home_band' })}
      className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold text-sm px-6 py-3 rounded-lg transition-colors shadow-sm"
    >
      Cum preluați o cerere
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
      </svg>
    </Link>
  );
}
