'use client';

import { useEffect, useRef, useState } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { trackEvent } from '@/lib/analytics';
import { PORTAL_EMAIL_KEY } from '@/lib/portal-email-handoff';
import { MAX_ACTIVE_CLAIMS_PER_FIRM } from '@/lib/sheets-shared';
import { getAttribution } from '@/lib/attribution';
import { FIRM_SOURCE_OPTIONS, isDoarMontaj } from '@/lib/utils-shared';
import type { FinancingTone } from '@/lib/utils-shared';

export interface LeadCardData {
  id: string;
  tipLabel: string;
  judet: string;
  /** Gata de afișat: „15 kW", „are 6 kW" la retrofit, sau „≈2,3 kW estimat". */
  putereLabel: string;
  /** „≈5-7 kWh necesar" — capacitatea din tabelul de dimensionare, la „doar baterie". */
  bateriaLabel: string;
  tipLucrare: string;
  tipLucrareLabel: string;
  suprafata: string;
  segment: string;
  postedLabel: string;
  ageDays: number;
  mesaj: string;
  acoperisLabel: string;
  fazareLabel: string;
  bransamentLabel: string;
  consumLunar: string;
  finantareLabel: string;
  finantareTone: FinancingTone;
  stocareLabel: string;
  wallboxLabel: string;
  /** Slugul din TIMELINE_OPTIONS; decide grosimea rândului „Vrea instalarea". */
  termen: string;
  termenLabel: string;
  intervalApelLabel: string;
  /** Banda de buget aleasă de client („Nehotărât" la „nu știu"); gol pe cererile vechi. */
  bugetLabel: string;
  /** Ce vrea clientul să rezolve (pasul 5, din 17 sept 2026); gol pe cererile vechi. */
  scopLabel: string;
  arePoze: boolean;
  verificata: boolean;
  /**
   * Clientul a bifat „Deocamdată mă informez” la termen (14 sept 2026). Cardul
   * arată „Urmărește" în loc de „Vreau această cerere"; revendicarea rămâne
   * posibilă, dar ca opțiune secundară. `informezMotiv` = de ce, în cuvintele
   * noastre („așteaptă Casa Verde Baterii"), gol dacă n-a răspuns.
   */
  seInformeaza: boolean;
  informezMotiv: string;
  /** Se informa și a apăsat „sunt gata": cererea e datată de la reactivare. */
  reactivata: boolean;
}

/**
 * Firma logată în portal, de la /api/portal/me. Cu nume și telefon (a mai
 * revendicat), revendicarea și urmărirea se trimit dintr-un click; doar cu
 * email (a intrat pentru alerte), formularul rămâne, cu emailul precompletat.
 */
export interface PortalMe {
  email: string;
  numeFirma: string;
  numeContact: string;
  telefon: string;
  activeClaims?: number;
  maxActiveClaims?: number;
}

interface LeadCardProps {
  lead: LeadCardData;
  initialClaims: number;
  /** Câte firme urmăresc cererea (doar la „se informează"). */
  initialWatches: number;
  maxClaims: number;
  /** Cererea spre care s-a dat click în `?cerere=<id>`: se aduce în ecran și se marchează. */
  focused?: boolean;
  /** Firma logată în portal; null = anonim sau încă neaflat. */
  me?: PortalMe | null;
}

// Punct colorat, nu pastilă: pastilele sunt deja luate de segment, iar asta
// trebuie să se citească dintr-o privire ca semnal separat, nu ca încă o etichetă.
const FINANCING_TONE_STYLES: Record<FinancingTone, { dot: string; text: string }> = {
  ready: { dot: 'bg-emerald-500', text: 'text-emerald-700' },
  credit: { dot: 'bg-sky-500', text: 'text-sky-700' },
  program: { dot: 'bg-amber-500', text: 'text-amber-700' },
  unknown: { dot: 'bg-gray-300', text: 'text-gray-500' },
};

function FinancingLine({ label, tone }: { label: string; tone: FinancingTone }) {
  const style = FINANCING_TONE_STYLES[tone];
  return (
    <p className={`mt-2 flex items-center gap-1.5 text-xs font-medium ${style.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} aria-hidden />
      {label}
    </p>
  );
}

// Termenul, scos din pastilele mici (16 sept 2026, cerere user): alături de
// finanțare e ce decide dacă firma sună azi. Fără a doua scală de culori:
// pusă lângă punctul colorat al finanțării, o culoare pe termen se citea ca
// aceeași dimensiune. Iconița spune urgența (fulgerul din logo la „cât mai
// repede", calendar la lunile de așteptare, „i" la „mă informez", ca badge-ul),
// grosimea textului o întărește.
const TIMELINE_STYLE: Record<string, { text: string; icon: React.ReactNode }> = {
  'cat-mai-repede': {
    text: 'font-semibold text-gray-900',
    icon: <path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H12z" />,
  },
  '1-3-luni': {
    text: 'font-medium text-gray-700',
    icon: (
      <>
        <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
        <path d="M3.5 10h17M8 3v4M16 3v4" />
      </>
    ),
  },
  'peste-3-luni': {
    text: 'text-gray-500',
    icon: (
      <>
        <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
        <path d="M3.5 10h17M8 3v4M16 3v4" />
      </>
    ),
  },
  'ma-informez': {
    text: 'text-gray-500',
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11.2v4.6M12 8.1h.01" />
      </>
    ),
  },
};

function TimelineLine({ slug, label }: { slug: string; label: string }) {
  const style = TIMELINE_STYLE[slug] ?? TIMELINE_STYLE['peste-3-luni'];
  return (
    <p className={`mt-1.5 flex items-center gap-1.5 text-xs ${style.text}`}>
      <svg
        className="h-3.5 w-3.5 shrink-0 text-gray-500"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {style.icon}
      </svg>
      Vrea instalarea: {label.toLowerCase()}
    </p>
  );
}

/**
 * Iconurile badge-urilor, SVG inline pe `currentColor`. Proiectul n-are
 * bibliotecă de iconuri și nu merită una pentru patru forme: un pachet întreg în
 * bundle-ul clientului ar contrazice curățenia făcută pe /cereri în iulie 2026.
 * 12px lângă text de 11px — mai mari trag ochiul de pe cuvânt.
 */
function BadgeIcon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="12"
      height="12"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      {children}
    </svg>
  );
}

const ICON_CASA = (
  <BadgeIcon>
    <path d="M3 11 12 4l9 7" />
    <path d="M6 9.6V20h12V9.6" />
  </BadgeIcon>
);

const ICON_HALA = (
  <BadgeIcon>
    <path d="M4 20V5h8v15" />
    <path d="M12 20V10h8v10" />
    <path d="M2.5 20h19" />
    <path d="M7 8.5h1M7 13h1M16 14h1" />
  </BadgeIcon>
);

const ICON_TELEFON = (
  <BadgeIcon>
    <rect x="7" y="2.5" width="10" height="19" rx="2.2" />
    <path d="M10.6 18.4h2.8" />
  </BadgeIcon>
);

const ICON_POZE = (
  <BadgeIcon>
    <path d="M3 8.8A1.8 1.8 0 0 1 4.8 7h1.9l1.4-2h7.8l1.4 2h1.9A1.8 1.8 0 0 1 21 8.8v8.4A1.8 1.8 0 0 1 19.2 19H4.8A1.8 1.8 0 0 1 3 17.2z" />
    <circle cx="12" cy="13" r="3.2" />
  </BadgeIcon>
);

// Cheia franceză: manoperă. Nu un panou și nu o casă, ca să nu se confunde cu
// „i" în cerc: iconița de informație pe care o știe toată lumea. Ochiul de
// dinainte sugera supraveghere, nu „clientul se documentează".
const ICON_INFORMEAZA = (
  <BadgeIcon>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11.2v4.6" />
    <path d="M12 8.1h.01" />
  </BadgeIcon>
);

// badge-ul de segment de lângă el.
const ICON_MONTAJ = (
  <BadgeIcon>
    <path d="M15.5 3.5a5 5 0 0 0-6.4 6.4L3.6 15.4a2 2 0 0 0 2.8 2.8l5.5-5.5a5 5 0 0 0 6.4-6.4l-3 3-2.8-2.8z" />
  </BadgeIcon>
);

function Badge({
  icon,
  tone,
  title,
  children,
}: {
  icon: React.ReactNode;
  tone: string;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 whitespace-nowrap px-2 py-0.5 rounded-full text-[11px] font-semibold ${tone}`}
    >
      {icon}
      {children}
    </span>
  );
}

/**
 * Ce trimite firma logată, în loc de formular: datele declarate ultima dată.
 * Linkul „altă firmă?" deschide formularul complet, pentru omul de vânzări
 * care revendică de pe contul colegului sau pentru o firmă cu două entități.
 */
function AccountBox({ me, verb, onManual }: { me: PortalMe; verb: string; onManual: () => void }) {
  const line = [me.numeContact, me.telefon].filter(Boolean).join(' · ');
  return (
    <div className="rounded-lg bg-surface border border-border px-4 py-3 text-sm">
      <p className="text-gray-600">
        {verb} ca <strong className="text-gray-900">{me.numeFirma}</strong>
      </p>
      {line && <p className="text-gray-600 mt-0.5">{line}</p>}
      <p className="text-gray-500 mt-0.5 break-all">{me.email}</p>
      <button
        type="button"
        onClick={onManual}
        className="mt-2 text-xs text-gray-500 underline hover:text-gray-900"
      >
        Altă firmă sau alte date? Completează manual
      </button>
    </div>
  );
}

/**
 * Puntea de la „am revendicat" la „am cont", pe ecranul de confirmare
 * (14 sept 2026).
 *
 * De ce aici și nu în formular: modalul pierde deja 59% dintre firme între
 * deschidere și trimitere (Umami, 30 zile la 7 sept), deci nu i se mai adaugă
 * text înainte de buton. După trimitere însă firma tocmai ne-a dat emailul cu
 * care se face contul, iar contul nu mai e o pagină despre care trebuie să
 * afle de undeva: e pasul următor, cu emailul ei precompletat în link.
 *
 * Avantajele sunt scrise în ordinea utilității pentru cine tocmai a revendicat:
 * datele clientului (le așteaptă acum), alertele pe județ (singurul lucru care
 * aduce cererea următoare fără să stea pe feed), statusurile (eliberează locul).
 */
function PortalNextStep({
  email,
  hasAccount,
  source,
  arePoze,
  judet,
}: {
  email: string;
  hasAccount: boolean;
  source: 'revendicare' | 'urmarire';
  arePoze: boolean;
  judet: string;
}) {
  if (hasAccount) {
    return (
      <p className="mt-3 text-xs text-gray-600 leading-relaxed">
        Cererea apare în{' '}
        <a
          href="/portal"
          onClick={() => trackEvent('portal_cta_click', { source, state: 'logat' })}
          className="font-medium text-primary-dark underline hover:no-underline"
        >
          portalul tău
        </a>
        . Dacă n-ai bifat încă județele pentru{' '}
        <a
          href="/portal#alerte"
          onClick={() => trackEvent('portal_cta_click', { source, state: 'logat_alerte' })}
          className="font-medium text-primary-dark underline hover:no-underline"
        >
          alerte pe email
        </a>
        , o faci în 30 de secunde și afli de cererile din {judet} fără să mai intri pe feed.
      </p>
    );
  }

  return (
    <div className="mt-4 rounded-xl border-2 border-primary bg-primary/5 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary-dark">
        Pasul următor
      </p>
      <h4 className="mt-1 font-bold text-gray-900">Intră în portal cu același email</h4>
      <p className="mt-1 text-sm text-gray-700 leading-relaxed">
        Contul e gratuit și n-are parolă: primești un cod pe{' '}
        {email ? <strong className="break-words">{email}</strong> : 'emailul firmei'} și ești
        înăuntru. Acolo ai:
      </p>
      <ul className="mt-3 space-y-2 text-sm text-gray-700">
        {[
          source === 'revendicare'
            ? `Datele complete ale clientului${arePoze ? ' și pozele trimise de el' : ''}, fără să te mai sunăm.`
            : 'Cererile pe care le urmărești și cele revendicate, într-un singur loc.',
          `Alerte pe email la fiecare cerere nouă din ${judet} și din celelalte județe pe care le bifezi, în momentul în care intră.`,
          'Statusul fiecărei cereri și notele tale, ca să nu te mai sunăm degeaba. Când renunți la o cerere, locul se eliberează pe loc.',
        ].map((t) => (
          <li key={t} className="flex gap-2">
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
              className="mt-0.5 shrink-0 text-primary-dark"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
            <span className="leading-relaxed">{t}</span>
          </li>
        ))}
      </ul>
      <Button
        href="/portal/login"
        variant="primary"
        className="mt-4 w-full"
        onClick={() => {
          // Precompletarea trece prin sessionStorage, nu prin query string:
          // emailul firmei n-are ce căuta în URL-ul trimis la Umami sau în
          // logurile serverului. Cheia e citită și ștearsă de LoginForm.
          try {
            if (email) sessionStorage.setItem(PORTAL_EMAIL_KEY, email);
          } catch {
            /* private mode: se tastează manual, nu e nimic de reparat */
          }
          trackEvent('portal_cta_click', { source, state: 'anonim' });
        }}
      >
        Intră cu emailul firmei
      </Button>
    </div>
  );
}

/**
 * Semnul întrebării de lângă cele două butoane ale unei cereri pe care clientul
 * se informează (14 sept 2026). Cardul are acum două acțiuni care sună la fel
 * pentru cine intră prima oară („o urmăresc" vs „vreau omul"), dar care costă
 * diferit: una e un email, cealaltă consumă un loc din cele trei și ne pune să
 * sunăm clientul. Diferența nu încape în eticheta butonului și nu merită încă un
 * paragraf pe fiecare card, deci stă sub un (i).
 *
 * Se deschide la hover ȘI la click, fiindcă pe telefon hoverul nu există, iar
 * pe /cereri majoritatea firmelor vin de pe telefon. `onFocus`/`onBlur` îl fac
 * accesibil din tastatură; Escape îl închide.
 */
function ActionsInfo({ maxClaims }: { maxClaims: number }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  // Ce a atins ultima oară butonul. Pe telefon Chrome trimite un `mouseenter`
  // sintetic înaintea clickului, deci un simplu toggle pe click ar fi deschis
  // tooltipul cu hoverul fals și l-ar fi închis imediat cu clickul: pe mobil nu
  // se deschidea deloc. Hoverul rămâne doar pentru mouse, atingerea comută.
  const pointer = useRef<string>('mouse');

  // Pe atingere nu există „ies cu mouse-ul de pe buton": fără asta, tooltipurile
  // deschise rămân deschise pe toate cardurile atinse.
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [open]);

  return (
    <div ref={wrapRef} className="relative flex justify-center">
      <button
        type="button"
        aria-expanded={open}
        aria-label="Ce înseamnă fiecare buton"
        onPointerDown={(e) => {
          // `pointerdown` e sursa sigură pentru felul atingerii: `pointerenter`
          // ajunge la React doar prin `pointerover`, deci nu e garantat.
          pointer.current = e.pointerType;
        }}
        onPointerEnter={(e) => {
          if (e.pointerType === 'mouse') setOpen(true);
        }}
        onPointerLeave={(e) => {
          if (e.pointerType === 'mouse') setOpen(false);
        }}
        onClick={() => {
          if (pointer.current !== 'mouse') setOpen((o) => !o);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-gray-500 transition-colors hover:text-gray-900"
      >
        <svg
          viewBox="0 0 24 24"
          width="13"
          height="13"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
        Ce înseamnă fiecare?
      </button>
      {open && (
        <div
          role="tooltip"
          className="absolute top-full left-1/2 z-20 mt-2 w-72 max-w-[calc(100vw-3rem)] -translate-x-1/2 rounded-xl border border-border bg-white p-3 text-left text-xs leading-relaxed text-gray-600 shadow-lg"
        >
          <p>
            <strong className="text-gray-900">Urmărește cererea</strong> — primești un singur
            email, în momentul în care clientul spune că e gata de oferte, înaintea alertelor pe
            județ. Nu ocupă loc, nu te sunăm și nu primești datele clientului.
          </p>
          <p className="mt-2">
            <strong className="text-gray-900">Vreau să contactez persoana</strong> — revendici
            cererea acum și primești în portal numele, telefonul și adresa clientului. Ocupă unul
            din cele {maxClaims} locuri, deși clientul a spus că deocamdată se informează.
          </p>
        </div>
      )}
    </div>
  );
}

function SegmentBadge({ segment }: { segment: string }) {
  const rez = segment === 'rezidential';
  return (
    <Badge
      icon={rez ? ICON_CASA : ICON_HALA}
      tone={rez ? 'bg-emerald-50 text-emerald-700' : 'bg-primary/10 text-primary-dark'}
    >
      {rez ? 'Rezidențial' : 'Comercial'}
    </Badge>
  );
}

export default function LeadCard({
  lead,
  initialClaims,
  initialWatches,
  maxClaims,
  focused,
  me = null,
}: LeadCardProps) {
  const [claims, setClaims] = useState(initialClaims);
  // Feedback instalatori, 14 sept 2026: cine are cont nu mai retastează firma,
  // contactul și telefonul la fiecare revendicare. `manual` = „altă firmă?",
  // deschide formularul complet; se resetează și la o sesiune expirată.
  const accountReady = Boolean(me?.numeFirma && me?.telefon);
  const [manual, setManual] = useState(false);
  const fromAccount = accountReady && !manual;
  const [modalOpen, setModalOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [error, setError] = useState<string | null>(null);
  // Urmărirea, la „se informează": modal separat, cu două câmpuri, fără
  // telefonul nostru de confirmare. Vezi /api/urmariri.
  const [watches, setWatches] = useState(initialWatches);
  const [watchOpen, setWatchOpen] = useState(false);
  const [watchStatus, setWatchStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [watchError, setWatchError] = useState<string | null>(null);
  // „Cum ai aflat de noi?", opțional. Chips, nu dropdown: modalul pierde deja
  // 59% dintre firme între deschidere și trimitere (Umami, 30 zile la 7 sept),
  // un câmp în plus trebuie să coste un singur tap sau nimic.
  const [cumAflat, setCumAflat] = useState('');
  // Emailul cu care a plecat revendicarea/urmărirea: cu el se precompletează
  // linkul spre /portal/login pe ecranul de confirmare, ca firma să nu-l mai
  // tasteze o dată (și să nu greșească alt email decât cel din revendicare).
  const [emailFolosit, setEmailFolosit] = useState('');
  // Firma cu cont în portal nu mai primește apelul de confirmare (15 sept
  // 2026), deci ecranul de confirmare îi scrie altceva. Adevărul îl știe doar
  // serverul (jurnalul de acces), nu sesiunea din pagină: o firmă cu cont poate
  // revendica delogată, din feed.
  const [hasAccount, setHasAccount] = useState(false);

  const full = claims >= maxClaims;
  const slotsLeft = maxClaims - claims;
  const claimedByMe = status === 'success';
  const watchedByMe = watchStatus === 'success';
  // Pe cererile „se informează" bara de locuri era ascunsă cu totul, așa că o
  // revendicare reală devenea invizibilă în feed (Galați, 17 sept 2026: firma
  // a luat cererea, cardul arăta în continuare „nimeni nu urmărește").
  const showSlots = !lead.seInformeaza || claims > 0;

  // Cardul venit prin link direct se aduce singur în ecran. `block: 'center'`,
  // nu 'start': pe telefon un card lipit de marginea de sus arată ca și cum ar
  // fi tăiat, iar aici tocmai vrem să se vadă că e cardul cerut. Fără
  // `behavior`, ca să respecte `scroll-behavior: smooth` din globals.css și
  // setarea de mișcare redusă a vizitatorului.
  const cardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!focused) return;
    cardRef.current?.scrollIntoView({ block: 'center' });
  }, [focused]);

  // Modal: Escape închide, scroll-ul paginii e blocat cât e deschis.
  const anyModal = modalOpen || watchOpen;
  useEffect(() => {
    if (!anyModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setModalOpen(false);
        setWatchOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [anyModal]);

  function handleWatchOpen() {
    setWatchOpen(true);
    setWatchError(null);
    trackEvent('lead_watch_opened', { county: lead.judet, project_type: lead.tipLabel });
  }

  async function handleWatchSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setWatchStatus('submitting');
    setWatchError(null);
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const res = await fetch('/api/urmariri', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, leadId: lead.id, fromAccount }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (json.needsForm) setManual(true);
        setWatchStatus('idle');
        setWatchError(json.error || 'A apărut o eroare. Încearcă din nou.');
        return;
      }
      trackEvent('lead_watch_submitted', { county: lead.judet, project_type: lead.tipLabel });
      setEmailFolosit(typeof data.email === 'string' ? data.email : me?.email || '');
      if (!json.duplicate) setWatches((n) => n + 1);
      setWatchStatus('success');
    } catch {
      setWatchStatus('idle');
      setWatchError('A apărut o eroare. Încearcă din nou.');
    }
  }

  function handleOpen() {
    setModalOpen(true);
    setError(null);
    trackEvent('lead_claim_opened', { county: lead.judet, project_type: lead.tipLabel });
  }

  // Firma logată cu datele deja știute revendică din card: o confirmare pe loc,
  // fără modal (feedback 17 sept 2026). Confirmarea rămâne, pentru că o
  // atingere greșită pe telefon ar ocupa unul din cele 3 locuri ale cererii.
  const [quickOpen, setQuickOpen] = useState(false);

  function startClaim() {
    if (!fromAccount) {
      handleOpen();
      return;
    }
    setQuickOpen(true);
    setError(null);
    trackEvent('lead_claim_opened', { county: lead.judet, project_type: lead.tipLabel });
  }

  async function quickClaim() {
    setStatus('submitting');
    setError(null);
    try {
      const res = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id, fromAccount: true, ...getAttribution() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (json.full) setClaims(maxClaims);
        setStatus('idle');
        // Sesiune expirată sau fără date de firmă: formularul complet preia de aici.
        if (json.needsForm) {
          setManual(true);
          setQuickOpen(false);
          setModalOpen(true);
        }
        setError(json.error || 'A apărut o eroare. Încearcă din nou.');
        return;
      }
      trackEvent('lead_claim_submitted', {
        county: lead.judet,
        project_type: lead.tipLabel,
        cum_aflat: 'din_cont',
      });
      if (typeof json.claims === 'number') setClaims(json.claims);
      setEmailFolosit(me?.email || '');
      setHasAccount(true);
      setQuickOpen(false);
      setStatus('success');
    } catch {
      setStatus('idle');
      setError('A apărut o eroare. Încearcă din nou.');
    }
  }

  const quickBox = quickOpen && me && (
    <div className="rounded-lg border border-primary/40 bg-primary/5 p-3 text-sm">
      <p className="text-gray-700">
        Revendici ca <strong className="text-gray-900">{me.numeFirma}</strong>
        {me.telefon ? ` · ${me.telefon}` : ''}
      </p>
      <p className="mt-0.5 text-xs text-gray-500">
        Datele clientului apar în contul tău după aprobare.
      </p>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      <div className="mt-3 flex gap-2">
        <Button
          variant="primary"
          onClick={quickClaim}
          disabled={status === 'submitting'}
          className="flex-1"
        >
          {status === 'submitting' ? 'Se trimite...' : 'Confirmă'}
        </Button>
        <Button
          variant="outline"
          onClick={() => setQuickOpen(false)}
          disabled={status === 'submitting'}
        >
          Anulează
        </Button>
      </div>
      <button
        type="button"
        onClick={() => {
          setQuickOpen(false);
          setManual(true);
          handleOpen();
        }}
        className="mt-2 text-xs text-gray-500 underline hover:text-gray-900"
      >
        Altă firmă sau alte date?
      </button>
    </div>
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('submitting');
    setError(null);

    const data = Object.fromEntries(new FormData(e.currentTarget).entries());

    try {
      const res = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, leadId: lead.id, cumAflat, fromAccount, ...getAttribution() }),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (json.full) setClaims(maxClaims);
        if (json.needsForm) setManual(true);
        setStatus('idle');
        setError(json.error || 'A apărut o eroare. Încearcă din nou.');
        return;
      }

      trackEvent('lead_claim_submitted', {
        county: lead.judet,
        project_type: lead.tipLabel,
        cum_aflat: fromAccount ? 'din_cont' : cumAflat || 'nespecificat',
      });
      if (typeof json.claims === 'number') setClaims(json.claims);
      setEmailFolosit(typeof data.email === 'string' ? data.email : me?.email || '');
      setHasAccount(json.hasAccount === true);
      setStatus('success');
    } catch {
      setStatus('idle');
      setError('A apărut o eroare. Încearcă din nou.');
    }
  }

  const details = [
    lead.judet,
    lead.putereLabel || null,
    lead.bateriaLabel || null,
    lead.suprafata ? `${lead.suprafata} mp` : null,
  ].filter(Boolean);

  // Detalii de ofertare, adăugate în formular în iulie 2026 — cererile mai vechi
  // nu le au, așa că rândul dispare complet când niciunul nu e completat.
  const specs = [
    // Prima: schimbă înțelesul restului (puterea e a sistemului existent, nu a
    // cererii). Badge-ul e rezervat lucrurilor care se citesc dintr-o privire.
    lead.tipLucrare && lead.tipLucrare !== 'sistem-nou' && !isDoarMontaj(lead.tipLucrare)
      ? { label: 'Lucrare', value: lead.tipLucrareLabel }
      : null,
    // Imediat după lucrare: firma vede din start dacă omul are așteptări
    // realiste (ex. „independență totală de rețea” pe o casă de 5 kW).
    lead.scopLabel ? { label: 'Vrea', value: lead.scopLabel } : null,
    lead.acoperisLabel ? { label: 'Acoperiș', value: lead.acoperisLabel } : null,
    lead.fazareLabel ? { label: 'Alimentare', value: lead.fazareLabel } : null,
    lead.bransamentLabel ? { label: 'Branșament', value: lead.bransamentLabel } : null,
    lead.consumLunar ? { label: 'Consum', value: lead.consumLunar } : null,
    lead.bugetLabel ? { label: 'Buget', value: lead.bugetLabel } : null,
    lead.stocareLabel ? { label: 'Baterie', value: lead.stocareLabel } : null,
    lead.wallboxLabel ? { label: 'Stație auto', value: lead.wallboxLabel } : null,
    lead.intervalApelLabel ? { label: 'Sunați', value: lead.intervalApelLabel } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div
      ref={cardRef}
      className={`bg-white rounded-xl border p-5 flex flex-col scroll-mt-24 ${
        focused ? 'border-primary ring-2 ring-primary/30' : 'border-border'
      } ${full && !claimedByMe ? 'opacity-75' : ''}`}
    >
      {/* Confirmarea că ai ajuns unde ai apăsat. Fără ea, într-o grilă de carduri
          identice, inelul singur s-ar citi ca o stare oarecare a cardului. */}
      {focused && (
        <p className="-mt-1 mb-2 text-[11px] font-semibold uppercase tracking-wider text-primary-dark">
          Cererea selectată
        </p>
      )}
      <div className="flex items-start justify-between gap-2">
        {/* Trei badge-uri (segment + poze + montaj) nu încap pe un rând într-o
            coloană de grilă: se rup pe rânduri întregi, nu pe cuvinte. */}
        <div className="flex flex-wrap items-center gap-1.5">
          <SegmentBadge segment={lead.segment} />
          {/* Pozele în sine nu sunt publice — badge-ul semnalează doar că firma
              care revendică le primește, ceea ce face cererea mai valoroasă. */}
          {lead.arePoze && (
            <Badge icon={ICON_POZE} tone="bg-sky-50 text-sky-700">
              Cu poze
            </Badge>
          )}
          {/* Cererea din care lipsește marfa. O firmă care ofertează kit + montaj
              trebuie să vadă asta înainte să consume o revendicare, nu după ce
              sună clientul. */}
          {isDoarMontaj(lead.tipLucrare) && (
            <Badge
              icon={ICON_MONTAJ}
              tone="bg-violet-50 text-violet-700"
              title="Clientul are deja panourile și invertorul. Cere doar manopera."
            >
              Doar montaj
            </Badge>
          )}
          {/* Amber, nu verde: verdele e deja luat de segment, iar ăsta trebuie
              să fie primul lucru pe care ochiul îl prinde pe card. */}
          {lead.verificata && (
            <Badge
              icon={ICON_TELEFON}
              tone="bg-amber-100 text-amber-800"
              title="Am sunat clientul și ne-a confirmat că vrea ofertă."
            >
              Verificată telefonic
            </Badge>
          )}
          {/* Albastru de informație: griul se citea ca „card dezactivat", deși
              cererea e la fel de reală ca celelalte. Albastrul e liber (verdele
              e la segment, amberul la verificare, portocaliul la reactivare). */}
          {lead.seInformeaza && (
            <Badge
              icon={ICON_INFORMEAZA}
              tone="bg-sky-100 text-sky-800"
              title="La întrebarea despre termen, clientul a ales „Deocamdată mă informez”."
            >
              Se informează
            </Badge>
          )}
          {lead.reactivata && (
            <Badge
              icon={ICON_TELEFON}
              tone="bg-orange-50 text-orange-700"
              title="Clientul se informa, iar acum a spus că e gata pentru oferte și și-a actualizat cererea."
            >
              Reactivată
            </Badge>
          )}
        </div>
        <span className="shrink-0 text-xs text-gray-400">{lead.postedLabel}</span>
      </div>

      <h3 className="mt-3 font-semibold text-gray-900">{lead.tipLabel}</h3>
      <p className="mt-1 text-sm text-gray-600">{details.join(' · ')}</p>
      {/* Cererile de dinainte de 29 iul 2026 n-au câmpul — rândul dispare de tot. */}
      {lead.finantareLabel && (
        <FinancingLine label={lead.finantareLabel} tone={lead.finantareTone} />
      )}
      {lead.termenLabel && <TimelineLine slug={lead.termen} label={lead.termenLabel} />}
      {/* Ce a răspuns clientul, nu ce deducem noi din asta: dacă vrea sau nu o
          ofertă acum n-a spus nimeni, firma decide singură dacă sună. Fără
          motiv nu scriem rândul: badge-ul și rândul de termen spun deja tot. */}
      {lead.seInformeaza && lead.informezMotiv && (
        <p className="mt-2 text-xs text-sky-800">Ne-a spus că {lead.informezMotiv}.</p>
      )}
      {specs.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {specs.map((s) => (
            <li
              key={s.label}
              className="rounded-md bg-surface border border-border px-2 py-0.5 text-[11px] text-gray-600"
            >
              <span className="text-gray-400">{s.label}:</span> {s.value}
            </li>
          ))}
        </ul>
      )}
      {lead.mesaj && (
        <p className="mt-2 text-sm text-gray-500 italic leading-relaxed">„{lead.mesaj}”</p>
      )}

      {/* Bara de locuri. La „se informează" apare doar după prima revendicare:
          cât timp nimeni n-a cerut contactul, „0/3" ar împinge spre acțiunea
          pe care tocmai o descurajăm. Dar din clipa în care o firmă a dat
          „Vreau să contactez persoana", locul e ocupat la fel ca pe orice
          cerere (plafonul din /api/claims nu face excepție), deci se vede. */}
      {showSlots && (
        <div className="mt-4 flex items-center gap-2">
          <div className="flex gap-1">
            {Array.from({ length: maxClaims }, (_, i) => (
              <span
                key={i}
                className={`w-6 h-1.5 rounded-full ${i < claims ? 'bg-primary' : 'bg-gray-200'}`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500">
            {full
              ? 'Complet'
              : claims > 0
                ? `${claims}/${maxClaims} revendicate`
                : 'Nicio revendicare încă'}
          </span>
        </div>
      )}
      {/* Urmăritorii: câte firme așteaptă reactivarea cererii. Doar la
          „se informează" — pe restul nu există urmărire. */}
      {lead.seInformeaza && (
        <p className={`${showSlots ? 'mt-2' : 'mt-4'} text-xs text-gray-500`}>
          {watches > 0
            ? `${watches} ${watches === 1 ? 'firmă urmărește' : 'firme urmăresc'} cererea`
            : 'Nimeni nu urmărește încă cererea'}
        </p>
      )}

      <div className="mt-4 flex-1 flex flex-col justify-end">
        {quickBox ? (
          quickBox
        ) : claimedByMe ? (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-sm text-emerald-800 text-center font-medium">
            Revendicare trimisă ✓
            {me && !modalOpen && (
              <a href="/portal" className="mt-0.5 block text-xs font-normal underline hover:no-underline">
                Vezi în contul tău
              </a>
            )}
          </div>
        ) : watchedByMe ? (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-sm text-emerald-800 text-center font-medium">
            Te anunțăm când devine activă ✓
          </div>
        ) : full ? (
          /* Plafonul se verifică înaintea fluxului „se informează": altfel
             firma vedea butonul de revendicare pe o cerere deja plină și afla
             abia după ce completa formularul (409 din /api/claims). Urmărirea
             rămâne deschisă — nu ocupă niciun loc. */
          lead.seInformeaza ? (
            <>
              <Button variant="secondary" onClick={handleWatchOpen} className="w-full">
                Urmărește cererea
              </Button>
              <p className="mt-2 text-[11px] text-gray-500 text-center font-medium">
                Complet — {maxClaims}/{maxClaims} firme au cerut deja contactul
              </p>
            </>
          ) : (
            <div className="rounded-lg bg-surface border border-border px-4 py-2.5 text-sm text-gray-500 text-center font-medium">
              Complet — {maxClaims}/{maxClaims} firme
            </div>
          )
        ) : lead.seInformeaza ? (
          <>
            {/* Revendicarea nu mai e un link în subsolul cardului: firma care
                vrea omul acum trebuie să găsească acțiunea acolo unde se uită,
                nu într-un rând de 11px. Rămâne a doua, ca greutate vizuală
                (contur, nu plin), fiindcă clientul chiar a spus că se
                informează — vezi tooltipul de dedesubt. */}
            <Button variant="secondary" onClick={handleWatchOpen} className="w-full">
              Urmărește cererea
            </Button>
            <Button variant="outline" onClick={startClaim} className="mt-2 w-full">
              Vreau să contactez persoana
            </Button>
            {claims > 0 && (
              <p className="mt-2 text-[11px] text-amber-700 text-center font-medium">
                {slotsLeft === 1 ? 'Ultimul loc disponibil' : `Mai sunt ${slotsLeft} locuri`}
              </p>
            )}
            <div className="mt-1.5">
              <ActionsInfo maxClaims={maxClaims} />
            </div>
          </>
        ) : (
          <>
            <Button variant="primary" onClick={startClaim} className="w-full">
              Vreau această cerere
            </Button>
            {claims > 0 && (
              <p className="mt-2 text-[11px] text-amber-700 text-center font-medium">
                {slotsLeft === 1 ? 'Ultimul loc disponibil' : `Mai sunt ${slotsLeft} locuri`}
              </p>
            )}
          </>
        )}
      </div>

      {watchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/50"
            onClick={() => watchStatus !== 'submitting' && setWatchOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Urmărește cererea: ${lead.tipLabel}, ${lead.judet}`}
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6"
          >
            <div className="flex items-start justify-between gap-4 mb-1">
              <h3 className="font-bold text-gray-900 text-lg">Urmărește această cerere</h3>
              <button
                onClick={() => setWatchOpen(false)}
                aria-label="Închide"
                className="shrink-0 -mt-1 -mr-1 w-9 h-9 inline-flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-surface transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              {lead.tipLabel} · {details.join(' · ')} · {lead.postedLabel}
              {lead.informezMotiv && ` · ${lead.informezMotiv}`}
            </p>
            {watchStatus === 'success' ? (
              <div>
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
                  Gata. Când clientul spune că e pregătit pentru oferte, primești email înaintea
                  firmelor cu alerte pe județ, iar cererea o revendici atunci de pe /cereri.
                </div>
                <PortalNextStep
                  email={emailFolosit}
                  hasAccount={Boolean(me)}
                  source="urmarire"
                  arePoze={lead.arePoze}
                  judet={lead.judet}
                />
              </div>
            ) : (
              <form onSubmit={handleWatchSubmit} className="space-y-3">
                {fromAccount ? (
                  <AccountBox me={me!} verb="Urmărești" onManual={() => setManual(true)} />
                ) : (
                  <>
                    <Input label="Nume firmă" name="numeFirma" required placeholder="SC Firma SRL" />
                    <Input
                      label="Email firmă"
                      name="email"
                      type="email"
                      required
                      placeholder="contact@firma.ro"
                      autoComplete="email"
                      defaultValue={me?.email}
                    />
                  </>
                )}
                {watchError && <p className="text-xs text-red-600">{watchError}</p>}
                <Button type="submit" variant="primary" disabled={watchStatus === 'submitting'} className="w-full">
                  {watchStatus === 'submitting' ? 'Se salvează...' : 'Urmărește cererea'}
                </Button>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Urmărirea nu e revendicare: nu ocupă un loc din cele {maxClaims}, nu te sunăm și nu
                  primești datele clientului. Primești un singur email, când cererea devine activă.
                </p>
              </form>
            )}
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/50"
            onClick={() => status !== 'submitting' && setModalOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Revendică cererea: ${lead.tipLabel}, ${lead.judet}`}
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6"
          >
            <div className="flex items-start justify-between gap-4 mb-1">
              <h3 className="font-bold text-gray-900 text-lg">Revendică această cerere</h3>
              <button
                onClick={() => setModalOpen(false)}
                aria-label="Închide"
                className="shrink-0 -mt-1 -mr-1 w-9 h-9 inline-flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-surface transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              {lead.tipLabel} · {details.join(' · ')} · {lead.postedLabel}
              {lead.finantareLabel && ` · ${lead.finantareLabel}`}
            </p>

            {claimedByMe ? (
              <div>
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
                  {hasAccount ? (
                    <>
                      Revendicare înregistrată. Datele clientului
                      {lead.arePoze ? ' și pozele cererii' : ''} apar în portalul tău în cel mult
                      o zi lucrătoare.
                    </>
                  ) : (
                    <>
                      Revendicare înregistrată. Te sunăm o dată pentru confirmare, apoi îți
                      deblocăm datele clientului{lead.arePoze ? ' și pozele cererii' : ''}.
                    </>
                  )}
                </div>
                <PortalNextStep
                  email={emailFolosit}
                  hasAccount={hasAccount}
                  source="revendicare"
                  arePoze={lead.arePoze}
                  judet={lead.judet}
                />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                {fromAccount ? (
                  <AccountBox me={me!} verb="Revendici" onManual={() => setManual(true)} />
                ) : (
                  <>
                    <Input label="Nume firmă" name="numeFirma" required placeholder="SC Firma SRL" />
                    <Input label="Persoană contact" name="numeContact" required placeholder="Ion Popescu" />
                    <Input
                      label="Telefon"
                      name="telefon"
                      type="tel"
                      required
                      placeholder="0740 123 456"
                      autoComplete="tel"
                    />
                    <Input
                      label="Email firmă"
                      name="email"
                      type="email"
                      required
                      placeholder="contact@firma.ro"
                      autoComplete="email"
                      defaultValue={me?.email}
                      hint="Cu el intri și în portal, unde primești datele clientului și alerte pe județele tale."
                    />
                  </>
                )}
                {/* „Cum ai aflat" e întrebare de primă întâlnire: firma cu cont
                    ne-a răspuns deja (sau n-a vrut) la prima revendicare. */}
                {!fromAccount && (
                <fieldset>
                  <legend className="block text-sm font-medium text-gray-700 mb-1.5">
                    Cum ai aflat de cererile noastre?{' '}
                    <span className="font-normal text-gray-400">(opțional)</span>
                  </legend>
                  <div className="flex flex-wrap gap-1.5">
                    {FIRM_SOURCE_OPTIONS.map((o) => {
                      const on = cumAflat === o.value;
                      return (
                        <button
                          key={o.value}
                          type="button"
                          aria-pressed={on}
                          onClick={() => setCumAflat(on ? '' : o.value)}
                          className={`rounded-full border px-3 py-1 text-xs transition-colors ${
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
                </fieldset>
                )}
                {error && <p className="text-xs text-red-600">{error}</p>}
                <Button type="submit" variant="primary" disabled={status === 'submitting'} className="w-full">
                  {status === 'submitting' ? 'Se trimite...' : 'Trimite revendicarea'}
                </Button>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Revendicarea este rezervată firmelor de instalare fotovoltaice. Primești datele
                  complete ale clientului în{' '}
                  <a href="/portal" className="underline hover:no-underline">Portalul Instalatorilor</a>;
                  la prima revendicare te sunăm o dată pentru confirmare.
                  Datele firmei tale sunt folosite doar pentru alocarea acestei cereri. Poți ține{' '}
                  {MAX_ACTIVE_CLAIMS_PER_FIRM} cereri nemișcate odată: locul se eliberează imediat
                  ce muți statusul cererii în portal.
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
