'use client';

import { useRef, useState } from 'react';
import { upload } from '@vercel/blob/client';
import { useRouter } from 'next/navigation';
import { OFFER_MAX_BYTES, OFFER_MAX_FILES, OFFER_TYPES, fileSizeLabel, offerPrefix, safeOfferName } from '@/lib/oferte-shared';
import type { PortalOffer } from './PortalClaimCard';

// Oferta trimisă prin platformă, pe cardul cererii din portal (pilot din 23 oct
// 2026). Clientul o vede în contul lui, iar firma află aici și pe email când a
// deschis-o. Fișierele urcă direct din browser în Blob, ca pozele cererii.

const dayTime = (iso: string) =>
  new Date(iso).toLocaleString('ro-RO', { timeZone: 'Europe/Bucharest', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

export default function PortalOfferBox({
  leadId,
  offers,
  canSend,
}: {
  leadId: string;
  offers: PortalOffer[];
  canSend: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [valoare, setValoare] = useState('');
  const [putere, setPutere] = useState('');
  const [mesaj, setMesaj] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!offers.length && !canSend) return null;

  function pick(list: FileList | null) {
    setError(null);
    const chosen = Array.from(list ?? []).slice(0, OFFER_MAX_FILES);
    const tooBig = chosen.find((f) => f.size > OFFER_MAX_BYTES);
    if (tooBig) {
      setError(`„${tooBig.name}" are peste ${fileSizeLabel(OFFER_MAX_BYTES)}.`);
      return;
    }
    setFiles(chosen);
  }

  async function send() {
    if (!files.length) {
      setError('Alege fișierul cu oferta.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const uploaded = [];
      for (const file of files) {
        const blob = await upload(`${offerPrefix(leadId)}${safeOfferName(file.name)}`, file, {
          access: 'private',
          handleUploadUrl: '/api/oferte/upload',
          clientPayload: JSON.stringify({ leadId }),
        });
        uploaded.push({ pathname: blob.pathname, name: file.name });
      }
      const res = await fetch('/api/portal/oferta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, files: uploaded, valoare, putere, mesaj }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof json.error === 'string' ? json.error : 'Oferta nu s-a putut trimite.');
      setDone(true);
      setOpen(false);
      setFiles([]);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Oferta nu s-a putut trimite.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/60 p-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-800">Oferta prin platformă</div>

      {offers.length > 0 && (
        <ul className="mt-2 space-y-1.5 text-sm">
          {offers.map((o) => (
            <li key={o.id} className="text-gray-800">
              Trimisă pe {dayTime(o.createdAt)} · {o.files.map((f) => f.name).join(', ')}
              <br />
              {o.clientOpenedAt ? (
                <span className="font-semibold text-emerald-700">✓ Clientul a deschis-o pe {dayTime(o.clientOpenedAt)}</span>
              ) : (
                <span className="text-gray-500">Clientul n-a deschis-o încă. Primești email când o deschide.</span>
              )}
            </li>
          ))}
        </ul>
      )}
      {done && <p className="mt-2 text-sm font-medium text-emerald-700">Trimisă. Clientul a primit-o pe email și în contul lui.</p>}

      {canSend && !open && (
        <div className="mt-2">
          <p className="text-xs text-gray-600">
            Trimite oferta prin noi: clientul o vede în contul lui, iar tu afli când a deschis-o.
          </p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-2 inline-flex min-h-[40px] items-center rounded-lg bg-primary px-3 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            {offers.length ? 'Trimite încă o ofertă' : 'Trimite oferta'}
          </button>
        </div>
      )}

      {canSend && open && (
        <div className="mt-3 space-y-3">
          <div>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={OFFER_TYPES.join(',')}
              onChange={(e) => pick(e.target.files)}
              className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-white file:px-3 file:py-2 file:text-sm file:font-semibold file:text-gray-900"
            />
            <p className="mt-1 text-xs text-gray-500">
              PDF sau poze, până la {OFFER_MAX_FILES} fișiere de maximum {fileSizeLabel(OFFER_MAX_BYTES)}.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <label className="text-xs text-gray-600">
              Valoare fără TVA (opțional)
              <span className="mt-1 flex items-center gap-1">
                <input
                  inputMode="decimal"
                  value={valoare}
                  onChange={(e) => setValoare(e.target.value)}
                  className="w-32 rounded-lg border border-border bg-white px-2 py-1.5 text-sm"
                />
                lei
              </span>
            </label>
            <label className="text-xs text-gray-600">
              Putere (opțional)
              <span className="mt-1 flex items-center gap-1">
                <input
                  inputMode="decimal"
                  value={putere}
                  onChange={(e) => setPutere(e.target.value)}
                  className="w-20 rounded-lg border border-border bg-white px-2 py-1.5 text-sm"
                />
                kW
              </span>
            </label>
          </div>
          <label className="block text-xs text-gray-600">
            Un mesaj pentru client (opțional)
            <textarea
              value={mesaj}
              onChange={(e) => setMesaj(e.target.value)}
              rows={2}
              maxLength={500}
              className="mt-1 w-full rounded-lg border border-border bg-white px-2 py-1.5 text-sm"
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void send()}
              disabled={busy}
              className="inline-flex min-h-[40px] items-center rounded-lg bg-primary px-3 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
            >
              {busy ? 'Se trimite…' : 'Trimite clientului'}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="px-3 text-sm text-gray-500 hover:text-gray-800">
              Renunță
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
