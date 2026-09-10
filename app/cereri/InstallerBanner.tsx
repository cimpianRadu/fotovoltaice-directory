'use client';

import Link from 'next/link';
import { trackEvent } from '@/lib/analytics';

/**
 * Bannerul pentru instalatori de deasupra feedului, din 10 septembrie 2026.
 *
 * Ce a înlocuit: caseta „Cum funcționează pentru instalatori?" cu trei pași
 * numerotați și un paragraf cu patru linkuri. Pe telefon ocupa jumătate de
 * ecran (de aceea era și strânsă într-un acordeon), iar firma venea aici pentru
 * cereri, nu pentru un text. Tot ce explica ea stă oricum, mai pe larg și
 * actualizat într-un singur loc, pe /pentru-instalatori.
 *
 * Evenimentul are `source` ca să se vadă care plasare aduce firmele: heroul de
 * pe homepage, banda de sub cereri sau bannerul ăsta.
 */
export default function InstallerBanner() {
  return (
    <Link
      href="/pentru-instalatori"
      onClick={() => trackEvent('pentru_instalatori_click', { source: 'cereri_banner' })}
      className="group mb-6 sm:mb-8 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-5 rounded-xl border border-primary/40 bg-primary/5 hover:bg-primary/10 px-4 sm:px-5 py-4 transition-colors"
    >
      <span className="text-sm sm:text-base text-gray-800 leading-snug text-center sm:text-left">
        <strong className="font-bold text-gray-900">Ești instalator?</strong> Preiei cereri gratuit
        din județul tău.
      </span>
      <span className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-primary group-hover:bg-primary-dark text-white font-semibold text-sm px-4 py-2.5 transition-colors">
        Vezi cum funcționează
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </span>
    </Link>
  );
}
