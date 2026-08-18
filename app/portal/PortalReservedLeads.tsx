'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trackEvent } from '@/lib/analytics';

export interface ReservedLead {
  id: string;
  tipLabel: string;
  judet: string;
  segment: string;
  specs: { label: string; value: string }[];
  mesaj: string;
  /** ISO — până când e numai a firmei. */
  until: string;
}

/** „azi 14:20" / „mâine 09:05" — cât mai are de gândit, nu o dată de calendar. */
function untilLabel(iso: string): string {
  const until = new Date(iso);
  if (Number.isNaN(until.getTime())) return '';
  const hours = Math.max(0, Math.round((until.getTime() - Date.now()) / 3_600_000));
  const clock = until.toLocaleString('ro-RO', {
    timeZone: 'Europe/Bucharest',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${clock} (${hours} ${hours === 1 ? 'oră' : 'ore'})`;
}

/**
 * Cererile rezervate abonamentului firmei: nu sunt pe /cereri și nu le poate lua
 * nimeni altcineva până expiră fereastra. Locul lor e aici, pentru că feedul e
 * public și static, iar portalul știe cine se uită.
 */
export default function PortalReservedLeads({ leads }: { leads: ReservedLead[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [taken, setTaken] = useState<string[]>([]);

  async function take(id: string) {
    setBusy(id);
    setError(null);
    try {
      const res = await fetch('/api/portal/claims/take', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: id }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof json.error === 'string' ? json.error : 'Eroare la preluare');
      setTaken((t) => [...t, id]);
      trackEvent('portal_reserved_taken');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eroare la preluare');
    } finally {
      setBusy(null);
    }
  }

  const pending = leads.filter((l) => !taken.includes(l.id));
  if (!pending.length) return null;

  return (
    <div className="mb-8 rounded-xl border border-amber-300 bg-amber-50/60 p-5 sm:p-6">
      <h2 className="font-semibold text-gray-900">
        Rezervate pentru tine {pending.length > 1 && <span className="text-gray-500">({pending.length})</span>}
      </h2>
      <p className="mt-1 text-sm text-gray-700 leading-relaxed">
        Cereri din județele abonamentului tău. Nu sunt pe pagina publică și nu le poate lua nicio
        altă firmă până expiră rezervarea.
      </p>

      <div className="mt-4 space-y-3">
        {pending.map((lead) => (
          <div key={lead.id} className="rounded-lg border border-border bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold text-gray-900">
                {lead.tipLabel} · {lead.judet}
              </h3>
              <span className="text-xs text-amber-700">a ta până {untilLabel(lead.until)}</span>
            </div>

            {lead.specs.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {lead.specs.map((s) => (
                  <li
                    key={s.label}
                    className="rounded-md border border-border bg-surface px-2 py-0.5 text-[11px] text-gray-600"
                  >
                    <span className="text-gray-400">{s.label}:</span> {s.value}
                  </li>
                ))}
              </ul>
            )}

            {lead.mesaj && (
              <p className="mt-2 text-sm text-gray-500 italic leading-relaxed">„{lead.mesaj}”</p>
            )}

            <button
              type="button"
              onClick={() => take(lead.id)}
              disabled={busy === lead.id}
              className="mt-3 w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:py-2"
            >
              {busy === lead.id ? 'Preiau…' : 'Preiau cererea'}
            </button>
          </div>
        ))}
      </div>

      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      <p className="mt-3 text-xs text-gray-500 leading-relaxed">
        După preluare, datele clientului se deblochează ca la orice revendicare, după apelul nostru
        de confirmare.
      </p>
    </div>
  );
}
