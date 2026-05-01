'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';

const primaryLinks = [
  { href: '/firme', label: 'Firme' },
  { href: '/clasament', label: 'Clasament' },
  { href: '/calculator-panouri-fotovoltaice', label: 'Calculator' },
  { href: '/verificare-anre', label: 'Verificare ANRE' },
  { href: '/ghid', label: 'Ghiduri' },
];

const moreLinks = [
  { href: '/publicitate', label: 'Publicitate' },
  { href: '/intrebari-frecvente', label: 'Întrebări frecvente' },
  { href: '/despre', label: 'Despre noi' },
];

const allMobileLinks = [...primaryLinks, ...moreLinks];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const pathname = usePathname();
  const moreRef = useRef<HTMLDivElement>(null);

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

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-secondary-dark">
          <Image src="/logo.svg" alt="Instalatori Fotovoltaice" width={32} height={32} className="w-8 h-8" />
          <span className="hidden sm:inline">Instalatori Fotovoltaice</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {primaryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
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
              className={`inline-flex items-center gap-1 text-sm font-medium transition-colors ${
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
            href="/listeaza-firma"
            className="bg-primary hover:bg-primary-dark text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
          >
            Listează-ți Firma
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <Link
            href="/listeaza-firma"
            className="inline-flex items-center justify-center bg-primary hover:bg-primary-dark text-white font-semibold text-sm px-3 min-h-[44px] rounded-lg transition-colors"
          >
            Listează Firma
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
      <div className={`md:hidden border-t border-border bg-white ${mobileOpen ? 'block' : 'hidden'}`}>
        <nav className="flex flex-col p-4 gap-1">
          {allMobileLinks.map((link) => (
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
