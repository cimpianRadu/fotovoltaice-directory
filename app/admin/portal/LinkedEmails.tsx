'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

/** O legătură activă, așa cum o vede pagina: două adrese ale aceleiași firme. */
export interface EmailLinkRow {
  primary: string;
  alias: string;
  firma: string;
}

/**
 * Emailurile legate pe aceeași firmă în portal.
 *
 * De ce există: identitatea în portal e adresa de email, iar firmele revendică
 * de pe adresa omului care a văzut cererea și intră apoi cu adresa de contact.
 * Fără legătură, contul logat nu vede revendicarea colegului și crede că
 * portalul e gol. Legarea o facem noi, nu firma: cine leagă o adresă îi dă
 * acces la datele de client ale celeilalte.
 */
export default function LinkedEmails({ links }: { links: EmailLinkRow[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [primary, setPrimary] = useState('');
  const [alias, setAlias] = useState('');
  const [firma, setFirma] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function send(payload: Record<string, string>, key: string) {
    setBusy(key);
    setError(null);
    try {
      const res = await fetch('/api/admin/portal/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `Eroare ${res.status}`);
      if (payload.action !== 'unlink') {
        setPrimary('');
        setAlias('');
        setFirma('');
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Eroare');
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="mb-6 rounded-xl border border-slate-200 bg-white">
      <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div>
          <h2 className="font-semibold text-slate-900">Emailuri legate</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Aceeași firmă, mai multe adrese: intră cu oricare și vede toate revendicările
            grupului.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          {open ? 'Ascunde' : 'Leagă două adrese'}
        </button>
      </header>

      {links.length > 0 && (
        <ul className="divide-y divide-slate-100">
          {links.map((l) => (
            <li
              key={`${l.primary}|${l.alias}`}
              className="flex flex-wrap items-center gap-x-2 gap-y-1 px-4 py-2 text-xs"
            >
              <span className="font-medium text-slate-900">{l.primary}</span>
              <span className="text-slate-400">+</span>
              <span className="font-medium text-slate-900">{l.alias}</span>
              {l.firma && <span className="text-slate-500">· {l.firma}</span>}
              <button
                type="button"
                disabled={busy === `${l.primary}|${l.alias}`}
                onClick={() =>
                  send(
                    { action: 'unlink', primary: l.primary, alias: l.alias },
                    `${l.primary}|${l.alias}`,
                  )
                }
                className="ml-auto text-slate-400 hover:text-red-600 disabled:opacity-50"
              >
                {busy === `${l.primary}|${l.alias}` ? 'se rupe…' : 'rupe legătura'}
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <div className="border-t border-slate-100 px-4 py-3">
          <div className="grid gap-2 sm:grid-cols-3">
            <input
              value={primary}
              onChange={(e) => setPrimary(e.target.value)}
              placeholder="cont principal (cu care intră)"
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs"
            />
            <input
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              placeholder="a doua adresă"
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs"
            />
            <input
              value={firma}
              onChange={(e) => setFirma(e.target.value)}
              placeholder="firma (opțional)"
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs"
            />
          </div>
          <button
            type="button"
            disabled={busy === 'add' || !primary.trim() || !alias.trim()}
            onClick={() => send({ action: 'link', primary, alias, firma }, 'add')}
            className="mt-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            {busy === 'add' ? 'se leagă…' : 'Leagă adresele'}
          </button>
        </div>
      )}

      {error && <p className="px-4 pb-3 text-xs text-red-600">{error}</p>}
    </section>
  );
}
