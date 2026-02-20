'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

const navLinks = [
  { href: '/firme', label: 'Firme' },
  { href: '/ghid/panouri-fotovoltaice-hale-industriale', label: 'Ghid' },
  { href: '/intrebari-frecvente', label: 'FAQ' },
  { href: '/despre', label: 'Despre' },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-secondary-dark">
          <Image src="/logo.svg" alt="Instalatori Fotovoltaice" width={32} height={32} className="w-8 h-8" />
          <span className="hidden sm:inline">Instalatori Fotovoltaice</span>
          <span className="sm:hidden">Instalatori FV</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-gray-600 hover:text-secondary-dark transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/cere-oferta"
            className="bg-primary hover:bg-primary-dark text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
          >
            Cere Ofertă
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <div className="flex items-center gap-3 md:hidden">
          <Link
            href="/cere-oferta"
            className="bg-primary hover:bg-primary-dark text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors"
          >
            Ofertă
          </Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 -mr-2"
            aria-label="Meniu"
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

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-white">
          <nav className="flex flex-col p-4 gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-base font-medium text-gray-700 hover:text-secondary-dark hover:bg-surface rounded-lg px-3 py-2.5 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
