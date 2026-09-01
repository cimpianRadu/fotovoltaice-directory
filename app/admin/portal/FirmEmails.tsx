'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

/** O adresă a firmei, cu ce atârnă de ea. */
export interface FirmEmailRow {
  email: string;
  /** Adresa care ține contul: pe ea se scriu revendicările date din admin. */
  isPrimary: boolean;
  /** Câte revendicări s-au făcut de pe adresa asta. */
  claims: number;
}

/**
 * Toate adresele de email ale unei firme, pe cardul ei din /admin/portal:
 * se văd împreună, se adaugă, se corectează și se scot de aici.
 *
 * De ce e în admin și nu în portalul firmei: o legătură face vizibile într-un
 * cont datele de client ale revendicărilor făcute de pe cealaltă adresă, deci
 * decizia rămâne a noastră, după ce știm că adresele sunt ale aceleiași firme.
 *
 * Contul principal nu se editează și nu se scoate: el e adresa cu care firma
 * intră în portal și pe care i se scriu cererile date din admin. Se corectează
 * doar adresele adăugate lângă el.
 */
export default function FirmEmails({
  firma,
  emails,
  suggested,
}: {
  firma: string;
  emails: FirmEmailRow[];
  /** Conturi care par ale aceleiași firme: nume identic pe revendicări sau domeniu propriu comun. */
  suggested: { email: string; reason: string }[];
}) {
  const router = useRouter();
  const primary = emails.find((e) => e.isPrimary)?.email ?? emails[0]?.email ?? '';
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
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
      setDraft('');
      setAdding(false);
      setEditing(null);
      // Cardurile se recompun pe server: adresa nouă intră în același cont, cu
      // revendicările ei cu tot.
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Eroare');
    } finally {
      setBusy(null);
    }
  }

  /**
   * Corectura schimbă adresa, nu revendicările: cele făcute de pe adresa veche
   * rămân ale ei și ies din contul firmei. Pe o adresă scrisă greșit (deci fără
   * revendicări) nu se pierde nimic, dar pe una cu cereri e o mutare reală.
   */
  function rename(oldEmail: string, claims: number) {
    const next = draft.trim();
    if (!next) return;
    if (
      claims &&
      !window.confirm(
        `${oldEmail} are ${claims} ${claims === 1 ? 'revendicare' : 'revendicări'}. ` +
          `Ele rămân pe adresa veche și ies din contul firmei. Corectezi oricum?`,
      )
    ) {
      return;
    }
    send({ action: 'rename', alias: oldEmail, newAlias: next }, oldEmail);
  }

  function remove(email: string, claims: number) {
    const warning = claims
      ? `Scoți ${email} de pe contul firmei? Cele ${claims} revendicări făcute de pe ea dispar din portalul firmei.`
      : `Scoți ${email} de pe contul firmei?`;
    if (window.confirm(warning)) send({ action: 'unlink', alias: email }, email);
  }

  const input =
    'min-w-0 flex-1 rounded border border-slate-200 px-2 py-1 text-xs';
  const primaryBtn =
    'rounded bg-slate-900 px-2 py-1 text-[11px] font-medium text-white disabled:opacity-50';
  const ghostBtn = 'text-[11px] text-slate-400 hover:text-slate-900';

  return (
    <div className="border-b border-slate-100 px-4 py-2 text-xs text-slate-600">
      <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
        Emailurile firmei ({emails.length})
        {emails.length > 1 && (
          <span className="normal-case tracking-normal"> · toate văd aceleași cereri în portal</span>
        )}
      </p>

      <ul className="mt-1 space-y-1">
        {emails.map((row) => (
          <li key={row.email} className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {editing === row.email ? (
              <>
                <input
                  autoFocus
                  defaultValue={row.email}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') rename(row.email, row.claims);
                    if (e.key === 'Escape') setEditing(null);
                  }}
                  className={input}
                />
                <button
                  type="button"
                  disabled={busy === row.email || !draft.trim()}
                  onClick={() => rename(row.email, row.claims)}
                  className={primaryBtn}
                >
                  {busy === row.email ? '…' : 'Salvează'}
                </button>
                <button type="button" onClick={() => setEditing(null)} className={ghostBtn}>
                  renunț
                </button>
              </>
            ) : (
              <>
                <span className="text-slate-900">{row.email}</span>
                {row.isPrimary ? (
                  <span
                    title="Adresa cu care firma intră în portal; pe ea se scriu cererile date din admin"
                    className="rounded bg-slate-200 px-1.5 py-px text-[10px] font-semibold text-slate-600"
                  >
                    cont principal
                  </span>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setDraft(row.email);
                        setEditing(row.email);
                      }}
                      className={ghostBtn}
                    >
                      editează
                    </button>
                    <button
                      type="button"
                      disabled={busy === row.email}
                      onClick={() => remove(row.email, row.claims)}
                      className="text-[11px] text-slate-400 hover:text-red-600 disabled:opacity-50"
                    >
                      {busy === row.email ? '…' : 'scoate'}
                    </button>
                  </>
                )}
                <span className="ml-auto text-[10px] text-slate-400">
                  {row.claims === 0
                    ? 'nicio revendicare'
                    : `${row.claims} ${row.claims === 1 ? 'revendicare' : 'revendicări'}`}
                </span>
              </>
            )}
          </li>
        ))}
      </ul>

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

      {adding ? (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && draft.trim()) send({ action: 'link', alias: draft }, 'add');
              if (e.key === 'Escape') setAdding(false);
            }}
            placeholder="email colaborator"
            className={input}
          />
          <button
            type="button"
            disabled={busy === 'add' || !draft.trim()}
            onClick={() => send({ action: 'link', alias: draft }, 'add')}
            className={primaryBtn}
          >
            {busy === 'add' ? '…' : 'Adaugă'}
          </button>
          <button type="button" onClick={() => setAdding(false)} className={ghostBtn}>
            renunț
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setDraft('');
            setAdding(true);
          }}
          title={`Revendicările făcute de pe adresa adăugată se văd în contul ${primary}`}
          className="mt-1 text-[11px] text-slate-400 hover:text-slate-900"
        >
          + adaugă email
        </button>
      )}

      {error && <p className="mt-1 text-[11px] text-red-600">{error}</p>}
    </div>
  );
}
