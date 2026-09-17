'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { trackEvent } from '@/lib/analytics';

/**
 * Adresele de email ale firmei: un coleg adăugat vede aceleași cereri și
 * primește aceleași alerte, iar o adresă scoasă își lasă cererile la firmă.
 * Tot aici se schimbă emailul contului: adaugi adresa nouă, intri cu ea și o
 * scoți pe cea veche. Regulile sunt în lib/portal-firm-emails.ts.
 */
export default function PortalFirmEmails({
  current,
  addresses,
  max,
}: {
  /** Adresa cu care e conectat omul, care nu se poate scoate de aici. */
  current: string;
  addresses: string[];
  max: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [list, setList] = useState(addresses);
  const [newEmail, setNewEmail] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function submit(action: 'add' | 'remove', email: string) {
    setBusy(action === 'add' ? '__add' : email);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch('/api/portal/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, email }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof json.error === 'string' ? json.error : 'Eroare la salvare');
      if (Array.isArray(json.addresses)) setList(json.addresses);
      if (action === 'add') {
        setNewEmail('');
        setNotice(`Am adăugat ${email.trim().toLowerCase()} și i-am trimis un email cu cum intră.`);
      } else {
        setNotice(`Am scos ${email}. Cererile și alertele lui au rămas pe contul firmei.`);
      }
      setConfirming(null);
      trackEvent(action === 'add' ? 'portal_email_added' : 'portal_email_removed');
      // Cererile se citesc pe server: după o scoatere, cele mutate trebuie să
      // apară sub adresa ta, nu sub cea scoasă.
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eroare la salvare');
    } finally {
      setBusy(null);
    }
  }

  const others = list.filter((e) => e !== current);
  const full = list.length >= max;

  return (
    <div id="adrese" className="mb-8 scroll-mt-24 rounded-xl border border-border bg-surface p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold text-gray-900">Utilizatorii firmei</h2>
          <p className="mt-1 text-sm text-gray-600 leading-relaxed">
            Colegii adăugați aici intră cu emailul lor, văd aceleași cereri și primesc aceleași
            alerte. Ca să schimbi emailul contului, adaugă adresa nouă, intră cu ea și scoate-o pe
            cea veche.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="shrink-0 rounded-lg border border-border bg-white px-3 py-2 text-xs font-semibold text-gray-600 transition-colors hover:border-secondary/40 hover:text-secondary-dark"
        >
          {open ? 'Ascunde' : 'Schimbă'}
        </button>
      </div>

      {!open && (
        <p className="mt-3 text-sm text-gray-700">
          {others.length === 0 ? (
            <>Doar <strong>{current}</strong>.</>
          ) : (
            <>
              <strong>{current}</strong> și <strong>{others.join(', ')}</strong>
            </>
          )}
        </p>
      )}

      {open && (
        <>
          <ul className="mt-4 divide-y divide-border rounded-lg border border-border bg-white">
            {list.map((address) => {
              const isCurrent = address === current;
              return (
                <li key={address} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5">
                  <span className="min-w-0 break-all text-sm text-gray-800">
                    {address}
                    {isCurrent && <span className="ml-2 text-xs text-gray-400">(tu)</span>}
                  </span>
                  {!isCurrent &&
                    (confirming === address ? (
                      <span className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => submit('remove', address)}
                          disabled={busy !== null}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                        >
                          {busy === address ? 'Scot…' : 'Da, scoate'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirming(null)}
                          disabled={busy !== null}
                          className="text-xs text-gray-500 underline hover:no-underline"
                        >
                          renunță
                        </button>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setConfirming(address);
                          setError(null);
                          setNotice(null);
                        }}
                        disabled={busy !== null}
                        className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:border-red-300 hover:text-red-700 disabled:opacity-50"
                      >
                        Scoate
                      </button>
                    ))}
                </li>
              );
            })}
          </ul>
          {confirming && (
            <p className="mt-2 text-xs text-gray-500">
              {confirming} nu va mai vedea cererile firmei. Cererile revendicate de pe ea trec pe
              adresa ta.
            </p>
          )}

          {full ? (
            <p className="mt-4 text-xs text-gray-500">
              Contul are {max} adrese, cât se poate. Scoate una ca să adaugi alta.
            </p>
          ) : (
            <form
              className="mt-4 flex flex-col gap-2 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                if (newEmail.trim()) submit('add', newEmail);
              }}
            >
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="coleg@firma.ro"
                autoComplete="off"
                className="min-w-0 flex-1 rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-secondary focus:outline-none sm:py-2"
              />
              <button
                type="submit"
                disabled={busy !== null || !newEmail.trim()}
                className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50 sm:py-2"
              >
                {busy === '__add' ? 'Adaug…' : 'Adaugă adresa'}
              </button>
            </form>
          )}

          {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
          {notice && <p className="mt-3 text-sm text-green-700">{notice}</p>}
        </>
      )}
    </div>
  );
}
