'use client';

import { useEffect, useRef, useState } from 'react';
import {
  JOURNAL_NOTED_EVENT,
  JOURNAL_SUBJECT_EVENT,
  subjectKey,
  type JournalEntry,
  type JournalSubject,
} from '@/lib/jurnal-shared';

function fmtTime(at: string): string {
  return new Date(at).toLocaleTimeString('ro-RO', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Bucharest',
  });
}

interface NotedDetail {
  kind: string;
  id: string;
  label: string;
  at: string;
}

function announce(detail: NotedDetail) {
  window.dispatchEvent(new CustomEvent<NotedDetail>(JOURNAL_NOTED_EVENT, { detail }));
}

/**
 * „notează” de pe un rând din agendă: alege rândul ca subiect în panoul de
 * jurnal și mută cursorul acolo. După ce nota e salvată arată ora ultimei note.
 */
export function NoteButton({ subject, notedAt }: { subject: JournalSubject; notedAt?: string }) {
  const [last, setLast] = useState(notedAt ?? '');

  useEffect(() => {
    function onNoted(e: Event) {
      const d = (e as CustomEvent<NotedDetail>).detail;
      if (subjectKey(d) === subjectKey(subject)) setLast(d.at);
    }
    window.addEventListener(JOURNAL_NOTED_EVENT, onNoted);
    return () => window.removeEventListener(JOURNAL_NOTED_EVENT, onNoted);
  }, [subject]);

  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent(JOURNAL_SUBJECT_EVENT, { detail: subject }))}
      className={`text-xs hover:underline ${last ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-900'}`}
    >
      {last ? `notat ${fmtTime(last)}` : 'notează'}
    </button>
  );
}

/**
 * Jurnalul zilei: caseta de scris și notele de azi. Pe /admin/azi e pagina
 * însăși (`main`); pe /admin/azi/liste stă pe lângă liste, mai mic.
 */
export default function JournalPanel({ initial, main = false }: { initial: JournalEntry[]; main?: boolean }) {
  const [entries, setEntries] = useState(initial);
  const [text, setText] = useState('');
  const [subject, setSubject] = useState<JournalSubject | null>(null);
  const [editing, setEditing] = useState<{ id: number; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    function onSubject(e: Event) {
      setSubject((e as CustomEvent<JournalSubject>).detail);
      setError(null);
      const el = inputRef.current;
      if (!el) return;
      el.focus({ preventScroll: true });
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    window.addEventListener(JOURNAL_SUBJECT_EVENT, onSubject);
    return () => window.removeEventListener(JOURNAL_SUBJECT_EVENT, onSubject);
  }, []);

  // Fără router.refresh(): reîncărcarea paginii ar reciti tot Sheet-ul la fiecare notă.
  async function post(body: Record<string, unknown>, key: string): Promise<{ entry?: JournalEntry } | null> {
    setBusy(key);
    setError(null);
    try {
      const res = await fetch('/api/admin/jurnal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Eroare ${res.status}`);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eroare');
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function add() {
    const t = text.trim();
    if (!t || busy) return;
    const data = await post({ create: { text: t, subject } }, 'add');
    const entry = data?.entry;
    if (!entry) return;
    setEntries((prev) => [entry, ...prev]);
    setText('');
    setSubject(null);
    if (entry.subject) announce({ ...entry.subject, at: entry.at });
  }

  async function saveEdit() {
    if (!editing || !editing.text.trim()) return;
    const data = await post({ id: editing.id, text: editing.text }, `e${editing.id}`);
    const entry = data?.entry;
    if (!entry) return;
    setEntries((prev) => prev.map((x) => (x.id === entry.id ? entry : x)));
    setEditing(null);
  }

  async function remove(e: JournalEntry) {
    if (!window.confirm('Ștergi nota?')) return;
    const data = await post({ id: e.id, delete: true }, `d${e.id}`);
    if (!data) return;
    const rest = entries.filter((x) => x.id !== e.id);
    setEntries(rest);
    if (e.subject) {
      const s = e.subject;
      const prev = rest.find((x) => x.subject && subjectKey(x.subject) === subjectKey(s));
      announce({ ...s, at: prev?.at ?? '' });
    }
  }

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      add();
    }
    if (e.key === 'Escape' && subject) setSubject(null);
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-slate-100 px-5 py-3">
        <h2 className={`font-semibold text-slate-900 ${main ? 'text-lg' : 'text-base'}`}>
          Jurnal <span className="tabular-nums text-slate-400">{entries.length}</span>
        </h2>
        <p className="text-xs text-slate-400">
          ce ai făcut, cu cine ai vorbit, ce ai de făcut; seara scot din el taskurile pe mâine și poimâine
        </p>
      </div>

      <div className="space-y-3 px-5 py-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
          className="space-y-2"
        >
          {subject && (
            <p className="flex items-center gap-2 text-xs">
              <span className="rounded bg-amber-50 px-1.5 py-0.5 font-medium text-amber-800">
                {subject.kind === 'firma' ? 'firma' : 'cererea'}: {subject.label}
              </span>
              <button
                type="button"
                onClick={() => setSubject(null)}
                aria-label="Scoate subiectul"
                className="text-slate-400 hover:text-slate-900"
              >
                ×
              </button>
            </p>
          )}
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKey}
            rows={main ? 5 : 3}
            autoFocus={main}
            placeholder={
              subject
                ? 'Ce s-a întâmplat? ex. nu răspunde, revin joi'
                : 'ex. Am sunat East Solar: interesați, le trimit joi oferta de comision. Mâine: sun clientul Teodoru.'
            }
            className={`w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2 focus:border-amber-500 focus:outline-none ${
              main ? 'text-base' : 'text-sm'
            }`}
          />
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={busy === 'add' || !text.trim()}
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-40"
            >
              Notează
            </button>
            <span className="text-[11px] text-slate-400">Enter salvează, Shift+Enter rând nou</span>
          </div>
        </form>
        {error && <p className="text-xs text-red-600">{error}</p>}

        {entries.length > 0 && (
          <ul className="divide-y divide-slate-100 border-t border-slate-100">
            {entries.map((e) => (
              <li key={e.id} className="group space-y-0.5 py-2">
                <div className="flex items-baseline gap-2 text-xs">
                  <span className="tabular-nums text-slate-400">{fmtTime(e.at)}</span>
                  {e.subject && <span className="font-medium text-slate-900">{e.subject.label}</span>}
                  <span className="ml-auto hidden gap-2 text-[11px] text-slate-400 group-hover:flex group-focus-within:flex">
                    <button
                      type="button"
                      onClick={() => setEditing({ id: e.id, text: e.text })}
                      className="hover:text-slate-900"
                    >
                      editează
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(e)}
                      disabled={busy === `d${e.id}`}
                      className="hover:text-red-600"
                    >
                      șterge
                    </button>
                  </span>
                </div>
                {editing?.id === e.id ? (
                  <div className="space-y-1">
                    <textarea
                      value={editing.text}
                      onChange={(ev) => setEditing({ id: e.id, text: ev.target.value })}
                      onKeyDown={(ev) => {
                        if (ev.key === 'Enter' && !ev.shiftKey && !ev.nativeEvent.isComposing) {
                          ev.preventDefault();
                          saveEdit();
                        }
                        if (ev.key === 'Escape') setEditing(null);
                      }}
                      rows={3}
                      autoFocus
                      className="w-full resize-y rounded-lg border border-slate-300 px-2 py-1 text-sm focus:border-amber-500 focus:outline-none"
                    />
                    <div className="flex gap-3 text-[11px]">
                      <button
                        type="button"
                        onClick={saveEdit}
                        disabled={busy === `e${e.id}`}
                        className="font-medium text-slate-900 hover:underline"
                      >
                        salvează
                      </button>
                      <button type="button" onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-900">
                        renunță
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className={`whitespace-pre-wrap text-slate-700 ${main ? 'text-[15px]' : 'text-sm'}`}>{e.text}</p>
                )}
              </li>
            ))}
          </ul>
        )}

        {entries.length === 0 && (
          <p className="text-sm text-slate-400">Nimic scris azi.</p>
        )}
      </div>
    </section>
  );
}
