'use client';

import { useEffect, useRef, useState } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { trackEvent } from '@/lib/analytics';
import { MAX_ACTIVE_CLAIMS_PER_FIRM } from '@/lib/sheets-shared';
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
  termenLabel: string;
  intervalApelLabel: string;
  arePoze: boolean;
  verificata: boolean;
}

interface LeadCardProps {
  lead: LeadCardData;
  initialClaims: number;
  maxClaims: number;
  /** Cererea spre care s-a dat click în `?cerere=<id>`: se aduce în ecran și se marchează. */
  focused?: boolean;
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
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${tone}`}
    >
      {icon}
      {children}
    </span>
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

export default function LeadCard({ lead, initialClaims, maxClaims, focused }: LeadCardProps) {
  const [claims, setClaims] = useState(initialClaims);
  const [modalOpen, setModalOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [error, setError] = useState<string | null>(null);

  const full = claims >= maxClaims;
  const slotsLeft = maxClaims - claims;
  const claimedByMe = status === 'success';

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
  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModalOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [modalOpen]);

  function handleOpen() {
    setModalOpen(true);
    setError(null);
    trackEvent('lead_claim_opened', { county: lead.judet, project_type: lead.tipLabel });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('submitting');
    setError(null);

    const data = Object.fromEntries(new FormData(e.currentTarget).entries());

    try {
      const res = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, leadId: lead.id }),
      });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (json.full) setClaims(maxClaims);
        setStatus('idle');
        setError(json.error || 'A apărut o eroare. Încearcă din nou.');
        return;
      }

      trackEvent('lead_claim_submitted', { county: lead.judet, project_type: lead.tipLabel });
      if (typeof json.claims === 'number') setClaims(json.claims);
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
    lead.tipLucrare && lead.tipLucrare !== 'sistem-nou'
      ? { label: 'Lucrare', value: lead.tipLucrareLabel }
      : null,
    lead.acoperisLabel ? { label: 'Acoperiș', value: lead.acoperisLabel } : null,
    lead.fazareLabel ? { label: 'Alimentare', value: lead.fazareLabel } : null,
    lead.bransamentLabel ? { label: 'Branșament', value: lead.bransamentLabel } : null,
    lead.consumLunar ? { label: 'Consum', value: lead.consumLunar } : null,
    lead.stocareLabel ? { label: 'Baterie', value: lead.stocareLabel } : null,
    lead.wallboxLabel ? { label: 'Stație auto', value: lead.wallboxLabel } : null,
    lead.termenLabel ? { label: 'Termen', value: lead.termenLabel } : null,
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
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <SegmentBadge segment={lead.segment} />
          {/* Pozele în sine nu sunt publice — badge-ul semnalează doar că firma
              care revendică le primește, ceea ce face cererea mai valoroasă. */}
          {lead.arePoze && (
            <Badge icon={ICON_POZE} tone="bg-sky-50 text-sky-700">
              Cu poze
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
        </div>
        <span className="text-xs text-gray-400">{lead.postedLabel}</span>
      </div>

      <h3 className="mt-3 font-semibold text-gray-900">{lead.tipLabel}</h3>
      <p className="mt-1 text-sm text-gray-600">{details.join(' · ')}</p>
      {/* Cererile de dinainte de 29 iul 2026 n-au câmpul — rândul dispare de tot. */}
      {lead.finantareLabel && (
        <FinancingLine label={lead.finantareLabel} tone={lead.finantareTone} />
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

      {/* Counter: sloturi vizuale + text. Afișat doar când există revendicări reale. */}
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

      <div className="mt-4 flex-1 flex flex-col justify-end">
        {claimedByMe ? (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-sm text-emerald-800 text-center font-medium">
            Revendicare trimisă ✓
          </div>
        ) : full ? (
          <div className="rounded-lg bg-surface border border-border px-4 py-2.5 text-sm text-gray-500 text-center font-medium">
            Complet — {maxClaims}/{maxClaims} firme
          </div>
        ) : (
          <>
            <Button variant="primary" onClick={handleOpen} className="w-full">
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
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
                Revendicare înregistrată. Te sunăm pentru confirmare, apoi găsești datele
                clientului în{' '}
                <a href="/portal" className="font-medium underline hover:no-underline">
                  Portalul Instalatorilor
                </a>
                , intri cu emailul firmei, fără parolă.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
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
                />
                {error && <p className="text-xs text-red-600">{error}</p>}
                <Button type="submit" variant="primary" disabled={status === 'submitting'} className="w-full">
                  {status === 'submitting' ? 'Se trimite...' : 'Trimite revendicarea'}
                </Button>
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  Revendicarea este rezervată firmelor de instalare fotovoltaice. Te contactăm
                  telefonic pentru confirmare, apoi primești datele complete ale clientului în{' '}
                  <a href="/portal" className="underline hover:no-underline">Portalul Instalatorilor</a>{' '}
                  (intri cu emailul firmei, fără parolă). Datele firmei tale sunt folosite doar
                  pentru alocarea acestei cereri. Poți ține {MAX_ACTIVE_CLAIMS_PER_FIRM} cereri
                  nemișcate odată: locul se eliberează imediat ce muți statusul cererii în portal.
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
