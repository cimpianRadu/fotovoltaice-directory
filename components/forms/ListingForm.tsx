'use client';

import { useState, useEffect, useMemo } from 'react';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';
import { getCounties } from '@/lib/utils';
import { trackEvent } from '@/lib/analytics';
import { getAnreCodeLabel, formatAnreDate, type ResolvedCert } from '@/lib/anre';

const specializationOptions = [
  { value: 'hale-industriale', label: 'Hale industriale' },
  { value: 'parcuri-logistice', label: 'Parcuri logistice' },
  { value: 'cladiri-birouri', label: 'Clădiri de birouri' },
  { value: 'retail', label: 'Retail (magazine, centre comerciale)' },
  { value: 'agricol', label: 'Agricol (ferme, sere)' },
  { value: 'hotel', label: 'HoReCa (hoteluri, pensiuni)' },
];

type FormValues = {
  numeFirma: string;
  cui: string;
  numeContact: string;
  functie: string;
  email: string;
  telefon: string;
  judet: string;
  website: string;
  specializare: string;
  descriere: string;
  gdpr: boolean;
};

const INITIAL: FormValues = {
  numeFirma: '',
  cui: '',
  numeContact: '',
  functie: '',
  email: '',
  telefon: '',
  judet: '',
  website: '',
  specializare: '',
  descriere: '',
  gdpr: false,
};

type AnreCheckState =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'found-active'; firmName: string; certs: ResolvedCert[] }
  | { status: 'found-no-pv'; firmName: string }
  | { status: 'not-found' };

type AnreCheckResponse = {
  matched: boolean;
  firmName?: string;
  certs?: ResolvedCert[];
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Romanian phone: 07XXXXXXXX, 02/03 + 8 digits, or +40 / 0040 prefix.
// Allows spaces / dashes / parens for readability.
const PHONE_RE = /^(?:\+?40|0040|0)\s*[0-9](?:[\s\-()]*[0-9]){8}$/;
const CUI_RE = /^(RO)?\d{2,10}$/i;
const URL_RE = /^https?:\/\/[^\s.]+\.[^\s]{2,}$/i;

function validateField(name: keyof FormValues, value: string | boolean, all: FormValues): string {
  switch (name) {
    case 'numeFirma':
      if (!String(value).trim()) return 'Introduceți numele firmei.';
      if (String(value).trim().length < 2) return 'Numele firmei pare prea scurt.';
      return '';
    case 'cui':
      if (!String(value).trim()) return 'CUI-ul este obligatoriu.';
      if (!CUI_RE.test(String(value).replace(/\s/g, ''))) return 'CUI invalid (ex: RO12345678 sau 12345678).';
      return '';
    case 'numeContact':
      if (!String(value).trim()) return 'Numele persoanei de contact este obligatoriu.';
      return '';
    case 'email':
      if (!String(value).trim()) return 'Email-ul este obligatoriu.';
      if (!EMAIL_RE.test(String(value).trim())) return 'Adresă de email invalidă.';
      return '';
    case 'telefon':
      if (!String(value).trim()) return 'Telefonul este obligatoriu.';
      if (!PHONE_RE.test(String(value).trim())) return 'Număr de telefon invalid (ex: 0740 123 456).';
      return '';
    case 'judet':
      if (!String(value).trim()) return 'Selectați județul sediului social.';
      return '';
    case 'specializare':
      if (!String(value).trim()) return 'Selectați activitatea principală.';
      return '';
    case 'website':
      if (!String(value).trim()) return '';
      if (!URL_RE.test(String(value).trim())) return 'URL invalid (ex: https://firma.ro).';
      return '';
    case 'gdpr':
      if (!all.gdpr) return 'Trebuie să acceptați prelucrarea datelor.';
      return '';
    default:
      return '';
  }
}

export default function ListingForm() {
  const [values, setValues] = useState<FormValues>(INITIAL);
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormValues, boolean>>>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [anreCheck, setAnreCheck] = useState<AnreCheckState>({ status: 'idle' });
  const counties = getCounties();

  const countyOptions = useMemo(
    () => counties.map((c) => ({ value: c, label: c })),
    [counties]
  );

  function setField<K extends keyof FormValues>(name: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [name]: value }));
    // Re-validate eagerly only if the field has been touched (don't shout at the user mid-typing)
    if (touched[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: validateField(name, value as string | boolean, { ...values, [name]: value }),
      }));
    }
  }

  function handleBlur<K extends keyof FormValues>(name: K) {
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, values[name] as string | boolean, values),
    }));
  }

  // Live ANRE lookup whenever firma name + județ are both present (debounced).
  // Hits an internal endpoint so the same registry data the rest of the site uses
  // is the source of truth here, no client-side bundle of anre-atestate.json.
  useEffect(() => {
    const name = values.numeFirma.trim();
    const judet = values.judet.trim();
    if (name.length < 3 || !judet) {
      setAnreCheck({ status: 'idle' });
      return;
    }

    let cancelled = false;
    setAnreCheck({ status: 'checking' });
    const handle = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/anre/lookup?name=${encodeURIComponent(name)}&judet=${encodeURIComponent(judet)}`
        );
        if (!res.ok) throw new Error('lookup failed');
        const data = (await res.json()) as AnreCheckResponse;
        if (cancelled) return;
        if (!data.matched) {
          setAnreCheck({ status: 'not-found' });
        } else if (data.certs && data.certs.length > 0) {
          setAnreCheck({
            status: 'found-active',
            firmName: data.firmName || name,
            certs: data.certs,
          });
        } else {
          setAnreCheck({ status: 'found-no-pv', firmName: data.firmName || name });
        }
      } catch {
        if (!cancelled) setAnreCheck({ status: 'idle' });
      }
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [values.numeFirma, values.judet]);

  function validateAll(): boolean {
    const fields: (keyof FormValues)[] = [
      'numeFirma',
      'cui',
      'numeContact',
      'email',
      'telefon',
      'judet',
      'website',
      'specializare',
      'gdpr',
    ];
    const newErrors: Partial<Record<keyof FormValues, string>> = {};
    for (const f of fields) {
      const err = validateField(f, values[f] as string | boolean, values);
      if (err) newErrors[f] = err;
    }
    setErrors(newErrors);
    setTouched(Object.fromEntries(fields.map((f) => [f, true])));
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validateAll()) {
      setToast({ message: 'Verificați câmpurile marcate cu roșu și încercați din nou.', type: 'error' });
      return;
    }
    setStatus('submitting');

    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          gdpr: values.gdpr ? 'on' : '',
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Eroare la trimitere');
      }

      trackEvent('listing_form_submitted', {
        company_name: values.numeFirma,
        county: values.judet,
        anre_matched: anreCheck.status === 'found-active' ? 'yes' : anreCheck.status === 'found-no-pv' ? 'no-pv' : 'no',
      });

      setStatus('success');
      setToast({
        message: 'Cererea a fost trimisă! Vom reveni cu un răspuns în cel mai scurt timp.',
        type: 'success',
      });
      setValues(INITIAL);
      setTouched({});
      setErrors({});
      setAnreCheck({ status: 'idle' });
    } catch (err) {
      setStatus('error');
      setToast({
        message: err instanceof Error && err.message ? err.message : 'A apărut o eroare. Vă rugăm încercați din nou.',
        type: 'error',
      });
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Numele firmei"
            name="numeFirma"
            required
            placeholder="SC Firma Fotovoltaice SRL"
            value={values.numeFirma}
            onChange={(e) => setField('numeFirma', e.target.value)}
            onBlur={() => handleBlur('numeFirma')}
            error={errors.numeFirma}
            autoComplete="organization"
          />
          <Input
            label="CUI"
            name="cui"
            required
            placeholder="RO12345678"
            value={values.cui}
            onChange={(e) => setField('cui', e.target.value)}
            onBlur={() => handleBlur('cui')}
            error={errors.cui}
            inputMode="text"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Persoana de contact"
            name="numeContact"
            required
            placeholder="Ion Popescu"
            value={values.numeContact}
            onChange={(e) => setField('numeContact', e.target.value)}
            onBlur={() => handleBlur('numeContact')}
            error={errors.numeContact}
            autoComplete="name"
          />
          <Input
            label="Funcție"
            name="functie"
            placeholder="Director, Manager, etc."
            value={values.functie}
            onChange={(e) => setField('functie', e.target.value)}
            autoComplete="organization-title"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Email"
            name="email"
            type="email"
            required
            placeholder="contact@firma.ro"
            value={values.email}
            onChange={(e) => setField('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            error={errors.email}
            inputMode="email"
            autoComplete="email"
          />
          <Input
            label="Telefon"
            name="telefon"
            type="tel"
            required
            placeholder="0740 123 456"
            value={values.telefon}
            onChange={(e) => setField('telefon', e.target.value)}
            onBlur={() => handleBlur('telefon')}
            error={errors.telefon}
            inputMode="tel"
            autoComplete="tel"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Județ (sediu social)"
            name="judet"
            options={countyOptions}
            required
            value={values.judet}
            onValueChange={(v) => {
              setField('judet', v);
              setTouched((prev) => ({ ...prev, judet: true }));
              setErrors((prev) => ({
                ...prev,
                judet: validateField('judet', v, { ...values, judet: v }),
              }));
            }}
            error={errors.judet}
          />
          <Input
            label="Website"
            name="website"
            type="url"
            placeholder="https://firma.ro"
            value={values.website}
            onChange={(e) => setField('website', e.target.value)}
            onBlur={() => handleBlur('website')}
            error={errors.website}
            inputMode="url"
            autoComplete="url"
          />
        </div>

        <Select
          label="Activitate principală"
          name="specializare"
          options={specializationOptions}
          required
          value={values.specializare}
          onValueChange={(v) => {
            setField('specializare', v);
            setTouched((prev) => ({ ...prev, specializare: true }));
            setErrors((prev) => ({
              ...prev,
              specializare: validateField('specializare', v, { ...values, specializare: v }),
            }));
          }}
          error={errors.specializare}
        />

        <AnreStatus state={anreCheck} />

        <Input
          label="Scurtă descriere a firmei (opțional)"
          name="descriere"
          type="textarea"
          placeholder="Experiență, certificări, tipuri de proiecte realizate. Dacă aveți și alte activități care nu apar în lista de mai sus, menționați-le aici."
          value={values.descriere}
          onChange={(e) => setField('descriere', e.target.value)}
        />

        <div>
          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="gdpr-listing"
              name="gdpr"
              checked={values.gdpr}
              onChange={(e) => {
                setField('gdpr', e.target.checked);
                setTouched((prev) => ({ ...prev, gdpr: true }));
                setErrors((prev) => ({
                  ...prev,
                  gdpr: validateField('gdpr', e.target.checked, { ...values, gdpr: e.target.checked }),
                }));
              }}
              className={`mt-1 w-4 h-4 rounded text-primary focus:ring-primary ${
                errors.gdpr ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            <label htmlFor="gdpr-listing" className="text-xs text-gray-600 leading-relaxed">
              Sunt de acord cu prelucrarea datelor transmise în conformitate cu GDPR.
              Datele vor fi folosite pentru verificarea și listarea firmei în directorul Instalatori Fotovoltaice. *
            </label>
          </div>
          {errors.gdpr && <p className="mt-1 ml-6 text-xs text-red-500">{errors.gdpr}</p>}
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={status === 'submitting'}
          className="w-full"
        >
          {status === 'submitting' ? 'Se trimite...' : 'Trimite Cererea de Listare'}
        </Button>
      </form>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}

function AnreStatus({ state }: { state: AnreCheckState }) {
  if (state.status === 'idle') return null;

  if (state.status === 'checking') {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
        <svg className="w-4 h-4 animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Verific firma în registrul ANRE...
      </div>
    );
  }

  if (state.status === 'found-active') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-3 text-sm text-green-800">
        <div className="flex items-start gap-2">
          <svg className="w-4 h-4 mt-0.5 shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="font-medium">Firmă verificată în registrul ANRE</p>
            <p className="text-xs text-green-700 mt-0.5">{state.firmName}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {state.certs.map((c) => (
                <span
                  key={c.code}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-white border border-green-300 text-green-800"
                  title={c.dataExpirare ? `Expiră: ${formatAnreDate(c.dataExpirare)}` : undefined}
                >
                  {getAnreCodeLabel(c.code)}
                  {c.dataExpirare && (
                    <span className="text-green-600 font-normal">· exp. {formatAnreDate(c.dataExpirare)}</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state.status === 'found-no-pv') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-3 text-sm text-amber-900">
        <div className="flex items-start gap-2">
          <svg className="w-4 h-4 mt-0.5 shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
          </svg>
          <div>
            <p className="font-medium">Firma există în registrul ANRE, dar fără atestat PV activ</p>
            <p className="text-xs text-amber-800 mt-0.5">
              {state.firmName} — nu am găsit atestate C2A / C1A / B / Bp / Be active.
              Listarea continuă, dar verificați la <span className="underline">portal.anre.ro</span>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-3 text-sm text-gray-700">
      <div className="flex items-start gap-2">
        <svg className="w-4 h-4 mt-0.5 shrink-0 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
        </svg>
        <div>
          <p className="font-medium text-gray-800">Firma nu apare în registrul ANRE pentru acest județ</p>
          <p className="text-xs text-gray-600 mt-0.5">
            Puteți continua listarea — verificăm manual înainte de publicare. Verificați totuși ortografia
            numelui și județul sediului social.
          </p>
        </div>
      </div>
    </div>
  );
}
