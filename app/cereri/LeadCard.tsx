'use client';

import { useEffect, useState } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { trackEvent } from '@/lib/analytics';
import { MAX_ACTIVE_CLAIMS_PER_FIRM } from '@/lib/sheets-shared';
import type { FinancingTone } from '@/lib/utils-shared';

export interface LeadCardData {
  id: string;
  tipLabel: string;
  judet: string;
  putere: string;
  suprafata: string;
  segment: string;
  postedLabel: string;
  ageDays: number;
  mesaj: string;
  acoperisLabel: string;
  fazareLabel: string;
  consumLunar: string;
  finantareLabel: string;
  finantareTone: FinancingTone;
  stocareLabel: string;
  wallboxLabel: string;
  termenLabel: string;
  arePoze: boolean;
}

interface LeadCardProps {
  lead: LeadCardData;
  initialClaims: number;
  maxClaims: number;
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

function SegmentBadge({ segment }: { segment: string }) {
  const rez = segment === 'rezidential';
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${
        rez ? 'bg-emerald-50 text-emerald-700' : 'bg-primary/10 text-primary-dark'
      }`}
    >
      {rez ? 'Rezidențial' : 'Comercial'}
    </span>
  );
}

export default function LeadCard({ lead, initialClaims, maxClaims }: LeadCardProps) {
  const [claims, setClaims] = useState(initialClaims);
  const [modalOpen, setModalOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [error, setError] = useState<string | null>(null);

  const full = claims >= maxClaims;
  const slotsLeft = maxClaims - claims;
  const claimedByMe = status === 'success';

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
    lead.putere ? `${lead.putere} kW` : null,
    lead.suprafata ? `${lead.suprafata} mp` : null,
  ].filter(Boolean);

  // Detalii de ofertare, adăugate în formular în iulie 2026 — cererile mai vechi
  // nu le au, așa că rândul dispare complet când niciunul nu e completat.
  const specs = [
    lead.acoperisLabel ? { label: 'Acoperiș', value: lead.acoperisLabel } : null,
    lead.fazareLabel ? { label: 'Alimentare', value: lead.fazareLabel } : null,
    lead.consumLunar ? { label: 'Consum', value: lead.consumLunar } : null,
    lead.stocareLabel ? { label: 'Baterie', value: lead.stocareLabel } : null,
    lead.wallboxLabel ? { label: 'Stație auto', value: lead.wallboxLabel } : null,
    lead.termenLabel ? { label: 'Termen', value: lead.termenLabel } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className={`bg-white rounded-xl border border-border p-5 flex flex-col ${full && !claimedByMe ? 'opacity-75' : ''}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <SegmentBadge segment={lead.segment} />
          {/* Pozele în sine nu sunt publice — badge-ul semnalează doar că firma
              care revendică le primește, ceea ce face cererea mai valoroasă. */}
          {lead.arePoze && (
            <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700">
              Cu poze
            </span>
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
                  odată: locurile se eliberează pe măsură ce clienții confirmă că i-ai sunat.
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
