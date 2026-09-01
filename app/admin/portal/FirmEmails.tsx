'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

/**
 * Adresele de email ale unei firme, pe cardul ei din /admin/portal.
 *
 * De ce e aici și nu în portalul firmei: identitatea în portal e emailul, iar
 * o legătură face vizibile într-un cont datele de client ale revendicărilor
 * făcute de pe cealaltă adresă. Decizia rămâne a noastră, după ce știm că cele
 * două adrese sunt chiar ale aceleiași firme.
 *
 * Adăugarea cere doar adresa colaboratorului: contul principal e cardul pe
 * care apeși, iar numele firmei se ia de pe el.
 */
export default function FirmEmails({
  primary,
  firma,
  linked,
  suggested,
}: {
  primary: string;
  firma: string;
  linked: string[];
  /** Conturi care par ale aceleiași firme: nume identic pe revendicări sau domeniu propriu comun. */
  suggested: { email: string; reason: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [alias, setAlias] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function send(payload: Record<string, string>, key: string) {
    setBusy(key);
    setError(null);
    try {
      const res = await fetch('/api/admin/portal/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ primary, firma, ...payload }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `Eroare ${res.status}`);
      setAlias('');
      setOpen(false);
      // Cardurile se recompun pe server: adresa nouă intră în același cont, cu
      // revendicările ei cu tot.
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Eroare');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="border-b border-slate-100 px-4 py-2 text-xs text-slate-600">
      {linked.length > 0 && (
        <>
          <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
            Aceeași firmă ·{' '}
          </span>
          {linked.map((email) => (
            <span key={email} className="mr-2">
              <span className="text-slate-900">{email}</span>{' '}
              <button
                type="button"
                disabled={busy === email}
                onClick={() => send({ action: 'unlink', alias: email }, email)}
                title="Desfă legătura — adresa își recapătă contul ei, cu revendicările ei"
                className="text-slate-400 hover:text-red-600 disabled:opacity-50"
              >
                {busy === email ? '…' : '×'}
              </button>
            </span>
          ))}
          <span className="text-slate-400">— vede și revendicările lor în portal</span>
        </>
      )}

      {suggested.length > 0 && (
        <div className="mt-1.5 space-y-1">
          {suggested.map((sug) => (
            <div key={sug.email} className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-amber-700">
                Poate aceeași firmă: <span className="font-medium">{sug.email}</span> ({sug.reason})
              </span>
              <button
                type="button"
                disabled={busy === sug.email}
                onClick={() => send({ action: 'link', alias: sug.email }, sug.email)}
                className="rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-50"
              >
                {busy === sug.email ? '…' : 'leagă'}
              </button>
            </div>
          ))}
        </div>
      )}

      {open ? (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <input
            autoFocus
            value={alias}
            onChange={(e) => setAlias(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && alias.trim()) send({ action: 'link', alias }, 'add');
              if (e.key === 'Escape') setOpen(false);
            }}
            placeholder="email colaborator"
            className="min-w-0 flex-1 rounded border border-slate-200 px-2 py-1 text-xs"
          />
          <button
            type="button"
            disabled={busy === 'add' || !alias.trim()}
            onClick={() => send({ action: 'link', alias }, 'add')}
            className="rounded bg-slate-900 px-2 py-1 text-[11px] font-medium text-white disabled:opacity-50"
          >
            {busy === 'add' ? '…' : 'Leagă de cont'}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="text-[11px] text-slate-400 hover:text-slate-700"
          >
            renunț
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          title={`Revendicările făcute de pe adresa adăugată se văd în contul ${primary}`}
          className={`text-[11px] text-slate-400 hover:text-slate-900 ${linked.length > 0 ? 'ml-2' : ''}`}
        >
          + adaugă email colaborator
        </button>
      )}

      {error && <p className="mt-1 text-[11px] text-red-600">{error}</p>}
    </div>
  );
}
