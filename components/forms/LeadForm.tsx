'use client';

import { useState } from 'react';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';
import { getCounties } from '@/lib/utils-shared';
import { useSegment } from '@/components/segment/SegmentProvider';
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

export default function LeadForm({ preselectedCompany, sourcePage = 'cere-oferta' }: LeadFormProps) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const counties = getCounties();
  const { segment } = useSegment();
  const isRezidential = segment === 'rezidential';
  const projectTypes = isRezidential ? residentialProjectTypes : commercialProjectTypes;

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
        body: JSON.stringify({ ...body, sourcePage, preselectedCompany, segment }),
      });

      if (!res.ok) throw new Error('Eroare la trimitere');

      trackEvent('lead_form_submitted', {
        project_type: String(body.tipProiect),
        county: String(body.judet),
        segment,
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
        {isRezidential ? (
          <Input label="Nume și prenume" name="numeContact" required placeholder="Ion Popescu" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Nume companie" name="numeCompanie" required placeholder="SC Firma SRL" />
            <Input label="Nume contact" name="numeContact" required placeholder="Ion Popescu" />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Email"
            name="email"
            type="email"
            required
            placeholder={isRezidential ? 'nume@email.ro' : 'contact@firma.ro'}
          />
          <Input label="Telefon" name="telefon" type="tel" required placeholder="0740 123 456" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label={isRezidential ? 'Tip locuință' : 'Tip proiect'}
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
          <Input
            label={isRezidential ? 'Suprafață acoperiș (mp)' : 'Suprafață estimată (mp)'}
            name="suprafata"
            type="number"
            placeholder={isRezidential ? 'ex: 60' : 'ex: 2000'}
          />
          <Input
            label="Putere dorită (kW)"
            name="putere"
            type="number"
            placeholder={isRezidential ? 'ex: 5' : 'ex: 200'}
          />
        </div>

        <div>
          <Input
            label="Mesaj (opțional)"
            name="mesaj"
            type="textarea"
            placeholder={
              isRezidential
                ? 'Descrieți pe scurt ce vă doriți (ex: vreau panouri prin Casa Verde)...'
                : 'Descrieți pe scurt proiectul...'
            }
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
            . Datele vor fi transmise exclusiv firmelor de instalare care acoperă zona mea, pentru a mă
            contacta cu oferte. *
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
