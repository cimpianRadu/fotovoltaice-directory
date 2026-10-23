'use client';

import { useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { ClientFeedbackForm } from '@/app/feedback/FeedbackForms';
import {
  ACTIVA_TERMEN_OPTIONS,
  DECID_HELP_OPTIONS,
  FIRM_CONTACT_OPTIONS,
  RENUNT_REASON_OPTIONS,
  YES_NO_OPTIONS,
  type ResponseDetails,
} from '@/lib/client-response-details';

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
  /** „Încă mă decid"/„Nu m-a contactat": firmele numite în email. „Am ales": firmele care au revendicat cererea. */
  firms?: { claimTs: string; name: string }[];
  /** „Nu mai vreau": fără „nu m-a sunat nicio firmă" la cererile „mă informez". */
  showNesunat?: boolean;
  /** „Da, încă vreau oferte": termenul din cerere, ca text. */
  currentTermen?: string;
}

type Option = { value: string; label: string };

function chipClass(selected: boolean): string {
  return `rounded-lg border px-3 py-2 text-sm text-left transition-colors ${
    selected ? 'border-primary bg-amber-50 font-medium text-gray-900' : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
  }`;
}

/** Variante bifabile, una sau mai multe. */
function Chips({ options, selected, onToggle }: { options: readonly Option[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={selected.includes(o.value)} onClick={() => onToggle(o.value)} className={chipClass(selected.includes(o.value))}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** O singură variantă; al doilea click pe ea o deselectează. */
function Pick({ options, value, onChange }: { options: readonly Option[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={value === o.value} onClick={() => onChange(value === o.value ? '' : o.value)} className={chipClass(value === o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Question({ title, hint = '(opțional)', children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset className="mt-6">
      <legend className="text-sm font-medium text-gray-900">
        {title} {hint && <span className="font-normal text-gray-500">{hint}</span>}
      </legend>
      <div className="mt-2">{children}</div>
    </fieldset>
  );
}

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors';

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
    body: 'Nicio problemă, cererea rămâne așa cum e. Dacă vreți, spuneți-ne mai jos cum a fost cu firmele și ce v-ar ajuta.',
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

export default function ResponseConfirm({
  action,
  id,
  token,
  f = '',
  valid,
  firmName = '',
  feedback,
  firms = [],
  showNesunat = true,
  currentTermen = '',
}: ResponseConfirmProps) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [firma, setFirma] = useState('');
  const [motiv, setMotiv] = useState('');
  // Detaliile opționale (12 oct 2026), trimise odată cu confirmarea.
  const [firmContacts, setFirmContacts] = useState<Record<string, string>>(() =>
    // La „Nu m-a contactat nicio firmă" pornim de la ce a spus deja; dacă una totuși l-a sunat, schimbă doar rândul ei.
    action === 'necontactat' ? Object.fromEntries(firms.map((x) => [x.claimTs, 'nu'])) : {},
  );
  const [ajutor, setAjutor] = useState<string[]>([]);
  const [suna, setSuna] = useState(false);
  const [motive, setMotive] = useState<string[]>([]);
  const [altceva, setAltceva] = useState('');
  const [firmaClaim, setFirmaClaim] = useState('');
  const [putere, setPutere] = useState('');
  const [termen, setTermen] = useState('');
  const [contactat, setContactat] = useState('');
  const toggle = (list: string[], set: (v: string[]) => void) => (v: string) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  function details(): ResponseDetails {
    const d: ResponseDetails = {};
    if ((action === 'decid' || action === 'necontactat') && Object.keys(firmContacts).length) d.firme = firmContacts;
    if (action === 'decid') {
      if (ajutor.length) d.ajutor = ajutor;
      if (suna) d.suna = true;
    }
    if (action === 'renunt') {
      if (motive.length) d.motive = motive;
      if (altceva.trim()) d.altceva = altceva.trim();
    }
    if (action === 'aleasa' && firmaClaim && firmaClaim !== 'alta') d.firmaClaim = firmaClaim;
    if (action === 'semnat' && putere.trim()) d.putere = putere.trim();
    if (action === 'activa') {
      if (termen) d.termen = termen;
      if (contactat === 'da' || contactat === 'nu') d.contactat = contactat;
    }
    return d;
  }
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
          detalii: details(),
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
          {action === 'aleasa' && firms.length > 0 && (
            <Question title="Cu ce firmă lucrați?">
              <div className="flex flex-wrap gap-2">
                {[...firms.map((x) => ({ value: x.claimTs, label: x.name })), { value: 'alta', label: 'Altă firmă' }].map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    aria-pressed={firmaClaim === o.value}
                    onClick={() => setFirmaClaim(firmaClaim === o.value ? '' : o.value)}
                    className={chipClass(firmaClaim === o.value)}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              {firmaClaim === 'alta' && (
                <input
                  type="text"
                  value={firma}
                  onChange={(e) => setFirma(e.target.value)}
                  maxLength={120}
                  placeholder="Numele firmei (opțional)"
                  aria-label="Numele firmei"
                  className={`mt-3 ${inputClass}`}
                />
              )}
            </Question>
          )}
          {action === 'aleasa' && firms.length === 0 && (
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
                className={`mt-1.5 ${inputClass}`}
              />
            </label>
          )}
          {(action === 'decid' || action === 'necontactat') && firms.length > 0 && (
            <Question
              title="Ce s-a întâmplat cu fiecare firmă?"
              hint={action === 'necontactat' ? '(dacă una totuși v-a sunat, schimbați aici)' : '(opțional)'}
            >
              <div className="space-y-4">
                {firms.map((x) => (
                  <div key={x.claimTs}>
                    <p className="mb-1.5 text-sm font-semibold text-gray-900">{x.name}</p>
                    <Pick
                      options={FIRM_CONTACT_OPTIONS}
                      value={firmContacts[x.claimTs] ?? ''}
                      onChange={(v) =>
                        setFirmContacts((prev) => {
                          const next = { ...prev };
                          if (v) next[x.claimTs] = v;
                          else delete next[x.claimTs];
                          return next;
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </Question>
          )}
          {action === 'decid' && (
            <>
              <Question title="Ce v-ar ajuta să vă hotărâți?" hint="(opțional, puteți alege mai multe)">
                <Chips options={DECID_HELP_OPTIONS} selected={ajutor} onToggle={toggle(ajutor, setAjutor)} />
              </Question>
              <label className="mt-5 flex items-start gap-3 text-sm text-gray-800 cursor-pointer">
                <input type="checkbox" checked={suna} onChange={(e) => setSuna(e.target.checked)} className="mt-0.5 h-4 w-4 accent-amber-500" />
                <span>Aș vrea să mă sunați, pentru câteva lămuriri.</span>
              </label>
            </>
          )}
          {action === 'renunt' && (
            <>
              <Question title="De ce renunțați?" hint="(opțional, puteți alege mai multe)">
                <Chips
                  options={showNesunat ? RENUNT_REASON_OPTIONS : RENUNT_REASON_OPTIONS.filter((o) => o.value !== 'nesunat')}
                  selected={motive}
                  onToggle={toggle(motive, setMotive)}
                />
              </Question>
              <label className="mt-4 block">
                <span className="text-sm font-medium text-gray-900">
                  Altceva? <span className="font-normal text-gray-500">(opțional)</span>
                </span>
                <textarea
                  value={altceva}
                  onChange={(e) => setAltceva(e.target.value)}
                  maxLength={500}
                  rows={2}
                  className={`mt-1.5 ${inputClass}`}
                />
              </label>
            </>
          )}
          {action === 'semnat' && (
            <label className="mt-5 block">
              <span className="text-sm font-medium text-gray-900">
                Ce putere are sistemul din contract? <span className="font-normal text-gray-500">(opțional)</span>
              </span>
              <div className="mt-1.5 flex items-center gap-2">
                <input
                  type="text"
                  inputMode="decimal"
                  value={putere}
                  onChange={(e) => setPutere(e.target.value)}
                  maxLength={10}
                  placeholder="ex. 10"
                  className={`${inputClass} max-w-[8rem]`}
                />
                <span className="text-sm text-gray-600">kW</span>
              </div>
            </label>
          )}
          {action === 'activa' && (
            <>
              <Question title="Când ați vrea montajul?">
                <Pick options={ACTIVA_TERMEN_OPTIONS} value={termen} onChange={setTermen} />
                {currentTermen && <p className="mt-2 text-xs text-gray-500">În cerere scrie acum: „{currentTermen}”.</p>}
              </Question>
              <Question title="V-a sunat vreo firmă până acum?">
                <Pick options={YES_NO_OPTIONS} value={contactat} onChange={setContactat} />
              </Question>
            </>
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
