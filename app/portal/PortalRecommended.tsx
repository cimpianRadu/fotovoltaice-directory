'use client';

import Link from 'next/link';
import { trackEvent } from '@/lib/analytics';

export interface RecommendedLead {
  id: string;
  judet: string;
  titlu: string;
  detalii: string;
  ageDays: number;
}

function ageLabel(days: number): string {
  if (days <= 0) return 'azi';
  if (days === 1) return 'ieri';
  return `acum ${days} zile`;
}

/**
 * Cele mai bune cereri deschise pe care firma încă nu le-a luat, cel mult trei:
 * mai întâi fonduri proprii + „cât mai repede”, apoi cele mai noi. Lista întreagă
 * rămâne pe /cereri; aici e doar motivul de a o deschide.
 */
export default function PortalRecommended({
  leads,
  total,
  href,
  fromClaims,
}: {
  leads: RecommendedLead[];
  total: number;
  href: string;
  /** N-a bifat județe, deci am ales după județele cererilor pe care le-a luat. */
  fromClaims: boolean;
}) {
  return (
    <section className="mb-5 rounded-xl border border-border bg-white">
      <div className="flex items-baseline justify-between gap-3 px-3 pb-1 pt-3 sm:px-4">
        <h2 className="text-sm font-semibold text-gray-900">
          {fromClaims ? 'Cereri noi din zonă' : 'Cereri noi în județele tale'}
        </h2>
        {total > leads.length && (
          <Link href={href} className="shrink-0 text-xs font-medium text-primary-dark hover:underline">
            Vezi toate ({total})
          </Link>
        )}
      </div>
      <ul className="divide-y divide-border">
        {leads.map((l) => (
          <li key={l.id}>
            <Link
              href={`/cereri?cerere=${encodeURIComponent(l.id)}`}
              onClick={() => trackEvent('portal_recommended_click')}
              className="flex items-center justify-between gap-3 px-3 py-2.5 transition-colors hover:bg-surface sm:px-4"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-gray-900">
                  {l.titlu} · {l.judet}
                </span>
                {l.detalii && <span className="block truncate text-xs text-gray-500">{l.detalii}</span>}
              </span>
              <span className="shrink-0 text-xs text-gray-400">
                {ageLabel(l.ageDays)} <span aria-hidden="true">→</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
