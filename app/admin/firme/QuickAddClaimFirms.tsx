'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface ClaimFirmSuggestion {
  numeFirma: string;
  telefon: string;
  /** Câte revendicări are firma în total — motivul pentru care merită fișă. */
  claims: number;
}

/**
 * Firmele care au revendicat cereri dar n-au încă fișă în CRM. Astea sunt
 * exact firmele care au ridicat mâna, deci primele de sunat: un click le
 * aduce în pipeline cu numele și telefonul din revendicare.
 */
export default function QuickAddClaimFirms({ firms }: { firms: ClaimFirmSuggestion[] }) {
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (firms.length === 0) return null;

  async function add(firm: ClaimFirmSuggestion) {
    setSaving(firm.numeFirma);
    setError(null);
    try {
      const res = await fetch('/api/admin/firms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ create: { numeFirma: firm.numeFirma, telefon: firm.telefon } }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `Eroare ${res.status}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eroare la salvare');
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3">
      <p className="text-[10px] font-semibold tracking-wider text-amber-700 uppercase">
        Au revendicat cereri, fără fișă în CRM
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {firms.map((f) => (
          <button
            key={f.numeFirma}
            type="button"
            disabled={saving !== null}
            onClick={() => add(f)}
            title={`${f.claims} ${f.claims === 1 ? 'revendicare' : 'revendicări'} · un click creează fișa`}
            className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 transition hover:border-amber-400 hover:bg-amber-100 disabled:cursor-wait disabled:opacity-60"
          >
            <span aria-hidden className="text-amber-600">+</span>
            {saving === f.numeFirma ? 'se adaugă…' : f.numeFirma}
            <span className="rounded-full bg-amber-100 px-1.5 text-[10px] font-semibold tabular-nums text-amber-700">
              {f.claims}
            </span>
          </button>
        ))}
      </div>
      {error && <p className="mt-1.5 text-[11px] text-red-600">{error}</p>}
    </div>
  );
}
