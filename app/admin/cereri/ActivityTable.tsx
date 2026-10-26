'use client';

import Link from 'next/link';
import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import type { CerereActivitate } from './timeline';
import TimelineList from './TimelineList';
import { cerereHref, fmtDateTime } from './shared';

// Click pe un rând din tabel deschide istoricul cererii într-un modal: cine ce
// a făcut și ce note a lăsat. Linkurile din rând merg ca înainte (titlul duce
// tot la fișă). Istoricul se citește la primul click și se ține cât stai pe
// pagină: fiecare citire costă trei lecturi din Sheets, cu cota comună cu prod.

type Result =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ok'; data: CerereActivitate };

export default function ActivityTable({ children }: { children: React.ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, Result>>({});
  const [showEmails, setShowEmails] = useState(false);

  function open(id: string) {
    setOpenId(id);
    const known = results[id]?.status;
    if (known === 'ok' || known === 'loading') return;
    setResults((r) => ({ ...r, [id]: { status: 'loading' } }));
    fetch(`/api/admin/cereri/activitate?id=${encodeURIComponent(id)}`)
      .then(async (res) => {
        const body = await res.json().catch(() => null);
        if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
        return body as CerereActivitate;
      })
      .then(
        (data) => setResults((r) => ({ ...r, [id]: { status: 'ok', data } })),
        (err: unknown) =>
          setResults((r) => ({
            ...r,
            [id]: { status: 'error', message: err instanceof Error ? err.message : String(err) },
          })),
      );
  }

  function onClick(e: React.MouseEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement;
    if (target.closest('a, button, input, select, textarea, label, dialog')) return;
    // Text selectat cu mouse-ul (un telefon, un nume): nu e click pe rând.
    if (window.getSelection()?.toString()) return;
    const id = target.closest<HTMLElement>('tr[data-cerere]')?.dataset.cerere;
    if (id) open(id);
  }

  const result = openId ? results[openId] : undefined;
  const data = result?.status === 'ok' ? result.data : null;

  return (
    <div onClick={onClick}>
      {children}
      <Modal
        open={openId !== null}
        onClose={() => setOpenId(null)}
        title={data ? `${data.hot ? '🔥 ' : ''}${data.title}` : 'Istoricul cererii'}
        width="max-w-2xl"
      >
        {result?.status === 'loading' && <p className="py-6 text-center text-sm text-slate-400">Se încarcă…</p>}
        {result?.status === 'error' && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            Nu am putut încărca istoricul: {result.message}
          </p>
        )}
        {data && openId && (
          <Activity
            key={openId}
            data={data}
            id={openId}
            showEmails={showEmails}
            onToggleEmails={() => setShowEmails((v) => !v)}
          />
        )}
      </Modal>
    </div>
  );
}

/** Unele mesaje au o pagină de specificații: trei rânduri, restul la cerere. */
function ClientMessage({ text }: { text: string }) {
  const [full, setFull] = useState(false);
  const long = text.length > 240 || text.split('\n').length > 3;
  return (
    <div>
      <div className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
        Mesajul clientului din formular
      </div>
      {/* Tăietura pe un element fără padding: altfel al patrulea rând se vede pe jumătate. */}
      <div className="mt-1 rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-1.5">
        <p className={`text-xs whitespace-pre-line text-slate-700 ${long && !full ? 'line-clamp-3' : ''}`}>{text}</p>
      </div>
      {long && (
        <button
          type="button"
          onClick={() => setFull((v) => !v)}
          className="mt-0.5 text-[11px] text-slate-500 hover:text-slate-900"
        >
          {full ? 'arată mai puțin' : 'arată tot mesajul'}
        </button>
      )}
    </div>
  );
}

function Activity({
  data,
  id,
  showEmails,
  onToggleEmails,
}: {
  data: CerereActivitate;
  id: string;
  showEmails: boolean;
  onToggleEmails: () => void;
}) {
  // Emailurile automate (alerte, remindere, confirmări) sunt cele mai multe
  // rânduri și nu le-a „făcut” nimeni: ascunse până le ceri.
  const emails = data.timeline.filter((t) => t.kind === 'email').length;
  const items = showEmails ? data.timeline : data.timeline.filter((t) => t.kind !== 'email');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs">
        <p className="text-slate-500">
          {[data.place, data.contact].filter(Boolean).join(' · ')} · intrată {fmtDateTime(data.enteredAt)}
        </p>
        <Link href={cerereHref(id)} className="font-medium whitespace-nowrap text-slate-700 hover:text-slate-900">
          Deschide fișa →
        </Link>
      </div>

      {data.dbError && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Baza Neon nu a răspuns, deci lipsesc schimbările de stare, emailurile și vizitele: {data.dbError}
        </p>
      )}

      {data.mesaj && <ClientMessage text={data.mesaj} />}

      <div className="flex flex-wrap items-baseline justify-between gap-2 border-t border-slate-100 pt-3">
        <span className="text-xs text-slate-400">
          {items.length} {items.length === 1 ? 'moment' : 'momente'}
        </span>
        {emails > 0 && (
          <button type="button" onClick={onToggleEmails} className="text-xs text-slate-500 hover:text-slate-900">
            {showEmails ? 'Ascunde emailurile automate' : `Arată și emailurile automate (${emails})`}
          </button>
        )}
      </div>

      <TimelineList items={items} />
    </div>
  );
}
