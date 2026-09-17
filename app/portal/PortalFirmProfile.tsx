'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

interface Profile {
  numeFirma: string;
  numeContact: string;
  telefon: string;
}

/**
 * Datele firmei din cardul contului: cu ele revendici dintr-un click pe
 * /cereri. Fără profil complet, formularul e deschis din prima, pentru că
 * altfel prima revendicare ar cere oricum aceleași trei câmpuri.
 */
export default function PortalFirmProfile({ initial, saved }: { initial: Profile; saved: boolean }) {
  const router = useRouter();
  const [profile, setProfile] = useState(initial);
  const [open, setOpen] = useState(!saved);
  const [isSaved, setIsSaved] = useState(saved);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const res = await fetch('/api/portal/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof json.error === 'string' ? json.error : 'Eroare la salvare');
      setProfile(json.profile);
      setIsSaved(true);
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eroare la salvare');
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-surface px-3 py-2.5 text-sm">
        <p className="min-w-0 text-gray-600">
          <span className="block truncate">
            {profile.numeContact} · {profile.telefon}
          </span>
          <span className="block text-xs text-gray-400">Cu datele astea revendici dintr-un click</span>
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="shrink-0 text-xs font-semibold text-primary-dark underline hover:no-underline"
        >
          Modifică
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-3 rounded-xl border border-primary/40 bg-primary/5 p-3 sm:p-4">
      <div>
        <p className="text-sm font-semibold text-gray-900">
          {isSaved ? 'Datele firmei' : 'Completează o dată datele firmei'}
        </p>
        <p className="text-xs text-gray-600">
          Le folosim la fiecare revendicare, ca să nu le mai scrii în formular.
        </p>
      </div>
      <Input label="Nume firmă" name="numeFirma" required defaultValue={profile.numeFirma} placeholder="SC Firma SRL" />
      <Input label="Persoană contact" name="numeContact" required defaultValue={profile.numeContact} placeholder="Ion Popescu" />
      <Input label="Telefon" name="telefon" type="tel" required defaultValue={profile.telefon} placeholder="0740 123 456" autoComplete="tel" />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button type="submit" variant="primary" disabled={busy} className="flex-1 sm:flex-none">
          {busy ? 'Se salvează...' : 'Salvează'}
        </Button>
        {isSaved && (
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={busy}>
            Anulează
          </Button>
        )}
      </div>
    </form>
  );
}
