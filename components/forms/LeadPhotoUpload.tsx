'use client';

// Încărcarea pozelor de pe ecranul de confirmare. Stă DUPĂ trimitere,
// intenționat: pe telefon un câmp de fișier înainte de submit pierde cereri,
// iar o cerere fără poze e tot o cerere. Aici omul a convertit deja, deci nimic
// din ce se întâmplă mai jos nu-i mai poate pierde cererea.
//
// Fișierele urcă direct din browser în Blob, cu un token cerut de la
// /api/leads/poze; serverul nostru nu vede fișierul. După fiecare urcare,
// /api/leads/poze/salveaza scrie poza în evidență — confirmarea aia e cea care
// aprinde semnalul „are poze" pe cerere.

import { upload } from '@vercel/blob/client';
import { useRef, useState } from 'react';
import {
  LEAD_PHOTO_MAX,
  LEAD_PHOTO_MAX_BYTES,
  LEAD_PHOTO_TYPES,
  leadPhotoPrefix,
  safePhotoName,
} from '@/lib/lead-photos-shared';

interface Uploaded {
  pathname: string;
  name: string;
  /** URL local (createObjectURL) — pozele private n-au adresă publică de afișat. */
  preview: string;
}

function mbLabel(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

export default function LeadPhotoUpload({
  leadId,
  token,
  mailtoFallback,
}: {
  leadId: string;
  token: string;
  /** Varianta pe email, pentru cine nu poate încărca (browser vechi, blocaje). */
  mailtoFallback: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [done, setDone] = useState<Uploaded[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const left = LEAD_PHOTO_MAX - done.length;

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    setBusy(true);

    // Una câte una, nu toate deodată: pe internet mobil, patru urcări în
    // paralel se încurcă între ele, iar dacă pică una vrem să știm care.
    for (const file of Array.from(files).slice(0, left)) {
      try {
        if (file.size > LEAD_PHOTO_MAX_BYTES) {
          throw new Error(`„${file.name}" are peste ${mbLabel(LEAD_PHOTO_MAX_BYTES)}.`);
        }
        const blob = await upload(`${leadPhotoPrefix(leadId)}${safePhotoName(file.name)}`, file, {
          access: 'private',
          handleUploadUrl: '/api/leads/poze',
          clientPayload: JSON.stringify({ leadId, token }),
        });

        // Fără confirmare, poza există în store dar n-o știe nimeni.
        const res = await fetch('/api/leads/poze/salveaza', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ leadId, token, pathname: blob.pathname }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || 'Poza s-a încărcat, dar nu s-a putut lega de cerere.');
        }

        setDone((prev) => [
          ...prev,
          { pathname: blob.pathname, name: file.name, preview: URL.createObjectURL(file) },
        ]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Nu s-a putut încărca poza.');
      }
    }

    setBusy(false);
    // Fără asta, aceeași poză aleasă a doua oară nu declanșează `change`.
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div className="mt-6 pt-5 border-t border-border">
      <p className="font-semibold text-gray-900 text-sm">
        Poze cu acoperișul și tabloul electric
      </p>
      <p className="mt-1 text-sm text-gray-700 leading-relaxed">
        Două-trei poze: una cu acoperișul văzut din exterior, una cu tabloul electric și
        contorul. Cu ele, instalatorii pot calcula montajul fără să mai vină întâi în vizită.
      </p>

      {done.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {done.map((p) => (
            <li key={p.pathname} className="relative">
              {/* next/image n-are ce optimiza la un blob local din browser. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.preview}
                alt={p.name}
                className="h-20 w-20 rounded-lg border border-border object-cover"
              />
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">
                ✓
              </span>
            </li>
          ))}
        </ul>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={LEAD_PHOTO_TYPES.join(',')}
        multiple
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />

      {left > 0 ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
        >
          {busy ? 'Se încarcă...' : done.length ? 'Mai adaug poze' : 'Adaugă poze'}
        </button>
      ) : (
        <p className="mt-4 text-sm text-gray-700">
          Sunt {LEAD_PHOTO_MAX} poze pe cerere, atât încap.
        </p>
      )}

      {done.length > 0 && !busy && (
        <p className="mt-2 text-sm font-medium text-emerald-700">
          {done.length === 1 ? 'Poza a ajuns la noi.' : `Cele ${done.length} poze au ajuns la noi.`}{' '}
          Le vede doar instalatorul care preia cererea.
        </p>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-600">
          {error}{' '}
          <a href={mailtoFallback} className="underline">
            Trimiteți-le pe email
          </a>
          .
        </p>
      )}

      <p className="mt-3 text-[11px] text-gray-400">
        JPG, PNG sau HEIC, până în {mbLabel(LEAD_PHOTO_MAX_BYTES)} fiecare. Preferați emailul?{' '}
        <a href={mailtoFallback} className="underline hover:text-gray-600">
          Ni le puteți trimite și așa
        </a>
        .
      </p>
    </div>
  );
}
