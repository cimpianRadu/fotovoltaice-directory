'use client';

import { useState } from 'react';

// Ieșirea din cont și ștergerea datelor, discret, sub lista de cereri.

export default function AccountActions({ verified }: { verified: boolean }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function logout() {
    setBusy(true);
    await fetch('/api/cont/iesire', { method: 'POST' }).catch(() => {});
    window.location.assign('/');
  }

  async function remove() {
    if (!window.confirm('Ștergem contul și datele dumneavoastră de pe platformă? Vă confirmăm pe email când am terminat.')) return;
    setBusy(true);
    setMsg(null);
    const res = await fetch('/api/cont/sterge', { method: 'POST' }).catch(() => null);
    const json = res ? await res.json().catch(() => ({})) : {};
    if (res?.ok) {
      setMsg('Am primit cererea de ștergere. Vă confirmăm pe email în cel mult 30 de zile.');
      setTimeout(() => window.location.assign('/'), 4000);
    } else {
      setMsg(typeof json.error === 'string' ? json.error : 'A apărut o eroare. Scrieți-ne la contact@instalatori-fotovoltaice.ro.');
      setBusy(false);
    }
  }

  return (
    <div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-xs text-gray-500">
      <button type="button" onClick={() => void logout()} disabled={busy} className="underline hover:text-gray-900">
        Ieșiți din cont
      </button>
      {verified && (
        <button type="button" onClick={() => void remove()} disabled={busy} className="underline hover:text-red-700">
          Ștergeți contul și datele mele
        </button>
      )}
      {msg && <p className="w-full text-center text-sm text-gray-700">{msg}</p>}
    </div>
  );
}
