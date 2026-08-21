'use client';

import Link from 'next/link';
import { useState } from 'react';

/**
 * Explicația pentru instalatori de deasupra feedului. Pe desktop cei trei pași
 * stau pe un singur rând și nu costă nimic. Pe telefon însă, stivuiți, ocupau
 * peste jumătate de ecran, iar prima cerere ajungea abia la al doilea ecran
 * derulat: firma venea pentru cereri și primea un text. Așa că sub `sm` caseta
 * e strânsă într-un singur rând de atins, iar conținutul apare doar la cerere.
 *
 * Starea inițială e „închis" pe ambele părți (server și client), ca să nu
 * existe nepotrivire de hidratare; desktopul o ignoră prin `sm:block`.
 */
export default function HowItWorks({ maxClaims }: { maxClaims: number }) {
  const [open, setOpen] = useState(false);
  const title = 'Cum funcționează pentru instalatori?';
  // Pe telefon, titlul întreg se rupea pe două rânduri; întrebarea firmei e
  // oricum asta, iar clientul care o atinge află ce se întâmplă cu cererea lui.
  const mobileTitle = 'Cum revendici o cerere?';

  return (
    <div className="mb-6 sm:mb-8 bg-surface rounded-xl border border-border">
      <h2 className="sm:hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="cum-functioneaza"
          className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left font-semibold text-gray-900"
        >
          {mobileTitle}
          <svg
            className={`h-5 w-5 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
      </h2>

      <div id="cum-functioneaza" className={`${open ? 'block' : 'hidden'} sm:block px-5 pb-5 sm:pt-5`}>
        <h2 className="hidden sm:block font-semibold text-gray-900 mb-4">{title}</h2>
        <ol className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-600">
          <li className="flex gap-3">
            <span className="shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary-dark font-bold text-sm inline-flex items-center justify-center">1</span>
            <span>Apeși „Vreau această cerere” și lași datele firmei tale (30 de secunde)</span>
          </li>
          <li className="flex gap-3">
            <span className="shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary-dark font-bold text-sm inline-flex items-center justify-center">2</span>
            <span>
              Te sunăm pentru confirmare (revendicarea este rezervată firmelor de instalare),
              apoi datele complete ale clientului apar în Portalul Instalatorilor
            </span>
          </li>
          <li className="flex gap-3">
            <span className="shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary-dark font-bold text-sm inline-flex items-center justify-center">3</span>
            <span>
              Fiecare cerere merge la maxim {maxClaims} firme, ca să aibă toată lumea o
              șansă reală de închidere
            </span>
          </li>
        </ol>
        <p className="text-sm text-gray-600 mt-4 pt-4 border-t border-border">
          Ai revendicat deja cereri? Intră în{' '}
          <Link href="/portal" className="text-primary-dark underline hover:no-underline">
            Portalul Instalatorilor
          </Link>{' '}
          cu emailul firmei (fără parolă) ca să-ți vezi cererile, să lași note și să
          eliberezi locurile la care renunți. Vrei să primești cererile direct, înainte să
          apară aici?{' '}
          <Link href="/listeaza-firma" className="text-primary-dark underline hover:no-underline">
            Listează-ți firma gratuit
          </Link>{' '}
          sau scrie-ne la{' '}
          <a
            href="mailto:contact@instalatori-fotovoltaice.ro"
            className="text-primary-dark underline hover:no-underline"
          >
            contact@instalatori-fotovoltaice.ro
          </a>
          .
        </p>
      </div>
    </div>
  );
}
