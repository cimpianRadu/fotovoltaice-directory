'use client';

import { useState } from 'react';
import type { JournalTask } from '@/lib/jurnal-shared';

function addDays(day: string, n: number): string {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

function fmtDay(day: string, withWeekday = true): string {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('ro-RO', {
    ...(withWeekday ? { weekday: 'long' as const } : {}),
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}

/**
 * Taskurile pe zile: azi (cu restantele), mâine, poimâine, mai târziu. Le scrii
 * aici sau le scoate digestul de seară din jurnal. Bifate azi, rămân tăiate
 * până mâine, ca să se vadă ce ai făcut.
 */
export default function TasksPanel({ today, initial }: { today: string; initial: JournalTask[] }) {
  const tomorrow = addDays(today, 1);
  const dayAfter = addDays(today, 2);
  const [tasks, setTasks] = useState(initial);
  const [text, setText] = useState('');
  const [due, setDue] = useState(today);
  const [editing, setEditing] = useState<{ id: number; text: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function post(body: Record<string, unknown>, key: string): Promise<{ task?: JournalTask } | null> {
    setBusy(key);
    setError(null);
    try {
      const res = await fetch('/api/admin/jurnal/task', {
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

  function put(task: JournalTask) {
    setTasks((prev) =>
      prev
        .map((t) => (t.id === task.id ? task : t))
        .sort((a, b) => a.due.localeCompare(b.due) || a.id - b.id),
    );
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    const data = await post({ create: { text: t, due } }, 'add');
    const task = data?.task;
    if (!task) return;
    setTasks((prev) => [...prev, task].sort((a, b) => a.due.localeCompare(b.due) || a.id - b.id));
    setText('');
  }

  async function change(t: JournalTask, body: Record<string, unknown>) {
    const data = await post({ id: t.id, ...body }, `t${t.id}`);
    if (data?.task) put(data.task);
  }

  async function saveEdit() {
    if (!editing || !editing.text.trim()) return;
    const t = tasks.find((x) => x.id === editing.id);
    if (!t) return;
    await change(t, { text: editing.text });
    setEditing(null);
  }

  async function remove(t: JournalTask) {
    if (!window.confirm('Ștergi taskul?')) return;
    const data = await post({ id: t.id, delete: true }, `t${t.id}`);
    if (data) setTasks((prev) => prev.filter((x) => x.id !== t.id));
  }

  const groups: { key: string; title: string; items: JournalTask[] }[] = [
    { key: 'azi', title: 'Azi', items: tasks.filter((t) => t.due <= today) },
    { key: 'maine', title: `Mâine, ${fmtDay(tomorrow)}`, items: tasks.filter((t) => t.due === tomorrow) },
    { key: 'poimaine', title: `Poimâine, ${fmtDay(dayAfter)}`, items: tasks.filter((t) => t.due === dayAfter) },
  ];
  const later = tasks.filter((t) => t.due > dayAfter);
  const openToday = groups[0].items.filter((t) => !t.doneAt).length;

  // Funcție, nu componentă: o componentă definită aici s-ar remonta la fiecare
  // tastă și câmpul de editare ar pierde focusul.
  function renderRow(t: JournalTask, showDay = false) {
    const done = Boolean(t.doneAt);
    const overdue = !done && t.due < today;
    return (
      <li key={t.id} className="group flex items-start gap-2 py-1.5">
        <button
          type="button"
          onClick={() => change(t, { done: !done })}
          disabled={busy === `t${t.id}`}
          aria-label={done ? 'Debifează' : 'Bifează'}
          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] disabled:opacity-50 ${
            done
              ? 'border-emerald-500 bg-emerald-500 text-white'
              : 'border-slate-300 bg-white text-transparent hover:border-emerald-500 hover:text-emerald-600'
          }`}
        >
          ✓
        </button>
        <div className="min-w-0 flex-1">
          {editing?.id === t.id ? (
            <input
              value={editing.text}
              onChange={(e) => setEditing({ id: t.id, text: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEdit();
                if (e.key === 'Escape') setEditing(null);
              }}
              onBlur={saveEdit}
              autoFocus
              className="w-full rounded border border-slate-300 px-1.5 py-0.5 text-sm focus:border-amber-500 focus:outline-none"
            />
          ) : (
            <p className={`text-sm ${done ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{t.text}</p>
          )}
          <p className="flex flex-wrap gap-x-2 text-[11px] text-slate-400">
            {overdue && <span className="font-medium text-amber-700">din {fmtDay(t.due, false)}</span>}
            {showDay && <span>{fmtDay(t.due)}</span>}
            {t.source === 'digest' && t.sourceDay && <span>din digestul de {fmtDay(t.sourceDay)}</span>}
            {!done && (
              <span className="hidden gap-2 group-hover:flex group-focus-within:flex">
                {t.due <= today && (
                  <button type="button" onClick={() => change(t, { due: tomorrow })} className="hover:text-slate-900">
                    mută pe mâine
                  </button>
                )}
                <button type="button" onClick={() => setEditing({ id: t.id, text: t.text })} className="hover:text-slate-900">
                  editează
                </button>
                <button type="button" onClick={() => remove(t)} className="hover:text-red-600">
                  șterge
                </button>
              </span>
            )}
          </p>
        </div>
      </li>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-slate-100 px-5 py-3">
        <h2 className="text-lg font-semibold text-slate-900">
          De făcut <span className="tabular-nums text-slate-400">{openToday}</span>
        </h2>
        <p className="text-xs text-slate-400">azi; digestul de seară le pune pe zilele următoare</p>
      </div>

      <div className="space-y-3 px-5 py-3">
        {groups.map((g) => (
          <div key={g.key}>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{g.title}</h3>
            {g.items.length === 0 ? (
              <p className="py-1 text-sm text-slate-300">nimic</p>
            ) : (
              <ul>
                {g.items.map((t) => renderRow(t))}
              </ul>
            )}
          </div>
        ))}

        {later.length > 0 && (
          <details>
            <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-900">
              Mai târziu ({later.length})
            </summary>
            <ul>
              {later.map((t) => renderRow(t, true))}
            </ul>
          </details>
        )}

        <form onSubmit={add} className="space-y-2 border-t border-slate-100 pt-3">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Task nou, ex. trimit oferta de comision la Hoiura"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm focus:border-amber-500 focus:outline-none"
          />
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {[
              { day: today, label: 'azi' },
              { day: tomorrow, label: 'mâine' },
              { day: dayAfter, label: 'poimâine' },
            ].map((o) => (
              <button
                key={o.label}
                type="button"
                onClick={() => setDue(o.day)}
                className={`rounded-full border px-2.5 py-1 ${
                  due === o.day ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-300 text-slate-600 hover:border-slate-500'
                }`}
              >
                {o.label}
              </button>
            ))}
            <input
              type="date"
              value={due}
              min={today}
              onChange={(e) => e.target.value && setDue(e.target.value)}
              aria-label="Altă zi"
              className="rounded-lg border border-slate-300 bg-white px-2 py-0.5 text-xs focus:border-amber-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={busy === 'add' || !text.trim()}
              className="ml-auto rounded-lg bg-slate-900 px-3 py-1 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-40"
            >
              Adaugă
            </button>
          </div>
        </form>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    </section>
  );
}
