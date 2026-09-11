'use client';

import { useState } from 'react';
import type { FirmStatus, LeadNote } from '@/lib/sheets-shared';
import FirmCrm from '../firme/FirmCrm';

/** Fișa din tabul „CRM Firme", cât îi trebuie editorului. */
export interface FirmCard {
  timestamp: string;
  status: FirmStatus;
  followUp: string;
  notes: LeadNote[];
}

/**
 * Notițele de pe firmele de necesit NU au tab propriu: scriu în aceeași fișă din
 * „CRM Firme" pe care o vezi în /admin/firme. Firma e aceeași, pipelineul e
 * același — două jurnale ar însemna două istorii care se contrazic. Diferența e
 * doar că aici fișa se creează la primul apel, nu în avans: 585 de firme scanate
 * n-au ce căuta în pipeline până nu pui mâna pe telefon.
 */
export default function NecesitCrm({
  card,
  identity,
}: {
  card: FirmCard | null;
  identity: { firmId: string; numeFirma: string; telefon: string };
}) {
  const [firm, setFirm] = useState<FirmCard | null>(card);
  const [state, setState] = useState<'idle' | 'saving' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function createCard() {
    setState('saving');
    setError(null);
    try {
      const res = await fetch('/api/admin/firms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ create: identity }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `Eroare ${res.status}`);
      setFirm(body.firm as FirmCard);
      setState('idle');
    } catch (e) {
      setState('error');
      setError(e instanceof Error ? e.message : 'Eroare la salvare');
    }
  }

  if (firm) {
    return (
      <FirmCrm
        id={firm.timestamp}
        status={firm.status}
        followUp={firm.followUp}
        notes={firm.notes}
      />
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={createCard}
        disabled={state === 'saving'}
        className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-wait disabled:text-slate-400"
      >
        {state === 'saving' ? 'se creează fișa…' : '+ Am contactat — scrie o notiță'}
      </button>
      <span className="text-[11px] text-slate-400">
        {state === 'error' ? (
          <span className="text-red-600">{error}</span>
        ) : (
          'creează fișa în CRM · Instalatori'
        )}
      </span>
    </div>
  );
}
