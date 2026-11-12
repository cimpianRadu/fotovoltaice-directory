'use client';

// Adresa exactă a lucrării, pe pasul „Zonă" al formularului (11 nov 2026, cerut
// de Radu; până atunci era opțională, după trimitere). Obligatorie: strada și
// numărul SAU locația dispozitivului, pentru cine e chiar acolo. Se salvează
// după ce cererea e trimisă, prin /api/leads/locatie (vezi LeadForm), și o vede
// doar firma care preia cererea.

import { useEffect, useId, useRef, useState } from 'react';
import { getDeviceLocation } from '@/lib/device-location';
import { LEAD_ADDRESS_MAX } from '@/lib/lead-location-shared';

const REQUIRED_MESSAGE = 'Scrieți strada și numărul sau folosiți locația telefonului.';

export default function AdresaLucrareField({
  adresa,
  coordonate,
  onAdresa,
  onCoordonate,
}: {
  adresa: string;
  coordonate: string;
  onAdresa: (v: string) => void;
  onCoordonate: (v: string) => void;
}) {
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const whyId = useId();
  const privacyId = useId();

  // Mesajul personalizat ține câmpul invalid până e șters; cu locația adăugată
  // adresa nu mai e obligatorie, deci mesajul trebuie să dispară și el.
  useEffect(() => {
    inputRef.current?.setCustomValidity('');
  }, [coordonate]);

  async function takeDeviceLocation() {
    setError(null);
    setLocating(true);
    const res = await getDeviceLocation();
    setLocating(false);
    if ('coords' in res) onCoordonate(res.coords);
    else setError(res.error);
  }

  // Motivul stă lipit de câmp, între etichetă și input, în același card (Radu,
  // 11 nov: caseta de dedesubt nu se lega de adresă și pe telefon rămânea sub
  // butonul „Continuă”). aria-describedby îl citește și cititorul de ecran.
  return (
    <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-3.5 sm:p-4">
      <label htmlFor="adresa" className="block text-sm font-medium text-gray-800">
        Adresa exactă (strada și numărul)<span className="text-red-500 ml-0.5">*</span>
      </label>
      <p id={whyId} className="mt-1 mb-2.5 flex gap-2 text-[13px] leading-snug text-sky-950">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="mt-px shrink-0 text-sky-700">
          <path d="M3 11.5 12 4l9 7.5" />
          <path d="M5 10v10h14V10" />
          <path d="M9 14h6" />
        </svg>
        <span>
          <strong className="font-semibold">De ce o cerem:</strong> instalatorul se uită la acoperiș
          din satelit (orientarea, umbrele, suprafața liberă) și vă propune un sistem potrivit încă
          de la primul telefon.
        </span>
      </p>
      <input
        ref={inputRef}
        id="adresa"
        name="adresa"
        type="text"
        // Cu locația luată de pe telefon, adresa scrisă nu mai e obligatorie.
        required={!coordonate}
        // Doar spații nu e o adresă.
        pattern={coordonate ? undefined : '.*\\S.*'}
        maxLength={LEAD_ADDRESS_MAX}
        autoComplete="street-address"
        placeholder="Ex: Str. Florilor nr. 12"
        aria-describedby={`${whyId} ${privacyId}`}
        value={adresa}
        onChange={(e) => {
          e.currentTarget.setCustomValidity('');
          onAdresa(e.target.value);
        }}
        // Bula nativă ar spune doar „completați câmpul"; aici spunem și varianta cu locația.
        onInvalid={(e) => e.currentTarget.setCustomValidity(REQUIRED_MESSAGE)}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-base sm:text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
      />

      <div className="mt-2 text-sm">
        {coordonate ? (
          <span className="text-emerald-700">
            ✓ Locația telefonului e adăugată{' '}
            <button
              type="button"
              onClick={() => onCoordonate('')}
              className="text-gray-500 underline hover:text-gray-700"
            >
              scoate-o
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => void takeDeviceLocation()}
            disabled={locating}
            className="inline-flex items-center gap-1.5 text-left text-primary-dark underline hover:no-underline disabled:opacity-60"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
              <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
              <circle cx="12" cy="9.5" r="2.5" />
            </svg>
            {locating ? 'Se caută locația...' : 'Sunt acum acolo: folosește locația mea (opțional)'}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

      <p id={privacyId} className="mt-2 flex items-center gap-1.5 text-[12px] text-sky-900/80">
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
        O vede doar firma care preia cererea, nu apare pe site.
      </p>
    </div>
  );
}
