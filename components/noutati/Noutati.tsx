'use client';

import { useRef, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Modal from '@/components/ui/Modal';
import { NOUTATI, bucharestDay, type Noutate } from '@/lib/noutati';
import { formatShortDate } from '@/lib/utils-shared';
import { trackEvent } from '@/lib/analytics';

// Noutățile platformei într-un modal, deschis din meniul site-ului (firma
// logată) și din cardul contului din portal. Ce a văzut firma se ține în
// browserul ei: e o comoditate, iar dacă se pierde, contează ca noi doar
// noutățile din ultima lună.

const STORAGE_KEY = 'portal-noutati-vazute';
/** Evenimentul cu care meniul și portalul își sting bulina împreună. */
const SEEN_EVENT = 'noutati-vazute';

/**
 * La prima vizită contează ca nou doar ce a apărut în ultima lună: o firmă care
 * intră azi n-are de ce să vadă bulină pe ce s-a schimbat în vară.
 */
const FIRST_VISIT_DAYS = 30;

/** Ziua ultimei noutăți văzute; fără nimic salvat, acum o lună. */
function readSeenSince(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
  } catch {
    /* private mode */
  }
  return bucharestDay(new Date(), -FIRST_VISIT_DAYS);
}

function subscribe(onChange: () => void) {
  window.addEventListener(SEEN_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(SEEN_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

function markSeen() {
  try {
    localStorage.setItem(STORAGE_KEY, NOUTATI[0].data);
  } catch {
    /* private mode */
  }
  window.dispatchEvent(new Event(SEEN_EVENT));
}

/**
 * Câte noutăți n-a văzut firma și modalul cu ele. `sursa` spune din ce loc a
 * fost deschis, ca să se vadă care dintre cele două e folosit.
 */
export function useNoutati(sursa: 'meniu' | 'portal') {
  // Pe server și la prima randare nimic nu e nou, ca HTML-ul să fie același;
  // ziua din browser vine abia după hidratare.
  const seenSince = useSyncExternalStore(subscribe, readSeenSince, () => null);
  // Ziua de dinainte de deschidere, după care se pun etichetele „Nou”, deși
  // între timp am salvat că firma le-a văzut. Null = modal închis.
  const [openSince, setOpenSince] = useState<string | null>(null);
  // Ce se întâmplă când firma închide modalul fără să plece din el (X, Esc,
  // fundal): meniul din care l-a deschis se redeschide. Golit la prima
  // închidere, ca un al doilea `close` al dialogului să nu-l repete.
  const onDismiss = useRef<(() => void) | undefined>(undefined);
  const unreadCount = seenSince === null ? 0 : NOUTATI.filter((n) => n.data > seenSince).length;

  return {
    unreadCount,
    open(dismissed?: () => void) {
      trackEvent('noutati_open', { sursa, noi: unreadCount });
      onDismiss.current = dismissed;
      setOpenSince(seenSince ?? readSeenSince());
      markSeen();
    },
    modalProps: {
      newSince: openSince,
      onClose() {
        const back = onDismiss.current;
        onDismiss.current = undefined;
        setOpenSince(null);
        back?.();
      },
      // Pe un link firma pleacă spre altă pagină: meniul redeschis i-ar acoperi-o.
      onNavigate() {
        onDismiss.current = undefined;
        setOpenSince(null);
      },
    },
  };
}

/** „2 noi”, pe butoanele care deschid modalul. */
export function NoutatiCount({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="whitespace-nowrap rounded-full bg-primary px-2 py-0.5 text-xs font-semibold leading-tight text-white">
      {count === 1 ? '1 nouă' : `${count} noi`}
    </span>
  );
}

const PORTAL_ANCHOR = '/portal#';

function NoutateLink({ noutate, onNavigate }: { noutate: Noutate; onNavigate: () => void }) {
  const pathname = usePathname();
  const className = 'mt-1 inline-block text-sm font-medium text-primary-dark hover:underline';
  const label = `${noutate.linkText || 'Vezi'} →`;
  const onClick = () => {
    trackEvent('noutati_click', { data: noutate.data });
    onNavigate();
  };
  // Din portal, spre o ancoră a lui (#alerte, #adrese), linkul e simplu, nu
  // next/link: doar schimbarea de hash declanșează `hashchange`, din care
  // PortalTabs deschide tabul de setări. Next navighează prin pushState, fără
  // eveniment. Din restul site-ului ancora se citește la încărcarea portalului.
  if (pathname === '/portal' && noutate.link!.startsWith(PORTAL_ANCHOR)) {
    return (
      <a href={noutate.link!.slice(PORTAL_ANCHOR.length - 1)} onClick={onClick} className={className}>
        {label}
      </a>
    );
  }
  return (
    <Link href={noutate.link!} onClick={onClick} className={className}>
      {label}
    </Link>
  );
}

export function NoutatiModal({
  newSince,
  onClose,
  onNavigate,
}: {
  newSince: string | null;
  onClose: () => void;
  onNavigate: () => void;
}) {
  return (
    // Pe telefon cu margine de 16px: lipit de marginile ecranului arăta a pagină, nu a fereastră.
    <Modal
      open={newSince !== null}
      onClose={onClose}
      title="Noutăți în platformă"
      width="max-w-[calc(100vw-2rem)] sm:max-w-md"
    >
      <ul className="space-y-5">
        {NOUTATI.map((n) => (
          <li key={n.data + n.titlu}>
            <p className="flex items-center gap-2 text-xs text-gray-400">
              {formatShortDate(n.data)}
              {newSince !== null && n.data > newSince && (
                <span className="rounded bg-amber-50 px-1.5 py-px text-[10px] font-bold uppercase tracking-wide text-primary-dark">
                  Nou
                </span>
              )}
            </p>
            <p className="mt-0.5 text-sm font-semibold text-gray-900">{n.titlu}</p>
            <p className="mt-1 text-sm leading-relaxed text-gray-600">{n.text}</p>
            {n.link && <NoutateLink noutate={n} onNavigate={onNavigate} />}
          </li>
        ))}
      </ul>
    </Modal>
  );
}

export function BellIcon({ className }: { className: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  );
}
