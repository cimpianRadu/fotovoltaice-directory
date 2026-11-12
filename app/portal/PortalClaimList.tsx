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
import PortalClaimCard, { StatusIcon, type ClaimPatch, type PortalClaim } from './PortalClaimCard';
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
                <StatusIcon status={s} className="mt-0.5 h-4 w-4 shrink-0" />
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
  return Boolean(c.releasedAt) || c.firmStatus === 'pierdut' || Boolean(c.leadClosed?.final);
}

/** Ieșite din lucru: renunțate de firmă sau închise de client (acestea ies singure). */
function isOut(c: PortalClaim): boolean {
  return Boolean(c.releasedAt) || Boolean(c.leadClosed?.final);
}

function inView(c: PortalClaim, view: View): boolean {
  switch (view) {
    case 'toate':
      return true;
    // Aceeași regulă ca pe card: ieșirea din lucru are întâietate față de status.
    case 'renuntate':
      return isOut(c);
    case 'aprobare':
      return !isOut(c) && !c.approved;
    default:
      return !isOut(c) && c.approved && c.firmStatus === view;
  }
}

const VIEWS: { id: View; label: string }[] = [
  { id: 'aprobare', label: 'Așteaptă apelul' },
  ...CLAIM_STATUSES.map((s) => ({ id: s as View, label: CLAIM_STATUS_LABELS[s] })),
  { id: 'renuntate', label: 'Închise sau renunțate' },
];

const claimKey = (c: PortalClaim) => `${c.leadId}-${c.claimTimestamp}`;

export default function PortalClaimList({
  claims,
  recommended,
}: {
  claims: PortalClaim[];
  /** Cererile noi de luat, între „De actualizat” și lista firmei. */
  recommended?: React.ReactNode;
}) {
  const [view, setView] = useState<View>('toate');
  // Ce intră în filtru se fixează când îl alegi: un rând mutat pe alt status nu
  // dispare de sub mână, cât timp firma poate vrea să-i lase și o notă.
  const [viewKeys, setViewKeys] = useState<Set<string> | null>(null);
  const [patches, setPatches] = useState<Record<string, ClaimPatch>>({});
  const [oldOpen, setOldOpen] = useState(false);

  const live = (c: PortalClaim): PortalClaim => ({ ...c, ...patches[claimKey(c)] });
  const patch = (key: string, p: ClaimPatch) =>
    setPatches((prev) => ({ ...prev, [key]: { ...prev[key], ...p } }));

  const count = (id: View) => claims.filter((c) => inView(live(c), id)).length;
  const filtering = view !== 'toate';

  // Rândurile rămân în „De actualizat” până la următoarea încărcare, cu „Am notat”
  // pe ele: dacă ar sări din listă la primul click, firma ar pierde rândul din ochi.
  const asks = claims.filter((c) => c.update?.recent);
  const oldAsks = claims.filter((c) => c.update && !c.update.recent);
  const pending = asks.filter((c) => !patches[claimKey(c)]).length;

  // În „Toate", cele la care s-a renunțat coboară la final: lista e de lucru.
  const rows = claims
    .filter((c) => (filtering ? viewKeys?.has(claimKey(c)) : !c.update))
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
    setViewKeys(
      next === 'toate'
        ? null
        : new Set(claims.filter((c) => inView(live(c), next)).map(claimKey)),
    );
    if (next !== 'toate') trackEvent('portal_filter_applied', { filtru: 'status', valoare: next });
  }

  const renderRow = (c: PortalClaim, inAsks: boolean) => (
    <PortalClaimCard
      key={claimKey(c)}
      claim={live(c)}
      ask={inAsks ? c.update : null}
      acted={Boolean(patches[claimKey(c)])}
      sursa={inAsks ? 'de_actualizat' : 'lista'}
      onPatch={(p) => patch(claimKey(c), p)}
    />
  );

  // În „De actualizat” rândurile sunt înalte (notă, mesajul clientului, cererea
  // închisă), așa că o linie subțire între ele nu ajunge: fiecare e card separat.
  const renderAsk = (c: PortalClaim) => (
    <div key={claimKey(c)} className="rounded-lg border border-amber-200 bg-white shadow-sm">
      {renderRow(c, true)}
    </div>
  );

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

      {!filtering && (asks.length > 0 || oldAsks.length > 0) && (
        <section className="mb-5 rounded-xl border border-amber-300 bg-amber-50/60 p-2 sm:p-3">
          <div className="px-1 pb-2">
            <h2 className="text-sm font-semibold text-gray-900">
              {pending > 0
                ? `De actualizat (${pending})`
                : asks.length > 0
                  ? 'Gata, sunt la zi'
                  : 'De actualizat'}
            </h2>
            {(pending > 0 || asks.length === 0 || oldOpen) && (
              <p className="mt-0.5 text-[13px] leading-relaxed text-gray-700">
                Mută statusul sau lasă o notă. Nu mai lucrezi la una? Alege „
                {CLAIM_STATUS_LABELS.pierdut}”.
              </p>
            )}
          </div>

          {asks.length > 0 && (
            <div className="space-y-3">{asks.map(renderAsk)}</div>
          )}

          {oldAsks.length > 0 && (
            <button
              type="button"
              onClick={() => setOldOpen(!oldOpen)}
              aria-expanded={oldOpen}
              className={`flex w-full items-center justify-between gap-2 rounded-lg px-1 py-2 text-left text-[13px] font-medium text-amber-900 hover:underline ${
                asks.length > 0 ? 'mt-1' : ''
              }`}
            >
              {oldAsks.length === 1
                ? 'Încă o cerere mai veche de o lună, fără noutăți'
                : `Încă ${oldAsks.length} cereri mai vechi de o lună, fără noutăți`}
              <ChevronIcon open={oldOpen} />
            </button>
          )}

          {oldOpen && (
            <div className="space-y-3">{oldAsks.map(renderAsk)}</div>
          )}
        </section>
      )}

      {!filtering && recommended}

      {rows.length > 0 ? (
        <div>
          {/* Card separat pe cerere, ca în „De actualizat”: un rând deschis are
              notă, mesajul clientului și cererea închisă, iar o linie nu le desparte. */}
          <div className="space-y-3">
            {rows.map((c) => (
              <div key={claimKey(c)} className="rounded-xl border border-border bg-white shadow-sm">
                {renderRow(c, false)}
              </div>
            ))}
          </div>
        </div>
      ) : (
        filtering && (
          <div className="bg-surface rounded-xl border border-border p-8 text-center text-sm text-gray-500">
            Nicio cerere aici.
          </div>
        )
      )}

      {showLegend && (
        <div className="mt-6">
          <StatusLegend />
        </div>
      )}
    </>
  );
}
