'use client';

import { useState } from 'react';
import {
  FIRM_STATUSES,
  FIRM_STATUS_HINTS,
  FIRM_STATUS_LABELS,
  type FirmStatus,
  type LeadNote,
} from '@/lib/sheets-shared';
import Band, { Caption } from '../crm/Band';
import NotesJournal, { type SaveState } from '../crm/NotesJournal';

const STATUS_TONE: Record<FirmStatus, string> = {
  de_sunat: 'bg-slate-500',
  nu_raspunde: 'bg-orange-500',
  discutii: 'bg-sky-600',
  interesat: 'bg-amber-500',
  client: 'bg-emerald-600',
  refuzat: 'bg-slate-400',
};

function todayLocal(): string {
  return new Date().toLocaleDateString('en-CA');
}

function plusDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('en-CA');
}

export default function FirmCrm({
  id,
  status: initialStatus,
  followUp: initialFollowUp,
  notes: initialNotes,
}: {
  id: string;
  status: FirmStatus;
  followUp: string;
  notes: LeadNote[];
}) {
  const [status, setStatus] = useState(initialStatus);
  const [followUp, setFollowUp] = useState(initialFollowUp);
  const [notes, setNotes] = useState(initialNotes);
  const [state, setState] = useState<SaveState>('idle');
  const [message, setMessage] = useState<string | null>(null);

  async function save(payload: {
    status?: FirmStatus;
    followUp?: string;
    note?: string;
    editNote?: { index: number; text: string; expected: string };
    deleteNote?: { index: number; expected: string };
  }) {
    setState('saving');
    setMessage(null);
    // Optimist pe selecții: cursorul trebuie să plece în clipa clickului, nu
    // după ce răspunde Sheets. Răspunsul rescrie oricum valoarea la final.
    if (payload.status) setStatus(payload.status);
    if (payload.followUp !== undefined) setFollowUp(payload.followUp);
    try {
      const res = await fetch('/api/admin/firms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...payload }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `Eroare ${res.status}`);
      setStatus(body.firm.status);
      setFollowUp(body.firm.followUp);
      setNotes(body.firm.notes);
      setState('saved');
      setTimeout(() => setState('idle'), 1500);
    } catch (e) {
      setState('error');
      setMessage(e instanceof Error ? e.message : 'Eroare');
    }
  }

  const busy = state === 'saving';
  const overdue = followUp !== '' && followUp < todayLocal();

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Caption>Stare</Caption>
        <Band
          options={FIRM_STATUSES.map((s) => ({
            value: s,
            label: FIRM_STATUS_LABELS[s],
            hint: FIRM_STATUS_HINTS[s],
          }))}
          value={status}
          tone={STATUS_TONE}
          disabled={busy}
          onPick={(s) => save({ status: s })}
        />
      </div>

      {/* Termenul de follow-up e motivul pentru care există pagina: „când
          revin la firma asta?". Scurtăturile acoperă cadențele reale de
          telefon; data liberă rămâne pentru restul. */}
      <div className="flex flex-wrap items-center gap-2">
        <Caption>Revin pe</Caption>
        <input
          type="date"
          value={followUp}
          disabled={busy}
          onChange={(e) => save({ followUp: e.target.value })}
          className={`rounded-md border px-2 py-1 text-xs tabular-nums outline-none transition focus:ring-2 focus:ring-slate-900/5 disabled:cursor-wait ${
            overdue
              ? 'border-red-300 bg-red-50 text-red-700'
              : 'border-slate-200 bg-white text-slate-700 focus:border-slate-400'
          }`}
        />
        {[
          { label: 'mâine', days: 1 },
          { label: '+3z', days: 3 },
          { label: '+7z', days: 7 },
        ].map((q) => (
          <button
            key={q.days}
            type="button"
            disabled={busy}
            onClick={() => save({ followUp: plusDays(q.days) })}
            className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-wait"
          >
            {q.label}
          </button>
        ))}
        {followUp && (
          <button
            type="button"
            disabled={busy}
            onClick={() => save({ followUp: '' })}
            className="text-[11px] text-slate-400 transition hover:text-slate-700 disabled:cursor-wait"
          >
            șterge
          </button>
        )}
      </div>

      <NotesJournal
        notes={notes}
        state={state}
        message={message}
        placeholder="Ce ați vorbit… se salvează pe ziua de azi când ieși din câmp"
        onAdd={(note) => save({ note })}
        onEdit={(editNote) => save({ editNote })}
        onDelete={(deleteNote) => save({ deleteNote })}
      />
    </div>
  );
}
