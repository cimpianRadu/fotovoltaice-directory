'use client';

import { useEffect, useState } from 'react';
import { trackEvent } from '@/lib/analytics';
import {
  CLAIM_STATUSES,
  CLAIM_STATUS_HINTS,
  CLAIM_STATUS_LABELS,
  type ClaimStatus,
} from '@/lib/sheets-shared';
import PortalClaimCard, { STATUS_TONE, type PortalClaim } from './PortalClaimCard';
import { usePersistedToggle } from './usePersistedToggle';

/**
 * Sub pragul ăsta filtrele sunt decor: plafonul de revendicări active e 3, deci
 * o firmă vede filtre abia când istoricul de cereri închise le face utile.
 */
const FILTERS_FROM = 6;

type Choice = string; // '' = toate

// Aceeași regulă de atingere ca la banda de statusuri: confortabil pe telefon,
// compact pe desktop.
const pillClass = (active: boolean) =>
  `rounded-full border px-3 py-2.5 text-[13px] font-medium transition-colors sm:py-1.5 sm:text-xs ${
    active
      ? 'bg-secondary text-white border-secondary'
      : 'bg-white text-gray-600 border-border hover:border-secondary/40 hover:text-secondary-dark'
  }`;

function normSegment(s: string): string {
  // Ca în /cereri: tot ce nu e explicit rezidențial e comercial (defaultul formularului).
  return s === 'rezidential' ? 'rezidential' : 'comercial';
}

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

function FilterRow({
  label,
  options,
  value,
  count,
  onPick,
}: {
  label: string;
  options: { id: Choice; label: string }[];
  value: Choice;
  count: (id: Choice) => number;
  onPick: (id: Choice) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-16 shrink-0 text-xs font-medium text-gray-400">{label}</span>
      {options.map((o) => (
        <button key={o.id} type="button" onClick={() => onPick(o.id)} className={pillClass(value === o.id)}>
          {o.label}{' '}
          <span className={value === o.id ? 'opacity-80' : 'text-gray-400'}>({count(o.id)})</span>
        </button>
      ))}
    </div>
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
  const [open, setOpen] = usePersistedToggle('portal-legend-open', true);

  return (
    <div className="mb-5 rounded-xl border border-border bg-surface">
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

export default function PortalClaimList({ claims }: { claims: PortalClaim[] }) {
  const [status, setStatus] = useState<Choice>('');
  const [segment, setSegment] = useState<Choice>('');
  const [judet, setJudet] = useState<Choice>('');
  // Pe telefon filtrele stăteau ca un bloc de trei rânduri deasupra cererilor,
  // adică împingeau munca sub ecran ca să afișeze niște controale folosite rar.
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSheetOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sheetOpen]);

  const counties = [...new Set(claims.map((c) => c.judet).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'ro'),
  );

  const matches = (c: PortalClaim, f: { status: Choice; segment: Choice; judet: Choice }) =>
    (!f.status || c.firmStatus === f.status) &&
    (!f.segment || normSegment(c.segment) === f.segment) &&
    (!f.judet || c.judet === f.judet);

  const current = { status, segment, judet };
  // Counterele țin cont de celelalte două dimensiuni (faceted), ca în /cereri.
  const countBy = (key: 'status' | 'segment' | 'judet') => (id: Choice) =>
    claims.filter((c) => matches(c, { ...current, [key]: id })).length;

  const visible = claims.filter((c) => matches(c, current));
  const active = visible.filter((c) => !c.releasedAt);
  const released = visible.filter((c) => c.releasedAt);

  const pick = (key: 'status' | 'segment' | 'judet', set: (v: Choice) => void) => (v: Choice) => {
    set(v);
    if (v) trackEvent('portal_filter_applied', { filtru: key, valoare: v });
  };

  const activeCount = [status, segment, judet].filter(Boolean).length;

  function resetFilters() {
    setStatus('');
    setSegment('');
    setJudet('');
  }

  // Statusurile fără nicio cerere n-au ce căuta pe ecran: o pastilă „(0)" pe
  // care nu se poate apăsa util e zgomot, nu informație.
  const statusOptions = [
    { id: '', label: 'Toate' },
    ...CLAIM_STATUSES.filter((s) => claims.some((c) => c.firmStatus === s)).map((s) => ({
      id: s as Choice,
      label: CLAIM_STATUS_LABELS[s as ClaimStatus],
    })),
  ];

  const showFilters = claims.length >= FILTERS_FROM;
  // Legenda explică banda de statusuri, deci apare doar când banda există
  // undeva pe ecran: altfel ar descrie butoane pe care firma nu le vede încă.
  const showLegend = claims.some((c) => c.approved && !c.releasedAt);

  const filterRows = (
    <div className="space-y-2.5">
      <FilterRow
        label="Status"
        options={statusOptions}
        value={status}
        count={countBy('status')}
        onPick={pick('status', setStatus)}
      />
      <FilterRow
        label="Segment"
        options={[
          { id: '', label: 'Toate' },
          { id: 'rezidential', label: 'Rezidențial' },
          { id: 'comercial', label: 'Comercial' },
        ]}
        value={segment}
        count={countBy('segment')}
        onPick={pick('segment', setSegment)}
      />
      {counties.length > 1 && (
        <FilterRow
          label="Județ"
          options={[{ id: '', label: 'Toate' }, ...counties.map((j) => ({ id: j, label: j }))]}
          value={judet}
          count={countBy('judet')}
          onPick={pick('judet', setJudet)}
        />
      )}
    </div>
  );

  return (
    <>
      {showLegend && <StatusLegend />}

      {/* Desktop: filtrele stau la vedere, spațiul există. */}
      {showFilters && <div className="mb-5 hidden sm:block">{filterRows}</div>}

      {visible.length === 0 && (
        <div className="bg-surface rounded-xl border border-border p-8 text-center text-sm text-gray-500">
          Nicio cerere pentru filtrele selectate.
        </div>
      )}

      {active.length > 0 && (
        <div className="space-y-4">
          {active.map((c) => (
            <PortalClaimCard key={`${c.leadId}-${c.claimTimestamp}`} claim={c} />
          ))}
        </div>
      )}

      {released.length > 0 && (
        <>
          <h2 className="mt-10 mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">
            Cereri la care ai renunțat
          </h2>
          <div className="space-y-4">
            {released.map((c) => (
              <PortalClaimCard key={`${c.leadId}-${c.claimTimestamp}`} claim={c} />
            ))}
          </div>
        </>
      )}

      {/* Mobil: buton plutitor + panou de jos. Locul de sub ecran e liber pe
          portal, comutatorul Casă/Firmă nu se mai afișează aici. */}
      {showFilters && (
        <>
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="fixed bottom-4 right-4 z-40 flex items-center gap-2 rounded-full bg-secondary px-4 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-secondary-dark sm:hidden"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-7.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            Filtre
            {activeCount > 0 && (
              <span className="rounded-full bg-white px-1.5 text-xs font-bold text-secondary">
                {activeCount}
              </span>
            )}
          </button>

          {sheetOpen && (
            <div className="fixed inset-0 z-50 sm:hidden">
              <button
                type="button"
                aria-label="Închide filtrele"
                onClick={() => setSheetOpen(false)}
                className="absolute inset-0 bg-black/30"
              />
              <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-white p-4 shadow-2xl">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-semibold text-gray-900">Filtre</span>
                  <div className="flex items-center gap-3">
                    {activeCount > 0 && (
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="text-xs text-gray-500 underline hover:text-gray-800"
                      >
                        Șterge tot
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setSheetOpen(false)}
                      className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-gray-600"
                    >
                      Gata
                    </button>
                  </div>
                </div>
                {filterRows}
                <p className="mt-4 text-xs text-gray-400">
                  {visible.length} din {claims.length} cereri
                </p>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
