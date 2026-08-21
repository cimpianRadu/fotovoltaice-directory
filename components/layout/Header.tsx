'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import SegmentToggle from '@/components/segment/SegmentToggle';
import { useSegment } from '@/components/segment/SegmentProvider';
import { trackEvent } from '@/lib/analytics';

// În bara principală rămân destinațiile pentru clientul care caută (Calculatorul
// e momeala care se termină în cerere de ofertă). Uneltele căutate punctual trec
// sub „Mai multe", inclusiv listarea de firmă: partea de listări nu e focusul
// acum. /cere-oferta nu e link aici: e CTA-ul amber al headerului, pe ambele
// lățimi — conversia principală a site-ului nu concurează cu propriul link.
const primaryLinks = [
  { href: '/firme', label: 'Firme' },
  { href: '/cereri', label: 'Cereri Clienți' },
  { href: '/studii-de-caz', label: 'Studii de Caz' },
  { href: '/ghid', label: 'Ghiduri' },
  { href: '/calculator-panouri-fotovoltaice', label: 'Calculator' },
];

// Uneltele primele, paginile despre site la urmă.
const moreLinks = [
  { href: '/verificare-anre', label: 'Verificare ANRE' },
  { href: '/clasament', label: 'Clasament' },
  { href: '/listeaza-firma', label: 'Listează-ți firma' },
  { href: '/portal', label: 'Portal Instalatori' },
  { href: '/publicitate', label: 'Publicitate' },
  { href: '/intrebari-frecvente', label: 'Întrebări frecvente' },
  { href: '/despre', label: 'Despre noi' },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const pathname = usePathname();
  const { segment } = useSegment();
  const moreRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  const isMoreActive = moreLinks.some((l) => isActive(l.href));

  // Close "Mai multe" dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    }
    if (moreOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [moreOpen]);

  // Close the mobile menu when tapping/clicking outside the header
  useEffect(() => {
    function handleClickOutside(e: Event) {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    }
    if (mobileOpen) document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, [mobileOpen]);

  return (
    <header ref={headerRef} className="sticky top-0 z-50 bg-white border-b border-border">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-secondary-dark shrink-0">
          <Image src="/logo.svg" alt="Instalatori Fotovoltaice" width={32} height={32} className="w-8 h-8" />
          {/* Între lg și xl textul logo-ului dispare — nav-ul are prioritate */}
          <span className="hidden sm:inline lg:hidden xl:inline whitespace-nowrap">Instalatori Fotovoltaice</span>
        </Link>

        {/* Desktop nav */}
        {/* Desktop nav de la lg în sus — linkuri + toggle + CTA nu încap sub 1024px */}
        <nav className="hidden lg:flex items-center gap-2.5 xl:gap-3 min-[1440px]:gap-5">
          <SegmentToggle source="nav" />
          {primaryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium whitespace-nowrap transition-colors ${
                isActive(link.href)
                  ? 'text-primary-dark border-b-2 border-primary pb-0.5'
                  : 'text-gray-600 hover:text-secondary-dark'
              }`}
            >
              {link.label}
            </Link>
          ))}

          {/* "Mai multe" dropdown */}
          <div ref={moreRef} className="relative">
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              className={`inline-flex items-center gap-1 text-sm font-medium whitespace-nowrap transition-colors ${
                isMoreActive
                  ? 'text-primary-dark border-b-2 border-primary pb-0.5'
                  : 'text-gray-600 hover:text-secondary-dark'
              }`}
              aria-expanded={moreOpen}
              aria-haspopup="menu"
            >
              Mai multe
              <svg
                className={`w-4 h-4 transition-transform ${moreOpen ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {/* Always render in DOM (SEO) — toggle visibility with CSS */}
            <div
              role="menu"
              className={`absolute right-0 mt-2 w-60 rounded-xl border border-border bg-white shadow-lg py-2 ${
                moreOpen ? 'block' : 'hidden'
              }`}
            >
              {moreLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  role="menuitem"
                  onClick={() => setMoreOpen(false)}
                  className={`block px-4 py-2.5 text-sm transition-colors ${
                    isActive(link.href)
                      ? 'text-primary-dark bg-primary/5 font-medium'
                      : 'text-gray-700 hover:bg-surface hover:text-secondary-dark'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <Link
            href="/cere-oferta?sursa=header"
            onClick={() => trackEvent('cere_oferta_click', { segment, source: 'header_desktop' })}
            className="bg-primary hover:bg-primary-dark text-white font-semibold text-sm px-4 py-2 rounded-lg whitespace-nowrap transition-colors"
          >
            Cere oferte
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <div className="flex items-center gap-2 lg:hidden">
          <Link
            href="/cere-oferta?sursa=header"
            onClick={() => trackEvent('cere_oferta_click', { segment, source: 'header_mobile' })}
            className="inline-flex items-center gap-1.5 justify-center bg-primary hover:bg-primary-dark text-white font-semibold text-sm px-3 min-h-[44px] rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Cere oferte
          </Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] -mr-2 rounded-lg hover:bg-surface"
            aria-label="Meniu"
            aria-expanded={mobileOpen}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile nav overlay — always in DOM for SEO, toggled with CSS */}
      <div className={`lg:hidden border-t border-border bg-white ${mobileOpen ? 'block' : 'hidden'}`}>
        <nav className="flex flex-col p-4 gap-1">
          <div className="px-1 pb-3 mb-2 border-b border-border">
            <p className="text-xs font-semibold text-gray-400 mb-2">Caut panouri pentru:</p>
            <SegmentToggle source="nav_mobile" />
          </div>
          {primaryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`text-base font-medium rounded-lg px-3 py-2.5 transition-colors ${
                isActive(link.href)
                  ? 'text-primary-dark bg-primary/5'
                  : 'text-gray-700 hover:text-secondary-dark hover:bg-surface'
              }`}
            >
              {link.label}
            </Link>
          ))}

          {/* Aceeași grupare ca pe desktop: pe mobil nu e dropdown, ci o secțiune
              separată cu etichetă, ca ordinea linkurilor să fie identică pe ambele. */}
          <p className="text-xs font-semibold text-gray-400 px-3 pt-4 pb-1 border-t border-border mt-2">
            Mai multe
          </p>
          {moreLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`text-base font-medium rounded-lg px-3 py-2.5 transition-colors ${
                isActive(link.href)
                  ? 'text-primary-dark bg-primary/5'
                  : 'text-gray-700 hover:text-secondary-dark hover:bg-surface'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
