'use client';

import { useState } from 'react';
import type { Movement } from './movements';
import { fmtDateTime, MovementText } from './MovementText';

/**
 * „Istoric complet” pe cardul contului: lista vine de la
 * /api/admin/portal/istoric abia la deschidere (24 nov 2026). Pe toate
 * cardurile, istoricul trimis odată cu pagina era ~0,7 MB din ea.
 */
export default function IstoricComplet({ count, members }: { count: number; members: string[] }) {
  const [items, setItems] = useState<Movement[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (items !== null || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/portal/istoric', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ members }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `Eroare ${res.status}`);
      setItems(body.movements ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Eroare');
    } finally {
      setLoading(false);
    }
  }

  return (
    <details
      className="border-t border-slate-100 bg-slate-50 px-4 py-2"
      onToggle={(e) => {
        if ((e.currentTarget as HTMLDetailsElement).open) load();
      }}
    >
      <summary className="cursor-pointer text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
        Istoric complet ({count})
      </summary>
      {loading && <p className="mt-1.5 text-xs text-slate-500">Se încarcă…</p>}
      {error && <p className="mt-1.5 text-[10px] text-red-600">{error}</p>}
      {items && (
        <ul className="mt-1.5 max-h-60 space-y-1 overflow-y-auto">
          {items.map((m, i) => (
            <li key={`${m.at}-${i}`} className="flex gap-2 text-xs">
              <span className="w-24 shrink-0 text-[10px] tracking-wide text-slate-400 uppercase">
                {m.dayOnly ? fmtDateTime(m.at).split(',')[0] : fmtDateTime(m.at)}
              </span>
              <MovementText m={m} />
            </li>
          ))}
        </ul>
      )}
    </details>
  );
}
