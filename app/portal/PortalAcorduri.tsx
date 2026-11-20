// Tabul „Condiții de colaborare”: ce a acceptat firma, la ce versiune și cine din
// echipă, plus linkurile spre cele trei documente, ca firma să le găsească oricând.

import { DOCUMENT_PROMOVARE, type AcordStare } from '@/lib/acorduri-shared';

/** „20 nov. 2026, 14:32”, ora României: e dovada, deci cu ora. */
function cand(iso: string): string {
  return new Date(iso).toLocaleString('ro-RO', {
    timeZone: 'Europe/Bucharest',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function PortalAcorduri({ acorduri }: { acorduri: AcordStare[] }) {
  return (
    <div id="acorduri" className="mb-8 scroll-mt-24 rounded-xl border border-border bg-surface p-5 sm:p-6">
      <h2 className="font-semibold text-gray-900">Condiții de colaborare</h2>
      <p className="mt-1 text-sm text-gray-600 leading-relaxed">
        Ce ai acceptat cu platforma. Dacă se schimbă ceva de fond, îți arătăm ce și bifezi din
        nou.
      </p>
      <ul className="mt-3 space-y-3">
        {acorduri.map((a) => (
          <li key={a.id} className="rounded-lg border border-border bg-white px-3.5 py-3">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <a
                href={a.href}
                target="_blank"
                rel="noopener"
                className="text-sm font-medium text-primary-dark underline hover:no-underline"
              >
                {a.titlu}
              </a>
              <span className="text-xs text-gray-500">versiunea din {a.dataVersiunii}</span>
            </div>
            {a.acceptari.length === 0 ? (
              <p className="mt-1.5 text-xs text-amber-700">Neacceptat încă.</p>
            ) : (
              <ul className="mt-1.5 space-y-0.5">
                {a.acceptari.map((x) => (
                  <li key={x.email} className="flex items-center gap-1.5 text-xs text-gray-700">
                    <span aria-hidden className="text-emerald-600">✓</span>
                    <span>
                      Acceptat de <strong className="font-medium">{x.email}</strong> pe{' '}
                      {cand(x.la)}
                      {x.sursa === 'revendicare' ? ', la revendicarea unei cereri' : ''}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
        <li className="rounded-lg border border-border bg-white px-3.5 py-3">
          <a
            href={DOCUMENT_PROMOVARE.href}
            target="_blank"
            rel="noopener"
            className="text-sm font-medium text-primary-dark underline hover:no-underline"
          >
            {DOCUMENT_PROMOVARE.titlu}
          </a>
          <p className="mt-1 text-xs leading-relaxed text-gray-500">{DOCUMENT_PROMOVARE.nota}</p>
        </li>
      </ul>
    </div>
  );
}
