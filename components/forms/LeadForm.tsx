'use client';

import { useState } from 'react';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';
import { getCounties } from '@/lib/utils';
import { trackEvent } from '@/lib/analytics';

const projectTypes = [
  { value: 'hala-industriala', label: 'Hală industrială' },
  { value: 'cladire-birouri', label: 'Clădire de birouri' },
  { value: 'parc-logistic', label: 'Parc logistic' },
  { value: 'agricol', label: 'Agricol (fermă, seră, depozit)' },
  { value: 'retail', label: 'Retail (magazin, centru comercial)' },
  { value: 'hotel', label: 'Hotel / Pensiune' },
  { value: 'institutie', label: 'Instituție publică' },
  { value: 'altele', label: 'Altele' },
];

interface LeadFormProps {
  preselectedCompany?: string;
  sourcePage?: string;
}

export default function LeadForm({ preselectedCompany, sourcePage = 'cere-oferta' }: LeadFormProps) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const counties = getCounties();

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
        body: JSON.stringify({ ...body, sourcePage, preselectedCompany }),
      });

      if (!res.ok) throw new Error('Eroare la trimitere');

      trackEvent('lead_form_submitted', {
        project_type: String(body.tipProiect),
        county: String(body.judet),
      });

      setStatus('success');
      setToast({ message: 'Cererea a fost trimisă cu succes! Veți fi contactat în curând.', type: 'success' });
      form.reset();
    } catch {
      setStatus('error');
      setToast({ message: 'A apărut o eroare. Vă rugăm încercați din nou.', type: 'error' });
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Nume companie" name="numeCompanie" required placeholder="SC Firma SRL" />
          <Input label="Nume contact" name="numeContact" required placeholder="Ion Popescu" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Email" name="email" type="email" required placeholder="contact@firma.ro" />
          <Input label="Telefon" name="telefon" type="tel" required placeholder="0740 123 456" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Tip proiect"
            name="tipProiect"
            options={projectTypes}
            required
          />
          <Select
            label="Județ"
            name="judet"
            options={counties.map((c) => ({ value: c, label: c }))}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Suprafață estimată (mp)" name="suprafata" type="number" placeholder="ex: 2000" />
          <Input label="Putere dorită (kW)" name="putere" type="number" placeholder="ex: 200" />
        </div>

        <Input label="Mesaj (opțional)" name="mesaj" type="textarea" placeholder="Descrieți pe scurt proiectul..." />

        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="gdpr"
            name="gdpr"
            required
            className="mt-1 w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label htmlFor="gdpr" className="text-xs text-gray-600 leading-relaxed">
            Sunt de acord cu prelucrarea datelor personale în conformitate cu GDPR. Datele vor fi folosite
            exclusiv pentru a vă pune în legătură cu instalatori de sisteme fotovoltaice. *
          </label>
        </div>

        <Button type="submit" variant="primary" size="lg" disabled={status === 'submitting'} className="w-full">
          {status === 'submitting' ? 'Se trimite...' : 'Trimite Cererea'}
        </Button>
      </form>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </>
  );
}
