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

// Iconițe inline: patru forme de 12px, cât să se vadă ce face butonul fără să
// aducem o librărie de icons pentru ele.
function IconPencil() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
      <path d="M12 20h9" strokeLinecap="round" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" strokeLinejoin="round" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
      <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function IconLink() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
      <path
        d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1-1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
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
          'Ele rămân pe adresa veche și ies din contul firmei. Corectezi oricum?',
      )
    ) {
      return;
    }
    send({ action: 'rename', alias: oldEmail, newAlias: next }, oldEmail);
  }

  function remove(email: string, claims: number) {
    const warning = claims
      ? `Scoți ${email} de pe contul firmei? Cele ${claims} ${
          claims === 1 ? 'revendicare făcută' : 'revendicări făcute'
        } de pe ea dispar din portalul firmei.`
      : `Scoți ${email} de pe contul firmei?`;
    if (window.confirm(warning)) send({ action: 'unlink', alias: email }, email);
  }

  const inputClass =
    'min-w-0 flex-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100';
  const saveClass =
    'rounded-lg bg-sky-600 px-2.5 py-1.5 text-[11px] font-semibold text-white transition hover:bg-sky-700 disabled:opacity-50';
  const cancelClass =
    'rounded-lg px-2 py-1.5 text-[11px] font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700';

  return (
    <div className="border-b border-slate-100 bg-slate-50/60 px-4 py-3">
      <div className="flex items-baseline gap-2">
        <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
          Emailurile firmei
        </p>
        <span className="rounded-full bg-slate-100 px-1.5 text-[10px] font-bold text-slate-500 tabular-nums">
          {emails.length}
        </span>
        {emails.length > 1 && (
          <span className="text-[10px] text-slate-400">văd aceleași cereri în portal</span>
        )}
      </div>

      <ul className="mt-2 space-y-1.5">
        {emails.map((row) => (
          <li
            key={row.email}
            className="group flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 transition hover:border-slate-300"
          >
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
                  className={inputClass}
                />
                <button
                  type="button"
                  disabled={busy === row.email || !draft.trim()}
                  onClick={() => rename(row.email, row.claims)}
                  className={saveClass}
                >
                  {busy === row.email ? '…' : 'Salvează'}
                </button>
                <button type="button" onClick={() => setEditing(null)} className={cancelClass}>
                  renunț
                </button>
              </>
            ) : (
              <>
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold uppercase ${
                    row.isPrimary ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {row.email.slice(0, 1)}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-slate-900">{row.email}</p>
                  <p className="text-[10px] text-slate-400">
                    {row.claims === 0
                      ? 'nicio revendicare'
                      : `${row.claims} ${row.claims === 1 ? 'revendicare' : 'revendicări'}`}
                    {row.isPrimary && ' · intră în portal cu adresa asta'}
                  </p>
                </div>

                {row.isPrimary ? (
                  <span
                    title="Adresa cu care firma intră în portal; pe ea se scriu cererile date din admin"
                    className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-200 ring-inset"
                  >
                    cont principal
                  </span>
                ) : (
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      title="Corectează adresa"
                      onClick={() => {
                        setAdding(false);
                        setDraft(row.email);
                        setEditing(row.email);
                      }}
                      className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
                    >
                      <IconPencil />
                      editează
                    </button>
                    <button
                      type="button"
                      title="Scoate adresa de pe contul firmei"
                      disabled={busy === row.email}
                      onClick={() => remove(row.email, row.claims)}
                      className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                    >
                      <IconTrash />
                      {busy === row.email ? '…' : 'scoate'}
                    </button>
                  </div>
                )}
              </>
            )}
          </li>
        ))}
      </ul>

      {suggested.map((sug) => (
        <div
          key={sug.email}
          className="mt-1.5 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5"
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <IconLink />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-amber-900">{sug.email}</p>
            <p className="truncate text-[10px] text-amber-700">Poate aceeași firmă · {sug.reason}</p>
          </div>
          <button
            type="button"
            disabled={busy === sug.email}
            onClick={() => send({ action: 'link', alias: sug.email }, sug.email)}
            className="shrink-0 rounded-lg bg-amber-500 px-2.5 py-1.5 text-[11px] font-semibold text-white transition hover:bg-amber-600 disabled:opacity-50"
          >
            {busy === sug.email ? '…' : 'Leagă'}
          </button>
        </div>
      ))}

      {adding ? (
        <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-sky-200 bg-sky-50/60 px-2.5 py-1.5">
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && draft.trim()) send({ action: 'link', alias: draft }, 'add');
              if (e.key === 'Escape') setAdding(false);
            }}
            placeholder="email@firma.ro"
            className={inputClass}
          />
          <button
            type="button"
            disabled={busy === 'add' || !draft.trim()}
            onClick={() => send({ action: 'link', alias: draft }, 'add')}
            className={saveClass}
          >
            {busy === 'add' ? '…' : 'Adaugă'}
          </button>
          <button type="button" onClick={() => setAdding(false)} className={cancelClass}>
            renunț
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            // Un singur formular deschis: `draft` e comun, iar două câmpuri
            // deschise ar arăta aceeași valoare în amândouă.
            setEditing(null);
            setDraft('');
            setAdding(true);
          }}
          title={`Revendicările făcute de pe adresa adăugată se văd în contul ${primary}`}
          className="mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 bg-white/70 px-2.5 py-2 text-[11px] font-semibold text-slate-500 transition hover:border-sky-400 hover:bg-sky-50 hover:text-sky-700"
        >
          <IconPlus />
          adaugă email colaborator
        </button>
      )}

      {error && (
        <p className="mt-1.5 rounded-lg bg-red-50 px-2.5 py-1.5 text-[11px] text-red-700">{error}</p>
      )}
    </div>
  );
}
