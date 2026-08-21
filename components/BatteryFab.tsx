'use client';

// Butonul care duce la calculatorul de baterii de pe home. Două forme, fiindcă
// marginile libere ale ecranului diferă:
//
//   desktop → pastilă verticală pe marginea din dreapta. Jos e ocupat: stânga
//             CtaPopup (380px), dreapta PartnerCarousel (320px).
//   mobil   → bandă lipită sub header. Jos-centru e FloatingSegmentToggle, iar
//             un buton rotund fără text nu spunea ce e dincolo de el.
//
// Banda de pe mobil e `sticky`, montată în flux imediat sub header, nu `fixed`:
// una `fixed` acoperea permanent vreo 60px de text. Așa ocupă spațiu real când e
// la locul ei și se lipește sub header la derulare. `top` nu poate fi 0 (acolo e
// headerul), deci îi măsurăm înălțimea; `ResizeObserver` prinde și deschiderea
// meniului de mobil, care schimbă înălțimea deasupra benzii.
//
// Ținta e ancora #calculator-baterie de pe home. Fiindcă tabul de baterie e deja
// cel implicit, un hash simplu ajunge la navigarea între pagini; pe home, unde
// navigarea e client-side, `CalculatorTabs` ascultă `hashchange` și comută înapoi
// dacă omul trecuse pe tabul de sistem.

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { trackEvent } from '@/lib/analytics';

const HREF = '/#calculator-baterie';
const LABEL = 'Calculator baterii';
// Banda de pe mobil ocupă permanent din ecran, deci se poate închide. Pastila de
// pe desktop stă pe margine și nu acoperă nimic, așa că rămâne.
const STORAGE_KEY = 'battery-fab-dismissed';

// Ecranele unde cititorul e în mijlocul unei acțiuni (formular, portal, admin)
// sau unde e instalator, nu client.
const HIDE_ON = ['/cere-oferta', '/listeaza-firma', '/portal', '/admin'];

export default function BatteryFab() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(true); // până citim localStorage
  const [headerH, setHeaderH] = useState(0);

  const hiddenHere = HIDE_ON.some((p) => pathname.startsWith(p));

  useEffect(() => {
    setDismissed(Boolean(localStorage.getItem(STORAGE_KEY)));
  }, []);

  // Doar pentru pastila de pe desktop: apare după o derulare scurtă, ca să nu
  // concureze cu primul ecran. Banda de pe mobil e în flux, deci e acolo de la
  // început și nu are ce acoperi.
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

  // Înălțimea headerului: măsurată, nu presupusă. `ResizeObserver` prinde și
  // deschiderea meniului de mobil, care schimbă înălțimea sub bandă.
  useEffect(() => {
    if (hiddenHere) return;
    const header = document.querySelector('header');
    if (!header) return;
    const measure = () => setHeaderH(header.getBoundingClientRect().height);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(header);
    return () => ro.disconnect();
  }, [hiddenHere, pathname]);

  if (hiddenHere) return null;

  function click(source: 'desktop' | 'mobil') {
    trackEvent('battery_fab_click', { source, from: pathname });
    // Pe home `hashchange` nu se declanșează dacă hash-ul e deja setat.
    if (pathname === '/' && window.location.hash === '#calculator-baterie') {
      document.getElementById('calculator-baterie')?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  return (
    <>
      {/* Desktop: pastilă verticală pe marginea din dreapta. */}
      <Link
        href={HREF}
        onClick={() => click('desktop')}
        aria-label={`${LABEL}: ce capacitate îți trebuie și ce punctaj iei la Casa Verde`}
        className={`hidden md:flex fixed right-0 top-1/2 -translate-y-1/2 z-30 items-center gap-2 rounded-l-xl bg-secondary py-4 pl-4 pr-3 text-white shadow-lg transition-all duration-300 hover:bg-secondary-dark ${
          visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'
        }`}
      >
        <BatteryIcon className="w-5 h-5 shrink-0 text-primary-light" />
        <span className="text-sm font-semibold [writing-mode:vertical-rl] rotate-180">{LABEL}</span>
      </Link>

      {/* Mobil: bandă sub header. */}
      {!dismissed && (
        <div
          style={{ top: headerH }}
          className="md:hidden sticky z-40 flex items-center gap-2 bg-secondary px-3 py-2.5 text-white shadow-md"
        >
          <Link
            href={HREF}
            onClick={() => click('mobil')}
            className="flex min-w-0 flex-1 items-center gap-2.5"
          >
            <BatteryIcon className="h-5 w-5 shrink-0 text-primary-light" />
            <span className="min-w-0">
              <span className="block text-sm font-semibold leading-tight">{LABEL}</span>
              <span className="block truncate text-[11px] leading-tight text-gray-300">
                Capacitate și punctaj la Casa Verde
              </span>
            </span>
            <svg
              className="ml-auto h-4 w-4 shrink-0 text-primary-light"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m9 5 7 7-7 7" />
            </svg>
          </Link>
          <button
            type="button"
            onClick={() => {
              localStorage.setItem(STORAGE_KEY, '1');
              setDismissed(true);
            }}
            aria-label="Închide banda"
            className="-mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-300 hover:bg-white/10 hover:text-white"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      )}
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
