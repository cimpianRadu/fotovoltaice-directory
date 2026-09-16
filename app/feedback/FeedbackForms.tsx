'use client';

import { useState } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import {
  DATE_CORECTE_OPTIONS,
  DATE_LIPSA_OPTIONS,
  DATE_UTILE_OPTIONS,
  FIRM_TESTIMONIAL_OPTIONS,
  OFERTE_OPTIONS,
  PRIMUL_CONTACT_OPTIONS,
  SATISFACTIE_VALUES,
  TESTIMONIAL_OPTIONS,
} from '@/lib/feedback-shared';

// Formularele de feedback de după o cerere concretizată. Întrebările cu puține
// variante sunt butoane, nu dropdown: se răspunde dintr-o atingere pe telefon.

type Option = { value: string; label: string };

function Choice({
  label,
  options,
  value,
  onChange,
  required,
  error,
  hint,
}: {
  label: string;
  options: Option[];
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  error?: boolean;
  hint?: string;
}) {
  return (
    <fieldset>
      <legend className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const selected = value === o.value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(o.value)}
              className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                selected
                  ? 'border-primary bg-primary/10 font-semibold text-gray-900'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
              } ${error && !value ? 'border-red-400' : ''}`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </fieldset>
  );
}

// Aceleași butoane, dar se pot bifa mai multe („ce a lipsit din cerere").
function MultiChoice({
  label,
  options,
  value,
  onChange,
  hint,
}: {
  label: string;
  options: Option[];
  value: string[];
  onChange: (v: string[]) => void;
  hint?: string;
}) {
  return (
    <fieldset>
      <legend className="block text-sm font-medium text-gray-700 mb-1.5">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const selected = value.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={selected}
              onClick={() =>
                onChange(selected ? value.filter((v) => v !== o.value) : [...value, o.value])
              }
              className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                selected
                  ? 'border-primary bg-primary/10 font-semibold text-gray-900'
                  : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </fieldset>
  );
}

// Ce anume se publică, spus lângă întrebare, nu doar în termeni: cine bifează
// „da" trebuie să știe exact ce apare. Aceeași listă e în /termeni-conditii.
function PublishNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="-mt-3 text-xs text-gray-500 leading-relaxed">
      {children} Nu publicăm niciodată telefonul, emailul sau adresa exactă. Acordul se poate retrage
      oricând, scriindu-ne la contact@instalatori-fotovoltaice.ro. Detalii în{' '}
      <a href="/termeni-conditii#testimoniale" target="_blank" rel="noopener" className="underline">
        Termeni și condiții
      </a>
      .
    </p>
  );
}

const SATISFACTIE_OPTIONS: Option[] = SATISFACTIE_VALUES.map((v) => ({ value: v, label: v }));

function useSubmit(payload: () => Record<string, unknown>) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done'>('idle');
  const [error, setError] = useState<{ message: string; field?: string } | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setStatus('submitting');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload()),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus('idle');
        setError({
          message: typeof json.error === 'string' ? json.error : 'A apărut o eroare. Încercați din nou.',
          field: typeof json.field === 'string' ? json.field : undefined,
        });
        return;
      }
      setStatus('done');
    } catch {
      setStatus('idle');
      setError({ message: 'A apărut o eroare. Încercați din nou.' });
    }
  }

  return { status, error, submit };
}

export function FeedbackThanks() {
  return (
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
      <h2 className="font-bold text-emerald-900">Vă mulțumim ✓</h2>
      <p className="mt-2 text-sm text-emerald-800 leading-relaxed">
        Am primit răspunsul. Îl citim cu atenție și ne ajută să facem platforma mai bună.
      </p>
    </div>
  );
}

export function ClientFeedbackForm({ id, token }: { id: string; token: string }) {
  const [oferte, setOferte] = useState('');
  const [primulContact, setPrimulContact] = useState('');
  const [satisfactie, setSatisfactie] = useState('');
  const [experienta, setExperienta] = useState('');
  const [imbunatatiri, setImbunatatiri] = useState('');
  const [testimonial, setTestimonial] = useState('');
  const { status, error, submit } = useSubmit(() => ({
    role: 'client',
    id,
    token,
    oferte,
    primulContact: oferte === '0' ? '' : primulContact,
    satisfactie,
    experienta,
    imbunatatiri,
    testimonial,
  }));

  if (status === 'done') return <FeedbackThanks />;

  return (
    <form onSubmit={submit} className="space-y-5 rounded-xl border border-border bg-white p-5 sm:p-6">
      <Choice label="Câte oferte ați primit?" options={OFERTE_OPTIONS} value={oferte} onChange={setOferte} required error={error?.field === 'oferte'} />
      {oferte !== '0' && (
        <Choice
          label="În cât timp v-a contactat prima firmă de la depunerea cererii?"
          options={PRIMUL_CONTACT_OPTIONS}
          value={primulContact}
          onChange={setPrimulContact}
          required
          error={error?.field === 'primulContact'}
        />
      )}
      {/* „Cu ce firmă ați semnat?" a fost scos pe 16 sept 2026: linkul se trimite
          abia după ce știm firma, iar serverul o ia din revendicarea „câștigat". */}
      <Choice
        label="Cât de mulțumit sunteți de platformă?"
        options={SATISFACTIE_OPTIONS}
        value={satisfactie}
        onChange={setSatisfactie}
        required
        error={error?.field === 'satisfactie'}
        hint="1 = deloc mulțumit, 5 = foarte mulțumit"
      />
      <Input
        label="Cum vi s-a părut experiența?"
        name="experienta"
        type="textarea"
        value={experienta}
        onChange={(e) => setExperienta(e.target.value)}
        placeholder="Ce a mers bine, ce nu, cum v-au tratat firmele..."
      />
      <Input
        label="Ce ar trebui să îmbunătățim?"
        name="imbunatatiri"
        type="textarea"
        value={imbunatatiri}
        onChange={(e) => setImbunatatiri(e.target.value)}
        placeholder="Opțional"
      />
      <Choice
        label="Putem publica părerea dumneavoastră pe site și pe rețelele noastre sociale?"
        options={TESTIMONIAL_OPTIONS}
        value={testimonial}
        onChange={setTestimonial}
        required
        error={error?.field === 'testimonial'}
      />
      <PublishNote>
        Dacă alegeți „da", putem publica textul scris mai sus, județul, tipul și puterea sistemului
        și, doar la prima variantă, numele dumneavoastră.
      </PublishNote>
      {error && <p className="text-sm text-red-600">{error.message}</p>}
      <Button type="submit" variant="primary" size="lg" disabled={status === 'submitting'} className="w-full">
        {status === 'submitting' ? 'Se trimite...' : 'Trimite răspunsul'}
      </Button>
    </form>
  );
}

export function FirmFeedbackForm({
  id,
  token,
  firma,
  initialPutere,
}: {
  id: string;
  token: string;
  firma: string;
  initialPutere: string;
}) {
  const [putere, setPutere] = useState(initialPutere);
  const [dateCorecte, setDateCorecte] = useState('');
  const [dateUtile, setDateUtile] = useState('');
  const [dateLipsa, setDateLipsa] = useState<string[]>([]);
  const [satisfactie, setSatisfactie] = useState('');
  const [experienta, setExperienta] = useState('');
  const [imbunatatiri, setImbunatatiri] = useState('');
  const [testimonial, setTestimonial] = useState('');
  const { status, error, submit } = useSubmit(() => ({
    role: 'firma',
    id,
    token,
    firma,
    putere,
    dateCorecte,
    dateUtile,
    dateLipsa,
    satisfactie,
    experienta,
    imbunatatiri,
    testimonial,
  }));

  if (status === 'done') return <FeedbackThanks />;

  return (
    <form onSubmit={submit} className="space-y-5 rounded-xl border border-border bg-white p-5 sm:p-6">
      <Input
        label="Puterea instalată (kW)"
        name="putere"
        type="number"
        inputMode="numeric"
        value={putere}
        onChange={(e) => setPutere(e.target.value)}
        placeholder="ex: 20"
      />
      <Choice
        label="Datele din cerere erau corecte?"
        options={DATE_CORECTE_OPTIONS}
        value={dateCorecte}
        onChange={setDateCorecte}
        required
        error={error?.field === 'dateCorecte'}
      />
      <Choice
        label="Ce ați putut face cu datele din cerere?"
        options={DATE_UTILE_OPTIONS}
        value={dateUtile}
        onChange={setDateUtile}
        required
        error={error?.field === 'dateUtile'}
      />
      <MultiChoice
        label="Ce v-ar fi ajutat să mai știți din cerere?"
        options={DATE_LIPSA_OPTIONS}
        value={dateLipsa}
        onChange={setDateLipsa}
        hint="Puteți bifa mai multe."
      />
      <Choice
        label="Cât de mulțumiți sunteți de platformă?"
        options={SATISFACTIE_OPTIONS}
        value={satisfactie}
        onChange={setSatisfactie}
        required
        error={error?.field === 'satisfactie'}
        hint="1 = deloc mulțumiți, 5 = foarte mulțumiți"
      />
      <Input
        label="Cum vi s-a părut colaborarea?"
        name="experienta"
        type="textarea"
        value={experienta}
        onChange={(e) => setExperienta(e.target.value)}
        placeholder="Ce a mers bine, ce nu..."
      />
      <Input
        label="Ce ar trebui să îmbunătățim?"
        name="imbunatatiri"
        type="textarea"
        value={imbunatatiri}
        onChange={(e) => setImbunatatiri(e.target.value)}
        placeholder="Opțional"
      />
      <Choice
        label="Putem publica părerea dumneavoastră pe site și pe rețelele noastre sociale?"
        options={FIRM_TESTIMONIAL_OPTIONS}
        value={testimonial}
        onChange={setTestimonial}
        required
        error={error?.field === 'testimonial'}
      />
      <PublishNote>
        Dacă alegeți „da", putem publica textul scris mai sus, județul, tipul lucrării și puterea
        instalată și, doar la prima variantă, numele firmei cu link spre profilul ei. Studiile de caz
        cu fotografii se stabilesc separat, în scris.
      </PublishNote>
      {error && <p className="text-sm text-red-600">{error.message}</p>}
      <Button type="submit" variant="primary" size="lg" disabled={status === 'submitting'} className="w-full">
        {status === 'submitting' ? 'Se trimite...' : 'Trimite răspunsul'}
      </Button>
    </form>
  );
}
