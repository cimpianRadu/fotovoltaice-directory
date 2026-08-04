'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import SearchableSelect from '@/components/ui/SearchableSelect';

/** Doar câmpurile de care are nevoie formul, nu toată structura Company. */
export interface DirectoryFirmOption {
  id: string;
  name: string;
  phone: string;
  city: string;
}

export default function AddFirmForm({ firms }: { firms: DirectoryFirmOption[] }) {
  const [open, setOpen] = useState(false);
  const [firmId, setFirmId] = useState('');
  const [numeFirma, setNumeFirma] = useState('');
  const [telefon, setTelefon] = useState('');
  const [state, setState] = useState<'idle' | 'saving' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const options = useMemo(
    () =>
      firms.map((f) => ({
        value: f.id,
        label: f.city ? `${f.name} · ${f.city}` : f.name,
      })),
    [firms],
  );

  function chooseFirm(id: string) {
    setFirmId(id);
    if (!id) return;
    const firm = firms.find((f) => f.id === id);
    if (!firm) return;
    setNumeFirma(firm.name);
    setTelefon(firm.phone);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState('saving');
    setError(null);
    try {
      const res = await fetch('/api/admin/firms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          create: { firmId, numeFirma: numeFirma.trim(), telefon: telefon.trim() },
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `Eroare ${res.status}`);
      setFirmId('');
      setNumeFirma('');
      setTelefon('');
      setState('idle');
      setOpen(false);
      // Fișa nouă vine din server component; fără refresh nu apare pe pagină.
      router.refresh();
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'Eroare la salvare');
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-800"
      >
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="h-3.5 w-3.5"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        Adaugă firmă
      </button>
    );
  }

  const canSubmit = numeFirma.trim() && state !== 'saving';

  return (
    <form
      onSubmit={submit}
      className="w-full max-w-md space-y-2 rounded-xl border border-slate-200 bg-white p-3"
    >
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
          Fișă nouă de firmă
        </span>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setState('idle');
            setError(null);
          }}
          className="text-[11px] text-slate-400 hover:text-slate-700"
        >
          renunță
        </button>
      </div>

      <SearchableSelect
        name="firm"
        options={options}
        value={firmId}
        onValueChange={chooseFirm}
        placeholder="Alege din director (opțional)"
      />

      <input
        type="text"
        required
        value={numeFirma}
        onChange={(e) => setNumeFirma(e.target.value)}
        placeholder="Nume firmă *"
        className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5"
      />

      <input
        type="tel"
        value={telefon}
        onChange={(e) => setTelefon(e.target.value)}
        placeholder="Telefon"
        className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5"
      />

      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-red-600">{state === 'error' && error}</span>
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-md bg-slate-900 px-3 py-1 text-[11px] font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {state === 'saving' ? 'se salvează…' : 'Adaugă'}
        </button>
      </div>
    </form>
  );
}
