'use client';

import { useState } from 'react';
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
 * Contorul și filtrul sunt același lucru (feedback 17 sept 2026): căsuțele cu
 * cifre sunt butoane, cu exact etichetele statusurilor de pe carduri. Înainte
 * erau cifre de „rezumat" cu alți termeni deasupra unui rând separat de
 * filtre, deci două vocabulare pentru aceleași cereri.
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

const VIEWS: { id: View; label: string; dot?: string }[] = [
  { id: 'toate', label: 'Toate' },
  { id: 'aprobare', label: 'Se aprobă', dot: 'bg-amber-300' },
  ...CLAIM_STATUSES.map((s) => ({
    id: s as View,
    label: CLAIM_STATUS_LABELS[s],
    dot: STATUS_TONE[s],
  })),
  { id: 'renuntate', label: 'Renunțate', dot: 'bg-gray-300' },
];

export default function PortalClaimList({ claims }: { claims: PortalClaim[] }) {
  const [view, setView] = useState<View>('toate');

  const count = (id: View) => claims.filter((c) => inView(c, id)).length;
  // În „Toate", cele la care s-a renunțat coboară la final: lista e de lucru.
  const visible = claims
    .filter((c) => inView(c, view))
    .sort((a, b) => Number(isClosed(a)) - Number(isClosed(b)));
  const showLegend = claims.some((c) => c.approved && !c.releasedAt);

  function pick(id: View) {
    // Al doilea tap pe aceeași căsuță scoate filtrul.
    const next = id === view ? 'toate' : id;
    setView(next);
    if (next !== 'toate') trackEvent('portal_filter_applied', { filtru: 'status', valoare: next });
  }

  return (
    <>
      <div className="mb-4 grid grid-cols-3 gap-1.5 sm:gap-2">
        {VIEWS.map((v) => {
          const n = count(v.id);
          const active = view === v.id;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => pick(v.id)}
              aria-pressed={active}
              disabled={n === 0 && !active}
              className={`flex min-h-[58px] flex-col items-center justify-center rounded-xl border px-1 py-2 text-center transition-colors disabled:opacity-40 ${
                active
                  ? 'border-secondary bg-secondary text-white'
                  : 'border-border bg-white text-gray-900 hover:border-secondary/40'
              }`}
            >
              <span className="text-lg font-bold leading-none tabular-nums sm:text-xl">{n}</span>
              <span
                className={`mt-1 flex items-center gap-1 text-[11px] leading-tight ${
                  active ? 'text-white/90' : 'text-gray-500'
                }`}
              >
                {v.dot && <span className={`hidden h-1.5 w-1.5 shrink-0 rounded-full sm:inline-block ${v.dot}`} />}
                {v.label}
              </span>
            </button>
          );
        })}
      </div>

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
