'use client';

import { useEffect, useState } from 'react';

type Tab = 'cereri' | 'setari' | 'conditii';

/** Ancorele din afara portalului (#alerte din /cereri, #adrese) duc în setări. */
const SETTINGS_HASHES = new Set(['#setari', '#alerte', '#adrese']);

/** Acordurile firmei (termeni, grila de comision), din modal și din documente. */
const CONDITII_HASH = '#conditii';

/**
 * Cererile firmei, setările contului și condițiile de colaborare, pe taburi.
 * Condițiile au tab separat (20 nov 2026): în setări, lângă alerte și colegi,
 * erau prea mult pentru un loc despre altceva. Pe telefon setările
 * (42 de județe de bifat, adresele) stăteau deasupra cererilor și împingeau
 * munca zilnică sub ecran; acum sunt la un tap, iar cererile sunt primele.
 */
export default function PortalTabs({
  claimsCount,
  settingsBadge,
  claims,
  settings,
  conditii,
}: {
  claimsCount: number;
  /** Punct de atenție pe tabul de setări: niciun județ bifat = nicio alertă. */
  settingsBadge: boolean;
  claims: React.ReactNode;
  settings: React.ReactNode;
  conditii: React.ReactNode;
}) {
  const [tab, setTab] = useState<Tab>('cereri');

  useEffect(() => {
    const sync = () => {
      if (window.location.hash === CONDITII_HASH) {
        setTab('conditii');
        return;
      }
      if (SETTINGS_HASHES.has(window.location.hash)) {
        setTab('setari');
        // Ancora exactă (#alerte) se derulează după ce tabul s-a randat.
        const id = window.location.hash.slice(1);
        requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView());
      }
    };
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  function pick(next: Tab) {
    setTab(next);
    const hash = next === 'setari' ? '#setari' : next === 'conditii' ? CONDITII_HASH : '';
    window.history.replaceState(null, '', `${window.location.pathname}${hash}`);
  }

  const tabClass = (active: boolean) =>
    `flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors sm:py-2 ${
      active ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
    }`;

  return (
    <>
      {/* Lipit sub headerul site-ului (h-16): pe o listă lungă de cereri,
          setările rămân la un tap fără scroll înapoi sus. */}
      <div
        id="setari"
        className="sticky top-16 z-30 -mx-4 mb-5 scroll-mt-20 bg-white/95 px-4 py-2 backdrop-blur"
      >
        <div role="tablist" className="flex gap-1 rounded-xl border border-border bg-surface p-1">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'cereri'}
            onClick={() => pick('cereri')}
            className={tabClass(tab === 'cereri')}
          >
            Cererile mele <span className="font-normal text-gray-400">({claimsCount})</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'setari'}
            onClick={() => pick('setari')}
            className={tabClass(tab === 'setari')}
          >
            <span className="inline-flex items-center gap-1.5">
              Alerte și utilizatori
              {settingsBadge && (
                <span className="h-2 w-2 rounded-full bg-primary" aria-label="de completat" />
              )}
            </span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'conditii'}
            onClick={() => pick('conditii')}
            className={tabClass(tab === 'conditii')}
          >
            <span className="sm:hidden">Condiții</span>
            <span className="hidden sm:inline">Condiții de colaborare</span>
          </button>
        </div>
      </div>

      <div hidden={tab !== 'cereri'}>{claims}</div>
      <div hidden={tab !== 'setari'}>{settings}</div>
      <div hidden={tab !== 'conditii'}>{conditii}</div>
    </>
  );
}
