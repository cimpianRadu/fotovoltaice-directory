'use client';

// Ce îi mai lipsește cererii ca firmele s-o preia și să-i dea o ofertă mai
// exactă: pozele și adresa (6 nov 2026, cerute de un instalator). Fără „fără
// vizită" în texte: pentru client nu sună a avantaj (Radu, 6 nov).
// Cifra de la poze e a noastră, vezi PhotoPitch; la adresă nu punem cifră
// până nu avem date.

import { useState } from 'react';
import LeadPhotoUpload from '@/components/forms/LeadPhotoUpload';
import LeadLocationField from '@/components/forms/LeadLocationField';
import { PHOTO_LIFT_PCT } from '@/lib/lead-photos-shared';

const PHOTO_INBOX = 'contact@instalatori-fotovoltaice.ro';

function Check({ done }: { done: boolean }) {
  return done ? (
    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white" aria-label="completat">
      ✓
    </span>
  ) : (
    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-amber-500 text-[11px] font-bold text-amber-600" aria-label="lipsește">
      !
    </span>
  );
}

export default function LeadDetailsChecklist({
  leadId,
  token,
  photoCount: initialPhotoCount,
  adresa: initialAdresa,
  coordonate: initialCoordonate,
  demo = false,
}: {
  leadId: string;
  /** Tokenul de detalii (lib/lead-photos), emis de pagină după verificarea sesiunii. */
  token: string;
  photoCount: number;
  adresa: string;
  coordonate: string;
  /** Previzualizarea din /admin: aceeași pagină, dar nimic nu se încarcă sau salvează. */
  demo?: boolean;
}) {
  // Bifele se aprind pe loc, nu după reîncărcare. `photoCount` rămâne cel de
  // la încărcarea paginii: e plafonul pe care îl știe LeadPhotoUpload, care își
  // numără singur pozele noi.
  const photoCount = initialPhotoCount;
  const [uploaded, setUploaded] = useState(0);
  const [location, setLocation] = useState({ adresa: initialAdresa, coordonate: initialCoordonate });
  const { adresa, coordonate } = location;
  const totalPhotos = photoCount + uploaded;
  const hasPhotos = totalPhotos > 0;
  const hasLocation = Boolean(adresa || coordonate);
  // Ce lipsește stă deschis; ce e completat se deschide doar la cerere.
  const [photosOpen, setPhotosOpen] = useState(initialPhotoCount === 0);
  const [locationOpen, setLocationOpen] = useState(!(initialAdresa || initialCoordonate));
  const doneCount = Number(hasPhotos) + Number(hasLocation);

  const subject = `Poze pentru cererea mea (ref. ${leadId})`;
  const mailto = `mailto:${PHOTO_INBOX}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
    'Atașez pozele cu acoperișul și cu tabloul electric.\n\n(Nu ștergeți referința din subiect, după ea legăm pozele de cererea dumneavoastră.)',
  )}`;

  return (
    <section className="rounded-xl border border-border bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Ca să primiți oferte potrivite</h2>
          <p className="mt-1 text-sm text-gray-600">
            {doneCount === 2
              ? 'Cererea are tot ce le trebuie instalatorilor ca să vă dea un preț.'
              : 'Cu aceste detalii, instalatorii vă pot face o ofertă mai exactă.'}
          </p>
        </div>
        <span className={`shrink-0 text-sm font-semibold tabular-nums ${doneCount === 2 ? 'text-emerald-700' : 'text-amber-700'}`}>
          {doneCount} din 2
        </span>
      </div>

      <fieldset disabled={demo} className="m-0 min-w-0 border-0 p-0">
      <ul className="mt-4 divide-y divide-border border-t border-border">
        <li className="py-4">
          <div className="flex items-start gap-3">
            <Check done={hasPhotos} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <p className="font-medium text-gray-900">
                  {hasPhotos
                    ? `${totalPhotos} ${totalPhotos === 1 ? 'poză adăugată' : 'poze adăugate'}`
                    : 'Poze cu acoperișul și tabloul electric'}
                </p>
                {hasPhotos && !photosOpen && (
                  <button type="button" onClick={() => setPhotosOpen(true)} className="text-sm text-primary-dark underline hover:no-underline">
                    Mai adaug
                  </button>
                )}
              </div>
              {initialPhotoCount === 0 && uploaded === 0 && (
                <p className="mt-1 text-sm text-gray-700 leading-relaxed">
                  Din ce am văzut pe site, pozele vă cresc șansele de oferte <strong>cu {PHOTO_LIFT_PCT}%</strong>.
                  Una cu acoperișul din exterior, una cu tabloul și contorul.
                </p>
              )}
              {photosOpen && (
                <div className="mt-3">
                  <LeadPhotoUpload leadId={leadId} token={token} mailtoFallback={mailto} existingCount={photoCount} bare onUploaded={() => setUploaded((n) => n + 1)} />
                </div>
              )}
            </div>
          </div>
        </li>

        <li className="pt-4">
          <div className="flex items-start gap-3">
            <Check done={hasLocation} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <p className="font-medium text-gray-900">
                  {hasLocation ? 'Adresa montajului adăugată' : 'Adresa unde se face montajul'}
                </p>
                {hasLocation && !locationOpen && (
                  <button type="button" onClick={() => setLocationOpen(true)} className="text-sm text-primary-dark underline hover:no-underline">
                    Modifică
                  </button>
                )}
              </div>
              {hasLocation && !locationOpen && adresa && <p className="mt-0.5 truncate text-sm text-gray-600">{adresa}</p>}
              {!hasLocation && (
                <p className="mt-1 text-sm text-gray-700 leading-relaxed">
                  Instalatorul se uită la acoperiș din satelit: orientarea, umbrele, suprafața liberă.
                  O vede doar firma care preia cererea ca să vă facă oferta, nu apare pe site.
                </p>
              )}
              {locationOpen && (
                <div className="mt-3">
                  <LeadLocationField
                    leadId={leadId}
                    token={token}
                    initialAdresa={initialAdresa}
                    initialCoordonate={initialCoordonate}
                    sursa="cont"
                    onSaved={setLocation}
                  />
                </div>
              )}
            </div>
          </div>
        </li>
      </ul>
      </fieldset>
    </section>
  );
}
