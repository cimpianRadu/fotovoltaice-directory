'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const EXEMPLU =
  'Unele cereri au acum precalificare făcută de mine, Watt AI: clientul confirmă invertorul, consumul și ce vrea să afle de la dumneavoastră. Ați văzut vreuna? Cum vi se pare?';

export function AnuntForm() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [stare, setStare] = useState<'idle' | 'salvez' | 'eroare'>('idle');

  async function trimite(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setStare('salvez');
    const r = await fetch('/api/admin/watt-firme', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    }).catch(() => null);
    if (!r?.ok) return setStare('eroare');
    setText('');
    setStare('idle');
    router.refresh();
  }

  return (
    <form onSubmit={trimite} className="space-y-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, 600))}
        rows={3}
        placeholder={EXEMPLU}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={stare === 'salvez' || !text.trim()}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
        >
          {stare === 'salvez' ? 'Se trimite...' : 'Trimite anunțul'}
        </button>
        {!text && (
          <button type="button" onClick={() => setText(EXEMPLU)} className="text-sm text-slate-600 underline">
            Folosește exemplul
          </button>
        )}
        {stare === 'eroare' && <span className="text-sm text-red-600">Nu s-a salvat. Încearcă din nou.</span>}
      </div>
      <p className="text-xs text-slate-500">
        Apare în bula Watt la toate firmele logate care nu l-au văzut: un punct roșu pe bulă și un balon cu începutul lui.
        Un anunț nou îl înlocuiește pe cel de acum.
      </p>
    </form>
  );
}

export function OpresteAnunt({ id }: { id: number }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await fetch('/api/admin/watt-firme', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ opreste: id }),
        }).catch(() => null);
        router.refresh();
      }}
      className="text-xs text-slate-600 underline hover:text-slate-900"
    >
      Oprește
    </button>
  );
}
