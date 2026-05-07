'use client';

import { useEffect, useState } from 'react';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';
import { getCounties } from '@/lib/utils';

declare global {
  interface Window {
    umami?: { track: (event: string, data?: Record<string, unknown>) => void };
  }
}

const TIER_OPTIONS = [
  { value: 'basic', label: 'Basic — 49€/lună (furnizori, distribuitori)' },
  { value: 'plus-first-mover', label: 'Plus First-Mover — 59€/lună × 6 luni (instalatori, primele 5 firme)' },
  { value: 'plus', label: 'Plus — 99€/lună (instalatori)' },
  { value: 'premium', label: 'Premium — 249€/lună (instalatori)' },
  { value: 'bundle', label: 'Național Plus (Bundle) — 299€/lună (instalatori)' },
];

const TIER_LABEL: Record<string, string> = {
  basic: 'Basic 49€',
  plus: 'Plus 99€',
  'plus-first-mover': 'Plus First-Mover 59€',
  premium: 'Premium 249€',
  bundle: 'Național Plus 299€',
};

function readTierFromHash(): string | null {
  if (typeof window === 'undefined') return null;
  const m = window.location.hash.match(/tier=([a-z-]+)/i);
  if (!m) return null;
  const t = m[1].toLowerCase();
  return TIER_OPTIONS.some((o) => o.value === t) ? t : null;
}

export default function AdInquiryForm() {
  const [tier, setTier] = useState<string>('plus');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const counties = getCounties();

  useEffect(() => {
    const sync = () => {
      const t = readTierFromHash();
      if (t) {
        setTier(t);
        window.umami?.track('ad_inquiry_opened', { tier: t });
      }
    };
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('submitting');

    const form = e.currentTarget;
    const data = new FormData(form);
    const body = Object.fromEntries(data.entries());

    try {
      const res = await fetch('/api/ad-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, tier }),
      });

      if (!res.ok) throw new Error('Eroare la trimitere');

      window.umami?.track('ad_inquiry_submitted', { tier });

      setStatus('success');
      setToast({
        message: 'Cererea a fost trimisă! Te contactăm în aceeași zi lucrătoare.',
        type: 'success',
      });
      form.reset();
    } catch {
      setStatus('error');
      setToast({
        message: 'A apărut o eroare. Te rugăm să încerci din nou.',
        type: 'error',
      });
    }
  }

  const showJudet = tier === 'plus' || tier === 'plus-first-mover' || tier === 'bundle';

  return (
    <>
      <div className="rounded-xl border border-primary/20 bg-white p-6 sm:p-8 shadow-sm">
        <div className="mb-5">
          <h3 className="text-lg font-bold text-gray-900 mb-1">Activează pachetul</h3>
          <p className="text-sm text-gray-600">
            Selectează pachetul, completează datele și te contactăm în aceeași zi lucrătoare cu factura proforma și pașii de activare.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Pachet dorit"
            name="tierLabel"
            options={TIER_OPTIONS}
            value={tier}
            onValueChange={(v) => setTier(v)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Nume firmă / brand" name="numeFirma" required placeholder="SC Firma SRL" />
            <Input label="CUI (opțional)" name="cui" placeholder="RO12345678" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Persoană contact" name="numeContact" required placeholder="Ion Popescu" />
            <Input label="Telefon" name="telefon" type="tel" required placeholder="0740 123 456" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Email" name="email" type="email" required placeholder="contact@firma.ro" />
            <Input label="Website (opțional)" name="website" type="url" placeholder="https://firma.ro" />
          </div>

          {showJudet && (
            <Select
              label="Județ țintit (pentru Plus)"
              name="judet"
              options={counties.map((c) => ({ value: c, label: c }))}
              required
            />
          )}

          <Input
            label="Mesaj (opțional)"
            name="mesaj"
            type="textarea"
            placeholder="Întrebări, observații, particularități..."
          />

          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="ad-gdpr"
              name="gdpr"
              required
              className="mt-1 w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="ad-gdpr" className="text-xs text-gray-600 leading-relaxed">
              Sunt de acord cu prelucrarea datelor pentru a fi contactat în legătură cu pachetul de publicitate selectat. *
            </label>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={status === 'submitting'}
            className="w-full"
          >
            {status === 'submitting'
              ? 'Se trimite...'
              : `Trimite cererea${tier ? ` — ${TIER_LABEL[tier] ?? ''}` : ''}`}
          </Button>

          <p className="text-[11px] text-gray-500 text-center">
            Răspuns în aceeași zi lucrătoare. Fără contract minim — poți închide oricând.
          </p>
        </form>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
