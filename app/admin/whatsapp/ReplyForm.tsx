'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Răspunsul clientului de pe WhatsApp, notat de mână (sau corectat după ce l-a
// notat rutina). Textul gol șterge răspunsul.
export default function ReplyForm({ leadId, text }: { leadId: string; text: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(text);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/whatsapp/raspuns', {
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
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[11px] font-medium text-slate-500 underline decoration-dotted hover:text-slate-900"
      >
        {text ? 'modifică' : 'notează răspunsul'}
      </button>
    );
  }

  return (
    <div className="mt-1 space-y-1">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={3}
        autoFocus
        placeholder="Ce a scris clientul, pe scurt"
        className="w-full rounded border border-slate-300 px-2 py-1 text-xs text-slate-800 focus:border-slate-500 focus:outline-none"
      />
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
