'use client';

import { useState } from 'react';
import type { FirmMatch } from '@/lib/lead-match';
import type { NecesitMatch } from '@/lib/necesit-match';
import { MatchList, NecesitList } from './MatchLists';

/**
 * „Pe cine sun?” pentru o cerere: potrivirile se calculează la apăsare, prin
 * /api/admin/potriviri, nu la încărcarea paginii (24 nov 2026).
 */
export default function Potriviri({
  leadId,
  judet,
  segment,
}: {
  leadId: string;
  judet: string;
  segment: string;
}) {
  const [data, setData] = useState<{ matches: FirmMatch[]; necesit: NecesitMatch[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/potriviri?lead=${encodeURIComponent(leadId)}`);
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `Eroare ${res.status}`);
      setData({ matches: body.matches ?? [], necesit: body.necesit ?? [] });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Eroare');
    } finally {
      setLoading(false);
    }
  }

  if (data) {
    return (
      <>
        <MatchList matches={data.matches} lead={{ judet, segment }} />
        <NecesitList matches={data.necesit} />
      </>
    );
  }

  return (
    <div className="border-t border-slate-100 px-4 py-2">
      <button
        type="button"
        onClick={load}
        disabled={loading}
        className="rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-wait disabled:opacity-60"
      >
        {loading ? 'Se calculează…' : 'Pe cine sun? Potriviri din director și necesit'}
      </button>
      {error && <p className="mt-1 text-[10px] text-red-600">{error}</p>}
    </div>
  );
}
