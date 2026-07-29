'use client';

import { useState } from 'react';
import {
  CONTACT_STATES,
  LEAD_STATUSES,
  LEAD_STATUS_HINTS,
  LEAD_STATUS_LABELS,
  type ContactState,
  type LeadNote,
  type LeadStatus,
} from '@/lib/sheets-shared';

const TONE: Record<LeadStatus, string> = {
  noua: 'bg-slate-200 text-slate-700',
  valida: 'bg-sky-100 text-sky-800',
  ofertare: 'bg-amber-100 text-amber-800',
  castigata: 'bg-emerald-100 text-emerald-800',
  altundeva: 'bg-orange-100 text-orange-800',
  renuntat: 'bg-slate-200 text-slate-500',
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
  contacted: initialContacted,
  notes: initialNotes,
}: {
  id: string;
  status: LeadStatus;
  contacted: ContactState;
  notes: LeadNote[];
}) {
  const [status, setStatus] = useState(initialStatus);
  const [contacted, setContacted] = useState(initialContacted);
  const [notes, setNotes] = useState(initialNotes);
  const [draft, setDraft] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  async function save(payload: { status?: LeadStatus; contacted?: ContactState; note?: string }) {
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
      setContacted(body.contactedByFirm);
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

  const busy = state === 'saving';

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {LEAD_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => save({ status: s })}
            disabled={busy}
            title={LEAD_STATUS_HINTS[s]}
            className={`rounded-full px-2 py-0.5 text-[11px] font-medium transition disabled:cursor-wait ${
              status === s ? TONE[s] : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
            }`}
          >
            {LEAD_STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1">
        <span className="text-[11px] text-slate-400">contactat de firmă:</span>
        {CONTACT_STATES.map((c) => (
          <button
            key={c}
            type="button"
            // Click pe valoarea activă o scoate: revine la „încă neverificat".
            onClick={() => save({ contacted: contacted === c ? '' : c })}
            disabled={busy}
            className={`rounded px-1.5 py-0.5 text-[11px] font-semibold transition disabled:cursor-wait ${
              contacted === c
                ? c === 'da'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-red-100 text-red-800'
                : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
            }`}
          >
            {c}
          </button>
        ))}
        {!contacted && <span className="text-[11px] text-slate-300">neverificat</span>}
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
        <div className="rounded-md bg-slate-50 px-2 py-1.5">
          <ul className="space-y-1.5">
            {(expanded ? grouped : grouped.slice(0, 1)).map((g, i) => (
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
          {grouped.length > 1 && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 text-[11px] font-medium text-slate-400 hover:text-slate-700"
            >
              {expanded ? 'ascunde' : `încă ${grouped.length - 1} ${grouped.length - 1 === 1 ? 'zi' : 'zile'}`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
