'use client';

import { useEffect, useRef } from 'react';
import { trackEvent } from '@/lib/analytics';

// Îndemnul spre contul clientului, pe ecranul de după cerere (23 oct 2026).
// Radu: „mai mare și mai evident, mai catchy, cu un mic preview și o listă de
// beneficii”. Previzualizarea e un desen al paginii cererii, pe date de exemplu,
// ca omul să vadă ce primește înainte să apese.
//
// Trimite două evenimente pentru verdictul experimentului (lib/client-events):
// blocul văzut și blocul apăsat.

function sendEvent(leadId: string, event: 'cta_vazut' | 'cta_click') {
  try {
    const body = JSON.stringify({ leadId, event });
    if (navigator.sendBeacon?.('/api/cont/eveniment', new Blob([body], { type: 'application/json' }))) return;
    void fetch('/api/cont/eveniment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
  } catch {
    // Măsurătoarea nu are voie să strice ecranul.
  }
}

const BENEFITS = [
  'Vedeți câte firme au primit cererea și câți instalatori s-au uitat pe ea',
  'Aflați numele și telefonul fiecărei firme care o preia',
  'Găsiți ofertele într-un singur loc, nu prin emailuri și mesaje',
  'Ne spuneți dacă nu vă sună nimeni, iar noi verificăm',
];

function Check() {
  return (
    <span aria-hidden className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white">
      ✓
    </span>
  );
}

/** Desenul paginii cererii, micșorat. Nu e interactiv: e o imagine a ce urmează. */
function Preview() {
  const steps = [
    { label: 'Trimisă', done: true },
    { label: 'Văzută', done: true },
    { label: 'Preluată', done: true },
    { label: 'Ofertă', done: false },
  ];
  return (
    <div aria-hidden className="pointer-events-none select-none rounded-xl border border-gray-200 bg-white p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Activă</span>
        <span className="text-[10px] text-gray-400">exemplu</span>
      </div>
      <p className="mt-2 text-sm font-bold text-gray-900">Sistem fotovoltaic de 10 kW</p>
      <div className="mt-3 flex items-center">
        {steps.map((s, i) => (
          <div key={s.label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                  s.done ? 'bg-primary text-white' : 'border-2 border-primary bg-white text-primary-dark'
                }`}
              >
                {s.done ? '✓' : i + 1}
              </span>
              <span className="mt-1 text-[10px] font-medium text-gray-600">{s.label}</span>
            </div>
            {i < steps.length - 1 && <span className={`mx-1 mb-4 h-0.5 flex-1 ${steps[i + 1].done ? 'bg-primary' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>
      <div className="mt-3 space-y-2">
        {[
          { name: 'Solar Exemplu', note: 'v-a sunat ieri' },
          { name: 'Energie Demo', note: 'a trimis oferta · PDF' },
        ].map((f) => (
          <div key={f.name} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
            <div>
              <p className="text-xs font-semibold text-gray-900">{f.name}</p>
              <p className="text-[10px] text-gray-500">{f.note}</p>
            </div>
            <span className="rounded-md border border-primary px-2 py-1 text-[10px] font-semibold text-primary-dark">📞 Sunați</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FollowRequestCTA({
  contUrl,
  contEmail,
  leadId,
}: {
  contUrl: string;
  contEmail: boolean;
  leadId: string | null;
}) {
  const seen = useRef(false);
  useEffect(() => {
    if (!leadId || seen.current) return;
    seen.current = true;
    sendEvent(leadId, 'cta_vazut');
  }, [leadId]);

  return (
    <div className="overflow-hidden rounded-2xl border-2 border-primary bg-gradient-to-br from-amber-50 via-white to-white shadow-sm">
      <div className="grid gap-6 p-5 sm:p-7 md:grid-cols-[1.2fr_1fr] md:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-white">Gratuit</span>
            <span className="text-xs font-medium text-gray-500">fără parolă, fără cont de creat</span>
          </div>
          <h3 className="mt-3 text-xl font-extrabold leading-tight text-gray-900">
            Urmăriți-vă cererea pas cu pas
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            Nu mai stați să ghiciți dacă v-a văzut cineva cererea. Totul, într-o singură pagină:
          </p>
          <ul className="mt-4 space-y-2.5">
            {BENEFITS.map((b) => (
              <li key={b} className="flex gap-2.5 text-sm text-gray-800">
                <Check />
                {b}
              </li>
            ))}
          </ul>
          <a
            href={contUrl}
            onClick={() => {
              if (leadId) sendEvent(leadId, 'cta_click');
              trackEvent('cont_cta_click');
            }}
            className="mt-5 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-base font-bold text-white shadow-sm transition-colors hover:bg-primary-dark sm:w-auto"
          >
            Urmăriți cererea gratuit <span aria-hidden>→</span>
          </a>
          <p className="mt-2 text-xs text-gray-500">
            {contEmail ? 'Vă trimitem linkul și pe email, ca să reveniți oricând.' : 'Pagina se deschide din acest browser, oricând reveniți.'}
          </p>
        </div>
        <div className="md:pl-2">
          <Preview />
        </div>
      </div>
    </div>
  );
}
