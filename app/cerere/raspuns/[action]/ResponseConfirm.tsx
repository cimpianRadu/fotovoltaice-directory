'use client';

import { useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';

interface ResponseConfirmProps {
  action: 'astept' | 'renunt' | 'activa' | 'aleasa';
  id: string;
  token: string;
  valid: boolean;
}

const COPY = {
  astept: {
    title: 'Încă vă informați',
    body: 'Nicio problemă. Nu vă mai scriem decât o dată, peste o lună, ca să vedem dacă s-a schimbat ceva. Între timp, când sunteți gata, butonul din email rămâne valabil.',
    button: 'Confirm, încă mă informez',
    done: 'Am notat. Vă scriem din nou peste o lună, doar dacă nu ne spuneți între timp că sunteți gata.',
  },
  renunt: {
    title: 'Nu mai doriți oferte',
    body: 'Închidem cererea și nu vă mai scriem. Dacă vă răzgândiți, puteți trimite oricând o cerere nouă.',
    button: 'Confirm, închideți cererea',
    done: 'Cererea a fost închisă. Vă mulțumim că ne-ați spus, așa nu deranjăm pe nimeni degeaba.',
  },
  activa: {
    title: 'Încă doriți oferte',
    body: 'Confirmați și cererea dumneavoastră urcă din nou în lista firmelor din județ, marcată ca actualizată azi.',
    button: 'Confirm, încă vreau oferte',
    done: 'Am actualizat cererea. Firmele din județ o văd acum printre cele mai noi.',
  },
  aleasa: {
    title: 'Ați ales deja o firmă',
    body: 'Închidem cererea, ca să nu vă mai sune alte firme. Dacă vreți, ne puteți spune și cu ce firmă lucrați.',
    button: 'Confirm, închideți cererea',
    done: 'Cererea a fost închisă. Vă mulțumim și spor la montaj!',
  },
} as const;

export default function ResponseConfirm({ action, id, token, valid }: ResponseConfirmProps) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [firma, setFirma] = useState('');
  const copy = COPY[action];

  if (!valid) {
    return (
      <>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Legătura nu mai este validă</h1>
        <p className="mt-4 text-gray-700 leading-relaxed">
          Linkul din email a expirat sau a fost modificat. Ne puteți scrie la{' '}
          <a href="mailto:contact@instalatori-fotovoltaice.ro" className="text-primary-dark underline">
            contact@instalatori-fotovoltaice.ro
          </a>{' '}
          și rezolvăm manual.
        </p>
      </>
    );
  }

  async function confirm() {
    setStatus('submitting');
    setError(null);
    try {
      const res = await fetch('/api/leads/raspuns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, token, action, ...(action === 'aleasa' ? { firma } : {}) }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus('idle');
        setError(typeof json.error === 'string' ? json.error : 'A apărut o eroare. Încercați din nou.');
        return;
      }
      setStatus('done');
    } catch {
      setStatus('idle');
      setError('A apărut o eroare. Încercați din nou.');
    }
  }

  return (
    <>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{copy.title}</h1>
      {status === 'done' ? (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800 leading-relaxed">
          {copy.done}
          {(action === 'renunt' || action === 'aleasa') && (
            <p className="mt-3">
              <Link href="/" className="underline hover:no-underline">
                Înapoi la prima pagină
              </Link>
            </p>
          )}
        </div>
      ) : (
        <>
          <p className="mt-4 text-gray-700 leading-relaxed">{copy.body}</p>
          {action === 'aleasa' && (
            <label className="mt-5 block">
              <span className="text-sm font-medium text-gray-900">
                Cu ce firmă lucrați? <span className="font-normal text-gray-500">(opțional)</span>
              </span>
              <input
                type="text"
                value={firma}
                onChange={(e) => setFirma(e.target.value)}
                maxLength={120}
                placeholder="Numele firmei"
                className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
              />
            </label>
          )}
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <div className="mt-6">
            <Button
              type="button"
              variant={action === 'renunt' || action === 'aleasa' ? 'outline' : 'primary'}
              size="lg"
              disabled={status === 'submitting'}
              onClick={() => void confirm()}
            >
              {status === 'submitting' ? 'Se salvează...' : copy.button}
            </Button>
          </div>
        </>
      )}
    </>
  );
}
