'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';

interface ProgramAnnounceProps {
  programs: { value: string; label: string; pending: number }[];
}

// „S-a deschis programul": un singur email, o singură dată, celor care îl
// așteptau. Întâi „Arată cui ar pleca" (dry), apoi trimiterea reală; coloana AV
// din Leads oprește retrimiterea către aceiași oameni.
export default function ProgramAnnounce({ programs }: ProgramAnnounceProps) {
  const [program, setProgram] = useState(programs[0]?.value ?? '');
  const [openedOn, setOpenedOn] = useState('');
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<{ dry: boolean; recipients: string[]; failed: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(dry: boolean) {
    if (!dry && !window.confirm(`Trimit emailul de deschidere pentru ${program} la toți cei care îl așteaptă?`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/informez', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ program, openedOn, dry }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || 'Eroare');
        return;
      }
      setOut({ dry, recipients: json.recipients ?? [], failed: json.failed ?? [] });
    } catch {
      setError('Eroare de rețea');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-white p-5 space-y-3">
      <h2 className="font-semibold text-gray-900">Anunță deschiderea unui program</h2>
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="block text-xs text-gray-500 mb-1">Program</span>
          <select
            value={program}
            onChange={(e) => setProgram(e.target.value)}
            className="rounded-lg border border-border px-3 py-2 text-sm"
          >
            {programs.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label} ({p.pending} de anunțat)
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm flex-1 min-w-[220px]">
          <span className="block text-xs text-gray-500 mb-1">S-a deschis... (cum apare în email)</span>
          <input
            value={openedOn}
            onChange={(e) => setOpenedOn(e.target.value)}
            placeholder="pe 6 octombrie 2026"
            className="w-full rounded-lg border border-border px-3 py-2 text-sm"
          />
        </label>
        <Button type="button" variant="outline" size="sm" disabled={busy || !openedOn} onClick={() => void run(true)}>
          Arată cui ar pleca
        </Button>
        <Button type="button" variant="primary" size="sm" disabled={busy || !openedOn || !out?.dry} onClick={() => void run(false)}>
          Trimite
        </Button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {out && (
        <div className="text-xs text-gray-600">
          <p className="font-medium">
            {out.dry ? 'Ar pleca la' : 'A plecat la'} {out.recipients.length}
            {out.failed.length ? `, eșuate ${out.failed.length}` : ''}
          </p>
          <ul className="mt-1 list-disc pl-4">
            {out.recipients.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
