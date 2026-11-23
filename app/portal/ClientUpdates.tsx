'use client';

import { useState } from 'react';
import type { ClientUpdate, ClientUpdateTone } from '@/lib/portal-client-updates';

// „Update de la client” pe cardul din /portal (23 nov 2026). Un singur update:
// data stă în titlu. Mai multe (clientul a revenit de câteva ori): strâns, cu
// ultimul update la vedere; la click se deschide timeline-ul, cel mai nou sus,
// fiecare cu data lui. Radu: „vreau să fie collapsible”.

function fmtDay(iso: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('ro-RO', {
    timeZone: 'Europe/Bucharest',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const DOT: Record<ClientUpdateTone, string> = {
  warn: 'bg-amber-500 ring-amber-100',
  ok: 'bg-emerald-500 ring-emerald-100',
  info: 'bg-[#1e3a5f] ring-sky-100',
  won: 'bg-emerald-500 ring-emerald-100',
  lost: 'bg-red-500 ring-red-100',
};

// Culorile chenarului, după cel mai nou update.
const BOX: Record<ClientUpdateTone, { box: string; bubble: string; title: string; count: string }> = {
  info: { box: 'border-sky-200 bg-sky-50/60', bubble: 'bg-sky-100 text-[#1e3a5f]', title: 'text-[#1e3a5f]', count: 'bg-[#1e3a5f]' },
  ok: { box: 'border-sky-200 bg-sky-50/60', bubble: 'bg-sky-100 text-[#1e3a5f]', title: 'text-[#1e3a5f]', count: 'bg-[#1e3a5f]' },
  warn: { box: 'border-amber-300 bg-amber-50/70', bubble: 'bg-amber-100 text-amber-700', title: 'text-amber-900', count: 'bg-amber-500' },
  won: { box: 'border-emerald-300 bg-emerald-50/70', bubble: 'bg-emerald-100 text-emerald-700', title: 'text-emerald-900', count: 'bg-emerald-600' },
  lost: { box: 'border-red-200 bg-red-50/60', bubble: 'bg-red-100 text-red-700', title: 'text-red-900', count: 'bg-red-500' },
};

/** Bifa verde (a ales firma ta) sau X roșu (a ales altă firmă). */
function Mark({ tone, className = '' }: { tone: 'won' | 'lost'; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-white ${
        tone === 'won' ? 'bg-emerald-500' : 'bg-red-500'
      } ${className}`}
    >
      <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
        {tone === 'won' ? <path d="m5 12.5 4.5 4.5L19 7.5" /> : <path d="M7 7l10 10M17 7 7 17" />}
      </svg>
    </span>
  );
}

function isMark(tone: ClientUpdateTone): tone is 'won' | 'lost' {
  return tone === 'won' || tone === 'lost';
}

function Bubble({ className }: { className: string }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    </span>
  );
}

export default function ClientUpdates({ updates }: { updates: ClientUpdate[] }) {
  const [open, setOpen] = useState(false);
  if (!updates.length) return null;

  const top = updates[0];
  const look = BOX[top.tone];
  const single = updates.length === 1;
  const titleColor = look.title;

  return (
    <div className={`mt-3 rounded-xl border shadow-sm ${look.box}`}>
      {single ? (
        <div className="flex items-center gap-2.5 px-3.5 pt-3">
          <Bubble className={look.bubble} />
          <p className={`text-xs font-semibold ${titleColor}`}>
            Update de la client
            {top.at && <span className="font-normal text-gray-500"> · {fmtDay(top.at)}</span>}
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full cursor-pointer items-center gap-2.5 rounded-t-xl px-3.5 pt-3 text-left"
        >
          <Bubble className={look.bubble} />
          <p className={`flex min-w-0 flex-1 items-center gap-1.5 text-xs font-semibold whitespace-nowrap ${titleColor}`}>
            Update de la client
            <span
              title={`${updates.length} update-uri`}
              className={`inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white ${
                look.count
              }`}
            >
              {updates.length}
            </span>
          </p>
          <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-gray-500">
            {open ? 'Strânge' : 'Vezi toate'}
            <svg
              viewBox="0 0 24 24"
              className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </span>
        </button>
      )}

      <div className="px-3.5 pb-3">
        {single || !open ? (
          <div className="mt-1.5 pl-[38px]">
            {!single && top.at && <p className="text-[11px] font-medium text-gray-500">{fmtDay(top.at)}</p>}
            <p className="flex items-start gap-1.5 whitespace-pre-line text-sm leading-snug text-gray-800">
              {isMark(top.tone) && <Mark tone={top.tone} className="mt-0.5" />}
              <span className={isMark(top.tone) ? 'font-medium' : ''}>{top.text}</span>
            </p>
          </div>
        ) : (
          <ol className="relative mt-2.5 ml-[13px] space-y-3 border-l border-gray-200 pl-[21px]">
            {updates.map((u, i) => (
              <li key={`${u.at}-${i}`} className="relative">
                {isMark(u.tone) ? (
                  <Mark tone={u.tone} className="absolute top-0.5 -left-[29px] ring-4 ring-white/80" />
                ) : (
                  <span
                    aria-hidden="true"
                    className={`absolute top-1 -left-[26px] h-2.5 w-2.5 rounded-full ring-4 ${DOT[u.tone]}`}
                  />
                )}
                {u.at && <p className="text-[11px] font-medium text-gray-500">{fmtDay(u.at)}</p>}
                <p
                  className={`mt-0.5 whitespace-pre-line text-sm leading-snug ${
                    i === 0 ? 'text-gray-900' : 'text-gray-600'
                  }`}
                >
                  {u.text}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
