import Link from 'next/link';
import type { NewLead } from '@/lib/sheets';
import type { FirmMatch } from '@/lib/lead-match';
import type { NecesitMatch } from '@/lib/necesit-match';

// Pe cine mai pot suna pentru o cerere: potrivirile din director și cele de pe
// necesit.ro. Folosite în /admin/crm și în fișa din /admin/cereri.

function Caption({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
      {children}
    </span>
  );
}

/**
 * Cele 3-4 firme pe care le-aș suna pentru cererea asta, cu motivele la
 * vedere. Scorul decide ordinea, dar nu se afișează: motivele sunt
 * argumentul, cifra ar părea mai exactă decât e.
 */
export function MatchList({ matches, lead }: { matches: FirmMatch[]; lead: NewLead }) {
  return (
    <div className="space-y-2 border-t border-slate-100 px-4 py-2">
      <Caption>De contactat, potriviri din director</Caption>
      {matches.length > 0 && (
        <ul className="space-y-1.5">
          {matches.map((m) => (
            <li key={m.id} className="text-xs leading-snug">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <Link
                  href={`/firme/${m.slug}`}
                  className="font-medium text-slate-800 hover:underline"
                >
                  {m.name}
                </Link>
                <span className="text-slate-400">{m.city}</span>
                {m.phone && (
                  <a href={`tel:${m.phone}`} className="text-slate-500 tabular-nums hover:text-slate-900">
                    {m.phone}
                  </a>
                )}
              </div>
              <p className="text-[10px] text-slate-400">{m.reasons.join(' · ')}</p>
              {m.warnings.length > 0 && (
                <p className="text-[10px] text-amber-600">{m.warnings.join(' · ')}</p>
              )}
            </li>
          ))}
        </ul>
      )}
      {/* Directorul nu acoperă tot: sub 3 potriviri, restul se caută offline
          cu targetare (cheia API nu există pe Vercel, doar în .env.local). */}
      {matches.length < 3 && lead.judet && (
        <p className="text-[10px] leading-relaxed text-slate-400">
          {matches.length === 0
            ? 'Nicio potrivire în director.'
            : `Doar ${matches.length} ${matches.length === 1 ? 'potrivire' : 'potriviri'} în director.`}{' '}
          Caută candidați ANRE cu targetare, local:{' '}
          <code className="rounded bg-slate-100 px-1 py-0.5 text-[10px] text-slate-600">
            node scripts/lead-targetare.mjs --judet=&quot;{lead.judet}&quot; --segment=
            {lead.segment || 'comercial'}
          </code>
        </p>
      )}
    </div>
  );
}

/**
 * Firmele de pe necesit.ro din județul cererii, potrivite pe segment. Directorul
 * e subțire pe rezidențial, iar necesit e plin de instalatori rezidențiali —
 * unii plătesc deja pentru cereri acolo, alții sunt doar listați ca momeală SEO.
 * Dacă sunt sau nu în directorul nostru e irelevant aici: întrebarea e pe cine
 * mai pot suna pentru cererea asta.
 */
export function NecesitList({ matches }: { matches: NecesitMatch[] }) {
  if (matches.length === 0) return null;
  return (
    <div className="space-y-2 border-t border-slate-100 px-4 py-2">
      <Caption>De pe necesit.ro, potriviri pe segment</Caption>
      <ul className="space-y-1.5">
        {matches.map((m) => (
          <li key={m.slug} className="text-xs leading-snug">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <a
                href={m.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-slate-800 hover:underline"
              >
                {m.name}
              </a>
              <span className="text-slate-400">{m.locality}</span>
              {m.askedListingAt && (
                <span className="rounded bg-emerald-50 px-1 py-0.5 text-[10px] font-semibold text-emerald-700">
                  a cerut listare · {m.askedListingAt}
                </span>
              )}
              {m.phone ? (
                <a
                  href={`tel:${m.phone}`}
                  className="text-slate-500 tabular-nums hover:text-slate-900"
                >
                  {m.phone}
                </a>
              ) : (
                <span className="text-slate-300">fără telefon</span>
              )}
            </div>
            <p className="text-[10px] text-slate-400">{m.reasons.join(' · ')}</p>
            {m.warnings.length > 0 && (
              <p className="text-[10px] text-amber-600">{m.warnings.join(' · ')}</p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
