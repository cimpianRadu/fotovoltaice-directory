'use client';

// Butonul flotant care duce la calculatorul de baterii de pe home.
//
// Poziționarea e constrânsă de ce stă deja fix pe ecran:
//   desktop  → stânga-jos e CtaPopup (380px), dreapta-jos e PartnerCarousel (320px)
//   mobil    → jos-centru e FloatingSegmentToggle
// Rămâne liberă marginea din dreapta pe desktop (pastilă verticală, la mijloc de
// ecran) și colțul din dreapta-jos pe mobil, unde toggle-ul de segment e centrat
// și nu ajunge. z-30 ca Toast-ul (z-50) și modalele să treacă peste el.
//
// Ținta e ancora #calculator-baterie de pe home. Fiindcă tabul de baterie e deja
// cel implicit, un hash simplu ar fi fost de ajuns la navigare între pagini; dar
// pe home navigarea e client-side, iar dacă omul a trecut între timp pe tabul de
// sistem, `CalculatorTabs` ascultă `hashchange` și comută înapoi.

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { trackEvent } from '@/lib/analytics';

const HREF = '/#calculator-baterie';

// Ecranele unde cititorul e în mijlocul unei acțiuni (formular, portal, panouri
// de admin) sau unde e instalator, nu client.
const HIDE_ON = ['/cere-oferta', '/listeaza-firma', '/portal', '/admin'];

export default function BatteryFab() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  const hiddenHere = HIDE_ON.some((p) => pathname.startsWith(p));

  // Apare după o derulare scurtă, ca să nu acopere primul ecran.
  useEffect(() => {
    if (hiddenHere) {
      setVisible(false);
      return;
    }
    const onScroll = () => setVisible(window.scrollY > 400);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [hiddenHere, pathname]);

  if (hiddenHere) return null;

  function click(source: 'desktop' | 'mobil') {
    trackEvent('battery_fab_click', { source, from: pathname });
    // Pe home, `hashchange` nu se declanșează dacă hash-ul e deja setat.
    if (pathname === '/' && window.location.hash === '#calculator-baterie') {
      document.getElementById('calculator-baterie')?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  const shown = visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none';

  return (
    <>
      {/* Desktop: pastilă verticală lipită de marginea din dreapta. */}
      <Link
        href={HREF}
        onClick={() => click('desktop')}
        aria-label="Calculator baterii: ce capacitate îți trebuie și ce punctaj iei la Casa Verde"
        className={`hidden md:flex fixed right-0 top-1/2 -translate-y-1/2 z-30 items-center gap-2 rounded-l-xl bg-secondary py-4 pl-4 pr-3 text-white shadow-lg transition-all duration-300 hover:bg-secondary-dark ${shown}`}
      >
        <BatteryIcon className="w-5 h-5 shrink-0 text-primary-light" />
        <span className="text-sm font-semibold [writing-mode:vertical-rl] rotate-180">
          Calculator baterii
        </span>
      </Link>

      {/* Mobil: buton rotund în dreapta-jos. Toggle-ul de segment e centrat. */}
      <Link
        href={HREF}
        onClick={() => click('mobil')}
        aria-label="Calculator baterii: ce capacitate îți trebuie și ce punctaj iei la Casa Verde"
        className={`md:hidden fixed bottom-4 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-white shadow-lg transition-all duration-300 active:bg-secondary-dark ${shown}`}
      >
        <BatteryIcon className="w-6 h-6 text-primary-light" />
      </Link>
    </>
  );
}

function BatteryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <rect x="2" y="7" width="16" height="10" rx="2" />
      <path d="M22 10v4" strokeLinecap="round" />
      <path d="M11 9.5 8.5 13H11l-1 2.5L13 12h-2.2l1-2.5Z" fill="currentColor" stroke="none" />
    </svg>
  );
}
