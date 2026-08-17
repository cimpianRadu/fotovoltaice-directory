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

/**
 * Atribuirea: de pe ce pagină a pornit cererea. Butoanele „Cere ofertă" duc pe
 * /cere-oferta?sursa=<slug>, iar valoarea ajunge în coloana K din Sheet, aceeași
 * pe care înainte o umplea mereu literalul „cere-oferta". Până acum nu se putea
 * spune care ghid produce cereri; de aici încolo se poate.
 *
 * Citim direct din window, nu cu useSearchParams: hook-ul ar cere o graniță
 * Suspense pe o pagină altfel statică. Toate apelurile sunt din handlere, deci
 * rulează după hidratare și nu există risc de nepotrivire la randarea pe server.
 */
function resolveSource(fallback: string): string {
  if (typeof window === 'undefined') return fallback;
  const raw = new URLSearchParams(window.location.search).get('sursa');
  const clean = raw?.trim().replace(/[^a-z0-9\-_/]/gi, '').slice(0, 80);
  return clean || fallback;
}

// Patru pași, iar cererea pleacă la ultimul. Ordinea nu e cea clasică
// („contactul la final"): datele de contact stau al treilea, înaintea detaliilor
// tehnice, ca omul să fi trecut deja de partea grea când ajunge la ele.
//
// Pasul 4 conține exact ce cer instalatorii la primul telefon și e integral
// opțional: fiecare câmp are „nu știu", iar butonul de trimitere e activ
// indiferent ce se completează acolo. Așa cererea pleacă mai bogată, fără ca
// vreo întrebare tehnică să poată bloca trimiterea.
const STEPS = [
  { id: 'proiect', label: 'Proiect' },
  { id: 'zona', label: 'Zonă' },
  { id: 'contact', label: 'Contact' },
  { id: 'detalii', label: 'Detalii' },
] as const;

const SUBMIT_STEP = STEPS.length - 1;

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

// Pasul 4, trimis odată cu cererea.
const STEP4_KEYS = ['tipAcoperis', 'putere', 'consumLunar', 'termen', 'finantare'] as const;

// Detaliile secundare, strânse pe ecranul de confirmare lângă trimiterea pozelor.
// Astea chiar merg prin /api/leads/enrich, pentru că vin după salvare.
const PANEL_KEYS = ['suprafata', 'fazare', 'stocare', 'wallbox'] as const;

type Step4Key = (typeof STEP4_KEYS)[number];
type PanelKey = (typeof PANEL_KEYS)[number];

// `putere` și `consumLunar` sunt câmpuri libere, deci n-au opțiune „Nu știu" în
// listă ca dropdown-urile. Bifa o ține local: în Sheet tot celulă goală se
// scrie, fiindcă „nu știu" înseamnă lipsa cifrei, nu un text în coloană.
type UnknownKey = 'putere' | 'consumLunar';

const EMPTY_STEP4 = Object.fromEntries(STEP4_KEYS.map((k) => [k, ''])) as Record<Step4Key, string>;
const EMPTY_PANEL = Object.fromEntries(PANEL_KEYS.map((k) => [k, ''])) as Record<PanelKey, string>;

type Option = { value: string; label: string };
type FieldSpec = { name: string; label: string; options: Option[]; hint?: string };

const opts = (list: readonly { value: string; label: string }[]): Option[] =>
  list.map((o) => ({ value: o.value, label: o.label }));

/** Bara de pași, deasupra formularului. */
function StepBar({ step, onBack }: { step: number; onBack?: () => void }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
        <span className="font-medium text-gray-700">
          Pasul {step + 1} din {STEPS.length}: {STEPS[step].label}
        </span>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
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
  );
}

function Meter({ answered, total }: { answered: number; total: number }) {
  return (
    <div className="mt-4 mb-6">
      <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
        <span>Cerere completată</span>
        <span className="font-semibold text-gray-700">
          {answered} din {total}
        </span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${(answered / total) * 100}%` }}
        />
      </div>
    </div>
  );
}

/** Semnalul că răspunsurile pleacă singure. Fără el, lipsa unui buton derutează. */
function SaveHint({ status }: { status: 'idle' | 'saving' | 'saved' | 'error' }) {
  if (status === 'idle') return null;
  const map = {
    saving: { text: 'Se salvează...', cls: 'text-gray-500' },
    saved: { text: 'Salvat ✓', cls: 'text-emerald-600' },
    error: { text: 'Salvăm mai târziu', cls: 'text-gray-400' },
  } as const;
  const s = map[status];
  return <span className={`shrink-0 text-xs font-medium ${s.cls}`}>{s.text}</span>;
}

function SelectField({
  field,
  value,
  onChange,
}: {
  field: FieldSpec;
  value: string;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div>
      <Select
        label={field.label}
        name={field.name}
        options={field.options}
        value={value}
        onValueChange={(v) => onChange(field.name, v)}
      />
      {field.hint && <p className="mt-1 text-[11px] text-gray-400">{field.hint}</p>}
    </div>
  );
}

/** Câmp liber cu bifă „Nu știu": listele au opțiunea în ele, cifrele n-o au. */
function NumberWithUnknown({
  name,
  label,
  placeholder,
  value,
  unknown,
  onChange,
  onToggle,
  unknownLabel,
  free = false,
}: {
  name: UnknownKey;
  label: string;
  placeholder: string;
  value: string;
  unknown: boolean;
  onChange: (key: string, value: string) => void;
  onToggle: (key: UnknownKey) => void;
  unknownLabel: string;
  free?: boolean;
}) {
  return (
    <div>
      <Input
        label={label}
        name={name}
        type={free ? 'text' : 'number'}
        inputMode={free ? 'text' : 'numeric'}
        placeholder={placeholder}
        value={value}
        disabled={unknown}
        onChange={(e) => onChange(name, e.target.value)}
      />
      <label className="mt-1.5 flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
        <input
          type="checkbox"
          checked={unknown}
          onChange={() => onToggle(name)}
          className="w-3.5 h-3.5 rounded border-gray-300 text-primary focus:ring-primary"
        />
        {unknownLabel}
      </label>
    </div>
  );
}

export default function LeadForm({ preselectedCompany, sourcePage = 'cere-oferta' }: LeadFormProps) {
  // Rezolvată la fiecare folosire, nu memoizată: toate apelurile vin din handlere.
  const src = () => resolveSource(sourcePage);
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
  const [details, setDetails] = useState<Record<Step4Key, string>>(EMPTY_STEP4);
  const [gdpr, setGdpr] = useState(false);
  const [extra, setExtra] = useState<Record<PanelKey, string>>(EMPTY_PANEL);
  const [unknown, setUnknown] = useState<Record<UnknownKey, boolean>>({
    putere: false,
    consumLunar: false,
  });
  const [enrichStatus, setEnrichStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const startedRef = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reportedFields = useRef(0);

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

  function setDetail(key: string, value: string) {
    markStarted();
    setDetails((d) => ({ ...d, [key]: value }));
  }

  function toggleUnknown(key: UnknownKey) {
    setUnknown((u) => ({ ...u, [key]: !u[key] }));
    // Bifa golește câmpul: „nu știu" înseamnă celulă goală, nu text în Sheet.
    if (!unknown[key]) setDetail(key, '');
  }

  // O singură dată per încărcare: numitorul față de care se citesc pașii.
  function markStarted() {
    if (startedRef.current) return;
    startedRef.current = true;
    trackEvent('lead_form_started', { segment, source_page: src() });
  }

  function completeStep(index: number) {
    trackEvent('lead_step_completed', {
      step: index + 1,
      name: STEPS[index].id,
      segment,
      source_page: src(),
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
    setStep((s) => Math.min(s + 1, SUBMIT_STEP));
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
    if (step < SUBMIT_STEP) {
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
          ...details,
          gdpr: gdpr ? 'on' : '',
          sourcePage: src(),
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

      completeStep(SUBMIT_STEP);
      trackEvent('lead_form_submitted', {
        project_type: values.tipProiect,
        county: values.judet,
        segment,
        source_page: src(),
        details_filled: STEP4_KEYS.filter((k) => details[k].trim()).length,
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

  const panelAnswered = PANEL_KEYS.filter((k) => extra[k].trim()).length;

  /**
   * Salvare automată pentru panoul de după trimitere, fără buton. Fiecare
   * răspuns repornește un temporizator scurt și trimite starea curentă;
   * serverul ignoră valorile goale, deci o cursă între două salvări nu poate
   * șterge un câmp completat înainte.
   */
  function scheduleSave(next: Record<PanelKey, string>) {
    if (!leadRef) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void pushEnrich(next), 800);
  }

  async function pushEnrich(next: Record<PanelKey, string>) {
    const filled = PANEL_KEYS.filter((k) => next[k].trim()).length;
    if (!leadRef || !filled) return;
    setEnrichStatus('saving');
    try {
      const res = await fetch('/api/leads/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leadRef, ...next }),
      });
      if (!res.ok) throw new Error('enrich failed');
      // Un eveniment per câmp nou completat, nu per salvare: altfel tastatul
      // într-un câmp liber ar umple Umami cu zgomot.
      if (filled > reportedFields.current) {
        reportedFields.current = filled;
        trackEvent('lead_enrich_submitted', { fields: filled, segment, source_page: src() });
      }
      setEnrichStatus('saved');
    } catch {
      // Cererea e deja salvată, deci un eșec aici nu pierde nimic esențial.
      // Fără toast: omul n-a apăsat nimic, un mesaj de eroare l-ar speria degeaba.
      setEnrichStatus('error');
    }
  }

  function setExtraField(key: string, value: string) {
    setExtra((x) => {
      const next = { ...x, [key]: value } as Record<PanelKey, string>;
      scheduleSave(next);
      return next;
    });
  }

  // Uploadul de poze vine DUPĂ trimitere, intenționat: pe mobil un câmp de fișier
  // înainte de submit pierde cereri, iar o cerere fără poze e tot o cerere.
  if (status === 'success') {
    const subject = `Poze pentru cererea mea${leadRef ? ` (ref. ${leadRef})` : ''}`;
    const mailto = `mailto:${PHOTO_INBOX}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
      'Atașez pozele cu acoperișul și cu tabloul electric.\n\n(Nu ștergeți referința din subiect, după ea legăm pozele de cererea dumneavoastră.)',
    )}`;

    const panelSelects: FieldSpec[] = [
      {
        name: 'fazare',
        label: 'Alimentare electrică',
        options: opts(PHASE_TYPES),
        hint: 'Scrie pe contor sau pe siguranța generală.',
      },
      { name: 'stocare', label: 'Baterie de stocare', options: opts(STORAGE_OPTIONS) },
      { name: 'wallbox', label: 'Stație de încărcare auto', options: opts(WALLBOX_OPTIONS) },
    ];

    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <h3 className="font-bold text-emerald-900">Cererea a fost trimisă ✓</h3>
          <p className="mt-1 text-sm text-emerald-800">
            Vă contactăm în cel mai scurt timp cu oferte de la firme care acoperă zona
            dumneavoastră. Mai jos puteți completa câteva detalii, dar nu e obligatoriu.
          </p>
        </div>

        {/* Restul detaliilor, plus pozele. Fără buton de salvare: fiecare răspuns
            pleacă singur spre cerere, vezi scheduleSave. */}
        <div className="rounded-xl border border-border bg-white p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-gray-900">Mai puteți adăuga</p>
              <p className="mt-1 text-sm text-gray-600 leading-relaxed">
                Firmele văd cererea într-o listă și aleg pe care o preiau. Fiecare detaliu în plus
                scade numărul de întrebări la primul telefon.
              </p>
            </div>
            <SaveHint status={enrichStatus} />
          </div>

          <Meter answered={panelAnswered} total={PANEL_KEYS.length} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={isRezidential ? 'Suprafață acoperiș (mp)' : 'Suprafață estimată (mp)'}
              name="suprafata"
              type="number"
              inputMode="numeric"
              placeholder={isRezidential ? 'ex: 60' : 'ex: 2000'}
              value={extra.suprafata}
              onChange={(e) => setExtraField('suprafata', e.target.value)}
            />
            {panelSelects.map((f) => (
              <SelectField
                key={f.name}
                field={f}
                value={extra[f.name as PanelKey]}
                onChange={setExtraField}
              />
            ))}
          </div>

          <div className="mt-6 pt-5 border-t border-border">
            <p className="font-semibold text-gray-900 text-sm">
              Poze cu acoperișul și tabloul electric
            </p>
            <p className="mt-1 text-sm text-gray-700 leading-relaxed">
              Două-trei poze: una cu acoperișul văzut din exterior, una cu tabloul electric și
              contorul. Cu ele, instalatorii pot calcula montajul fără să mai vină întâi în vizită.
            </p>
            <a
              href={mailto}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
            >
              Trimite pozele pe email
            </a>
          </div>
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

  const step4Selects: FieldSpec[] = [
    { name: 'tipAcoperis', label: 'Tip acoperiș', options: opts(roofTypes) },
    { name: 'termen', label: 'Cât de repede vreți instalarea', options: opts(TIMELINE_OPTIONS) },
    { name: 'finantare', label: 'Cum finanțați investiția', options: opts(financingTypes) },
  ];

  return (
    <>
      {/* Progres. Pe un formular scurt bara nu e decor: spune din start că sunt
          patru pași, nu cincisprezece câmpuri. */}
      <div className="mb-5">
        <StepBar step={step} onBack={step > 0 ? goBack : undefined} />
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
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 leading-relaxed">
              Ultimul pas. Instalatorii întreabă oricum astea la primul telefon, iar un răspuns aici
              vă aduce o ofertă mai apropiată de prețul final. Puteți răspunde
              &bdquo;nu știu&rdquo; oriunde, nimic de aici nu e obligatoriu.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {step4Selects.map((f) => (
                <SelectField
                  key={f.name}
                  field={f}
                  value={details[f.name as Step4Key]}
                  onChange={setDetail}
                />
              ))}

              <NumberWithUnknown
                name="putere"
                label="Putere dorită (kW)"
                placeholder={isRezidential ? 'ex: 5' : 'ex: 200'}
                value={details.putere}
                unknown={unknown.putere}
                onChange={setDetail}
                onToggle={toggleUnknown}
                unknownLabel="Nu știu, aștept recomandarea instalatorului"
              />
              <NumberWithUnknown
                name="consumLunar"
                label="Consum lunar mediu"
                placeholder="ex: 350 lei sau 250 kWh"
                value={details.consumLunar}
                unknown={unknown.consumLunar}
                onChange={setDetail}
                onToggle={toggleUnknown}
                free
                unknownLabel="Nu știu, nu am factura la îndemână"
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
                indicat că doresc finanțare, credit sau un program de sprijin ori că nu am decis
                încă, unui partener de finanțare, pentru a mă contacta cu oferte. Dacă am indicat
                fonduri proprii, cererea nu se transmite unui partener de finanțare. *
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
            {step < SUBMIT_STEP ? (
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
              Gratuit, fără obligații.
            </p>
          </div>
        )}
      </form>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
