'use client';

import { useEffect, useRef, useState } from 'react';
import FollowRequestCTA from '@/components/cont/FollowRequestCTA';
import Input from '@/components/ui/Input';
import PhoneInput, { checkPhoneInput } from '@/components/ui/PhoneInput';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';
import {
  getCounties,
  ROOF_TYPES_REZIDENTIAL,
  ROOF_TYPES_COMERCIAL,
  CONNECTION_OPTIONS,
  PHASE_TYPES,
  FINANCING_REZIDENTIAL,
  BUDGET_COMERCIAL,
  BUDGET_REZIDENTIAL,
  FINANCING_COMERCIAL,
  STORAGE_OPTIONS,
  WALLBOX_OPTIONS,
  TIMELINE_OPTIONS,
  WORK_TYPES,
  isRetrofit,
  CALL_WINDOW_OPTIONS,
  BLOCAJ_OPTIONS,
  isSeInformeaza,
  SCOP_OPTIONS,
  SCOP_INDEPENDENTA_HINT,
} from '@/lib/utils-shared';
import { MAX_REQUESTED_FIRMS } from '@/lib/sheets-shared';
import { DEFAULT_TARIFF_RON_PER_KWH } from '@/lib/pv-constants';
import { useSegment } from '@/components/segment/SegmentProvider';
import SponsorBanner from '@/components/sponsor/SponsorBanner';
import LeadPhotoUpload, { uploadLeadPhoto } from './LeadPhotoUpload';
import LeadPhotoPicker, { type PickedPhoto, releasePhotos } from './LeadPhotoPicker';
import LeadLocationField, { LOCATION_CARD_CLASS, LocationPitch } from './LeadLocationField';
import LocalitateInput from './LocalitateInput';
import AdresaLucrareField from './AdresaLucrareField';
import { trackEvent } from '@/lib/analytics';
import { getAttribution } from '@/lib/attribution';
import {
  COMMERCIAL_PROJECT_TYPES,
  RESIDENTIAL_PROJECT_TYPES,
  segmentForProjectType,
} from '@/lib/project-types';

/** O firmă din director, strict cât îi trebuie formularului ca s-o dea la ales. */
export interface FirmPick {
  slug: string;
  name: string;
  city: string;
  county: string;
  /** Județele declarate ca acoperite, pe lângă cel al sediului. */
  coverage: string[];
}

interface LeadFormProps {
  /** Lista din director, dată de pagina server. Fără ea, blocul de firme lipsește. */
  firms?: FirmPick[];
  /** Slug-ul firmei de pe a cărei pagină a pornit cererea (`/cere-oferta?company=`). */
  preselectedSlug?: string;
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

// Șase pași, iar cererea pleacă la al cincilea. Ordinea nu e cea clasică
// („contactul la final"): datele de contact stau al treilea, înaintea detaliilor
// tehnice, ca omul să fi trecut deja de partea grea când ajunge la ele.
//
// Pasul 2 cere din 11 nov 2026 și adresa exactă (sau locația telefonului),
// obligatoriu: cu ea firma se uită la acoperiș din satelit. Până atunci era
// opțională, după trimitere.
//
// Pasul 4 conține exact ce cer instalatorii la primul telefon; fiecare întrebare
// are ieșire onestă („nu știu"), deci nimic tehnic nu blochează trimiterea.
//
// Pasul 5 (poze + detaliile opționale) stă din 11 nov 2026 ÎNAINTEA trimiterii,
// cu „Sari peste și trimite" la un tap (cerut de Radu): pozele cresc preluările,
// vezi PHOTO_LIFT_PCT. Istoric: din Umami (17-24 aug 2026) 27 de completări ale
// pasului de contact au dat 14 trimiteri, iar opționalele de atunci au fost
// mutate după trimitere; de urmărit în Umami dacă pasul 5 pierde cereri
// (`lead_step_completed` name=detalii față de `lead_form_submitted`).
//
// Pasul 6 vine DUPĂ ce cererea a plecat: ce vrea să rezolve, consum și mesaj.
const STEPS = [
  { id: 'proiect', label: 'Proiect' },
  { id: 'zona', label: 'Zonă' },
  { id: 'contact', label: 'Contact' },
  { id: 'detalii', label: 'Detalii' },
  { id: 'poze', label: 'Poze' },
  { id: 'extra', label: 'Obiectiv' },
] as const;

// Cererea se trimite la „poze"; „extra" e ecran post-trimitere, nu pas de
// formular — navigarea (goNext) nu poate ajunge la el. Atenție la Umami: până
// pe 11 nov 2026 `detalii` era pasul de trimitere; de atunci trimiterea e
// `poze`, iar `lead_form_submitted` rămâne măsura comparabilă în timp.
const SUBMIT_STEP = STEPS.findIndex((s) => s.id === 'poze');
const EXTRA_STEP = STEPS.findIndex((s) => s.id === 'extra');

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

// Detaliile din state-ul `details`, trimise în corpul cererii. `consumLunar` se
// completează însă abia la pasul 6, după trimitere: la POST pleacă gol și
// ajunge în Sheet prin /api/leads/enrich, ca restul detaliilor târzii.
const STEP4_KEYS = [
  'tipLucrare',
  'capacitateBaterie',
  'tipAcoperis',
  'putere',
  'consumLunar',
  'termen',
  'finantare',
  'buget',
  'bransament',
] as const;

// Detaliile secundare, opționale, pe pasul pozelor. Din 11 nov 2026 pleacă în
// corpul cererii (saveLeadToSheet are coloanele lor), nu prin /api/leads/enrich.
const PANEL_KEYS = ['suprafata', 'fazare', 'stocare', 'wallbox'] as const;

type Step4Key = (typeof STEP4_KEYS)[number];
type PanelKey = (typeof PANEL_KEYS)[number];

// `putere` și `consumLunar` cer o cifră, nu o opțiune dintr-o listă, deci n-au
// cum să aibă un „Nu știu" printre valori ca dropdown-urile. Bifa o ține local:
// în Sheet tot celulă goală se scrie, fiindcă „nu știu" înseamnă lipsa cifrei,
// nu un text în coloană.
type UnknownKey = 'putere' | 'consumLunar' | 'capacitateBaterie';

const EMPTY_STEP4 = Object.fromEntries(STEP4_KEYS.map((k) => [k, ''])) as Record<Step4Key, string>;
const EMPTY_PANEL = Object.fromEntries(PANEL_KEYS.map((k) => [k, ''])) as Record<PanelKey, string>;

type Option = { value: string; label: string };
type FieldSpec = { name: string; label: string; options: Option[]; hint?: string; required?: boolean };

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
        required={field.required}
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
  required = false,
}: {
  name: UnknownKey;
  label: string;
  placeholder: string;
  value: string;
  unknown: boolean;
  onChange: (key: string, value: string) => void;
  onToggle: (key: UnknownKey) => void;
  unknownLabel: string;
  /** Cere o cifră SAU bifa. Bifa dezactivează inputul, deci iese din validare. */
  required?: boolean;
}) {
  return (
    <div>
      <Input
        label={label}
        name={name}
        type="number"
        inputMode="numeric"
        placeholder={placeholder}
        value={value}
        disabled={unknown}
        required={required && !unknown}
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

export type ConsumUnit = 'lei' | 'kWh';

// Pragurile de „sigur asta e cifra?", în kWh pe lună. Din 53 de consumuri
// trimise cu unitate aleasă (25 aug – 17 sept 2026), cel mai mic credibil a
// fost 80 kWh, iar două au fost sub prag: „8 kWh" și „50 lei". Sus, cel mai
// mare rezidențial a fost 1.180 kWh; peste 3.000 e mai degrabă totalul pe an.
// Comercialul nu are plafon: acolo au venit și 12.000 kWh pe lună, reale.
const CONSUM_MIN_KWH = 50;
const CONSUM_MAX_KWH_REZIDENTIAL = 3000;

/**
 * Întrebarea de pus când cifra nu pare a unei luni întregi, sau null. Nu e o
 * eroare: casa nouă, nelocuită încă, chiar consumă 8 kWh. De aceea a doua
 * apăsare pe „Salvează" trimite cifra neschimbată.
 */
function consumDubios(valoare: string, unit: ConsumUnit, rezidential: boolean): string | null {
  const n = Number(valoare.replace(',', '.'));
  if (!Number.isFinite(n) || n <= 0) return null;
  const kwh = unit === 'kWh' ? n : n / DEFAULT_TARIFF_RON_PER_KWH;
  const scris = `${valoare} ${unit}`;
  if (kwh < CONSUM_MIN_KWH) {
    return `Ați scris ${scris} pe lună. Cifra nu pare corectă, vă rugăm să verificați pe factură. Dacă e corectă, apăsați din nou pe „Salvează și încheie”.`;
  }
  if (rezidential && kwh > CONSUM_MAX_KWH_REZIDENTIAL) {
    return `Ați scris ${scris} pe lună. Cifra nu pare corectă, vă rugăm să verificați pe factură: poate e consumul pe tot anul. Dacă e corectă, apăsați din nou pe „Salvează și încheie”.`;
  }
  return null;
}

/**
 * Consumul lunar: cifră plus unitatea aleasă explicit, nu text liber. Până pe
 * 25 aug 2026 câmpul era liber, iar în Sheet ajungeau alături „300kw", „500 lei
 * lunar", „170kwh" și „30" — firma care citea cardul nu putea spune dacă e lunar
 * sau anual, în kWh sau în lei, deci nu putea folosi cifra la nimic.
 *
 * Cu unitatea știută, consumul devine singurul reper de dimensionare pe cererile
 * unde omul bifează „nu știu" la putere (57% dintre cele intrate după 18 aug
 * 2026), fiindcă din el iese puterea orientativă de pe cardul din /cereri.
 */
function ConsumField({
  valoare,
  unit,
  unknown,
  onValoare,
  onUnit,
  onToggle,
  avertisment,
}: {
  /** Întrebarea de confirmare la o cifră neverosimilă; vezi `consumDubios`. */
  avertisment?: string | null;
  valoare: string;
  unit: ConsumUnit;
  unknown: boolean;
  onValoare: (value: string) => void;
  onUnit: (unit: ConsumUnit) => void;
  onToggle: () => void;
}) {
  // kWh primul și implicit, ca în widgetul de baterii de pe prima pagină: e
  // cifra exactă de pe factură, în timp ce leii trec printr-o ipoteză de tarif.
  const units: { value: ConsumUnit; label: string; placeholder: string; hint: string }[] = [
    { value: 'kWh', label: 'kWh / lună', placeholder: 'ex: 190', hint: 'Cifra de pe factură.' },
    { value: 'lei', label: 'lei / lună', placeholder: 'ex: 250', hint: 'Convertim la 1,30 lei/kWh.' },
  ];
  const active = units.find((u) => u.value === unit) ?? units[0];

  return (
    <div>
      <label htmlFor="consumLunar" className="block text-sm font-medium text-gray-700 mb-1">
        Consum lunar mediu
      </label>
      <div className="flex gap-2">
        <input
          id="consumLunar"
          name="consumLunar"
          type="number"
          inputMode="numeric"
          min="0"
          placeholder={active.placeholder}
          value={valoare}
          disabled={unknown}
          onChange={(e) => onValoare(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
        />
        <div className="flex shrink-0 rounded-lg border border-gray-300 overflow-hidden">
          {units.map((u) => (
            <button
              key={u.value}
              type="button"
              disabled={unknown}
              aria-pressed={u.value === unit}
              onClick={() => onUnit(u.value)}
              className={`px-3 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:text-gray-300 ${
                u.value === unit
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {u.label}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-1 text-[11px] text-gray-400">{active.hint}</p>
      {avertisment && (
        <p role="alert" className="mt-1.5 rounded-md bg-amber-50 px-2.5 py-2 text-xs text-amber-900">
          {avertisment}
        </p>
      )}
      <label className="mt-1.5 flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
        <input
          type="checkbox"
          checked={unknown}
          onChange={onToggle}
          className="w-3.5 h-3.5 rounded border-gray-300 text-primary focus:ring-primary"
        />
        Nu știu, nu am factura la îndemână
      </label>
    </div>
  );
}

/**
 * Firmele pe care clientul le vrea cu numele, până la MAX_REQUESTED_FIRMS.
 * Există pentru că pe 21 aug 2026 un client din Sibiu a trimis trei cereri
 * identice, câte una de pe pagina fiecărei firme: singura cale de a cere trei
 * firme era să apese de trei ori. Opțional și strâns implicit, ca să nu lungească
 * pasul; se deschide la cerere sau când cererea a pornit de pe pagina unei firme.
 */
function FirmPicker({
  firms,
  judet,
  selected,
  onToggle,
}: {
  firms: FirmPick[];
  judet: string;
  selected: string[];
  onToggle: (slug: string) => void;
}) {
  const [open, setOpen] = useState(selected.length > 0);
  const [showAll, setShowAll] = useState(false);

  const j = judet.trim();
  const inCounty = j ? firms.filter((f) => f.county === j || f.coverage.includes(j)) : [];
  // Sediul în județ primele, apoi alfabetic: firma locală e alegerea cea mai probabilă.
  inCounty.sort(
    (a, b) => Number(b.county === j) - Number(a.county === j) || a.name.localeCompare(b.name, 'ro'),
  );
  // Ce e deja bifat rămâne la vedere chiar dacă nu acoperă județul ales: cererea
  // a pornit de pe pagina firmei, iar omul a ales apoi alt județ. Debifează el.
  const pinned = firms.filter((f) => selected.includes(f.slug) && !inCounty.includes(f));
  const candidates = [...pinned, ...inCounty];
  if (candidates.length === 0) return null;

  const LIMIT = 8;
  const shown = showAll ? candidates : candidates.slice(0, LIMIT);
  const full = selected.length >= MAX_REQUESTED_FIRMS;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-primary-dark hover:underline"
      >
        + Vreau oferte de la anumite firme (opțional)
      </button>
    );
  }

  return (
    <fieldset>
      <legend className="block text-sm font-medium text-gray-700">
        Firme anume <span className="text-gray-400">(opțional)</span>
      </legend>
      <p className="mt-1 text-xs text-gray-500">
        Alegeți până la {MAX_REQUESTED_FIRMS}. Cererea ajunge oricum și la alți instalatori care
        acoperă județul.
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {shown.map((f) => {
          const on = selected.includes(f.slug);
          const blocked = !on && full;
          return (
            <button
              key={f.slug}
              type="button"
              aria-pressed={on}
              disabled={blocked}
              onClick={() => onToggle(f.slug)}
              className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                on
                  ? 'border-primary bg-primary/10 font-semibold text-secondary-dark'
                  : blocked
                    ? 'border-border bg-gray-50 text-gray-400 cursor-not-allowed'
                    : 'border-border bg-white text-gray-700 hover:border-primary/40'
              }`}
            >
              {on && <span aria-hidden="true">✓ </span>}
              {f.name}
              <span className={on ? 'text-secondary-dark/60' : 'text-gray-400'}> · {f.city}</span>
            </button>
          );
        })}
      </div>
      {candidates.length > LIMIT && !showAll && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          className="mt-2 text-xs text-gray-500 hover:text-gray-900"
        >
          Arată toate ({candidates.length})
        </button>
      )}
      <p className="mt-1.5 text-[11px] text-gray-400">
        {selected.length} din {MAX_REQUESTED_FIRMS} alese{full ? ', maximul' : ''}
      </p>
    </fieldset>
  );
}

export default function LeadForm({ firms = [], preselectedSlug, sourcePage = 'cere-oferta' }: LeadFormProps) {
  // Rezolvată la fiecare folosire, nu memoizată: toate apelurile vin din handlere.
  const src = () => resolveSource(sourcePage);
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [leadRef, setLeadRef] = useState<string | null>(null);
  // Tokenul de încărcare a pozelor, emis odată cu cererea. Vezi lib/lead-photos.
  const [photoToken, setPhotoToken] = useState<string>('');
  // Pagina cererii din contul clientului (23 oct 2026). Vine de la /api/leads doar
  // după pornirea contului; până atunci butonul nu apare.
  const [contUrl, setContUrl] = useState<string | null>(null);
  // Doar cu emailurile pornite promitem că linkul vine și pe email.
  const [contEmail, setContEmail] = useState(false);
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
    intervalApel: '',
  });
  const [details, setDetails] = useState<Record<Step4Key, string>>(EMPTY_STEP4);
  // Slug-urile firmelor cerute cu numele; serverul le traduce în nume din director.
  const [firme, setFirme] = useState<string[]>(() =>
    preselectedSlug && firms.some((f) => f.slug === preselectedSlug) ? [preselectedSlug] : [],
  );
  const [gdpr, setGdpr] = useState(false);
  // Locul lucrării (pasul 2). Stă în Neon (lead_locatii), nu în Sheet, deci se
  // salvează după cerere, prin /api/leads/locatie, cu tokenul primit la trimitere.
  const [adresa, setAdresa] = useState('');
  const [coordonate, setCoordonate] = useState('');
  const [locationSaved, setLocationSaved] = useState(false);
  // Pozele alese la pasul 5; urcă după ce cererea e salvată.
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const [uploadNote, setUploadNote] = useState('');
  const [photoFailures, setPhotoFailures] = useState(0);
  const [extra, setExtra] = useState<Record<PanelKey, string>>(EMPTY_PANEL);
  const [unknown, setUnknown] = useState<Record<UnknownKey, boolean>>({
    putere: false,
    consumLunar: false,
    capacitateBaterie: false,
  });
  // `details.consumLunar` ține doar cifra; unitatea stă separat și se lipește de
  // ea la salvare, ca în coloana U să intre „250 lei" sau „190 kWh", nu un număr
  // gol pe care nimeni nu-l poate interpreta.
  const [consumUnit, setConsumUnit] = useState<ConsumUnit>('kWh');
  // Pasul 6 e post-trimitere: cererea există deja în Sheet, ecranul doar mai
  // strânge consumul și mesajul. `extraDone` desparte pasul 6 de confirmare.
  const [extraDone, setExtraDone] = useState(false);
  const [extraStatus, setExtraStatus] = useState<'idle' | 'saving'>('idle');
  // „Ce vă lipsește ca să mergeți mai departe?", doar la „mă informez" (14 sept
  // 2026). Decide emailul de întâmpinare al platformei și ce vede firma pe card.
  const [blocaj, setBlocaj] = useState('');
  const [blocajDetalii, setBlocajDetalii] = useState('');
  // „Ce vreți să rezolvați?" (17 sept 2026), obligatoriu pe pasul 6: firma vede
  // din start ce așteaptă omul. `scopError` apare doar după un „Salvează" gol.
  const [scop, setScop] = useState<string[]>([]);
  const [scopDetalii, setScopDetalii] = useState('');
  const [scopError, setScopError] = useState(false);
  const scopRef = useRef<HTMLFieldSetElement>(null);
  // Consumul pentru care omul a văzut deja întrebarea de confirmare. Ținem
  // valoarea, nu un boolean: dacă schimbă cifra cu alta la fel de ciudată,
  // întrebarea se pune din nou.
  const [consumIntrebat, setConsumIntrebat] = useState('');
  const startedRef = useRef(false);

  const counties = getCounties();
  const { segment, setSegment } = useSegment();
  const isRezidential = segment === 'rezidential';
  const roofTypes = isRezidential ? ROOF_TYPES_REZIDENTIAL : ROOF_TYPES_COMERCIAL;
  const retrofit = isRetrofit(details.tipLucrare);
  const financingTypes = isRezidential ? FINANCING_REZIDENTIAL : FINANCING_COMERCIAL;
  const budgetBands = isRezidential ? BUDGET_REZIDENTIAL : BUDGET_COMERCIAL;

  function set<K extends keyof typeof values>(key: K, value: string) {
    markStarted();
    setValues((v) => ({ ...v, [key]: value }));
  }

  function setDetail(key: string, value: string) {
    markStarted();
    setDetails((d) => ({ ...d, [key]: value }));
  }

  function toggleFirm(slug: string) {
    markStarted();
    setFirme((list) => {
      if (list.includes(slug)) return list.filter((s) => s !== slug);
      return list.length < MAX_REQUESTED_FIRMS ? [...list, slug] : list;
    });
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

  async function goNext() {
    const form = formRef.current;
    // Telefonul are o verificare proprie (PhoneInput), pusă pe câmp ca validare
    // nativă: trece prin același checkValidity și apare în aceeași bulă.
    if (form) await checkPhoneInput(form.elements.namedItem('telefon'));
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
    // Segmentul vine din tipul ales, nu dintr-un comutator separat: de el atârnă
    // tipurile de acoperiș, variantele de finanțare și potrivirea cu firmele.
    const tipSegment = segmentForProjectType(value);
    if (tipSegment && tipSegment !== segment) setSegment(tipSegment);
    setValues((v) => ({ ...v, tipProiect: value }));
    completeStep(0);
    setStep(1);
    scrollToForm();
  }

  // Preselecția din heroul homepage-ului: `/cere-oferta?tip=casa-individuala`.
  // Omul a răspuns deja la prima întrebare acolo, deci formularul se deschide la
  // pasul de zonă. Nu folosim `chooseProjectType`: aia derulează pagina, ceea ce
  // la montare ar smuci ecranul înainte ca omul să apuce să vadă unde a ajuns.
  //
  // `completeStep(0)` se trimite oricum: fără el, pașii din Umami s-ar citi ca și
  // cum toți cei veniți din hero ar fi sărit primul pas, iar pâlnia n-ar mai fi
  // comparabilă cu perioada dinaintea schimbării.
  //
  // Segmentul se aliniază la tip, nu invers. Un link cu `tip` rezidențial și un
  // cookie rămas pe comercial ar da tipuri de acoperiș și finanțări de hală.
  const prefilledRef = useRef(false);
  useEffect(() => {
    if (prefilledRef.current) return;
    const tip = new URLSearchParams(window.location.search).get('tip');
    if (!tip) return;
    const tipSegment = segmentForProjectType(tip);
    if (!tipSegment) return;
    prefilledRef.current = true;
    if (tipSegment !== segment) setSegment(tipSegment);
    markStarted();
    setValues((v) => ({ ...v, tipProiect: tip }));
    completeStep(0);
    setStep(1);
    // Doar la montare: o schimbare ulterioară de segment vine de la om, iar
    // rescrierea tipului i-ar șterge alegerea din formular.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    setUploadNote('');

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          ...details,
          // Detaliile opționale de la pasul 5 (suprafață, alimentare, baterie,
          // stație); goale dacă omul a sărit peste.
          ...extra,
          // Bifa nu ajunge în Sheet (acolo „nu știu" = celulă goală), dar
          // serverul are nevoie de ea ca să deosebească „n-a răspuns" de
          // „a răspuns că nu știe". Vezi validarea din /api/leads.
          putereNecunoscuta: unknown.putere ? 'on' : '',
          gdpr: gdpr ? 'on' : '',
          intervalApel: values.intervalApel,
          sourcePage: src(),
          // Canalul reținut la intrarea în sesiune, nu ce e în URL acum: la pasul
          // 4 al formularului parametrii de campanie au dispărut demult.
          ...getAttribution(),
          // Slug-uri, nu nume: numele se rezolvă pe server din director, ca în
          // Sheet să nu intre text liber din browser.
          firme,
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
        firms_requested: firme.length,
      });
      trackEvent('lead_poze_pas', {
        actiune: photos.length ? 'cu_poze' : 'fara_poze',
        poze: photos.length,
        detalii: PANEL_KEYS.filter((k) => extra[k].trim()).length,
        segment,
      });

      const id = typeof json.id === 'string' ? json.id : null;
      const token = typeof json.photoToken === 'string' ? json.photoToken : '';
      setLeadRef(id);
      setPhotoToken(token);
      setContUrl(typeof json.contUrl === 'string' ? json.contUrl : null);
      setContEmail(json.contEmail === true);

      // De aici cererea e salvată: ce urmează (adresa, pozele) nu o mai poate
      // pierde. Un eșec lasă doar un card de reîncercare pe ecranul următor.
      if (id && token) {
        setUploadNote('Cererea e înregistrată. Salvăm adresa...');
        setLocationSaved(await saveLocation(id, token));

        let failed = 0;
        for (let i = 0; i < photos.length; i++) {
          setUploadNote(
            `Cererea e înregistrată. Se încarcă pozele (${i + 1} din ${photos.length}), nu închideți pagina...`,
          );
          try {
            await uploadLeadPhoto(id, token, photos[i].file);
          } catch (err) {
            console.error('[lead] poza:', err);
            failed++;
          }
        }
        setPhotoFailures(failed);
        releasePhotos(photos);
      } else {
        // Fără token (răspuns vechi din cache, PORTAL_SECRET lipsă) nu avem cu
        // ce salva adresa și pozele; ecranul următor dă varianta pe email.
        setPhotoFailures(photos.length);
      }

      setUploadNote('');
      // Pasul 6 începe de sus, ca orice pas; scrollăm cât formularul mai există.
      scrollToForm();
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

  /** Adresa sau locația, pe cererea abia salvată. O reîncercare, apoi renunță. */
  async function saveLocation(id: string, token: string): Promise<boolean> {
    const body = JSON.stringify({ leadId: id, token, adresa: adresa.trim(), coordonate });
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch('/api/leads/locatie', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        });
        if (res.ok) {
          trackEvent('lead_locatie_salvata', {
            sursa: 'formular',
            adresa: Boolean(adresa.trim()),
            gps: Boolean(coordonate),
          });
          return true;
        }
      } catch (err) {
        console.error('[lead] adresa:', err);
      }
    }
    return false;
  }

  function setExtraField(key: string, value: string) {
    markStarted();
    setExtra((x) => ({ ...x, [key]: value }) as Record<PanelKey, string>);
  }

  // Salvarea pasului 5, pe aceeași rută ca panoul de confirmare: cererea e deja
  // în Sheet, aici doar completăm consumul (col. U) și mesajul (col. J). Un eșec
  // nu blochează nimic — omul merge mai departe, cererea lui există.
  async function saveExtraStep() {
    const consumValoare = unknown.consumLunar ? '' : details.consumLunar.trim();
    const consumLunar = consumValoare ? `${consumValoare} ${consumUnit}` : '';
    const mesaj = values.mesaj.trim();
    if (!scop.length) {
      setScopError(true);
      focusField(scopRef.current);
      return;
    }
    if (consumLunar && consumLunar !== consumIntrebat && consumDubios(consumValoare, consumUnit, isRezidential)) {
      setConsumIntrebat(consumLunar);
      focusField(document.getElementById('consumLunar'));
      return;
    }
    if (!leadRef) {
      setExtraDone(true);
      return;
    }
    setExtraStatus('saving');
    try {
      const res = await fetch('/api/leads/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: leadRef,
          consumLunar,
          mesaj,
          blocaj,
          blocajDetalii: blocaj === 'altceva' ? blocajDetalii.trim() : '',
          scop: scop.join('; '),
          scopDetalii: scop.includes('altceva') ? scopDetalii.trim() : '',
        }),
      });
      if (!res.ok) throw new Error('enrich failed');
      trackEvent('lead_scop', { scop: scop.join(','), segment });
      // Doar la salvare reușită, nu la „sar peste": raportul dintre `extra` și
      // `detalii` din Umami spune câți acceptă pasul opțional.
      completeStep(EXTRA_STEP);
    } catch {
      // Fără toast de eroare: cererea e trimisă, iar un mesaj roșu aici l-ar
      // face pe om să creadă că s-a pierdut tot.
    }
    setExtraStatus('idle');
    setExtraDone(true);
  }

  // Pasul 6, după trimitere: cererea a plecat la pasul 5, deci cine închide
  // pagina aici nu mai pierde nimic. Din 17 sept 2026 „ce vreți să rezolvați"
  // e obligatoriu (fără „sar peste"); consumul și mesajul rămân opționale.
  if (status === 'success' && !extraDone) {
    return (
      <div className="space-y-5">
        <StepBar step={EXTRA_STEP} />

        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 leading-relaxed">
          <span className="font-semibold text-emerald-900">Cererea a fost trimisă ✓</span> Mai
          aveți un pas: spuneți-ne ce vreți să rezolvați, ca firmele să vă facă o ofertă potrivită.
        </div>

        <div className="rounded-xl border border-border bg-white p-5 sm:p-6 space-y-4">
          <fieldset ref={scopRef} tabIndex={-1} className="outline-none">
            <legend className="block text-sm font-medium text-gray-700 mb-1">
              Ce vreți să rezolvați? <span className="text-red-500">*</span>
            </legend>
            <p className="mb-2 text-[11px] text-gray-400">Puteți bifa mai multe.</p>
            <div className="flex flex-wrap gap-1.5">
              {SCOP_OPTIONS.map((o) => {
                const on = scop.includes(o.value);
                return (
                  <button
                    key={o.value}
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      setScopError(false);
                      setScop((cur) => (on ? cur.filter((v) => v !== o.value) : [...cur, o.value]));
                    }}
                    className={`rounded-full border px-3 py-1.5 text-xs text-left transition-colors ${
                      on
                        ? 'border-amber-500 bg-amber-50 text-amber-900 font-medium'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
            {scop.includes('independenta') && (
              <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 leading-relaxed">
                {SCOP_INDEPENDENTA_HINT}
              </p>
            )}
            {scop.includes('altceva') && (
              <div className="mt-3">
                <Input
                  label="Spuneți-ne pe scurt"
                  name="scopDetalii"
                  type="textarea"
                  placeholder="Ce ați vrea să obțineți de la sistem?"
                  value={scopDetalii}
                  onChange={(e) => setScopDetalii(e.target.value)}
                />
              </div>
            )}
            {scopError && (
              <p className="mt-2 text-xs text-red-600">Alegeți cel puțin o variantă.</p>
            )}
          </fieldset>

          {/* Doar cine a bifat „mă informez". Chips, nu dropdown: un singur tap,
              iar răspunsul e ce primește omul de la noi prin email, nu un câmp
              de formular oarecare. */}
          {isSeInformeaza(details.termen) && (
            <fieldset>
              <legend className="block text-sm font-medium text-gray-700 mb-1">
                Ce vă lipsește ca să mergeți mai departe?
              </legend>
              <p className="mb-2 text-[11px] text-gray-400">
                Ați bifat că deocamdată vă informați. Vă trimitem pe email exact ce vă lipsește, iar
                firmele știu să nu vă sune insistent.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {BLOCAJ_OPTIONS.map((o) => {
                  const on = blocaj === o.value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setBlocaj(on ? '' : o.value)}
                      className={`rounded-full border px-3 py-1.5 text-xs text-left transition-colors ${
                        on
                          ? 'border-amber-500 bg-amber-50 text-amber-900 font-medium'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
              {blocaj === 'altceva' && (
                <div className="mt-3">
                  <Input
                    label="Spuneți-ne pe scurt"
                    name="blocajDetalii"
                    type="textarea"
                    placeholder="Ce v-ar ajuta să decideți?"
                    value={blocajDetalii}
                    onChange={(e) => setBlocajDetalii(e.target.value)}
                  />
                </div>
              )}
            </fieldset>
          )}

          <ConsumField
            valoare={details.consumLunar}
            unit={consumUnit}
            unknown={unknown.consumLunar}
            onValoare={(v) => setDetail('consumLunar', v)}
            onUnit={setConsumUnit}
            onToggle={() => toggleUnknown('consumLunar')}
            avertisment={
              !unknown.consumLunar && consumIntrebat === `${details.consumLunar.trim()} ${consumUnit}`
                ? consumDubios(details.consumLunar.trim(), consumUnit, isRezidential)
                : null
            }
          />

          <div>
            <Input
              label="Mesaj pentru instalatori"
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
              Nu includeți date de contact în mesaj, le avem deja din pasul anterior.
            </p>
          </div>

          <Button
            type="button"
            variant="primary"
            size="lg"
            disabled={extraStatus === 'saving'}
            onClick={() => void saveExtraStep()}
            className="w-full"
          >
            {extraStatus === 'saving' ? 'Se salvează...' : 'Salvează și încheie'}
          </Button>
        </div>
      </div>
    );
  }

  // Confirmarea. Pozele, adresa și detaliile opționale s-au strâns înainte de
  // trimitere (11 nov 2026); aici apar doar dacă ceva n-a ajuns, ca reîncercare.
  if (status === 'success') {
    const subject = `Poze pentru cererea mea${leadRef ? ` (ref. ${leadRef})` : ''}`;
    const mailto = `mailto:${PHOTO_INBOX}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
      'Atașez pozele cu acoperișul și cu tabloul electric.\n\n(Nu ștergeți referința din subiect, după ea legăm pozele de cererea dumneavoastră.)',
    )}`;

    const chosenFirms = firms.filter((f) => firme.includes(f.slug)).map((f) => f.name);

    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <h3 className="font-bold text-emerald-900">Cererea a fost trimisă ✓</h3>
          <p className="mt-1 text-sm text-emerald-800">
            {chosenFirms.length > 0 && (
              <>
                Am notat că doriți oferte de la {chosenFirms.join(', ')}.{' '}
              </>
            )}
            Am trimis-o firmelor de instalare din zona dumneavoastră. Cele care o preiau vă
            sună direct.
          </p>
        </div>

        {/* Pozele care n-au urcat la trimitere (internet slab, fișier refuzat).
            Fără token (răspuns vechi din cache) rămâne varianta pe email. */}
        {photoFailures > 0 &&
          (leadRef && photoToken ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-amber-800">
                {photoFailures === 1
                  ? 'O poză n-a ajuns la noi. Încercați din nou:'
                  : `${photoFailures} poze n-au ajuns la noi. Încercați din nou:`}
              </p>
              <LeadPhotoUpload leadId={leadRef} token={photoToken} mailtoFallback={mailto} />
            </div>
          ) : (
            <p className="text-sm text-amber-800">
              Pozele n-au putut fi încărcate.{' '}
              <a href={mailto} className="underline">
                Trimiteți-le pe email
              </a>
              , le legăm noi de cerere.
            </p>
          ))}

        {/* Adresa care n-a putut fi salvată: aceleași valori, gata de retrimis. */}
        {!locationSaved && leadRef && photoToken && (adresa.trim() || coordonate) && (
          <div className={LOCATION_CARD_CLASS}>
            <LocationPitch />
            <p className="mt-2 text-sm font-medium text-amber-800">
              Adresa n-a ajuns la noi. Apăsați „Salvează adresa”.
            </p>
            <div className="mt-4">
              <LeadLocationField
                leadId={leadRef}
                token={photoToken}
                initialAdresa={adresa.trim()}
                initialCoordonate={coordonate}
                unsaved
                sursa="confirmare"
                onSaved={() => setLocationSaved(true)}
              />
            </div>
          </div>
        )}

        {contUrl && <FollowRequestCTA contUrl={contUrl} contEmail={contEmail} leadId={leadRef} />}

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

  const step4Selects: FieldSpec[] = [
    // Prima întrebare a pasului: schimbă înțelesul câmpului de putere de sub ea
    // și, pe /cereri, tot ce ofertează firma. Vezi WORK_TYPES.
    {
      name: 'tipLucrare',
      label: 'Ce lucrare vă trebuie',
      options: opts(WORK_TYPES),
      required: true,
    },
    { name: 'tipAcoperis', label: 'Tip acoperiș', options: opts(roofTypes), required: true },
    // Obligatorii din 18 aug 2026. Sunt primele două întrebări pe care le pune
    // firma care ofertează, iar o cerere fără ele ajunge pe /cereri ca un card
    // gol: județ, tip de casă și nimic din ce decide prețul. Ambele au ieșire
    // onestă în listă („Deocamdată mă informez", „Nu știu încă"), deci nu forțăm
    // pe nimeni să inventeze un răspuns.
    { name: 'termen', label: 'Cât de repede vreți instalarea', options: opts(TIMELINE_OPTIONS), required: true },
    { name: 'finantare', label: 'Cum finanțați investiția', options: opts(financingTypes), required: true },
    // Bugetul orientativ (16 sept 2026): toți instalatorii îl cer la primul
    // telefon. Nu ca să ofereze la maximum, ci ca să aleagă componentele care
    // încap, de exemplu panouri și invertor acum, bateria într-o etapă viitoare.
    {
      name: 'buget',
      label: 'Buget orientativ',
      options: opts(budgetBands),
      required: true,
      hint: 'Ajută firma să aleagă componentele care se încadrează în buget, de exemplu panourile și invertorul acum, bateria mai târziu.',
    },
    // Cerut de instalatori pe 18 aug 2026: fără branșament nu se racordează
    // nimic, iar ei aflau abia la fața locului.
    {
      name: 'bransament',
      label: 'Branșament electric la locul instalării',
      options: opts(CONNECTION_OPTIONS),
      required: true,
      hint: 'Adică există deja contor și contract de energie pe adresa aceea.',
    },
  ];

  return (
    <>
      {/* Progres. Pe un formular scurt bara nu e decor: spune din start că sunt
          cinci pași scurți, nu cincisprezece câmpuri. */}
      <div className="mb-5">
        <StepBar step={step} onBack={step > 0 ? goBack : undefined} />
      </div>

      <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-4">
        {step === 0 && (
          <div className="space-y-5">
            {/* Ambele segmente pe același ecran, din 10 septembrie 2026. Înainte
                lista depindea de un comutator Casă/Firmă din bara de sus, adică
                un om cu hală vedea patru feluri de locuință și trebuia să ghicească
                unde se schimbă. Alegerea de aici stabilește segmentul, iar
                comutatorul a dispărut din tot site-ul.

                Carduri, nu dropdown: un dropdown cere deschidere, scroll și
                selecție, un card cere un tap și trece singur mai departe. */}
            {[
              { titlu: 'Pentru casă', tipuri: RESIDENTIAL_PROJECT_TYPES.filter((t) => t.value !== 'altele') },
              { titlu: 'Pentru firmă', tipuri: COMMERCIAL_PROJECT_TYPES.filter((t) => t.value !== 'altele') },
            ].map((grup) => (
              <div key={grup.titlu}>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  {grup.titlu}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {grup.tipuri.map((t) => (
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
            ))}

            {/* `altele` are aceeași valoare în ambele liste, deci nu poate spune
                singur ce segment e. Rămâne pe cel curent, iar restul întrebărilor
                sunt oricum comune. */}
            <button
              type="button"
              onClick={() => chooseProjectType('altele')}
              className={`w-full text-left rounded-lg border px-4 py-3 text-sm font-medium transition-all min-h-[52px] ${
                values.tipProiect === 'altele'
                  ? 'border-primary bg-primary/5 text-primary-dark'
                  : 'border-gray-300 bg-white text-gray-600 hover:border-primary/50 hover:bg-primary/5'
              }`}
            >
              Altceva
            </button>
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
            <LocalitateInput
              judet={values.judet}
              value={values.localitate}
              onChange={(v) => set('localitate', v)}
              placeholder={isRezidential ? 'ex: Berceni' : 'ex: Ploiești'}
            />
            <AdresaLucrareField
              adresa={adresa}
              coordonate={coordonate}
              onAdresa={(v) => {
                markStarted();
                setAdresa(v);
              }}
              onCoordonate={setCoordonate}
            />
            {/* Aici, nu pe pasul de contact: lista depinde de județ, iar omul
                tocmai l-a ales. Lipsește cu totul când pagina nu dă lista
                (formularul de pe /despre). */}
            {firms.length > 0 && (
              <FirmPicker firms={firms} judet={values.judet} selected={firme} onToggle={toggleFirm} />
            )}
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
              <PhoneInput
                label="Telefon"
                name="telefon"
                required
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

            {/* Opțional deliberat: un câmp obligatoriu în plus pe pasul de contact
                costă mai mult decât aduce. Cine îl completează primește un apel
                când poate răspunde, cine nu, e sunat ca până acum. */}
            <fieldset>
              <legend className="block text-sm font-medium text-gray-700">
                Când vă putem suna? <span className="text-gray-400">(opțional)</span>
              </legend>
              <p className="mt-1 text-xs text-gray-500">
                Instalatorul vede intervalul înainte să vă sune.
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {CALL_WINDOW_OPTIONS.map((o) => {
                  const on = values.intervalApel === o.value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      aria-pressed={on}
                      onClick={() => set('intervalApel', on ? '' : o.value)}
                      className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                        on
                          ? 'border-primary bg-primary/10 font-semibold text-secondary-dark'
                          : 'border-border bg-white text-gray-600 hover:border-primary/40'
                      }`}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 leading-relaxed">
              Instalatorii întreabă oricum astea la primul telefon, iar un răspuns aici
              vă aduce o ofertă mai apropiată de prețul final. Unde nu știți, alegeți
              &bdquo;nu știu&rdquo; sau bifați căsuța: e un răspuns bun, spune firmei de unde
              să pornească discuția.
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

              {/* La retrofit, întrebarea își schimbă înțelesul: nu mai e „ce
                  putere vrei", ci „ce ai deja". Un prosumator care voia doar o
                  baterie n-avea ce răspunde la prima și scria o cifră inventată. */}
              <NumberWithUnknown
                name="putere"
                label={retrofit ? 'Puterea sistemului pe care îl aveți (kW)' : 'Putere dorită (kW)'}
                placeholder={retrofit ? 'ex: 6' : isRezidential ? 'ex: 5' : 'ex: 200'}
                value={details.putere}
                unknown={unknown.putere}
                onChange={setDetail}
                onToggle={toggleUnknown}
                unknownLabel={
                  retrofit ? 'Nu știu ce putere are' : 'Nu știu, aștept recomandarea instalatorului'
                }
                required
              />

              {/* Numai la „doar baterie". Are propriul câmp fiindcă e al doilea
                  număr al cererii, iar până acum clientul îl scria în „Putere",
                  singurul loc liber: un prosumator din București a trecut acolo
                  15, adică bateria pe care o vrea, nu puterea panourilor. */}
              {details.tipLucrare === 'doar-baterie' && (
                <NumberWithUnknown
                  name="capacitateBaterie"
                  label="Ce capacitate de baterie vreți (kWh)"
                  placeholder="ex: 15"
                  value={details.capacitateBaterie}
                  unknown={unknown.capacitateBaterie}
                  onChange={setDetail}
                  onToggle={toggleUnknown}
                  unknownLabel="Nu știu, aștept recomandarea instalatorului"
                />
              )}
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

        {/* Pasul 5: pozele și detaliile opționale, înaintea trimiterii (11 nov
            2026). Ambele butoane trimit cererea; fără poze, butonul spune că
            sare peste, ca nimeni să nu creadă că pozele sunt obligatorii. */}
        {step === SUBMIT_STEP && (
          <div className="space-y-4" data-pas="poze">
            <LeadPhotoPicker photos={photos} onChange={setPhotos} />

            <div className="rounded-xl border border-border bg-white p-5 sm:p-6">
              <p className="font-semibold text-gray-900">
                Alte detalii <span className="font-normal text-gray-400">(opțional)</span>
              </p>
              <p className="mt-1 mb-4 text-sm text-gray-600 leading-relaxed">
                Fiecare detaliu în plus scade numărul de întrebări la primul telefon.
              </p>
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
            </div>
          </div>
        )}

        {/* Pe telefon butonul rămâne lipit de baza ecranului cât timp formularul
            e în viewport; gradientul maschează câmpurile care trec pe sub el.
            Marginile negative îl întind până la rama cardului părinte (p-5 pe
            /despre, p-6 aici).
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
                variant={photos.length ? 'primary' : 'outline'}
                size="lg"
                disabled={status === 'submitting'}
                className={`w-full max-md:shadow-lg max-md:shadow-gray-900/15 ${photos.length ? '' : 'bg-white'}`}
              >
                {status === 'submitting'
                  ? 'Se trimite...'
                  : photos.length
                    ? `Trimite cererea cu ${photos.length === 1 ? 'poza' : `cele ${photos.length} poze`}`
                    : 'Sari peste și trimite cererea'}
              </Button>
            )}
            {uploadNote ? (
              <p className="mt-2 text-center text-xs font-medium text-gray-700" role="status">
                {uploadNote}
              </p>
            ) : (
              <p className="mt-2 text-center text-[11px] text-gray-400">Gratuit, fără obligații.</p>
            )}
          </div>
        )}
      </form>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
