'use client';

import { useState } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';

declare global {
  interface Window {
    umami?: { track: (event: string, data?: Record<string, unknown>) => void };
  }
}

export default function AdInquiryForm() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

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
        body: JSON.stringify({ ...body, tier: 'waitlist' }),
      });

      if (!res.ok) throw new Error('Eroare la trimitere');

      window.umami?.track('ad_inquiry_submitted', { tier: 'waitlist' });

      setStatus('success');
      setToast({
        message: 'Cererea a fost trimisă. Te contactăm direct când e cazul.',
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

  return (
    <>
      <div className="rounded-xl border border-primary/20 bg-white p-6 sm:p-8 shadow-sm">
        <div className="mb-5">
          <h3 className="text-lg font-bold text-gray-900 mb-1">Lista de interes — partener comercial</h3>
          <p className="text-sm text-gray-600">
            Directorul e în creștere și nu vindem încă pachete comerciale standard. Dacă vrei să fii contactat când le lansăm — sau să propui un parteneriat individual acum (testimonial, pilot, cross-promotion) — lasă-ne datele.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <Input
            label="Despre ce e vorba?"
            name="mesaj"
            type="textarea"
            placeholder="Ce te interesează: vizibilitate pe pagina județului, pe homepage, pe ghiduri, pilot gratuit cu testimonial, sau altceva? Scrie ce ai în cap, vorbim direct."
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
              Sunt de acord cu prelucrarea datelor pentru a fi contactat. *
            </label>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={status === 'submitting'}
            className="w-full"
          >
            {status === 'submitting' ? 'Se trimite...' : 'Trimite — te contactăm direct'}
          </Button>
        </form>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
}
