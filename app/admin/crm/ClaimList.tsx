'use client';

import { useState } from 'react';
import {
  CLAIM_REMINDER_MAX,
  CLAIM_STALE_DAYS,
  CLAIM_STATUS_HINTS,
  CLAIM_STATUS_LABELS,
  MAX_ACTIVE_CLAIMS_PER_FIRM,
  claimHoldsFirmSlot,
  claimIdleBusinessDays,
  claimIdleCalendarDays,
  claimLastActivity,
  claimRemindersExhausted,
  isClaimStale,
  isClaimStatusUnproven,
  type ClaimSource,
  type ClaimStatus,
  type LeadNote,
} from '@/lib/sheets-shared';

export interface ClaimRow {
  timestamp: string;
  leadId: string;
  numeFirma: string;
  numeContact: string;
  telefon: string;
  contactedAt: string;
  source: ClaimSource;
  /** Email-ul de portal al firmei; gol pe revendicările de dinainte de portal. */
  email: string;
  releasedAt: string;
  releaseReason: string;
  firmNotes: LeadNote[];
  approvedAt: string;
  /** Firma a marcat din portal că a trimis oferta clientului. */
  offeredAt: string;
  /** Unde zice FIRMA că e cu clientul (setat de ea din /portal). Auto-raportat. */
  firmStatus: ClaimStatus;
  /** Câte sloturi ține firma asta ocupate, la încărcarea paginii. */
  firmActive: number;
  /** Când i-a plecat firmei ultimul reminder pe cererea asta. */
  remindedAt: string;
  /** Câte remindere au plecat. La CLAIM_REMINDER_MAX seria s-a terminat. */
  reminderCount: number;
}

const FIRM_STATUS_CHIP: Record<ClaimStatus, string> = {
  de_sunat: 'bg-slate-200 text-slate-600',
  nu_raspunde: 'bg-amber-100 text-amber-700',
  discutii: 'bg-indigo-100 text-indigo-700',
  ofertat: 'bg-sky-100 text-sky-700',
  castigat: 'bg-emerald-600 text-white',
  pierdut: 'bg-rose-100 text-rose-700',
};

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('ro-RO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Bucharest',
  });
}

function fmtDay(ymd: string): string {
  const d = new Date(ymd.includes('T') ? ymd : `${ymd}T00:00:00`);
  if (Number.isNaN(d.getTime())) return ymd;
  return d.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' });
}

function Claim({ claim }: { claim: ClaimRow }) {
  const [contactedAt, setContactedAt] = useState(claim.contactedAt);
  const [approvedAt, setApprovedAt] = useState(claim.approvedAt);
  const [state, setState] = useState<'idle' | 'saving' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  // Slotul se eliberează în clipa confirmării, deci contorul afișat trebuie să
  // se miște odată cu butonul, nu abia la următorul refresh. Regula de ocupare e
  // aceeași ca la revendicare (statusul poate să fi eliberat deja slotul), ca să
  // nu arate contorul altceva decât refuză API-ul.
  const noteCount = claim.firmNotes.length;
  const heldAtLoad = claimHoldsFirmSlot({ ...claim, noteCount });
  const heldNow = claimHoldsFirmSlot({ ...claim, contactedAt, noteCount });
  const active = claim.firmActive - (heldAtLoad ? 1 : 0) + (heldNow ? 1 : 0);
  const capped = active >= MAX_ACTIVE_CLAIMS_PER_FIRM;

  async function call(url: string, body: Record<string, unknown>, apply: (b: Record<string, string>) => void) {
    setState('saving');
    setMessage(null);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimTimestamp: claim.timestamp, leadId: claim.leadId, ...body }),
      });
      const resBody = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(resBody.error || `Eroare ${res.status}`);
      apply(resBody);
      setState('idle');
    } catch (e) {
      setState('error');
      setMessage(e instanceof Error ? e.message : 'Eroare');
    }
  }

  const toggleContacted = () =>
    call('/api/admin/claims', { contacted: !contactedAt }, (b) => setContactedAt(b.contactedAt || ''));
  const toggleApproved = () =>
    call('/api/admin/claims/approve', { approved: !approvedAt }, (b) => setApprovedAt(b.approvedAt || ''));

  // Renunțarea din portal: card gri, doar informație — nu mai e nimic de apăsat.
  if (claim.releasedAt) {
    return (
      <div className="rounded-md border border-slate-100 bg-slate-50/40 px-2 py-1.5 text-xs opacity-70">
        <div className="flex items-baseline justify-between gap-2">
          <span className="min-w-0 truncate font-medium text-slate-500 line-through">
            {claim.numeFirma}
          </span>
          <span className="shrink-0 rounded bg-slate-200 px-1 py-px text-[9px] font-semibold tracking-wide text-slate-600 uppercase">
            a renunțat · {fmtDay(claim.releasedAt)}
          </span>
        </div>
        {claim.releaseReason && (
          <div className="mt-0.5 text-slate-500 italic">„{claim.releaseReason}"</div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-md border border-slate-100 bg-slate-50/70 px-2 py-1.5 text-xs">
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex min-w-0 items-baseline gap-1.5">
          <span className="min-w-0 truncate font-medium text-slate-800">{claim.numeFirma}</span>
          {claim.source === 'manual' && (
            <span
              title="Revendicare marcată din CRM după apel telefonic (nu prin /cereri)"
              className="shrink-0 rounded bg-amber-100 px-1 py-px text-[9px] font-semibold tracking-wide text-amber-700 uppercase"
            >
              prin admin
            </span>
          )}
        </div>
        <span
          title={`Sloturi ocupate de firmă (status încă „de sunat", sau „nu răspunde" fără notă), din ${MAX_ACTIVE_CLAIMS_PER_FIRM}`}
          className={`shrink-0 text-[10px] font-semibold tabular-nums ${
            capped ? 'text-red-600' : 'text-slate-400'
          }`}
        >
          {active}/{MAX_ACTIVE_CLAIMS_PER_FIRM}
        </span>
      </div>
      <div className="text-slate-500">
        {claim.numeContact}
        {claim.telefon && (
          <>
            {' · '}
            <a href={`tel:${claim.telefon}`} className="hover:text-slate-900">
              {claim.telefon}
            </a>
          </>
        )}
      </div>
      {claim.email && (
        <div className="truncate text-slate-400" title="Emailul de portal al firmei">
          {claim.email}
        </div>
      )}
      <div className="text-slate-400">{fmtDateTime(claim.timestamp)}</div>

      {/* Statusul declarat de firmă în portal. E auto-raportat, deci semnal, nu
          adevăr — apelul de verificare cu clientul rămâne sursa. `castigat` e
          scris tare pentru că cere o acțiune de la noi: închidem cererea. */}
      <div
        title={CLAIM_STATUS_HINTS[claim.firmStatus]}
        className={`mt-1 inline-block rounded px-1.5 py-px text-[10px] font-semibold ${FIRM_STATUS_CHIP[claim.firmStatus]}`}
      >
        {CLAIM_STATUS_LABELS[claim.firmStatus].toLowerCase()}
        {claim.offeredAt ? ` · ${fmtDay(claim.offeredAt)}` : ''}
      </div>
      {claim.firmStatus === 'castigat' && (
        <div className="mt-1 text-[10px] font-medium text-emerald-700">
          Firma zice că a semnat. Verifică cu clientul, apoi treci cererea pe „Câștigată".
        </div>
      )}
      {/* Datele au plecat spre firmă, oferta nu, și nimic nu s-a mișcat de 2 zile
          LUCRĂTOARE: apel de follow-up, aflăm dacă mai e de interes sau realocăm.
          Weekendul nu se numără, dar clientul îl trăiește, deci lângă cifra de
          zile lucrătoare stă și cât așteaptă omul de fapt. */}
      {isClaimStale({ ...claim, approvedAt, offeredAt: claim.offeredAt, contactedAt }) && (
        <div
          title={`Nimic nou din ${fmtDateTime(new Date(claimLastActivity({ ...claim, approvedAt, contactedAt })).toISOString())}`}
          className="mt-1 inline-block rounded bg-red-100 px-1.5 py-px text-[10px] font-semibold text-red-700"
        >
          fără mișcare de {CLAIM_STALE_DAYS}+ zile lucrătoare, sună firma
          {approvedAt ? ` (clientul așteaptă de ${claimIdleCalendarDays(approvedAt)} zile)` : ''}
        </div>
      )}

      {/* Seria de remindere s-a terminat și tot n-a atins cererea: emailul și-a
          făcut treaba cât a putut, mai departe e apel sau realocare. */}
      {claimRemindersExhausted({ ...claim, approvedAt, noteCount, remindedAt: claim.remindedAt }) && (
        <div
          title={`${claim.reminderCount} remindere trimise, ultimul ${claim.remindedAt ? fmtDay(claim.remindedAt) : '?'}`}
          className="mt-1 inline-block rounded bg-red-600 px-1.5 py-px text-[10px] font-semibold text-white"
        >
          {CLAIM_REMINDER_MAX} remindere fără reacție, de realocat
        </div>
      )}

      {/* Statusul mutat i-a eliberat un slot, dar nu există nicio urmă că a
          vorbit cu clientul. De cele mai multe ori a sunat și n-a scris, dar
          asta e singura formă pe care ar lua-o și mutarea pastilei doar ca să se
          elibereze locuri: verific la clientul din cerere. */}
      {isClaimStatusUnproven({ ...claim, approvedAt, contactedAt, noteCount }) && (
        <div
          title="Status mutat, dar fără notă, fără ofertă și fără apel confirmat de client"
          className="mt-1 inline-block rounded bg-amber-100 px-1.5 py-px text-[10px] font-semibold text-amber-800"
        >
          status mutat fără dovadă de {claimIdleBusinessDays(approvedAt)} zile, verifică la client
        </div>
      )}

      {/* Jurnalul firmei din portal — derivat, doar afișare. */}
      {claim.firmNotes.length > 0 && (
        <div className="mt-1 space-y-0.5 border-t border-slate-100 pt-1">
          {claim.firmNotes.map((n, i) => (
            <div key={`${n.date}-${i}`} className="text-slate-500">
              <span className="mr-1 text-[10px] text-slate-400">
                {n.date ? fmtDay(n.date) : ''}
                {n.time ? ` ${n.time}` : ''}
              </span>
              {n.text}
            </div>
          ))}
        </div>
      )}

      <div className="mt-1.5 grid grid-cols-2 gap-1">
        <button
          type="button"
          onClick={toggleApproved}
          disabled={state === 'saving'}
          title={
            approvedAt
              ? 'Retrage aprobarea — datele clientului dispar din portal'
              : 'Aprobă revendicarea (după apelul cu firma) — datele clientului apar în portalul ei'
          }
          className={`rounded px-2 py-1 text-[11px] font-medium transition disabled:cursor-wait ${
            approvedAt
              ? 'bg-sky-600 text-white hover:bg-sky-700'
              : 'border border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900'
          }`}
        >
          {state === 'saving'
            ? '…'
            : approvedAt
              ? `Date în portal · ${fmtDay(approvedAt)}`
              : 'Aprobă → portal'}
        </button>
        <button
          type="button"
          onClick={toggleContacted}
          disabled={state === 'saving'}
          title={
            contactedAt
              ? 'Retrage confirmarea — locul se ocupă la loc'
              : 'Confirmă că firma a sunat clientul — eliberează un loc'
          }
          className={`rounded px-2 py-1 text-[11px] font-medium transition disabled:cursor-wait ${
            contactedAt
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'border border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900'
          }`}
        >
          {state === 'saving'
            ? 'se salvează…'
            : contactedAt
              ? `A sunat · ${fmtDay(contactedAt)}`
              : 'Marchează apelul'}
        </button>
      </div>
      {state === 'error' && <p className="mt-1 text-[10px] text-red-600">{message}</p>}
    </div>
  );
}

export default function ClaimList({ claims }: { claims: ClaimRow[] }) {
  if (claims.length === 0) {
    return <p className="text-xs text-slate-400">Nerevendicat</p>;
  }
  return (
    <div className="space-y-1.5">
      {claims.map((c) => (
        <Claim key={`${c.leadId}-${c.timestamp}`} claim={c} />
      ))}
    </div>
  );
}
