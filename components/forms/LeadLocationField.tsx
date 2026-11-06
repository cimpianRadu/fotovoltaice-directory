'use client';

// Locul lucrării, opțional, după trimiterea cererii și din contul clientului.
// Stă după submit din același motiv ca pozele: un câmp în plus în formular
// pierde cereri, iar o cerere fără adresă e tot o cerere. Omul poate scrie
// adresa sau poate lua locația telefonului, dacă e acasă.

import { useState } from 'react';
import { trackEvent } from '@/lib/analytics';
import { LEAD_ADDRESS_MAX, formatCoords, satelliteMapUrl } from '@/lib/lead-location-shared';

export const LOCATION_CARD_CLASS = 'rounded-xl border border-border bg-white p-5 sm:p-6';

/** De ce merită adresa. Fără cifră: încă n-avem date despre efectul ei. */
export function LocationPitch() {
  return (
    <>
      <p className="flex items-center gap-2 font-semibold text-gray-900">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-primary-dark">
          <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
          <circle cx="12" cy="9.5" r="2.5" />
        </svg>
        Adăugați adresa unde se face montajul
      </p>
      <p className="mt-2 text-sm text-gray-700 leading-relaxed">
        Cu adresa, instalatorul se uită la acoperiș din satelit: vede orientarea, umbrele și
        suprafața liberă, și vă poate propune un sistem potrivit acoperișului. O vede doar
        instalatorul care preia cererea ca să vă facă oferta, nu apare pe site.
      </p>
    </>
  );
}

export default function LeadLocationField({
  leadId,
  token,
  initialAdresa = '',
  initialCoordonate = '',
  sursa,
  onSaved,
}: {
  leadId: string;
  token: string;
  initialAdresa?: string;
  initialCoordonate?: string;
  /** Unde e afișat: `confirmare` (după trimitere) sau `cont`. Doar pentru analytics. */
  sursa: 'confirmare' | 'cont';
  onSaved?: (saved: { adresa: string; coordonate: string }) => void;
}) {
  const [adresa, setAdresa] = useState(initialAdresa);
  const [coordonate, setCoordonate] = useState(initialCoordonate);
  const [saved, setSaved] = useState({ adresa: initialAdresa, coordonate: initialCoordonate });
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = adresa.trim() !== saved.adresa || coordonate !== saved.coordonate;
  const hasSaved = Boolean(saved.adresa || saved.coordonate);
  const mapUrl = satelliteMapUrl({ adresa: saved.adresa, coordonate: saved.coordonate });

  function useMyLocation() {
    if (!navigator.geolocation) {
      setError('Browserul nu poate da locația. Scrieți adresa mai sus.');
      return;
    }
    setError(null);
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoordonate(formatCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }));
        setLocating(false);
      },
      () => {
        setLocating(false);
        setError('Nu am primit locația (poate e blocată din setări). Scrieți adresa mai sus.');
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/leads/locatie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, token, adresa, coordonate }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || 'Nu am putut salva adresa. Încercați din nou.');
        return;
      }
      const next = { adresa: json.adresa ?? adresa.trim(), coordonate: json.coordonate ?? coordonate };
      setSaved(next);
      setAdresa(next.adresa);
      onSaved?.(next);
      trackEvent('lead_locatie_salvata', {
        sursa,
        adresa: Boolean(json.adresa),
        gps: Boolean(json.coordonate),
      });
    } catch {
      setError('Nu am putut salva adresa. Încercați din nou.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save}>
      <label htmlFor={`adresa-${leadId}`} className="block text-sm font-medium text-gray-700">
        Adresa (stradă, număr, localitate)
      </label>
      <input
        id={`adresa-${leadId}`}
        type="text"
        value={adresa}
        onChange={(e) => setAdresa(e.target.value)}
        maxLength={LEAD_ADDRESS_MAX}
        autoComplete="street-address"
        placeholder="Ex: Str. Florilor nr. 12, Ghimbav"
        className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-base text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none sm:text-sm"
      />

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        {coordonate ? (
          <span className="text-emerald-700">
            ✓ Locația de pe telefon e adăugată{' '}
            <button
              type="button"
              onClick={() => setCoordonate('')}
              className="text-gray-500 underline hover:text-gray-700"
            >
              scoate-o
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={useMyLocation}
            disabled={locating}
            className="text-primary-dark underline hover:no-underline disabled:opacity-60"
          >
            {locating ? 'Se caută locația...' : 'Sunt acum acolo: folosește locația telefonului'}
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={busy || !dirty || (!adresa.trim() && !coordonate && !hasSaved)}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
        >
          {busy ? 'Se salvează...' : hasSaved ? 'Salvează modificarea' : 'Salvează adresa'}
        </button>
        {hasSaved && !dirty && (
          <span className="text-sm font-medium text-emerald-700">
            Salvată.{' '}
            {mapUrl && (
              <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="font-normal text-gray-500 underline hover:text-gray-700">
                Verificați pe hartă
              </a>
            )}
          </span>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </form>
  );
}
