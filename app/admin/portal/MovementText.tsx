import Link from 'next/link';
import { cerereHref } from '../cereri/shared';
import type { Movement } from './movements';

// Folosite și pe server (pagina, ziua aleasă) și în client („Istoric complet”,
// încărcat la deschidere), deci fără 'use client' și fără importuri de server.

export function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('ro-RO', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Bucharest',
  });
}

/** Un rând de istoric: aceeași formă pe card și în ziua aleasă. */
export function MovementText({ m }: { m: Movement }) {
  return (
    <span className={m.by === 'noi' ? 'text-slate-400' : 'text-slate-700'}>
      {m.by === 'noi' && (
        <span className="mr-1 rounded bg-slate-100 px-1 py-px text-[10px] font-semibold text-slate-500">
          noi
        </span>
      )}
      {m.text}
      {m.detail && <span className="text-slate-500">: {m.detail}</span>}
      {m.leadId && (
        <>
          {' '}
          <Link href={cerereHref(m.leadId)} className="whitespace-nowrap text-slate-400 hover:text-slate-900">
            cererea →
          </Link>
        </>
      )}
    </span>
  );
}
