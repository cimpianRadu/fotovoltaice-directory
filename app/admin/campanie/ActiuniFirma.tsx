'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Butoanele unei firme din /admin/campanie. Ce apare depinde de status: o firmă
// care a răspuns așteaptă decizia lui Radu (reia follow-up-urile, semnat,
// refuzat, oprește); una activă poate fi oprită sau marcată ca răspunsă.
type Actiune = 'reia' | 'oprit' | 'a_raspuns' | 'semnat' | 'refuzat';

const ETICHETE: Record<Actiune, string> = {
  reia: 'Reia follow-up-urile',
  oprit: 'Oprește',
  a_raspuns: 'A răspuns',
  semnat: 'Semnat',
  refuzat: 'Refuzat',
};

const PE_STATUS: Record<string, Actiune[]> = {
  activ: ['a_raspuns', 'oprit'],
  a_raspuns: ['semnat', 'refuzat', 'reia', 'oprit'],
  oprit: ['reia', 'semnat', 'refuzat'],
  respins: ['reia'],
  manual: ['a_raspuns', 'semnat', 'refuzat'],
  semnat: [],
  refuzat: ['reia'],
};

export default function ActiuniFirma({ id, status }: { id: number; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<Actiune | null>(null);
  const [error, setError] = useState('');

  async function run(actiune: Actiune) {
    setBusy(actiune);
    setError('');
    const res = await fetch('/api/admin/campanie', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, actiune }),
    }).catch(() => null);
    setBusy(null);
    if (!res?.ok) {
      const body = await res?.json().catch(() => null);
      setError(body?.error ?? 'Nu s-a salvat.');
      return;
    }
    router.refresh();
  }

  const actiuni = PE_STATUS[status] ?? [];
  if (!actiuni.length) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {actiuni.map((a) => (
        <button
          key={a}
          type="button"
          disabled={busy !== null}
          onClick={() => run(a)}
          className={`rounded px-2 py-1 text-[11px] font-semibold disabled:opacity-50 ${
            a === 'semnat'
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : a === 'reia'
                ? 'bg-[#1e3a5f] text-white hover:bg-[#162c48]'
                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          {busy === a ? '…' : ETICHETE[a]}
        </button>
      ))}
      {error && <span className="text-[11px] text-red-600">{error}</span>}
    </div>
  );
}
