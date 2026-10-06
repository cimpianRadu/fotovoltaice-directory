'use client';

import { useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { ClientFeedbackForm } from '@/app/feedback/FeedbackForms';

type StatusCheckAction = 'semnat' | 'decid' | 'altafirma' | 'necontactat';

interface ResponseConfirmProps {
  action: 'astept' | 'renunt' | 'activa' | 'aleasa' | StatusCheckAction;
  id: string;
  token: string;
  /** La „semnat": revendicarea aleasă, semnată în token. */
  f?: string;
  valid: boolean;
  /** La „semnat": numele firmei. */
  firmName?: string;
  /** Doar la „Ați găsit o ofertă bună?": chestionarul de după confirmare. */
  feedback?: { token: string; done: boolean };
}

const ALTA_FIRMA_OPTIONS = [
  { value: 'altundeva', label: 'Am ales o firmă care nu a venit prin platformă' },
  { value: 'renuntat', label: 'Nu mai fac lucrarea, cel puțin deocamdată' },
] as const;

/** Introducerea chestionarului, după butonul apăsat (aprobate de Radu pe 6 oct 2026). */
const FEEDBACK_INTRO: Record<StatusCheckAction, string> = {
  semnat: 'Felicitări pentru decizie! Ne-ar ajuta mult să aflăm cum a decurs.',
  decid: 'Am notat. Până atunci, ne-ar ajuta să aflăm cum vi s-au părut ofertele de până acum.',
  altafirma: 'Am notat. Ne-ar ajuta să aflăm ce n-a mers, ca să facem platforma mai bună.',
  necontactat: 'Ne pare rău, nu așa ar trebui să meargă. Ne-ar ajuta să aflăm mai multe.',
};

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
  semnat: {
    title: 'Ați semnat cu {firma}',
    body: 'Confirmați și închidem cererea, ca să nu vă mai sune alte firme.',
    button: 'Confirm, am semnat',
    done: 'Am notat. Vă mulțumim și spor la montaj!',
  },
  decid: {
    title: 'Încă vă decideți',
    body: 'Nicio problemă, cererea rămâne așa cum e. Confirmați și vă mai punem câteva întrebări scurte.',
    button: 'Confirm, încă mă decid',
    done: 'Am notat. Vă mulțumim!',
  },
  altafirma: {
    title: 'Ce s-a întâmplat?',
    body: 'Alegeți varianta potrivită și închidem cererea, ca să nu vă mai sune alte firme.',
    button: 'Confirm',
    done: 'Cererea a fost închisă. Vă mulțumim că ne-ați spus!',
  },
  necontactat: {
    title: 'Nu v-a contactat nicio firmă',
    body: 'Confirmați și ne uităm noi ce s-a întâmplat.',
    button: 'Confirm',
    done: 'Am notat. Vă mulțumim că ne-ați spus!',
  },
} as const;

export default function ResponseConfirm({ action, id, token, f = '', valid, firmName = '', feedback }: ResponseConfirmProps) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [firma, setFirma] = useState('');
  const [motiv, setMotiv] = useState('');
  const copy = COPY[action];
  const title = copy.title.replace('{firma}', firmName);
  const statusCheck = action === 'semnat' || action === 'decid' || action === 'altafirma' || action === 'necontactat';

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
    if (action === 'altafirma' && !motiv) {
      setError('Alegeți una dintre variante.');
      return;
    }
    setStatus('submitting');
    setError(null);
    try {
      const res = await fetch('/api/leads/raspuns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          token,
          action,
          ...(action === 'aleasa' ? { firma } : {}),
          ...(action === 'semnat' ? { f } : {}),
          ...(action === 'altafirma' ? { motiv } : {}),
        }),
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

  if (status === 'done' && statusCheck && feedback && !feedback.done) {
    return (
      <>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Mulțumim!</h1>
        <p className="mt-4 text-gray-700 leading-relaxed">
          {FEEDBACK_INTRO[action as StatusCheckAction]} Durează cam două minute.
        </p>
        <div className="mt-6">
          <ClientFeedbackForm id={id} token={feedback.token} />
        </div>
      </>
    );
  }

  return (
    <>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{title}</h1>
      {status === 'done' ? (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800 leading-relaxed">
          {copy.done}
          {(action === 'renunt' || action === 'aleasa' || statusCheck) && (
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
          {action === 'altafirma' && (
            <fieldset className="mt-5 space-y-2">
              <legend className="sr-only">Ce s-a întâmplat?</legend>
              {ALTA_FIRMA_OPTIONS.map((o) => (
                <label
                  key={o.value}
                  className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm cursor-pointer transition-colors ${
                    motiv === o.value ? 'border-primary bg-amber-50 text-gray-900' : 'border-gray-300 text-gray-700 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="motiv"
                    value={o.value}
                    checked={motiv === o.value}
                    onChange={() => {
                      setMotiv(o.value);
                      setError(null);
                    }}
                    className="accent-amber-500"
                  />
                  {o.label}
                </label>
              ))}
            </fieldset>
          )}
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <div className="mt-6">
            <Button
              type="button"
              variant={action === 'renunt' || action === 'aleasa' || action === 'altafirma' ? 'outline' : 'primary'}
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
