'use client';

import { useState } from 'react';
import type { LeadNote } from '@/lib/sheets-shared';
import { Caption } from './Band';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

function fmtDay(iso: string): string {
  if (!iso) return 'fără dată';
  return new Date(`${iso}T00:00:00`).toLocaleDateString('ro-RO', {
    day: 'numeric',
    month: 'short',
  });
}

/**
 * Jurnalul de note, extras din LeadCrm ca să fie același și pe fișele de firmă:
 * listă derulabilă cu editare și ștergere în rând, câmp de adăugare cu
 * auto-save la blur. Starea de salvare vine de la părinte, care deține și
 * apelul de API; jurnalul ține doar starea de editare locală.
 */
export default function NotesJournal({
  notes,
  state,
  message,
  placeholder,
  onAdd,
  onEdit,
  onDelete,
}: {
  notes: LeadNote[];
  state: SaveState;
  message: string | null;
  placeholder?: string;
  onAdd: (text: string) => void;
  onEdit: (ref: { index: number; expected: string; text: string }) => void;
  onDelete: (ref: { index: number; expected: string }) => void;
}) {
  const [draft, setDraft] = useState('');
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState('');
  // Confirmarea la ștergere stă în rând, nu într-un confirm() de browser.
  const [confirmIndex, setConfirmIndex] = useState<number | null>(null);

  const busy = state === 'saving';

  // Auto-save la ieșirea din câmp: nu pe fiecare tastă, ca să nu spargem nota
  // în bucăți și să nu batem în Sheets la fiecare literă.
  // Valoarea vine din câmp, nu din state: dacă blur-ul cade în aceeași bucată de
  // execuție cu ultima tastă, state-ul e încă cel vechi și nota s-ar pierde.
  function commitDraft(value: string) {
    const note = value.trim();
    if (!note) return;
    setDraft('');
    onAdd(note);
  }

  function startEdit(index: number, text: string) {
    setEditIndex(index);
    setEditDraft(text);
    setConfirmIndex(null);
  }

  function commitEdit(index: number, expected: string, value: string) {
    setEditIndex(null);
    if (value.trim() === expected.trim()) return;
    onEdit({ index, text: value, expected });
  }

  function removeNote(index: number, expected: string) {
    setConfirmIndex(null);
    setEditIndex(null);
    onDelete({ index, expected });
  }

  // Notele vin cele noi primele, ca în celulă. Fiecare e o intrare separată,
  // cu data afișată o singură dată pe zi, ca să se vadă unde se termină una
  // și începe alta. Panoul are înălțime fixă și derulează, deci un card nu
  // crește la infinit oricâte note ar aduna.
  const days = new Set(notes.map((n) => n.date)).size;

  return (
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
            const confirming = confirmIndex === i;
            return (
              <li
                key={`${n.date}-${i}`}
                className={`group flex gap-3 px-3 py-2 transition-colors ${
                  confirming
                    ? 'bg-red-50/70'
                    : editing
                      ? 'bg-slate-50'
                      : 'hover:bg-slate-50/70'
                }`}
              >
                {/* Data o dată pe zi, ora pe fiecare notă: pill-ul pătrățos
                    face timeline-ul lizibil dintr-o privire. Notele vechi
                    n-au oră salvată, deci acolo nu apare nimic. */}
                <span className="flex w-14 shrink-0 flex-col items-start gap-1 pt-px">
                  {firstOfDay && (
                    <span className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
                      {fmtDay(n.date)}
                    </span>
                  )}
                  {n.time && (
                    <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-amber-700">
                      {n.time}
                    </span>
                  )}
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
                    <p
                      className={`min-w-0 flex-1 text-xs leading-relaxed whitespace-pre-wrap transition-colors ${
                        confirming ? 'text-slate-400 line-through' : 'text-slate-700'
                      }`}
                    >
                      {n.text}
                    </p>

                    {confirming ? (
                      // Confirmarea ia locul iconițelor, în rând: aceeași
                      // pauză de gândire ca un dialog, fără să blocheze pagina.
                      <span className="flex shrink-0 items-center gap-2 text-[10px]">
                        <span className="font-semibold tracking-wide text-red-600 uppercase">
                          Ștergi?
                        </span>
                        <button
                          type="button"
                          autoFocus
                          disabled={busy}
                          onClick={() => removeNote(i, n.text)}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') setConfirmIndex(null);
                          }}
                          className="rounded bg-red-600 px-2 py-0.5 font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-wait"
                        >
                          Șterge
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmIndex(null)}
                          className="text-slate-500 transition-colors hover:text-slate-900"
                        >
                          Renunță
                        </button>
                      </span>
                    ) : (
                      /* Vizibile mereu, doar decolorate: pe hover-only nu se
                         vede că notele se pot edita până nu dai din mouse. */
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
                          onClick={() => {
                            setConfirmIndex(i);
                            setEditIndex(null);
                          }}
                          className="rounded p-1 transition-colors hover:bg-red-100 hover:text-red-600 disabled:cursor-wait"
                        >
                          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </span>
                    )}
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
          placeholder={placeholder ?? 'Scrie o notă… se salvează pe ziua de azi când ieși din câmp'}
          className="w-full resize-y rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs leading-relaxed text-slate-700 transition outline-none placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-900/5"
        />
      </div>
    </div>
  );
}
