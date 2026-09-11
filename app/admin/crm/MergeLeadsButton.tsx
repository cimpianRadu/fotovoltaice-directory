'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface MergeCandidate {
  id: string;
  /** Ce scrie pe card: „10 sept, 11:43". */
  when: string;
  /** Firmele cerute pe retrimitere, ca să se vadă ce se adună pe canonic. */
  firms: string[];
}

interface Props {
  /** Cererea păstrată: cea de pe cardul ăsta. */
  leadId: string;
  candidates: MergeCandidate[];
}

/**
 * Comasează retrimiterile aceleiași cereri în cererea de pe cardul ăsta.
 * Aceeași operație ca scripts/merge-leads.mjs, dar luată în fața cardului:
 * decizia „ăsta e același om" se ia uitându-te la cele două cereri, nu în
 * terminal. Nu șterge nimic — retrimiterile primesc „Ascuns" + Q, reversibil.
 */
export default function MergeLeadsButton({ leadId, candidates }: Props) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string[]>(() => candidates.map((c) => c.id));
  const [state, setState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [error, setError] = useState<string | null>(null);
  // Apare doar după un refuz pe care îl poate trece un om (revendicare pe
  // retrimitere, alt telefon): forțarea rămâne o a doua decizie, nu un click.
  const [canForce, setCanForce] = useState(false);
  const [force, setForce] = useState(false);
  const router = useRouter();

  function toggle(id: string) {
    setPicked((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function submit() {
    setState('saving');
    setError(null);
    try {
      const res = await fetch('/api/admin/leads/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leadId, duplicates: picked, force }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (body.forceable) setCanForce(true);
        throw new Error(body.error || `Eroare ${res.status}`);
      }
      setState('saved');
      setTimeout(() => {
        setOpen(false);
        setState('idle');
        setForce(false);
        setCanForce(false);
        // revalidatePath din API nu recitește pagina la client fără asta.
        router.refresh();
      }, 800);
    } catch (err) {
      setState('idle');
      setError(err instanceof Error ? err.message : 'Eroare la comasare');
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Comasează retrimiterile aceleiași cereri în asta: firmele cerute se adună aici, celelalte rânduri se ascund"
        className="mt-1 inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-800 transition hover:border-amber-300 hover:bg-amber-100"
      >
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3.5 w-3.5"
        >
          <path d="M7 3v5a4 4 0 0 0 4 4h6" />
          <path d="M7 21v-5a4 4 0 0 1 4-4h6" />
          <polyline points="14 9 17 12 14 15" />
        </svg>
        Comasează în asta
      </button>
    );
  }

  const label =
    state === 'saved'
      ? 'Comasat'
      : state === 'saving'
        ? 'Comasez…'
        : `Comasează ${picked.length} ${picked.length === 1 ? 'retrimitere' : 'retrimiteri'}`;

  return (
    <div className="mt-1 space-y-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-2">
      <p className="text-[11px] text-amber-900">
        Cererea asta rămâne, cele bifate se ascund și își mută firmele cerute aici.
      </p>
      <ul className="space-y-1">
        {candidates.map((c) => (
          <li key={c.id}>
            <label className="flex items-start gap-1.5 text-[11px] text-amber-900">
              <input
                type="checkbox"
                checked={picked.includes(c.id)}
                onChange={() => toggle(c.id)}
                className="mt-0.5 accent-amber-600"
              />
              <span>
                cererea din {c.when}
                {c.firms.length > 0 && (
                  <span className="text-amber-700"> · {c.firms.join(' · ')}</span>
                )}
              </span>
            </label>
          </li>
        ))}
      </ul>

      {canForce && (
        <label className="flex items-start gap-1.5 text-[11px] text-red-700">
          <input
            type="checkbox"
            checked={force}
            onChange={(e) => setForce(e.target.checked)}
            className="mt-0.5 accent-red-600"
          />
          <span>Forțează oricum (revendicările rămân pe rândul ascuns — mută-le de mână)</span>
        </label>
      )}

      {error && <p className="text-[11px] text-red-700">{error}</p>}

      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={submit}
          disabled={state !== 'idle' || picked.length === 0}
          className="rounded-md bg-amber-600 px-2 py-1 text-[11px] font-medium text-white transition hover:bg-amber-700 disabled:opacity-50"
        >
          {label}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
            setCanForce(false);
            setForce(false);
            setPicked(candidates.map((c) => c.id));
          }}
          className="rounded-md border border-amber-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50"
        >
          Renunț
        </button>
      </div>
    </div>
  );
}
