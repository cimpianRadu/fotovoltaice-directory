'use client';

import Link from 'next/link';
import { trackEvent } from '@/lib/analytics';

// Butonul din blocul de finanțare pentru firme de pe homepage. E o componentă
// separată dintr-un singur motiv: pagina e server component, iar `trackEvent`
// are nevoie de onClick. Restul secțiunii rămâne pe server.
//
// `href` vine din pagină, nu e hardcodat aici, fiindcă ținta se schimbă: acum
// duce în /finantare, iar când pagina de finanțare pentru firme intră live se
// mută acolo. Evenimentul trimite ținta ca prop, ca să nu se amestece cele două
// perioade în același raport.
interface Props {
  href: string;
  children: React.ReactNode;
}

export default function HomeFinantareCta({ href, children }: Props) {
  return (
    <Link
      href={href}
      onClick={() => trackEvent('finantare_cta_click', { source: 'home_b2b', to: href })}
      className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors"
    >
      {children}
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
      </svg>
    </Link>
  );
}
