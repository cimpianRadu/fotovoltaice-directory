'use client';

import { useState } from 'react';
import { LEAD_STATUSES, type LeadNote, type LeadStatus } from '@/lib/sheets-shared';

const TONE: Record<LeadStatus, string> = {
  nou: 'bg-slate-100 text-slate-600',
  sunat: 'bg-sky-100 text-sky-800',
  hot: 'bg-red-100 text-red-800',
  cold: 'bg-slate-200 text-slate-500',
  contract: 'bg-emerald-100 text-emerald-800',
};

function fmtDay(iso: string): string {
  if (!iso) return '';
  return new Date(`${iso}T00:00:00`).toLocaleDateString('ro-RO', {
    day: 'numeric',
    month: 'short',
  });
}

export default function LeadCrm({
  id,
  status: initialStatus,
  notes: initialNotes,
}: {
  id: string;
  status: LeadStatus;
  notes: LeadNote[];
}) {
  const [status, setStatus] = useState(initialStatus);
  const [notes, setNotes] = useState(initialNotes);
  const [draft, setDraft] = useState('');
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  async function save(payload: { status?: LeadStatus; note?: string }) {
    setState('saving');
    setMessage(null);
    try {
      const res = await fetch('/api/admin/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...payload }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `Eroare ${res.status}`);
      setStatus(body.crmStatus);
      setNotes(body.notes);
      setState('saved');
      setTimeout(() => setState('idle'), 1500);
    } catch (e) {
      setState('error');
      setMessage(e instanceof Error ? e.message : 'Eroare');
    }
  }

  // Auto-save la ieșirea din câmp: nu pe fiecare tastă, ca să nu spargem nota
  // în bucăți și să nu batem în Sheets la fiecare literă.
  // Valoarea vine din câmp, nu din state: dacă blur-ul cade în aceeași bucată de
  // execuție cu ultima tastă, state-ul e încă cel vechi și nota s-ar pierde.
  function commitDraft(value: string) {
    const note = value.trim();
    if (!note) return;
    setDraft('');
    save({ note });
  }

  const grouped: { date: string; texts: string[] }[] = [];
  for (const n of notes) {
    const last = grouped[grouped.length - 1];
    if (last && last.date === n.date) last.texts.push(n.text);
    else grouped.push({ date: n.date, texts: [n.text] });
  }

  return (
    <div className="min-w-[200px] space-y-2">
      <div className="flex flex-wrap gap-1">
        {LEAD_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => save({ status: s })}
            disabled={state === 'saving'}
            className={`rounded-full px-2 py-0.5 text-[11px] font-medium transition disabled:cursor-wait ${
              status === s ? TONE[s] : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={(e) => commitDraft(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) e.currentTarget.blur();
        }}
        rows={2}
        placeholder="Notă… (se salvează când ieși din câmp)"
        className="w-full rounded border border-slate-200 px-2 py-1 text-xs text-slate-700 outline-none focus:border-slate-400"
      />

      {state === 'saving' && <p className="text-[11px] text-slate-400">se salvează…</p>}
      {state === 'saved' && <p className="text-[11px] text-emerald-600">salvat</p>}
      {state === 'error' && <p className="text-[11px] text-red-600">{message}</p>}

      {grouped.length > 0 && (
        <ul className="space-y-1.5">
          {grouped.map((g, i) => (
            <li key={`${g.date}-${i}`} className="text-[11px]">
              <div className="font-medium text-slate-400">{fmtDay(g.date) || 'fără dată'}</div>
              {g.texts.map((t, j) => (
                <p key={j} className="whitespace-pre-wrap text-slate-600">
                  {t}
                </p>
              ))}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
