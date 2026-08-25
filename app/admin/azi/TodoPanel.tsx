'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface TodoRow {
  timestamp: string;
  text: string;
  due: string;
  link: string;
}

function addDays(day: string, n: number): string {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

function fmtDay(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('ro-RO', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  });
}

export default function TodoPanel({
  due,
  upcoming,
  today,
}: {
  due: TodoRow[];
  upcoming: TodoRow[];
  today: string;
}) {
  const router = useRouter();
  const [text, setText] = useState('');
  const [date, setDate] = useState(today);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function post(body: Record<string, unknown>, key: string) {
    setBusy(key);
    setError(null);
    try {
      const res = await fetch('/api/admin/todo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Eroare ${res.status}`);
      router.refresh();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eroare');
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    const ok = await post({ create: { text: text.trim(), due: date } }, 'add');
    if (ok) setText('');
  }

  function Row({ t, showDate }: { t: TodoRow; showDate: boolean }) {
    const overdue = t.due < today;
    return (
      <li className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
        <button
          type="button"
          onClick={() => post({ id: t.timestamp, done: true }, t.timestamp)}
          disabled={busy === t.timestamp}
          aria-label="Marchează făcută"
          className="h-5 w-5 shrink-0 rounded border border-slate-300 bg-white text-xs text-transparent hover:border-emerald-500 hover:text-emerald-600 disabled:opacity-50"
        >
          ✓
        </button>
        <span className="text-sm text-slate-800">{t.text}</span>
        {t.link && (
          <a href={t.link} className="text-xs text-amber-700 hover:underline" target="_blank" rel="noreferrer">
            deschide
          </a>
        )}
        {overdue && (
          <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
            restant din {fmtDay(t.due)}
          </span>
        )}
        {showDate && !overdue && (
          <span className="text-[10px] text-slate-400">{fmtDay(t.due)}</span>
        )}
        <span className="ml-auto flex items-center gap-2 text-[11px] text-slate-400">
          <button
            type="button"
            onClick={() => post({ id: t.timestamp, due: addDays(today, 1) }, t.timestamp)}
            className="hover:text-slate-900"
          >
            mâine
          </button>
          <button
            type="button"
            onClick={() => post({ id: t.timestamp, due: addDays(today, 7) }, t.timestamp)}
            className="hover:text-slate-900"
          >
            +7 zile
          </button>
        </span>
      </li>
    );
  }

  return (
    <div className="space-y-3">
      <form onSubmit={add} className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="ex. Follow-up Voltech pe abonament"
          className="min-w-[16rem] flex-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm focus:border-amber-500 focus:outline-none"
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm focus:border-amber-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={busy === 'add' || !text.trim()}
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-40"
        >
          Adaugă
        </button>
      </form>
      {error && <p className="text-xs text-red-600">{error}</p>}

      {due.length === 0 ? (
        <p className="text-sm text-slate-400">Nimic scris de mână pentru azi.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {due.map((t) => (
            <Row key={t.timestamp} t={t} showDate={false} />
          ))}
        </ul>
      )}

      {upcoming.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-xs text-slate-500 hover:text-slate-900">
            Urmează în 7 zile ({upcoming.length})
          </summary>
          <ul className="mt-1 divide-y divide-slate-100">
            {upcoming.map((t) => (
              <Row key={t.timestamp} t={t} showDate />
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
