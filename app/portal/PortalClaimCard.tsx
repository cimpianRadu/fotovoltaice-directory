'use client';

// Pozele clientului sunt private: le servește /api/portal/poza după ce verifică
// sesiunea, deci n-au URL public pe care next/image să-l poată optimiza.
/* eslint-disable @next/next/no-img-element */

import { useRef, useState } from 'react';
import PortalOfferBox from './PortalOfferBox';
import RezumatFirma from '@/components/asistent/RezumatFirma';
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

/** Pe card, în cele trei casete. Restul specificațiilor stau la „Toate detaliile”. */
const FACT_LABELS = new Set(['Putere', 'Buget', 'Termen']);

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
  const spec = (label: string) => claim.specs.find((s) => s.label === label)?.value || '';
  // Ce caută firma dintr-o privire (Radu, 12 nov 2026): cine, unde, telefonul,
  // statusul, apoi puterea, bugetul și termenul. Restul e la „Toate detaliile”.
  const facts = [
    { label: 'Putere', value: spec('Putere') },
    { label: 'Buget', value: spec('Buget') },
    { label: 'Termen', value: spec('Termen') },
  ];
  const extraSpecs = claim.specs.filter((s) => !FACT_LABELS.has(s.label));
  // Închisă de client: firma a primit email și revendicarea iese singură din
  // lucru. Cardul o spune, fără butoane de apăsat.
  const closedFinal = Boolean(claim.leadClosed?.final);
  const done = released || closedFinal;
  const photos = claim.client?.pozeUrcate ?? [];
  const photoCount = photos.length || claim.pozeCount;
  const place = claim.client ? claim.client.adresa || claim.client.localitate : claim.judet;
  const hasDetails =
    extraSpecs.length > 0 ||
    claim.client !== null ||
    claim.approved ||
    notes.length > 0 ||
    Boolean(claim.mesaj) ||
    (released && Boolean(claim.releaseReason));
  const pill = 'flex w-full items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium';

  return (
    <div className={`px-4 py-4 sm:px-5 ${done ? 'opacity-75' : ''}`}>
      {/* Cine și unde sus. Statusul stă în dreapta sus pe laptop, iar pe telefon
          coboară lângă butonul de apel, ca adresa să aibă tot rândul. */}
      <div className="grid grid-cols-[minmax(0,1fr)_10rem] items-center gap-x-3 gap-y-3 sm:grid-cols-[minmax(0,1fr)_12rem] sm:items-start">
        <div className="col-span-2 min-w-0 sm:col-span-1 sm:col-start-1 sm:row-start-1">
          <h3 className="text-base font-semibold leading-snug text-gray-900">
            {clientName || <span className="font-medium text-gray-500">Datele clientului, după confirmare</span>}
          </h3>
          {place && (
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-gray-600">
              <span className="inline-flex min-w-0 items-start gap-1">
                <svg
                  viewBox="0 0 24 24"
                  className="mt-0.5 h-4 w-4 shrink-0 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 21s-7-6.1-7-11.5a7 7 0 0 1 14 0C19 14.9 12 21 12 21z" />
                  <circle cx="12" cy="9.5" r="2.5" />
                </svg>
                <span>{place}</span>
              </span>
              {claim.client?.hartaUrl && (
                <a
                  href={claim.client.hartaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackEvent('portal_harta_deschisa', { sursa })}
                  className="font-medium text-primary-dark hover:underline"
                >
                  Satelit ↗
                </a>
              )}
            </p>
          )}
        </div>

        {/* Până la aprobare arătăm unde suntem NOI (apelul de confirmare), după
            aprobare unde e FIRMA cu clientul. */}
        <div className="col-start-2 row-start-2 sm:row-start-1">
          {closedFinal ? (
            <span className={`${pill} border-gray-200 bg-gray-50 text-gray-600`}>Închisă de client</span>
          ) : released ? (
            <span className={`${pill} border-gray-200 bg-gray-50 text-gray-500`}>
              Renunțat · {fmtDate(claim.releasedAt)}
            </span>
          ) : !claim.approved ? (
            <span className={`${pill} border-amber-200 bg-amber-50 text-amber-800`}>Așteaptă apelul</span>
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

        {claim.client && !done && (
          <div className="col-start-1 row-start-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            <a
              href={`tel:${claim.client.telefon.replace(/\s/g, '')}`}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d={PHONE_PATH} />
              </svg>
              {claim.client.telefon}
            </a>
            {claim.intervalApel && (
              <span className="text-xs text-gray-500">Preferă să fie sunat: {claim.intervalApel}</span>
            )}
          </div>
        )}
      </div>

      {/* Puterea, bugetul și termenul: trei casete egale, citite dintr-o privire. */}
      <dl className="mt-3 grid grid-cols-3 divide-x divide-border overflow-hidden rounded-lg border border-border bg-surface">
        {facts.map((f) => (
          <div key={f.label} className="min-w-0 px-3 py-2">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{f.label}</dt>
            <dd className="mt-0.5 text-sm font-semibold leading-snug text-gray-900">{f.value || '–'}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-2.5 text-xs text-gray-500">
        {claim.tipLabel}
        {claim.client ? ` · ${claim.judet}` : ''} · revendicat {fmtDate(claim.claimedAt)}
        {claim.updatedDays !== null && !done && (!ask || acted) && ` · ${updatedLabel(claim.updatedDays)}`}
      </p>

      {/* Pozele și mesajul stau la „Toate detaliile”; pe cardul strâns, doar
          semnul că există, cu numărul de poze (Radu, 12 nov 2026). */}
      {/* Plus pastila „Precalificare” (Watt AI, pilot 12 nov 2026), în același
          rând și cu aceeași formă. Rândul se ascunde singur când e gol: pastila
          vine din client și lipsește pe cererile fără sesiune. */}
      <div className="mt-2 flex flex-wrap gap-2 empty:hidden">
          {claim.cuPoze && (
            <button
              type="button"
              onClick={toggle}
              title={claim.client ? 'Vezi pozele' : 'Pozele le vezi după confirmare'}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-white px-2.5 py-1 text-xs font-medium text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-50"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5 text-gray-500"
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
              {photoCount > 0 ? (photoCount === 1 ? '1 poză' : `${photoCount} poze`) : 'Poze'}
            </button>
          )}
          {claim.mesaj && (
            <button
              type="button"
              onClick={toggle}
              title="Vezi mesajul clientului"
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-white px-2.5 py-1 text-xs font-medium text-gray-700 transition-colors hover:border-gray-400 hover:bg-gray-50"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5 text-gray-500"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              Mesaj
            </button>
          )}
          <RezumatFirma leadId={claim.leadId} sursa="portal" />
        </div>

      {closedFinal && claim.leadClosed && (
        <p className="mt-2 text-sm text-gray-600">
          {claim.leadClosed.text} Am scos-o din lucru, nu mai e nevoie să suni.
        </p>
      )}
      {claim.leadClosed && !claim.leadClosed.final && !released && (
        <p className="mt-2 text-sm text-gray-600">{claim.leadClosed.text}</p>
      )}

      {ask && !done && !justReleased && (
        <p className={`mt-2 text-[13px] font-medium ${acted ? 'text-emerald-700' : 'text-amber-800'}`}>
          {acted ? 'Am notat, mulțumim.' : askText(ask)}
        </p>
      )}

      {!claim.client && !done && (
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

      {/* Notele noi intră primele în listă, deci prima e ultima scrisă. */}
      {notes.length > 0 && !open && !done && (
        <EllipsisLine
          label={`Nota ta${notes[0].date ? `, ${notes[0].date}` : ''}`}
          text={notes[0].text}
          onClick={toggle}
        />
      )}

      {/* Mereu la vedere pe cererile în lucru (Radu, 2 și 3 nov 2026): un click
          în plus înseamnă note nescrise. */}
      {!done && (
        <form onSubmit={addNote} className="mt-3 flex gap-2">
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

      {hasDetails && (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          className="mt-2.5 inline-flex cursor-pointer items-center gap-1 rounded text-xs font-medium text-gray-500 transition-colors hover:text-gray-900"
        >
          {open ? 'Ascunde detaliile' : 'Toate detaliile'}
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
          {photos.length > 0 && claim.client && (
            <ul className="flex flex-wrap gap-2" aria-label={`Poze de la client (${photos.length})`}>
              {photos.map((poza) => {
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
                        className="h-24 w-24 rounded-lg border border-border object-cover transition-opacity hover:opacity-80"
                      />
                    </a>
                  </li>
                );
              })}
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
          {claim.cuPoze && !claim.client && (
            <p className="text-[13px] text-gray-500">Pozele de la client le vezi după confirmare.</p>
          )}
          {claim.mesaj && (
            <p className="whitespace-pre-line break-words text-sm leading-relaxed text-gray-800">
              <span className="text-gray-400">Mesajul clientului:</span> {claim.mesaj}
            </p>
          )}
          {extraSpecs.length > 0 && <SpecLine specs={extraSpecs} />}
          {claim.client?.email && (
            <p className="text-sm">
              <a href={`mailto:${claim.client.email}`} className="break-all text-primary-dark hover:underline">
                {claim.client.email}
              </a>
            </p>
          )}
          {done && claim.client && (
            <p className="text-sm text-gray-600">Telefon: {claim.client.telefon}</p>
          )}
          {claim.approved && !done && (
            <p className="text-xs text-gray-400">
              {CLAIM_STATUS_LABELS[status]}: {CLAIM_STATUS_HINTS[status]}
              {status === 'ofertat' && claim.offeredAt ? ` · marcat pe ${fmtDate(claim.offeredAt)}` : ''}
            </p>
          )}
          {claim.approved && !done && (
            <PortalOfferBox leadId={claim.leadId} offers={claim.offers} canSend={claim.canSendOffer} />
          )}
          {released && claim.releaseReason && (
            <div className="rounded-lg border border-border bg-surface px-4 py-3 text-sm text-gray-500">
              <span className="text-gray-400">Motivul:</span> {claim.releaseReason}
            </div>
          )}
          {/* Jurnalul de note, vizibil și pentru noi în CRM. */}
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
    </div>
  );
}
