'use client';

import { useState } from 'react';
import {
  CLAIM_STALE_DAYS,
  MAX_ACTIVE_CLAIMS_PER_FIRM,
  claimLastActivity,
  isClaimStale,
  type ClaimSource,
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
  /** Câte cereri ține firma asta fără apel confirmat, la încărcarea paginii. */
  firmActive: number;
}

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
  // se miște odată cu butonul, nu abia la următorul refresh.
  const active = claim.firmActive - (contactedAt ? 1 : 0) + (claim.contactedAt ? 1 : 0);
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
          title={`Cereri ținute fără apel confirmat, din ${MAX_ACTIVE_CLAIMS_PER_FIRM} posibile`}
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

      {claim.offeredAt && (
        <div className="mt-1 inline-block rounded bg-sky-100 px-1.5 py-px text-[10px] font-semibold text-sky-700">
          ofertă trimisă · {fmtDay(claim.offeredAt)}
        </div>
      )}
      {/* Datele au plecat spre firmă, oferta nu, și nimic nu s-a mișcat de 2 zile:
          apel de follow-up, aflăm dacă mai e de interes sau realocăm cererea. */}
      {isClaimStale({ ...claim, approvedAt, offeredAt: claim.offeredAt, contactedAt })
        && (
          <div
            title={`Nimic nou din ${fmtDateTime(new Date(claimLastActivity({ ...claim, approvedAt, contactedAt })).toISOString())}`}
            className="mt-1 inline-block rounded bg-red-100 px-1.5 py-px text-[10px] font-semibold text-red-700"
          >
            fără mișcare de {CLAIM_STALE_DAYS}+ zile, sună firma
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
