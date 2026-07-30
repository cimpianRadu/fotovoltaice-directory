'use client';

import { useState } from 'react';
import { MAX_ACTIVE_CLAIMS_PER_FIRM, type ClaimSource } from '@/lib/sheets-shared';

export interface ClaimRow {
  timestamp: string;
  leadId: string;
  numeFirma: string;
  numeContact: string;
  telefon: string;
  contactedAt: string;
  source: ClaimSource;
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
  const d = new Date(`${ymd}T00:00:00`);
  if (Number.isNaN(d.getTime())) return ymd;
  return d.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' });
}

function Claim({ claim }: { claim: ClaimRow }) {
  const [contactedAt, setContactedAt] = useState(claim.contactedAt);
  const [state, setState] = useState<'idle' | 'saving' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  // Slotul se eliberează în clipa confirmării, deci contorul afișat trebuie să
  // se miște odată cu butonul, nu abia la următorul refresh.
  const active = claim.firmActive - (contactedAt ? 1 : 0) + (claim.contactedAt ? 1 : 0);
  const capped = active >= MAX_ACTIVE_CLAIMS_PER_FIRM;

  async function toggle() {
    const next = !contactedAt;
    setState('saving');
    setMessage(null);
    try {
      const res = await fetch('/api/admin/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimTimestamp: claim.timestamp,
          leadId: claim.leadId,
          contacted: next,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `Eroare ${res.status}`);
      setContactedAt(body.contactedAt || '');
      setState('idle');
    } catch (e) {
      setState('error');
      setMessage(e instanceof Error ? e.message : 'Eroare');
    }
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
      <div className="text-slate-400">{fmtDateTime(claim.timestamp)}</div>

      <button
        type="button"
        onClick={toggle}
        disabled={state === 'saving'}
        title={
          contactedAt
            ? 'Retrage confirmarea — locul se ocupă la loc'
            : 'Confirmă că firma a sunat clientul — eliberează un loc'
        }
        className={`mt-1.5 w-full rounded px-2 py-1 text-[11px] font-medium transition disabled:cursor-wait ${
          contactedAt
            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
            : 'border border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900'
        }`}
      >
        {state === 'saving'
          ? 'se salvează…'
          : contactedAt
            ? `A sunat clientul · ${fmtDay(contactedAt)}`
            : 'Marchează apelul'}
      </button>
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
