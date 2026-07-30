'use client';

import { useState } from 'react';
import {
  LEAD_STATUSES,
  LEAD_STATUS_HINTS,
  LEAD_STATUS_LABELS,
  type ContactState,
  type LeadNote,
  type LeadStatus,
} from '@/lib/sheets-shared';

const STATUS_TONE: Record<LeadStatus, string> = {
  noua: 'bg-slate-500',
  valida: 'bg-sky-600',
  ofertare: 'bg-amber-500',
  castigata: 'bg-emerald-600',
  altundeva: 'bg-orange-600',
  renuntat: 'bg-slate-400',
};

const CONTACT_TONE: Record<string, string> = {
  da: 'bg-emerald-600',
  nu: 'bg-red-500',
  '': 'bg-slate-400',
};

const CONTACT_OPTIONS: { value: ContactState; label: string; hint: string }[] = [
  { value: '', label: 'Neverificat', hint: 'încă nu l-am întrebat pe client' },
  { value: 'da', label: 'Da', hint: 'l-a sunat cel puțin o firmă' },
  { value: 'nu', label: 'Nu', hint: 'nu l-a căutat nimeni' },
];

function fmtDay(iso: string): string {
  if (!iso) return 'fără dată';
  return new Date(`${iso}T00:00:00`).toLocaleDateString('ro-RO', {
    day: 'numeric',
    month: 'short',
  });
}

function Caption({ children }: { children: React.ReactNode }) {
  return (
    <span className="shrink-0 text-[10px] font-semibold tracking-wider whitespace-nowrap text-slate-400 uppercase">
      {children}
    </span>
  );
}

/**
 * Bandă de selecție cu un cursor care alunecă între poziții, ca acul unui radio.
 * Segmentele sunt egale ca lățime (grid), ca poziția cursorului să fie o simplă
 * regulă de trei și tranziția să nu depindă de lungimea etichetelor.
 */
function Band<T extends string>({
  options,
  value,
  tone,
  disabled,
  onPick,
}: {
  options: { value: T; label: string; hint?: string }[];
  value: T;
  tone: Record<string, string>;
  disabled?: boolean;
  onPick: (v: T) => void;
}) {
  const idx = options.findIndex((o) => o.value === value);
  const pct = 100 / options.length;

  return (
    <div
      className="relative grid rounded-full border border-slate-200 bg-slate-100 p-0.5"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {/* Gradațiile dintre segmente, ca reperele de pe scala unui radio. */}
      <div aria-hidden className="pointer-events-none absolute inset-y-2 left-0 w-full">
        {options.slice(1).map((o, i) => (
          <span
            key={o.value}
            className="absolute inset-y-0 w-px bg-slate-300/70"
            style={{ left: `${(i + 1) * pct}%` }}
          />
        ))}
      </div>

      {idx >= 0 && (
        <span
          aria-hidden
          className={`absolute top-0.5 bottom-0.5 rounded-full shadow-sm transition-[left,background-color] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${tone[value] ?? 'bg-slate-400'}`}
          style={{ left: `calc(${idx * pct}% + 2px)`, width: `calc(${pct}% - 4px)` }}
        />
      )}

      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          title={o.hint}
          disabled={disabled}
          onClick={() => onPick(o.value)}
          className={`relative z-10 truncate rounded-full px-1 py-1 text-[11px] font-medium transition-colors duration-200 disabled:cursor-wait ${
            o.value === value ? 'text-white' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
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
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  async function save(payload: {
    status?: LeadStatus;
    contacted?: ContactState;
    note?: string;
    editNote?: { index: number; text: string; expected: string };
    deleteNote?: { index: number; expected: string };
  }) {
    setState('saving');
    setMessage(null);
    // Optimist pe selecții: cursorul trebuie să plece în clipa clickului, nu
    // după ce răspunde Sheets. Răspunsul rescrie oricum valoarea la final.
    if (payload.status) setStatus(payload.status);
    if (payload.contacted !== undefined) setContacted(payload.contacted);
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

  function startEdit(index: number, text: string) {
    setEditIndex(index);
    setEditDraft(text);
    setMessage(null);
  }

  function commitEdit(index: number, expected: string, value: string) {
    setEditIndex(null);
    if (value.trim() === expected.trim()) return;
    save({ editNote: { index, text: value, expected } });
  }

  function removeNote(index: number, expected: string) {
    const preview = expected.length > 60 ? `${expected.slice(0, 60)}…` : expected;
    if (!confirm(`Ștergi nota?\n\n${preview}`)) return;
    setEditIndex(null);
    save({ deleteNote: { index, expected } });
  }

  // Notele vin cele noi primele, ca în celulă. Fiecare e o intrare separată,
  // cu data afișată o singură dată pe zi, ca să se vadă unde se termină una
  // și începe alta. Panoul are înălțime fixă și derulează, deci un card nu
  // crește la infinit oricâte note ar aduna.
  const days = new Set(notes.map((n) => n.date)).size;

  const busy = state === 'saving';

  return (
    <div className="space-y-3">
      {/* Banda de stare ține toată lățimea: cu șase trepte, orice coloană
          alăturată i-ar tăia etichetele („În ofertare" e cea mai lungă). */}
      <div className="space-y-1">
        <Caption>Stare</Caption>
        <Band
          options={LEAD_STATUSES.map((s) => ({
            value: s,
            label: LEAD_STATUS_LABELS[s],
            hint: LEAD_STATUS_HINTS[s],
          }))}
          value={status}
          tone={STATUS_TONE}
          disabled={busy}
          onPick={(s) => save({ status: s })}
        />
      </div>

      <div className="flex items-center gap-3">
        <Caption>Contactat de firmă</Caption>
        <div className="w-full max-w-60">
          <Band
            options={CONTACT_OPTIONS}
            value={contacted}
            tone={CONTACT_TONE}
            disabled={busy}
            onPick={(c) => save({ contacted: c })}
          />
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-3 py-1.5">
          <Caption>Note</Caption>
          <span className="text-[10px] text-slate-400">
            {state === 'saving' && 'se salvează…'}
            {state === 'saved' && <span className="text-emerald-600">salvat</span>}
            {state === 'error' && <span className="text-red-600">{message}</span>}
            {state === 'idle' &&
              notes.length > 0 &&
              `${notes.length} ${notes.length === 1 ? 'notă' : 'note'} · ${days} ${
                days === 1 ? 'zi' : 'zile'
              }`}
          </span>
        </div>

        {/* Lista derulează ca să nu crească cardul la infinit, dar în editare
            se lărgește: altfel butoanele de salvare cad sub margine. */}
        {notes.length > 0 && (
          <ul
            className={`divide-y divide-slate-100 overflow-y-auto ${
              editIndex === null ? 'max-h-44' : 'max-h-80'
            }`}
          >
            {notes.map((n, i) => {
              const firstOfDay = i === 0 || notes[i - 1].date !== n.date;
              const editing = editIndex === i;
              return (
                <li
                  key={`${n.date}-${i}`}
                  className={`group flex gap-3 px-3 py-2 transition-colors ${
                    editing ? 'bg-slate-50' : 'hover:bg-slate-50/70'
                  }`}
                >
                  <span className="w-14 shrink-0 pt-px text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
                    {firstOfDay ? fmtDay(n.date) : ''}
                  </span>

                  {editing ? (
                    <div className="min-w-0 flex-1 space-y-1">
                      <textarea
                        autoFocus
                        value={editDraft}
                        onChange={(e) => setEditDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') setEditIndex(null);
                          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                            commitEdit(i, n.text, e.currentTarget.value);
                          }
                        }}
                        rows={Math.min(editDraft.split('\n').length + 1, 6)}
                        className="w-full resize-y rounded-md border border-slate-300 bg-white px-2 py-1 text-xs leading-relaxed text-slate-700 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5"
                      />
                      <div className="flex items-center gap-2 text-[10px]">
                        <button
                          type="button"
                          onClick={() => commitEdit(i, n.text, editDraft)}
                          className="rounded bg-slate-900 px-2 py-0.5 font-medium text-white hover:bg-slate-700"
                        >
                          Salvează
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditIndex(null)}
                          className="text-slate-500 hover:text-slate-900"
                        >
                          Renunță
                        </button>
                        <span className="text-slate-400">golește textul ca s-o ștergi</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="min-w-0 flex-1 text-xs leading-relaxed whitespace-pre-wrap text-slate-700">
                        {n.text}
                      </p>
                      {/* Vizibile mereu, doar decolorate: pe hover-only nu se
                          vede că notele se pot edita până nu dai din mouse. */}
                      <span className="flex shrink-0 items-start gap-1 text-slate-300 transition-colors group-hover:text-slate-400">
                        <button
                          type="button"
                          title="Editează nota"
                          disabled={busy}
                          onClick={() => startEdit(i, n.text)}
                          className="rounded p-1 transition-colors hover:bg-slate-200 hover:text-slate-700 disabled:cursor-wait"
                        >
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          title="Șterge nota"
                          disabled={busy}
                          onClick={() => removeNote(i, n.text)}
                          className="rounded p-1 transition-colors hover:bg-red-100 hover:text-red-600 disabled:cursor-wait"
                        >
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </span>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <div className="border-t border-slate-100 p-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={(e) => commitDraft(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) e.currentTarget.blur();
            }}
            rows={2}
            placeholder="Scrie o notă… se salvează pe ziua de azi când ieși din câmp"
            className="w-full resize-y rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs leading-relaxed text-slate-700 transition outline-none placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-900/5"
          />
        </div>
      </div>
    </div>
  );
}
