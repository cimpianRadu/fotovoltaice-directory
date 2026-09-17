'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

/**
 * Butonul de dezactivare din subsolul cardului. Nu șterge nimic: firma nu mai
 * intră în portal, nu mai primește alerte și cardul iese din listele de lucru,
 * dar revendicările și jurnalul rămân, iar reactivarea readuce totul.
 */
export default function AccountStatus({
  label,
  emails,
  deactivatedAt,
}: {
  /** Numele firmei sau adresa, pentru mesajul de confirmare. */
  label: string;
  emails: string[];
  /** ISO dacă e dezactivat, altfel gol. */
  deactivatedAt: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(action: 'deactivate' | 'reactivate', note = '') {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/portal/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, emails, note }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `Eroare ${res.status}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Eroare');
    } finally {
      setBusy(false);
    }
  }

  function deactivate() {
    const addresses = emails.length > 1 ? `\n\nAdresele: ${emails.join(', ')}` : '';
    const note = window.prompt(
      `Dezactivezi contul ${label}?\n\n` +
        '• nu mai poate intra în portal (nici cu sesiunea deschisă, nici cu cod nou)\n' +
        '• nu mai primește alerte pe județ\n' +
        '• dispare din listele de aici, rămâne pe filtrul „Dezactivate"\n\n' +
        'Revendicările și istoricul NU se șterg; îl poți reactiva oricând.' +
        addresses +
        '\n\nDe ce? (opțional, apasă OK și cu câmpul gol)',
      '',
    );
    if (note === null) return;
    send('deactivate', note.trim());
  }

  function reactivate() {
    if (window.confirm(`Reactivezi contul ${label}? Poate intra din nou în portal și primește alertele.`)) {
      send('reactivate');
    }
  }

  return (
    <>
      {deactivatedAt ? (
        <button
          type="button"
          disabled={busy}
          onClick={reactivate}
          className="ml-auto rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
        >
          {busy ? '…' : 'Reactivează contul'}
        </button>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={deactivate}
          className="ml-auto flex items-center gap-1.5 rounded-lg bg-red-600 px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
            <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {busy ? '…' : 'Dezactivează contul'}
        </button>
      )}
      {error && <span className="w-full text-[11px] text-red-700">{error}</span>}
    </>
  );
}
