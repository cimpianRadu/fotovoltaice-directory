'use client';

// Pozele, alese pe pasul dinaintea trimiterii (11 nov 2026, cerut de Radu).
// Aici doar se aleg: urcarea pornește după ce cererea e salvată (LeadForm →
// uploadLeadPhoto), ca o urcare picată pe internet mobil să nu coste cererea.

import { useRef, useState } from 'react';
import {
  LEAD_PHOTO_MAX,
  LEAD_PHOTO_MAX_BYTES,
  LEAD_PHOTO_TYPES,
  PHOTO_LIFT_PCT,
} from '@/lib/lead-photos-shared';
import { mbLabel } from './LeadPhotoUpload';

export interface PickedPhoto {
  file: File;
  /** URL local (createObjectURL), doar pentru miniatură. */
  url: string;
}

/** Eliberează URL-urile locale când pozele nu mai sunt în formular. */
export function releasePhotos(list: PickedPhoto[]) {
  for (const p of list) URL.revokeObjectURL(p.url);
}

function Thumb({ photo, onRemove }: { photo: PickedPhoto; onRemove: () => void }) {
  // HEIC (iPhone) nu se poate afișa în Chrome; atunci rămâne iconița cu numele.
  const [broken, setBroken] = useState(false);
  return (
    <li className="relative">
      {broken ? (
        <div className="flex h-20 w-20 flex-col items-center justify-center rounded-lg border border-border bg-white px-1 text-center">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-gray-400" aria-hidden="true">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <circle cx="9" cy="10" r="1.6" />
            <path d="m21 16-5-5-9 8" />
          </svg>
          <span className="mt-1 w-full truncate text-[10px] text-gray-500">{photo.file.name}</span>
        </div>
      ) : (
        // next/image n-are ce optimiza la un fișier local din browser.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo.url}
          alt={photo.file.name}
          onError={() => setBroken(true)}
          className="h-20 w-20 rounded-lg border border-border object-cover"
        />
      )}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Scoate poza ${photo.file.name}`}
        className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white shadow hover:bg-gray-700"
      >
        ×
      </button>
    </li>
  );
}

export default function LeadPhotoPicker({
  photos,
  onChange,
}: {
  photos: PickedPhoto[];
  onChange: (next: PickedPhoto[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  // Pozele stau în LeadForm, nu aici: pickerul se demontează când omul se
  // întoarce un pas, iar alegerea trebuie să-l aștepte când revine. URL-urile
  // locale se eliberează la scoatere și după urcare.
  const left = LEAD_PHOTO_MAX - photos.length;

  function add(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    const next = [...photos];
    const skipped: string[] = [];
    for (const file of Array.from(files)) {
      if (next.length >= LEAD_PHOTO_MAX) break;
      // Unele telefoane dau HEIC fără tip MIME; extensia ajunge ca dovadă.
      const okType = LEAD_PHOTO_TYPES.includes(file.type) || /\.(heic|heif)$/i.test(file.name);
      if (!okType) {
        skipped.push(`„${file.name}" nu e o poză (JPG, PNG sau HEIC).`);
        continue;
      }
      if (file.size > LEAD_PHOTO_MAX_BYTES) {
        skipped.push(`„${file.name}" are peste ${mbLabel(LEAD_PHOTO_MAX_BYTES)}.`);
        continue;
      }
      if (next.some((p) => p.file.name === file.name && p.file.size === file.size)) continue;
      next.push({ file, url: URL.createObjectURL(file) });
    }
    if (skipped.length) setError(skipped.join(' '));
    onChange(next);
    // Fără asta, aceeași poză aleasă a doua oară nu declanșează `change`.
    if (inputRef.current) inputRef.current.value = '';
  }

  function remove(i: number) {
    releasePhotos([photos[i]]);
    onChange(photos.filter((_, j) => j !== i));
  }

  return (
    <div className="rounded-xl border-2 border-primary/50 bg-amber-50/70 p-5 sm:p-6">
      <p className="text-xl sm:text-2xl font-extrabold leading-tight text-gray-900">
        Pozele vă cresc șansele de oferte{' '}
        <span className="text-primary-dark">cu {PHOTO_LIFT_PCT}%</span>
      </p>
      <p className="mt-2 text-sm text-gray-700 leading-relaxed">
        Instalatorul vede acoperișul și tabloul înainte să vă sune și vă poate propune direct un
        sistem potrivit acoperișului. Ajung 2-3 poze: acoperișul văzut din exterior și
        tabloul electric cu contorul. Le vede doar instalatorul care preia cererea.
      </p>

      {photos.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-3">
          {photos.map((p, i) => (
            <Thumb key={p.url} photo={p} onRemove={() => remove(i)} />
          ))}
        </ul>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={[...LEAD_PHOTO_TYPES, '.heic', '.heif'].join(',')}
        multiple
        className="hidden"
        onChange={(e) => add(e.target.files)}
      />

      {left > 0 ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-4 inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-base font-semibold text-white transition-colors hover:bg-primary-dark"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 8.8A1.8 1.8 0 0 1 4.8 7h1.9l1.4-2h7.8l1.4 2h1.9A1.8 1.8 0 0 1 21 8.8v8.4A1.8 1.8 0 0 1 19.2 19H4.8A1.8 1.8 0 0 1 3 17.2z" />
            <circle cx="12" cy="13" r="3.2" />
          </svg>
          {photos.length ? 'Mai adaug poze' : 'Adaugă poze'}
        </button>
      ) : (
        <p className="mt-4 text-sm text-gray-700">Sunt {LEAD_PHOTO_MAX} poze pe cerere, atât încap.</p>
      )}

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <p className="mt-3 text-[11px] text-gray-500">
        JPG, PNG sau HEIC, până în {mbLabel(LEAD_PHOTO_MAX_BYTES)} fiecare. Se încarcă după ce
        trimiteți cererea.
      </p>
    </div>
  );
}
