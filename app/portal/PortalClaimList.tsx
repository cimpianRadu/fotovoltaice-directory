'use client';

import { useState } from 'react';
import SearchableSelect from '@/components/ui/SearchableSelect';
import { trackEvent } from '@/lib/analytics';
import {
  CLAIM_STATUSES,
  CLAIM_STATUS_HINTS,
  CLAIM_STATUS_LABELS,
  type ClaimStatus,
} from '@/lib/sheets-shared';
import PortalClaimCard, { STATUS_TONE, type PortalClaim } from './PortalClaimCard';
import { usePersistedToggle } from './usePersistedToggle';

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

/**
 * Ce înseamnă fiecare status, scris pe ecran. Explicațiile existau doar ca
 * `title` pe pastile, adică invizibile pe telefon și pentru cine nu ține
 * mouse-ul pe buton. Un status pe care fiecare firmă îl interpretează altfel
 * nu e date, e zgomot. Se poate strânge: e text de citit o dată, nu în
 * fiecare zi, iar starea rămâne memorată pe browserul firmei.
 */
function StatusLegend() {
  const [open, setOpen] = usePersistedToggle('portal-legend-open', false);

  return (
    <div className="rounded-xl border border-border bg-surface">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
      >
        <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          Ce înseamnă fiecare status
        </span>
        <span className="flex items-center gap-1 text-xs text-gray-400">
          {open ? 'Ascunde' : 'Arată'}
          <ChevronIcon open={open} />
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4">
          <ul className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {CLAIM_STATUSES.map((s) => (
              <li key={s} className="flex items-start gap-2 text-[13px] leading-snug">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${STATUS_TONE[s]}`} />
                <span>
                  <span className="font-medium text-gray-800">{CLAIM_STATUS_LABELS[s]}</span>
                  <span className="text-gray-500"> — {CLAIM_STATUS_HINTS[s]}</span>
                </span>
              </li>
            ))}
          </ul>
          {/* Etichetele vin din constante, nu scrise de mână: dacă se redenumește
              un status, textul explicativ nu are voie să rămână în urmă. */}
          <p className="mt-3 border-t border-border pt-2.5 text-xs leading-relaxed text-gray-500">
            „{CLAIM_STATUS_LABELS.pierdut}" eliberează locul pentru altă firmă și îți cere motivul.
            „{CLAIM_STATUS_LABELS.castigat}" ne spune să închidem cererea, ca să nu mai fie sunat
            clientul de altcineva.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Un singur filtru, cu text explicit (Radu, 2 nov 2026): grila de 9 căsuțe cu
 * cifre nu se citea ca un filtru și lua un ecran întreg pe telefon. Etichetele
 * sunt cele de pe carduri, ca aceeași stare să nu aibă două nume.
 */
type View = 'toate' | 'aprobare' | ClaimStatus | 'renuntate';

/** Ieșite din lucru: renunțate din portal sau marcate „Neconcretizat". Coboară la finalul listei. */
function isClosed(c: PortalClaim): boolean {
  return Boolean(c.releasedAt) || c.firmStatus === 'pierdut';
}

function inView(c: PortalClaim, view: View): boolean {
  switch (view) {
    case 'toate':
      return true;
    // Aceeași regulă ca badge-ul de pe card: renunțarea are întâietate față de status.
    case 'renuntate':
      return Boolean(c.releasedAt);
    case 'aprobare':
      return !c.releasedAt && !c.approved;
    default:
      return !c.releasedAt && c.approved && c.firmStatus === view;
  }
}

const VIEWS: { id: View; label: string }[] = [
  { id: 'aprobare', label: 'Așteaptă apelul' },
  ...CLAIM_STATUSES.map((s) => ({ id: s as View, label: CLAIM_STATUS_LABELS[s] })),
  { id: 'renuntate', label: 'Renunțate' },
];

export default function PortalClaimList({ claims }: { claims: PortalClaim[] }) {
  const [view, setView] = useState<View>('toate');

  const count = (id: View) => claims.filter((c) => inView(c, id)).length;
  // În „Toate", cele la care s-a renunțat coboară la final: lista e de lucru.
  const visible = claims
    .filter((c) => inView(c, view))
    .sort((a, b) => Number(isClosed(a)) - Number(isClosed(b)));
  const showLegend = claims.some((c) => c.approved && !c.releasedAt);

  // Doar stările în care firma chiar are cereri. Cea aleasă rămâne în listă și
  // dacă s-a golit, altfel filtrul ar arăta „Toate" peste o listă filtrată.
  const options = VIEWS.filter((v) => v.id === view || count(v.id) > 0).map((v) => ({
    value: v.id,
    label: `${v.label} (${count(v.id)})`,
  }));

  function pick(value: string) {
    const next = (value || 'toate') as View;
    setView(next);
    if (next !== 'toate') trackEvent('portal_filter_applied', { filtru: 'status', valoare: next });
  }

  return (
    <>
      {/* Cu toate cererile în aceeași stare, filtrul n-ar avea ce să filtreze. */}
      {options.length > 1 && (
        <SearchableSelect
          name="portal-status"
          label="Filtrează cererile după status"
          placeholder={`Toate cererile (${claims.length})`}
          options={options}
          value={view === 'toate' ? '' : view}
          onValueChange={pick}
          className="mb-4 sm:max-w-xs"
        />
      )}

      {visible.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border p-8 text-center text-sm text-gray-500">
          Nicio cerere aici.
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {visible.map((c) => (
            <PortalClaimCard key={`${c.leadId}-${c.claimTimestamp}`} claim={c} />
          ))}
        </div>
      )}

      {showLegend && (
        <div className="mt-6">
          <StatusLegend />
        </div>
      )}
    </>
  );
}
