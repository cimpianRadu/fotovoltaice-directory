'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Nota platformei pentru firme (19 nov 2026): ce am aflat de la client pe
// WhatsApp sau la telefon, arătat pe cardul cererii din /portal la toate firmele
// care o țin. Textul gol o șterge.
export default function NotaFirmeForm({
  leadId,
  text,
  la,
}: {
  leadId: string;
  text: string;
  la: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(text);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/nota-platforma', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, text: value }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `Eroare ${res.status}`);
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Eroare');
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        {text ? (
          <p className="text-xs whitespace-pre-line text-slate-800">
            {text}
            {la && (
              <span className="ml-1 text-[10px] text-slate-400">
                ·{' '}
                {new Date(la).toLocaleDateString('ro-RO', {
                  timeZone: 'Europe/Bucharest',
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
            )}
          </p>
        ) : (
          <p className="text-xs text-slate-400">Nimic. Firmele văd doar cererea.</p>
        )}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-[11px] font-medium text-slate-500 underline decoration-dotted hover:text-slate-900"
        >
          {text ? 'modifică' : 'scrie o notă'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={3}
        maxLength={1000}
        autoFocus
        placeholder="ex. Am vorbit cu clientul pe 19 nov: încă așteaptă oferte și vrea ca firma să vină pe teren."
        className="w-full rounded border border-slate-300 px-2 py-1 text-xs text-slate-800 focus:border-slate-500 focus:outline-none"
      />
      <p className="text-[10px] text-slate-400">
        O văd toate firmele care țin cererea, pe cardul din portal.
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="rounded bg-slate-900 px-2 py-1 text-[11px] font-medium text-white hover:bg-slate-700 disabled:opacity-60"
        >
          {busy ? 'se salvează…' : 'Salvează'}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setValue(text);
          }}
          className="text-[11px] text-slate-500 hover:text-slate-900"
        >
          renunță
        </button>
        {error && <span className="text-[11px] text-red-600">{error}</span>}
      </div>
    </div>
  );
}
