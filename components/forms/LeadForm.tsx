'use client';

import { useRef, useState } from 'react';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';
import {
  getCounties,
  ROOF_TYPES_REZIDENTIAL,
  ROOF_TYPES_COMERCIAL,
  PHASE_TYPES,
  FINANCING_REZIDENTIAL,
  FINANCING_COMERCIAL,
  STORAGE_OPTIONS,
  WALLBOX_OPTIONS,
  TIMELINE_OPTIONS,
} from '@/lib/utils-shared';
import { useSegment } from '@/components/segment/SegmentProvider';
import SponsorBanner from '@/components/sponsor/SponsorBanner';
import { trackEvent } from '@/lib/analytics';

const commercialProjectTypes = [
  { value: 'hala-industriala', label: 'Hală industrială' },
  { value: 'cladire-birouri', label: 'Clădire de birouri' },
  { value: 'parc-logistic', label: 'Parc logistic' },
  { value: 'agricol', label: 'Agricol (fermă, seră, depozit)' },
  { value: 'retail', label: 'Retail (magazin, centru comercial)' },
  { value: 'hotel', label: 'Hotel / Pensiune' },
  { value: 'institutie', label: 'Instituție publică' },
  { value: 'altele', label: 'Altele' },
];

const residentialProjectTypes = [
  { value: 'casa-individuala', label: 'Casă individuală' },
  { value: 'vila', label: 'Vilă' },
  { value: 'casa-vacanta', label: 'Casă de vacanță' },
  { value: 'apartament', label: 'Apartament / bloc' },
  { value: 'altele', label: 'Altele' },
];

interface LeadFormProps {
  preselectedCompany?: string;
  sourcePage?: string;
}

const PHOTO_INBOX = 'contact@instalatori-fotovoltaice.ro';

// Trei pași până la trimitere. Ordinea nu e cea clasică („contactul la final"):
// datele de contact stau al treilea, nu ultimul, pentru că businessul e pe
// leaduri. Cine abandonează la detaliile tehnice a lăsat deja un nume și un
// telefon, deci rămâne o cerere de urmărit; cu contactul la final, fiecare
// abandon ar fi zero. Detaliile tehnice au ieșit cu totul din fluxul principal,
// se strâng după trimitere (vezi secțiunea de îmbogățire mai jos).
const STEPS = [
  { id: 'proiect', label: 'Proiect' },
  { id: 'zona', label: 'Zonă' },
  { id: 'contact', label: 'Contact' },
] as const;

const LAST_STEP = STEPS.length - 1;

// iOS Safari focusează primul câmp invalid la submit, dar nu scrollează fiabil
// până la el: pe telefon, apăsarea butonului părea că nu face nimic. Scrollăm
// noi câmpul în mijlocul ecranului (deasupra barei sticky cu butonul), apoi
// cerem bula nativă de validare; la dropdown-uri focusul deschide și lista.
// scrollTo cu poziție calculată și behavior instant, nu scrollIntoView cu
// smooth: scrollIntoView are propriile capricii pe iOS (fix ce reparăm aici),
// iar globals.css setează scroll-behavior: smooth, care ar anima scroll-ul și
// ar lăsa reportValidity să-l întrerupă cu scroll-ul lui propriu, la mijloc.
function focusField(el: unknown) {
  if (!(el instanceof HTMLElement)) return;
  const rect = el.getBoundingClientRect();
  window.scrollTo({
    top: window.scrollY + rect.top - (window.innerHeight - rect.height) / 2,
    behavior: 'instant',
  });
  const input = el as HTMLInputElement;
  input.focus({ preventScroll: true });
  if (typeof input.reportValidity === 'function' && !input.checkValidity()) {
    input.reportValidity();
  }
}

/** Câmpurile strânse după trimitere. Goale = „nu știu", fără bifă separată. */
const ENRICH_KEYS = [
  'termen',
  'suprafata',
  'putere',
  'tipAcoperis',
  'fazare',
  'stocare',
  'wallbox',
  'finantare',
  'consumLunar',
] as const;

type EnrichKey = (typeof ENRICH_KEYS)[number];

const EMPTY_ENRICH = Object.fromEntries(ENRICH_KEYS.map((k) => [k, ''])) as Record<EnrichKey, string>;

export default function LeadForm({ preselectedCompany, sourcePage = 'cere-oferta' }: LeadFormProps) {
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [leadRef, setLeadRef] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  // Un pas care se demontează și-ar pierde valorile din FormData, deci câmpurile
  // sunt controlate și corpul cererii se construiește din state, nu din formular.
  const [values, setValues] = useState({
    tipProiect: '',
    judet: '',
    localitate: '',
    numeCompanie: '',
    numeContact: '',
    telefon: '',
    email: '',
    mesaj: '',
  });
  const [gdpr, setGdpr] = useState(false);
  const [extra, setExtra] = useState<Record<EnrichKey, string>>(EMPTY_ENRICH);
  const [enrichStatus, setEnrichStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const startedRef = useRef(false);

  const counties = getCounties();
  const { segment } = useSegment();
  const isRezidential = segment === 'rezidential';
  const projectTypes = isRezidential ? residentialProjectTypes : commercialProjectTypes;
  const roofTypes = isRezidential ? ROOF_TYPES_REZIDENTIAL : ROOF_TYPES_COMERCIAL;
  const financingTypes = isRezidential ? FINANCING_REZIDENTIAL : FINANCING_COMERCIAL;

  function set<K extends keyof typeof values>(key: K, value: string) {
    markStarted();
    setValues((v) => ({ ...v, [key]: value }));
  }

  // O singură dată per încărcare: numitorul față de care se citesc pașii.
  function markStarted() {
    if (startedRef.current) return;
    startedRef.current = true;
    trackEvent('lead_form_started', { segment, source_page: sourcePage });
  }

  function completeStep(index: number) {
    trackEvent('lead_step_completed', {
      step: index + 1,
      name: STEPS[index].id,
      segment,
      source_page: sourcePage,
    });
  }

  // Pasul nou începe de sus. `offsetTop` ar fi greșit aici, e relativ la
  // offsetParent, nu la document; rect + scrollY dă poziția reală, iar marja
  // lasă loc antetului sticky.
  function scrollToForm() {
    const el = formRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 96;
    window.scrollTo({ top: Math.max(top, 0), behavior: 'instant' });
  }

  function goNext() {
    const form = formRef.current;
    // noValidate ține bula nativă sub controlul nostru, dar regulile rămân cele
    // de pe câmpuri. Doar pasul curent e montat, deci se validează doar el.
    if (form && !form.checkValidity()) {
      focusField(form.querySelector(':invalid'));
      return;
    }
    completeStep(step);
    setStep((s) => Math.min(s + 1, LAST_STEP));
    scrollToForm();
  }

  function goBack() {
    trackEvent('lead_step_back', { step: step + 1, name: STEPS[step].id, segment });
    setStep((s) => Math.max(s - 1, 0));
    scrollToForm();
  }

  function chooseProjectType(value: string) {
    markStarted();
    setValues((v) => ({ ...v, tipProiect: value }));
    completeStep(0);
    setStep(1);
    scrollToForm();
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    // Enter într-un câmp de text trimite formularul nativ. Pe pașii intermediari
    // asta ar sări peste restul, deci îl tratăm ca pe „Continuă".
    if (step < LAST_STEP) {
      goNext();
      return;
    }

    const form = e.currentTarget;
    if (!form.checkValidity()) {
      focusField(form.querySelector(':invalid'));
      return;
    }

    setStatus('submitting');

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          gdpr: gdpr ? 'on' : '',
          sourcePage,
          preselectedCompany,
          segment,
        }),
      });

      // Serverul numește câmpul lipsă și îl identifică prin `field`: scrollăm și
      // focusăm direct controlul, iar mesajul ajunge și în toast.
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (typeof err.field === 'string') {
          focusField(form.elements.namedItem(err.field));
        }
        throw new Error(typeof err.error === 'string' ? err.error : 'Eroare la trimitere');
      }
      const json = await res.json().catch(() => ({}));

      completeStep(LAST_STEP);
      trackEvent('lead_form_submitted', {
        project_type: values.tipProiect,
        county: values.judet,
        segment,
        source_page: sourcePage,
      });

      setLeadRef(typeof json.id === 'string' ? json.id : null);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setToast({
        message:
          err instanceof Error && err.message !== 'Eroare la trimitere'
            ? err.message
            : 'A apărut o eroare. Vă rugăm încercați din nou.',
        type: 'error',
      });
    }
  }

  const filledExtras = ENRICH_KEYS.filter((k) => extra[k].trim()).length;

  async function handleEnrich() {
    if (!leadRef || !filledExtras) return;
    setEnrichStatus('saving');
    try {
      const res = await fetch('/api/leads/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leadRef, ...extra }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(typeof err.error === 'string' ? err.error : 'Eroare la salvare');
      }
      trackEvent('lead_enrich_submitted', {
        fields: filledExtras,
        segment,
        source_page: sourcePage,
      });
      setEnrichStatus('saved');
    } catch (err) {
      setEnrichStatus('error');
      setToast({
        message: err instanceof Error ? err.message : 'Nu am putut salva detaliile.',
        type: 'error',
      });
    }
  }

  // Uploadul de poze vine DUPĂ trimitere, intenționat: pe mobil un câmp de fișier
  // înainte de submit pierde cereri, iar o cerere fără poze e tot o cerere.
  if (status === 'success') {
    const subject = `Poze pentru cererea mea${leadRef ? ` (ref. ${leadRef})` : ''}`;
    const mailto = `mailto:${PHOTO_INBOX}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
      'Atașez pozele cu acoperișul și cu tabloul electric.\n\n(Nu ștergeți referința din subiect, după ea legăm pozele de cererea dumneavoastră.)',
    )}`;

    const enrichSelects: { name: EnrichKey; label: string; options: { value: string; label: string }[]; hint?: string }[] = [
      { name: 'termen', label: 'Când ați vrea instalarea', options: TIMELINE_OPTIONS.map((o) => ({ value: o.value, label: o.label })) },
      { name: 'tipAcoperis', label: 'Tip acoperiș', options: roofTypes.map((o) => ({ value: o.value, label: o.label })) },
      {
        name: 'fazare',
        label: 'Alimentare electrică',
        options: PHASE_TYPES.map((o) => ({ value: o.value, label: o.label })),
        hint: 'Scrie pe contor sau pe siguranța generală.',
      },
      { name: 'stocare', label: 'Baterie de stocare', options: STORAGE_OPTIONS.map((o) => ({ value: o.value, label: o.label })) },
      { name: 'wallbox', label: 'Stație de încărcare auto', options: WALLBOX_OPTIONS.map((o) => ({ value: o.value, label: o.label })) },
      { name: 'finantare', label: 'Cum finanțați investiția', options: financingTypes.map((o) => ({ value: o.value, label: o.label })) },
    ];

    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
          <h3 className="font-bold text-emerald-900">Cererea a fost trimisă ✓</h3>
          <p className="mt-1 text-sm text-emerald-800">
            Vă contactăm în cel mai scurt timp cu oferte de la firme care acoperă zona dumneavoastră.
          </p>
        </div>

        {/* Îmbogățirea stă inline, nu într-un modal: ecranul ăsta are deja o
            cerere (pozele), iar două cereri suprapuse se anulează reciproc.
            Argumentul e cel adevărat — firmele chiar văd cererea în feedul
            /cereri și decid după ce scrie acolo — nu un procent inventat. */}
        {enrichStatus !== 'saved' && (
          <div className="rounded-xl border border-border bg-white p-6">
            <h3 className="font-bold text-gray-900">Completați cererea, primiți oferte mai potrivite</h3>
            <p className="mt-1 text-sm text-gray-600 leading-relaxed">
              Firmele de instalare văd cererea dumneavoastră într-o listă și aleg pe care o preiau.
              Cu cât știu mai multe dinainte, cu atât oferta pe care o primiți e mai apropiată de
              prețul final și cu atât mai puține întrebări la primul telefon. Toate câmpurile sunt
              opționale, iar cererea este deja înregistrată.
            </p>

            <div className="mt-4 mb-6">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                <span>Cerere completată</span>
                <span className="font-semibold text-gray-700">
                  {filledExtras} din {ENRICH_KEYS.length}
                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${(filledExtras / ENRICH_KEYS.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={isRezidential ? 'Suprafață acoperiș (mp)' : 'Suprafață estimată (mp)'}
                name="suprafata"
                type="number"
                inputMode="numeric"
                placeholder={isRezidential ? 'ex: 60' : 'ex: 2000'}
                value={extra.suprafata}
                onChange={(e) => setExtra((x) => ({ ...x, suprafata: e.target.value }))}
              />
              <Input
                label="Putere dorită (kW)"
                name="putere"
                type="number"
                inputMode="numeric"
                placeholder={isRezidential ? 'ex: 5' : 'ex: 200'}
                value={extra.putere}
                onChange={(e) => setExtra((x) => ({ ...x, putere: e.target.value }))}
              />

              {enrichSelects.map((f) => (
                <div key={f.name}>
                  <Select
                    label={f.label}
                    name={f.name}
                    options={f.options}
                    value={extra[f.name]}
                    onValueChange={(v) => setExtra((x) => ({ ...x, [f.name]: v }))}
                  />
                  {f.hint && <p className="mt-1 text-[11px] text-gray-400">{f.hint}</p>}
                </div>
              ))}

              <div className="sm:col-span-2">
                <Input
                  label="Consum lunar mediu"
                  name="consumLunar"
                  placeholder="ex: 350 lei sau 250 kWh"
                  value={extra.consumLunar}
                  onChange={(e) => setExtra((x) => ({ ...x, consumLunar: e.target.value }))}
                />
                <p className="mt-1 text-[11px] text-gray-400">
                  De pe ultima factură. Ajută instalatorul să dimensioneze sistemul din date reale,
                  nu din estimare.
                </p>
              </div>
            </div>

            <div className="mt-5">
              <Button
                type="button"
                variant="primary"
                onClick={handleEnrich}
                disabled={!filledExtras || enrichStatus === 'saving'}
              >
                {enrichStatus === 'saving' ? 'Se salvează...' : 'Salvează detaliile'}
              </Button>
            </div>
          </div>
        )}

        {enrichStatus === 'saved' && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
            <h3 className="font-bold text-emerald-900">Detaliile au fost salvate ✓</h3>
            <p className="mt-1 text-sm text-emerald-800">
              Firmele văd acum cererea completată.
            </p>
          </div>
        )}

        <div className="rounded-xl border border-border bg-white p-6">
          <p className="font-semibold text-gray-900 text-sm">Mai puteți trimite 2-3 poze</p>
          <p className="mt-1 text-sm text-gray-700 leading-relaxed">
            Una cu acoperișul văzut din exterior, una cu tabloul electric și contorul. Cu ele,
            instalatorii pot calcula montajul fără să mai vină întâi în vizită.
          </p>
          <a
            href={mailto}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
          >
            Trimite pozele pe email
          </a>
        </div>

        {/* Nimic promoțional nu stă lângă formular: pagina are o singură treabă,
            să producă cererea, iar un click pe altceva e o cerere pierdută. După
            trimitere situația se inversează, omul a convertit deja și așteaptă. */}
        <div className="max-w-sm">
          <SponsorBanner position="cere-oferta-confirmare" />
        </div>

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    );
  }

  return (
    <>
      {/* Progres. Pe un formular scurt bara nu e decor: spune din start că sunt
          trei pași, nu cincisprezece câmpuri. */}
      <div className="mb-5">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
          <span className="font-medium text-gray-700">
            Pasul {step + 1} din {STEPS.length}: {STEPS[step].label}
          </span>
          {step > 0 && (
            <button
              type="button"
              onClick={goBack}
              className="text-gray-500 hover:text-gray-900 transition-colors"
            >
              &larr; Înapoi
            </button>
          )}
        </div>
        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-4">
        {step === 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">
              {isRezidential ? 'Ce fel de locuință aveți?' : 'Ce fel de proiect aveți?'}
            </p>
            {/* Carduri, nu dropdown: un dropdown cere deschidere, scroll și
                selecție, un card cere un tap și trece singur mai departe. */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {projectTypes.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => chooseProjectType(t.value)}
                  className={`text-left rounded-lg border px-4 py-3 text-sm font-medium transition-all min-h-[52px] ${
                    values.tipProiect === t.value
                      ? 'border-primary bg-primary/5 text-primary-dark'
                      : 'border-gray-300 bg-white text-gray-900 hover:border-primary/50 hover:bg-primary/5'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <Select
              label="Județ"
              name="judet"
              options={counties.map((c) => ({ value: c, label: c }))}
              required
              value={values.judet}
              onValueChange={(v) => set('judet', v)}
            />
            <div>
              <Input
                label="Localitate"
                name="localitate"
                required
                placeholder={isRezidential ? 'ex: Comuna Berceni' : 'ex: Ploiești'}
                value={values.localitate}
                onChange={(e) => set('localitate', e.target.value)}
              />
              <p className="mt-1 text-[11px] text-gray-400">
                Orașul sau comuna. Firmele estimează deplasarea înainte să vă sune.
              </p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            {isRezidential ? (
              <Input
                label="Nume și prenume"
                name="numeContact"
                required
                autoComplete="name"
                placeholder="Ion Popescu"
                value={values.numeContact}
                onChange={(e) => set('numeContact', e.target.value)}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Nume companie"
                  name="numeCompanie"
                  required
                  autoComplete="organization"
                  placeholder="SC Firma SRL"
                  value={values.numeCompanie}
                  onChange={(e) => set('numeCompanie', e.target.value)}
                />
                <Input
                  label="Nume contact"
                  name="numeContact"
                  required
                  autoComplete="name"
                  placeholder="Ion Popescu"
                  value={values.numeContact}
                  onChange={(e) => set('numeContact', e.target.value)}
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Telefon"
                name="telefon"
                type="tel"
                required
                inputMode="tel"
                autoComplete="tel"
                placeholder="0740 123 456"
                value={values.telefon}
                onChange={(e) => set('telefon', e.target.value)}
              />
              <Input
                label="Email"
                name="email"
                type="email"
                required
                inputMode="email"
                autoComplete="email"
                placeholder={isRezidential ? 'nume@email.ro' : 'contact@firma.ro'}
                value={values.email}
                onChange={(e) => set('email', e.target.value)}
              />
            </div>

            <div>
              <Input
                label="Mesaj (opțional)"
                name="mesaj"
                type="textarea"
                placeholder={
                  isRezidential
                    ? 'Alte detalii utile (ex: acoperiș în două ape, umbrire parțială după-amiaza)...'
                    : 'Descrieți pe scurt proiectul...'
                }
                value={values.mesaj}
                onChange={(e) => set('mesaj', e.target.value)}
              />
              <p className="mt-1 text-[11px] text-gray-400">
                Nu includeți date de contact în mesaj, le colectăm separat în câmpurile de mai sus.
              </p>
            </div>

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="gdpr"
                name="gdpr"
                required
                checked={gdpr}
                onChange={(e) => setGdpr(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="gdpr" className="text-xs text-gray-600 leading-relaxed">
                Sunt de acord cu prelucrarea datelor personale conform{' '}
                <a
                  href="/politica-confidentialitate"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-gray-900"
                >
                  Politicii de Confidențialitate
                </a>
                . Datele vor fi transmise firmelor de instalare care acoperă zona mea și, dacă am
                cerut finanțare printr-un program, unui partener de finanțare, pentru a mă contacta
                cu oferte. *
              </label>
            </div>
          </div>
        )}

        {/* Pe telefon butonul rămâne lipit de baza ecranului cât timp formularul
            e în viewport; gradientul maschează câmpurile care trec pe sub el.
            Marginile negative îl întind până la rama cardului părinte (p-5 pe
            /despre, p-6 aici). Pilula Casă/Firmă e scoasă de pe aceste pagini,
            vezi HIDE_ON în FloatingSegmentToggle.
            Pasul 0 n-are buton: cardurile avansează singure. */}
        {step > 0 && (
          <div className="max-md:sticky max-md:bottom-0 max-md:z-30 max-md:-mx-5 max-md:-mb-5 max-md:px-5 max-md:pt-3 max-md:pb-[max(1.25rem,env(safe-area-inset-bottom))] max-md:bg-linear-to-t from-white via-white/95 to-transparent">
            {step < LAST_STEP ? (
              <Button
                type="button"
                variant="primary"
                size="lg"
                onClick={goNext}
                className="w-full max-md:shadow-lg max-md:shadow-gray-900/15"
              >
                Continuă
              </Button>
            ) : (
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={status === 'submitting'}
                className="w-full max-md:shadow-lg max-md:shadow-gray-900/15"
              >
                {status === 'submitting' ? 'Se trimite...' : 'Trimite Cererea'}
              </Button>
            )}
            <p className="mt-2 text-center text-[11px] text-gray-400">
              Gratuit, fără obligații. Detaliile tehnice le completați după trimitere.
            </p>
          </div>
        )}
      </form>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
