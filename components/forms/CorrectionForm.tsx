'use client';

import { useState } from 'react';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';
import { trackEvent } from '@/lib/analytics';

interface CorrectionFormProps {
  companies: { slug: string; name: string }[];
  preselectedSlug?: string;
}

export default function CorrectionForm({ companies, preselectedSlug }: CorrectionFormProps) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const companyOptions = companies.map((c) => ({ value: c.slug, label: c.name }));

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('submitting');

    const form = e.currentTarget;
    const data = new FormData(form);
    const body = Object.fromEntries(data.entries());

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numeCompanie: body.firma,
          numeContact: body.numeContact,
          email: body.email,
          telefon: body.telefon || '-',
          tipProiect: 'corectie-clasament',
          judet: '-',
          mesaj: body.corectie,
          gdpr: body.gdpr,
          sourcePage: 'clasament',
        }),
      });

      if (!res.ok) throw new Error('Eroare la trimitere');

      trackEvent('lead_form_submitted', {
        project_type: 'corectie-clasament',
        county: '-',
      });

      setStatus('success');
      setToast({ message: 'Mulțumim! Vom verifica și actualiza datele.', type: 'success' });
      form.reset();
    } catch {
      setStatus('error');
      setToast({ message: 'A apărut o eroare. Vă rugăm încercați din nou.', type: 'error' });
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Firma"
          name="firma"
          options={companyOptions}
          required
          value={preselectedSlug}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Nume contact" name="numeContact" required placeholder="Ion Popescu" />
          <Input label="Email" name="email" type="email" required placeholder="contact@firma.ro" />
        </div>

        <Input label="Telefon (opțional)" name="telefon" type="tel" placeholder="0740 123 456" />

        <Input
          label="Ce date trebuie corectate?"
          name="corectie"
          type="textarea"
          required
          placeholder="Ex: Cifra de afaceri nu este corectă, numărul de angajați s-a schimbat, avem certificare ANRE C2A..."
        />

        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="gdpr-corectie"
            name="gdpr"
            required
            className="mt-1 w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label htmlFor="gdpr-corectie" className="text-xs text-gray-600 leading-relaxed">
            Sunt de acord cu prelucrarea datelor personale în conformitate cu GDPR. *
          </label>
        </div>

        <Button type="submit" variant="primary" size="md" disabled={status === 'submitting'} className="w-full">
          {status === 'submitting' ? 'Se trimite...' : 'Trimite Corecția'}
        </Button>
      </form>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </>
  );
}
