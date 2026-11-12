'use client';

// Pornirea și oprirea rezumatului AI pe cereri, din setările portalului (pilot
// 12 nov 2026). Pornit implicit; starea se citește la deschidere.

import { useEffect, useState } from 'react';
import { trackEvent } from '@/lib/analytics';

export default function RezumatAiToggle() {
  const [pornit, setPornit] = useState<boolean | null>(null);
  const [eroare, setEroare] = useState('');

  useEffect(() => {
    fetch('/api/portal/setari', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { rezumatAi: true }))
      .then((j) => setPornit(j.rezumatAi !== false))
      .catch(() => setPornit(true));
  }, []);

  async function schimba(nou: boolean) {
    setEroare('');
    const vechi = pornit;
    setPornit(nou);
    trackEvent('rezumat_ai_setare', { pornit: nou });
    const r = await fetch('/api/portal/setari', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rezumatAi: nou }),
    }).catch(() => null);
    if (!r?.ok) {
      setPornit(vechi);
      setEroare('Nu am putut salva. Încercați din nou.');
    }
  }

  return (
    <section className="rounded-xl border border-border bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-gray-900">Rezumat AI pe cererile de baterii</h3>
          <p className="mt-1 text-sm leading-relaxed text-gray-600">
            La cererile de baterie și extindere, clientul poate discuta după trimitere cu asistentul nostru. Pe
            card vezi ce a confirmat (invertor, fazare, consum), ce nu se potrivește și ce vrea să afle de la tine.
          </p>
        </div>
        <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            checked={pornit ?? true}
            disabled={pornit === null}
            onChange={(e) => void schimba(e.target.checked)}
          />
          {pornit === false ? 'Oprit' : 'Pornit'}
        </label>
      </div>
      {eroare && <p className="mt-2 text-sm text-red-700">{eroare}</p>}
    </section>
  );
}
