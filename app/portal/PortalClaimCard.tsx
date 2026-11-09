'use client';

// Pozele clientului sunt private: le servește /api/portal/poza după ce verifică
// sesiunea, deci n-au URL public pe care next/image să-l poată optimiza.
/* eslint-disable @next/next/no-img-element */

import { useRef, useState } from 'react';
import PortalOfferBox from './PortalOfferBox';
import Button from '@/components/ui/Button';
import SearchableSelect from '@/components/ui/SearchableSelect';
import { trackEvent } from '@/lib/analytics';
import {
  MIN_OTHER_REASON_LENGTH,
  RELEASE_REASONS,
  type ClosedLeadNotice,
  type ReleaseReasonId,
} from '@/lib/portal-release-reasons';
import {
  CLAIM_STATUSES,
  CLAIM_STATUS_HINTS,
  CLAIM_STATUS_LABELS,
  type ClaimStatus,
  type ClaimUpdateAsk,
  type LeadNote,
} from '@/lib/sheets-shared';

export interface PortalOffer {
  id: number;
  createdAt: string;
  files: { name: string; size: number }[];
  clientOpenedAt: string | null;
}

export interface PortalClaim {
  claimTimestamp: string;
  leadId: string;
  numeFirma: string;
  claimedAt: string;
  releasedAt: string;
  releaseReason: string;
  contactedAt: string;
  approved: boolean;
  /** ISO — când i s-au deblocat datele clientului. Gol pe cele neaprobate. */
  approvedAt: string;
  offeredAt: string;
  /** Ofertele trimise prin platformă și când le-a deschis clientul (din 23 oct 2026). */
  offers: PortalOffer[];
  /** Firma poate urca o ofertă aici: din pilot, cu datele clientului deblocate. */
  canSendOffer: boolean;
  firmStatus: ClaimStatus;
  notes: LeadNote[];
  tipLabel: string;
  judet: string;
  segment: string;
  specs: { label: string; value: string }[];
  /** Intervalul cerut de client pentru apel. Gol pe cererile de dinainte de 21 aug 2026. */
  intervalApel: string;
  mesaj: string;
  /** Câte poze a urcat clientul. Numărul se vede și pe rândul blocat, ca pe /cereri. */
  pozeCount: number;
  /** Are poze, chiar dacă nu știm câte: moștenirea cu link sau cu poze pe email. */
  cuPoze: boolean;
  /** Cererea s-a închis cât firma încă o avea în lucru. Null pe cele deschise. */
  leadClosed: ClosedLeadNotice | null;
  /** Zile de la ultima mișcare a firmei. `null` = n-a mișcat nimic de la revendicare. */
  updatedDays: number | null;
  /** „Mai lucrezi la ea?”. Calculat pe server, o dată la încărcarea paginii. */
  update: ClaimUpdateAsk | null;
  /** Doar pe revendicările aprobate — altfel null, datele nu pleacă spre browser. */
  client: {
    nume: string;
    companie: string;
    telefon: string;
    email: string;
    localitate: string;
    /** Adresa montajului, dacă a dat-o clientul (BD), cu localitatea și județul după. */
    adresa: string;
    /** Google Maps pe satelit, din coordonate sau din adresă. Null fără niciuna. */
    hartaUrl: string | null;
    /** Pozele urcate de client din formular. Se cer prin /api/portal/poza. */
    pozeUrcate: { pathname: string; fileName: string }[];
    /** Moștenire: link pus de noi în coloana AD, pentru pozele venite pe email. */
    poze: string;
    /** Poze primite, dar încă neurcate: semnal, ca firma să știe că există. */
    pozePeEmail: boolean;
  } | null;
}

/** Ce schimbă firma de pe rând. Stă în listă, ca filtrul să vadă statusul de acum. */
export type ClaimPatch = Partial<
  Pick<PortalClaim, 'firmStatus' | 'offeredAt' | 'notes' | 'releasedAt' | 'updatedDays'>
>;

const STATUS_TONE: Record<ClaimStatus, string> = {
  de_sunat: 'text-slate-500',
  nu_raspunde: 'text-amber-500',
  discutii: 'text-indigo-500',
  ofertat: 'text-sky-600',
  castigat: 'text-emerald-600',
  pierdut: 'text-rose-600',
};

const PHONE_PATH =
  'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z';

const STATUS_GLYPH: Record<ClaimStatus, React.ReactNode> = {
  de_sunat: <path d={PHONE_PATH} />,
  nu_raspunde: (
    <>
      <path d={PHONE_PATH} />
      <path d="m23 1-6 6M17 1l6 6" />
    </>
  ),
  discutii: (
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  ),
  ofertat: <path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" />,
  castigat: (
    <>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="M22 4 12 14.01l-3-3" />
    </>
  ),
  pierdut: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6M9 9l6 6" />
    </>
  ),
};

/** Iconița statusului, aceeași pe rând, în listă și în legendă. Culoarea singură nu spune destul. */
export function StatusIcon({
  status,
  className = 'h-4 w-4 shrink-0',
}: {
  status: ClaimStatus;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`${className} ${STATUS_TONE[status]}`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {STATUS_GLYPH[status]}
    </svg>
  );
}

const STATUS_OPTIONS = CLAIM_STATUSES.map((s) => ({
  value: s,
  label: CLAIM_STATUS_LABELS[s],
  icon: <StatusIcon status={s} />,
}));

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('ro-RO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Europe/Bucharest',
  });
}

/** „9 zile”, „25 de zile”: de la 20 în sus româna cere „de”. */
function zile(n: number): string {
  if (n === 1) return 'o zi';
  const rest = n % 100;
  return rest === 0 || rest >= 20 ? `${n} de zile` : `${n} zile`;
}

function updatedLabel(days: number): string {
  if (days <= 0) return 'actualizat azi';
  if (days === 1) return 'actualizat ieri';
  return `actualizat acum ${zile(days)}`;
}

function askText(ask: ClaimUpdateAsk): string {
  return ask.kind === 'neatinsa'
    ? `Ai datele clientului de ${zile(ask.days)} lucrătoare. Mai ești interesat?`
    : `Fără noutăți de ${zile(ask.days)}. Mai lucrezi la ea?`;
}

/**
 * Un rând de text tăiat cu „…”: se citește întreg la hover (Radu, 3 nov 2026) și
 * la expand. Telefonul n-are hover, deci acolo apăsarea deschide rândul. Fereastra
 * apare doar dacă textul chiar a fost tăiat, altfel ar repeta același rând.
 */
function EllipsisLine({
  label,
  text,
  accent,
  onClick,
}: {
  label: string;
  text: string;
  accent?: boolean;
  onClick: () => void;
}) {
  const lineRef = useRef<HTMLSpanElement>(null);
  const [cut, setCut] = useState(false);
  const measure = () => {
    const el = lineRef.current;
    if (el) setCut(el.scrollWidth > el.clientWidth);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={measure}
      onFocus={measure}
      className={`group relative mt-2 block w-full text-left text-[13px] ${
        accent ? 'border-l-2 border-primary pl-2' : ''
      }`}
    >
      <span ref={lineRef} className="block truncate text-gray-700">
        <span className={`font-medium ${accent ? 'text-amber-800' : 'text-gray-500'}`}>{label}:</span>{' '}
        {text}
      </span>
      {cut && (
        <span className="absolute inset-x-0 top-full z-20 mt-1 hidden whitespace-pre-line break-words rounded-lg border border-border bg-white p-3 text-sm leading-relaxed text-gray-900 shadow-lg group-hover:block group-focus-visible:block">
          {text}
        </span>
      )}
    </button>
  );
}

/** Ce stă pe card fără click: ce te ajută să suni și să estimezi oferta. */
const KEY_SPECS = new Set([
  'Vrea',
  'Suprafață',
  'Acoperiș',
  'Alimentare',
  'Baterie',
  'Buget',
  'Termen',
  'Se informează',
  'Reactivată',
]);
/** Peste atât, ultima miniatură devine „+N” și deschide detaliile. */
const MAX_THUMBS = 4;

/** Specificațiile ca text pe un rând, nu etichete: pe 375px cardul rămâne scurt. */
function SpecLine({ specs }: { specs: { label: string; value: string }[] }) {
  return (
    <p className="text-[13px] leading-relaxed text-gray-700">
      {specs.map((s, i) => (
        <span key={s.label}>
          {i > 0 && (
            <span className="mx-1.5 text-gray-300" aria-hidden="true">
              ·
            </span>
          )}
          <span className="text-gray-400">{s.label}:</span> {s.value}
        </span>
      ))}
    </p>
  );
}

/**
 * Rândul unei cereri (Radu, 3 nov 2026). Ce faci zilnic stă pe rând: suni, muți
 * statusul, lași o notă. Expand-ul arată doar mai multe detalii, nimic de făcut:
 * un click în plus înseamnă note nescrise.
 */
export default function PortalClaimCard({
  claim,
  ask = null,
  acted = false,
  sursa = 'lista',
  onPatch,
}: {
  claim: PortalClaim;
  /** Pe rândurile din „De actualizat”: ce întrebăm firma. */
  ask?: ClaimUpdateAsk | null;
  /** Firma a răspuns de la încărcarea paginii. */
  acted?: boolean;
  sursa?: 'de_actualizat' | 'lista';
  onPatch: (patch: ClaimPatch) => void;
}) {
  const notes = claim.notes;
  const status = claim.firmStatus;
  const released = Boolean(claim.releasedAt);

  const [open, setOpen] = useState(false);

  const [noteText, setNoteText] = useState('');
  const [noteBusy, setNoteBusy] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  const [statusBusy, setStatusBusy] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const [releaseOpen, setReleaseOpen] = useState(false);
  const [motivId, setMotivId] = useState('');
  const [detalii, setDetalii] = useState('');
  const [releaseBusy, setReleaseBusy] = useState(false);
  const [releaseError, setReleaseError] = useState<string | null>(null);
  const [justReleased, setJustReleased] = useState(false);

  function toggle() {
    if (!open) trackEvent('portal_row_opened', { sursa });
    setOpen(!open);
  }

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteText.trim()) return;
    setNoteBusy(true);
    setNoteError(null);
    try {
      const res = await fetch('/api/portal/claims/note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimTimestamp: claim.claimTimestamp,
          leadId: claim.leadId,
          text: noteText,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNoteError(json.error || 'A apărut o eroare. Încearcă din nou.');
        return;
      }
      trackEvent('portal_note_added', { sursa });
      onPatch({ notes: json.notes || [], updatedDays: 0 });
      setNoteText('');
    } catch {
      setNoteError('A apărut o eroare. Încearcă din nou.');
    } finally {
      setNoteBusy(false);
    }
  }

  async function pickStatus(value: string) {
    const next = value as ClaimStatus;
    if (!next || next === status) return;
    // `pierdut` eliberează locul cererii pentru altă firmă, deci trece prin
    // formularul de renunțare, cu motiv, nu printr-un click simplu.
    if (next === 'pierdut') {
      setReleaseOpen(true);
      return;
    }
    setStatusBusy(true);
    setStatusError(null);
    try {
      const res = await fetch('/api/portal/claims/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimTimestamp: claim.claimTimestamp,
          leadId: claim.leadId,
          status: next,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatusError(json.error || 'A apărut o eroare. Încearcă din nou.');
        return;
      }
      trackEvent('portal_status_set', { status: next, sursa });
      onPatch({ firmStatus: json.status || next, offeredAt: json.offeredAt || '', updatedDays: 0 });
    } catch {
      setStatusError('A apărut o eroare. Încearcă din nou.');
    } finally {
      setStatusBusy(false);
    }
  }

  async function release(e: React.FormEvent) {
    e.preventDefault();
    if (!motivId) {
      setReleaseError('Alege motivul.');
      return;
    }
    await sendRelease(motivId as ReleaseReasonId, detalii);
  }

  // Din formular sau, pe cererile închise de client, direct din banner: motivul
  // e deja știut, firma doar confirmă că o scoate din lucru.
  async function sendRelease(id: ReleaseReasonId, details: string) {
    setReleaseBusy(true);
    setReleaseError(null);
    try {
      const res = await fetch('/api/portal/claims/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimTimestamp: claim.claimTimestamp,
          leadId: claim.leadId,
          motivId: id,
          detalii: details,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setReleaseError(json.error || 'A apărut o eroare. Încearcă din nou.');
        return;
      }
      trackEvent('portal_claim_released', { sursa, motiv: id, inchisa: Boolean(claim.leadClosed) });
      onPatch({ releasedAt: new Date().toISOString(), firmStatus: 'pierdut', updatedDays: 0 });
      setJustReleased(true);
      setReleaseOpen(false);
    } catch {
      setReleaseError('A apărut o eroare. Încearcă din nou.');
    } finally {
      setReleaseBusy(false);
    }
  }

  const clientName = claim.client
    ? [claim.client.nume, claim.client.companie].filter(Boolean).join(' · ')
    : '';
  const putere = claim.specs.find((s) => s.label === 'Putere')?.value;
  // Puterea e deja în titlu. Restul se împarte: ce te ajută să suni și să
  // estimezi stă pe card, ce se consultă rar trece la „Toate detaliile”.
  const keySpecs = claim.specs.filter((s) => KEY_SPECS.has(s.label));
  const extraSpecs = claim.specs.filter((s) => s.label !== 'Putere' && !KEY_SPECS.has(s.label));
  // Renunțate sau închise de client: nu mai e nimic de făcut, rămân pe un rând.
  const quiet = released || Boolean(claim.leadClosed);
  const showProject = !quiet || open;
  const photos = claim.client?.pozeUrcate ?? [];
  const thumbsShown = showProject && photos.length > 0;
  const fitsAll = open || photos.length <= MAX_THUMBS;
  const shownPhotos = fitsAll ? photos : photos.slice(0, MAX_THUMBS - 1);
  const morePhotos = photos.length - shownPhotos.length;
  const place = claim.client ? claim.client.adresa || claim.client.localitate : '';
  const hasDetails =
    extraSpecs.length > 0 ||
    claim.client !== null ||
    claim.approved ||
    notes.length > 0 ||
    Boolean(claim.mesaj) ||
    (released && Boolean(claim.releaseReason)) ||
    (quiet && keySpecs.length > 0);
  const photosLabel = `${
    claim.pozeCount === 1 ? 'O poză' : claim.pozeCount > 1 ? `${claim.pozeCount} poze` : 'Poze'
  } de la client${claim.client ? '' : ', le vezi după confirmare'}`;
  // `whitespace-nowrap`: pe 375px eticheta se rupea în două rânduri.
  const badge = 'inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold';

  return (
    <div className={`relative px-3 py-3 sm:px-4 ${released ? 'opacity-70' : ''}`}>
      {/* Pe telefon titlul ia tot rândul, iar dedesubt stau „Sună” și statusul,
          acțiunile pentru care intră firma în portal. Pe laptop, coloane. */}
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_11.5rem] sm:items-start sm:gap-3">
        <div className="col-span-2 min-w-0 sm:col-span-1">
          <h3 className="text-sm font-semibold leading-snug text-gray-900">
            <button type="button" onClick={toggle} className="text-left hover:underline">
              {claim.tipLabel}
              {claim.judet ? ` · ${claim.judet}` : ''}
              {putere ? ` · ${putere}` : ''}
              {/* Doar când miniaturile nu stau pe card: înainte de confirmare,
                  pe cererile închise sau cu pozele venite pe alt drum. */}
              {claim.cuPoze && !thumbsShown && (
                <span
                  title={photosLabel}
                  aria-label={photosLabel}
                  className="ml-2 inline-flex items-center gap-1 align-[-1px] text-xs font-medium text-gray-500"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3.5 w-3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M3 8.8A1.8 1.8 0 0 1 4.8 7h1.9l1.4-2h7.8l1.4 2h1.9A1.8 1.8 0 0 1 21 8.8v8.4A1.8 1.8 0 0 1 19.2 19H4.8A1.8 1.8 0 0 1 3 17.2z" />
                    <circle cx="12" cy="13" r="3.2" />
                  </svg>
                  {claim.pozeCount > 0 && claim.pozeCount}
                </span>
              )}
            </button>
          </h3>
          <p className="mt-0.5 text-xs text-gray-400">
            {clientName && <span className="sm:hidden">{clientName} · </span>}
            revendicat {fmtDate(claim.claimedAt)}
            {/* Pe rândurile din „De actualizat” zilele le spune deja întrebarea. */}
            {claim.updatedDays !== null && (!ask || acted) && ` · ${updatedLabel(claim.updatedDays)}`}
          </p>
        </div>

        <div className="min-w-0">
          {clientName && (
            <p className="mb-1 hidden truncate text-sm text-gray-800 sm:block" title={clientName}>
              {clientName}
            </p>
          )}
          {claim.client && (
            <a
              href={`tel:${claim.client.telefon.replace(/\s/g, '')}`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 sm:px-2.5 sm:py-1 sm:text-xs"
            >
              <svg
                className="h-4 w-4 sm:h-3.5 sm:w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              Sună<span className="hidden sm:inline"> {claim.client.telefon}</span>
            </a>
          )}
        </div>

        {/* Două stări diferite, nu una: până la aprobare arătăm unde suntem NOI
            (apelul de confirmare), după aprobare unde e FIRMA cu clientul. */}
        <div className="min-w-0">
          {released ? (
            <span className={`${badge} bg-gray-100 text-gray-500`}>
              Renunțat · {fmtDate(claim.releasedAt)}
            </span>
          ) : !claim.approved ? (
            <span className={`${badge} bg-amber-50 text-amber-700`}>Așteaptă apelul</span>
          ) : (
            <div className={`relative ${statusBusy ? 'pointer-events-none opacity-60' : ''}`}>
              <span className="pointer-events-none absolute left-2.5 top-1/2 z-10 -translate-y-1/2">
                <StatusIcon status={status} />
              </span>
              <SearchableSelect
                name={`status-${claim.claimTimestamp}`}
                options={STATUS_OPTIONS}
                value={status}
                onValueChange={pickStatus}
                noReset
                ariaLabel="Unde ești cu clientul"
                triggerClassName="pl-8 whitespace-nowrap"
              />
            </div>
          )}
        </div>
      </div>

      {/* Sub buton, nu printre detalii: e ultima informație pe care o vrei citită
          înainte de a apăsa. */}
      {claim.client && claim.intervalApel && !released && (
        <p className="mt-1.5 text-xs font-medium text-emerald-700">
          Clientul a cerut să fie sunat: {claim.intervalApel}
        </p>
      )}

      {ask &&
        !justReleased &&
        (acted ? (
          <p className="mt-2 text-[13px] font-medium text-emerald-700">Am notat, mulțumim.</p>
        ) : (
          <p className="mt-2 text-[13px] font-medium text-amber-800">{askText(ask)}</p>
        ))}

      {!claim.client && !released && (
        <p className="mt-2 text-xs leading-relaxed text-gray-500">
          E prima ta cerere de la noi: te sunăm o dată pentru confirmare și datele clientului apar
          aici. De la a doua cerere se deblochează pe loc, fără telefon.
        </p>
      )}

      {status === 'castigat' && !released && (
        <p className="mt-2 text-xs text-emerald-700">
          Felicitări. Închidem cererea la noi, ca să nu mai fie sunat de alte firme.
        </p>
      )}
      {statusError && <p className="mt-2 text-xs text-red-600">{statusError}</p>}

      {/* Cererea s-a închis cât firma o avea în lucru: spus clar, pe rândul
          închis, cu ieșirea dintr-un click. Firma a primit și email. */}
      {claim.leadClosed && !released && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5">
          <p className="text-sm text-gray-800">
            <span className="font-semibold">Cererea s-a închis.</span> {claim.leadClosed.text} Nu mai e nevoie
            să suni.
          </p>
          <button
            type="button"
            disabled={releaseBusy}
            onClick={() => claim.leadClosed && void sendRelease(claim.leadClosed.motivId, '')}
            className="shrink-0 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 hover:border-gray-400 disabled:opacity-60"
          >
            {releaseBusy ? 'Se scoate...' : 'Scoate-o din lucru'}
          </button>
          {releaseError && !releaseOpen && <p className="w-full text-xs text-red-600">{releaseError}</p>}
        </div>
      )}

      {releaseOpen && !released && (
        <form onSubmit={release} className="mt-3 space-y-2 rounded-lg border border-border bg-surface p-3">
          <fieldset>
            <legend className="text-sm font-medium text-gray-700">De ce nu a mers această cerere?</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {RELEASE_REASONS.map((r) => {
                const picked = motivId === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    aria-pressed={picked}
                    onClick={() => {
                      setMotivId(r.id);
                      setReleaseError(null);
                    }}
                    className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      picked
                        ? 'border-primary bg-primary/10 font-medium text-gray-900'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
          {motivId && (
            <div>
              <label htmlFor={`motiv-${claim.claimTimestamp}`} className="block text-xs text-gray-600">
                {motivId === 'altul' ? 'Scrie pe scurt motivul' : 'Detalii (opțional)'}
              </label>
              <textarea
                id={`motiv-${claim.claimTimestamp}`}
                value={detalii}
                onChange={(e) => setDetalii(e.target.value)}
                required={motivId === 'altul'}
                minLength={motivId === 'altul' ? MIN_OTHER_REASON_LENGTH : undefined}
                rows={2}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              />
            </div>
          )}
          {releaseError && <p className="text-xs text-red-600">{releaseError}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={releaseBusy}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
            >
              {releaseBusy ? 'Se trimite...' : 'Renunț și eliberez locul'}
            </button>
            <Button type="button" variant="ghost" onClick={() => setReleaseOpen(false)}>
              Anulează
            </Button>
          </div>
        </form>
      )}

      {justReleased && (
        <p className="mt-2 text-sm text-emerald-700">
          Locul a fost eliberat. Mulțumim, motivul ne ajută să realocăm cererea.
        </p>
      )}

      {/* Proiectul, direct pe card (Radu, 9 nov 2026): „deschide detaliile” era
          cea mai folosită acțiune din portal, deci ce se căuta acolo (poze,
          acoperiș, specificații, mesajul clientului) nu mai cere click. */}
      {showProject && (keySpecs.length > 0 || claim.client || claim.mesaj) && (
        <div className="mt-3 space-y-2.5">
          {keySpecs.length > 0 && <SpecLine specs={keySpecs} />}
          {claim.client && (place || claim.client.hartaUrl) && (
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-gray-700">
              {place && <span>{place}</span>}
              {claim.client.hartaUrl && (
                <a
                  href={claim.client.hartaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent('portal_harta_deschisa', { sursa })}
                  className="inline-flex items-center gap-1 font-medium text-primary-dark hover:underline"
                >
                  Vezi acoperișul din satelit ↗
                </a>
              )}
            </p>
          )}
          {photos.length > 0 && claim.client && (
            <ul className="flex flex-wrap gap-1.5" aria-label={`Poze de la client (${photos.length})`}>
              {shownPhotos.map((poza) => {
                const src = `/api/portal/poza?cerere=${encodeURIComponent(
                  claim.leadId,
                )}&poza=${encodeURIComponent(poza.pathname)}`;
                return (
                  <li key={poza.pathname}>
                    <a href={src} target="_blank" rel="noopener noreferrer">
                      <img
                        src={src}
                        alt={poza.fileName || 'Poză de la client'}
                        loading="lazy"
                        className="h-16 w-16 rounded-md border border-border object-cover transition-opacity hover:opacity-80"
                      />
                    </a>
                  </li>
                );
              })}
              {morePhotos > 0 && (
                <li>
                  <button
                    type="button"
                    onClick={toggle}
                    aria-label={`Încă ${morePhotos} poze`}
                    className="flex h-16 w-16 items-center justify-center rounded-md border border-border bg-surface text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-100"
                  >
                    +{morePhotos}
                  </button>
                </li>
              )}
            </ul>
          )}
          {claim.client?.poze && (
            <p className="text-[13px]">
              <a
                href={claim.client.poze}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-dark underline hover:no-underline"
              >
                Pozele acoperișului / locației
              </a>
            </p>
          )}
          {claim.client?.pozePeEmail && (
            <p className="text-[13px] text-gray-500">Clientul a trimis poze pe email, le adăugăm aici.</p>
          )}
          {/* Trei rânduri ajung de obicei; restul, la „Toate detaliile”. */}
          {claim.mesaj && (
            <p
              className={`whitespace-pre-line break-words border-l-2 border-primary pl-2.5 text-[13px] leading-relaxed text-gray-800 ${
                open ? '' : 'line-clamp-3'
              }`}
            >
              <span className="font-medium text-amber-800">Mesajul clientului:</span> {claim.mesaj}
            </p>
          )}
        </div>
      )}

      {/* Text, nu o săgeată în colț: lângă săgeata statusului cele două se
          confundau, iar una deschide o listă, cealaltă cardul. */}
      {hasDetails && (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          className="mt-2 inline-flex items-center gap-1 rounded text-xs font-medium text-gray-500 transition-colors hover:text-gray-900"
        >
          {open ? 'Ascunde detaliile' : quiet ? 'Detalii' : 'Toate detaliile'}
          <svg
            className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}

      {open && (
        <div className="mt-2 space-y-3 border-t border-border pt-3">
          {extraSpecs.length > 0 && <SpecLine specs={extraSpecs} />}
          {claim.client?.email && (
            <p className="text-sm">
              <a href={`mailto:${claim.client.email}`} className="break-all text-primary-dark hover:underline">
                {claim.client.email}
              </a>
            </p>
          )}
          {claim.approved && !released && (
            <p className="text-xs text-gray-400">
              {CLAIM_STATUS_LABELS[status]}: {CLAIM_STATUS_HINTS[status]}
              {status === 'ofertat' && claim.offeredAt ? ` · marcat pe ${fmtDate(claim.offeredAt)}` : ''}
            </p>
          )}
          {claim.approved && !released && (
            <PortalOfferBox leadId={claim.leadId} offers={claim.offers} canSend={claim.canSendOffer} />
          )}
          {released && claim.releaseReason && (
            <div className="rounded-lg border border-border bg-surface px-4 py-3 text-sm text-gray-500">
              <span className="text-gray-400">Motivul renunțării:</span> {claim.releaseReason}
            </div>
          )}
          {/* Jurnalul de note — vizibil și pentru noi în CRM, deci ce scrii aici chiar ajută la realocare. */}
          {notes.length > 0 && (
            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                Notele tale ({notes.length})
              </div>
              <ul className="space-y-2">
                {notes.map((n, i) => (
                  <li key={`${n.date}-${i}`} className="text-sm text-gray-700">
                    <span className="mr-2 text-xs text-gray-400">
                      {n.date}
                      {n.time ? ` ${n.time}` : ''}
                    </span>
                    {n.text}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      {/* Notele noi intră primele în listă, deci prima e ultima scrisă. */}
      {notes.length > 0 && !open && !released && (
        <EllipsisLine
          label={`Nota ta${notes[0].date ? `, ${notes[0].date}` : ''}`}
          text={notes[0].text}
          onClick={toggle}
        />
      )}
      {/* Mereu la vedere, jos pe rând (Radu, 2 și 3 nov 2026): un click în plus
          înseamnă note nescrise. Butonul apare doar când ai ce trimite: pe 375px
          lângă câmp lăsa ~198px de scris, iar pe zece rânduri devenea zgomot. */}
      {!released && (
        <form onSubmit={addNote} className="mt-2.5 flex gap-2">
          <input
            type="text"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Notă: am sunat, nu răspunde, revin mâine"
            aria-label="Notă nouă"
            className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          />
          {noteText.trim() && (
            <Button type="submit" variant="outline" disabled={noteBusy}>
              {noteBusy ? '...' : 'Adaugă'}
            </Button>
          )}
        </form>
      )}
      {noteError && <p className="mt-1 text-xs text-red-600">{noteError}</p>}
    </div>
  );
}
