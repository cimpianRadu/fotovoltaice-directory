'use client';

import { useState } from 'react';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';
import { getCounties } from '@/lib/utils';
import { trackEvent } from '@/lib/analytics';

const specializationOptions = [
  { value: 'hale-industriale', label: 'Hale industriale' },
  { value: 'parcuri-logistice', label: 'Parcuri logistice' },
  { value: 'cladiri-birouri', label: 'Clădiri de birouri' },
  { value: 'retail', label: 'Retail (magazine, centre comerciale)' },
  { value: 'agricol', label: 'Agricol (ferme, sere)' },
  { value: 'hotel', label: 'HoReCa (hoteluri, pensiuni)' },
];

export default function ListingForm() {
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
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Eroare la trimitere');

      trackEvent('listing_form_submitted', {
        company_name: String(body.numeFirma),
        county: String(body.judet),
      });

      setStatus('success');
      setToast({ message: 'Cererea a fost trimisă! Vom reveni cu un răspuns în cel mai scurt timp.', type: 'success' });
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
          <Input label="Numele firmei" name="numeFirma" required placeholder="SC Firma Fotovoltaice SRL" />
          <Input label="CUI" name="cui" required placeholder="RO12345678" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Persoana de contact" name="numeContact" required placeholder="Ion Popescu" />
          <Input label="Funcție" name="functie" placeholder="Director, Manager, etc." />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Email" name="email" type="email" required placeholder="contact@firma.ro" />
          <Input label="Telefon" name="telefon" type="tel" required placeholder="0740 123 456" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Județ (sediu social)"
            name="judet"
            options={counties.map((c) => ({ value: c, label: c }))}
            required
          />
          <Input label="Website" name="website" placeholder="https://firma.ro" />
        </div>

        <Select
          label="Specializare principală"
          name="specializare"
          options={specializationOptions}
          required
        />

        <Input
          label="Scurtă descriere a firmei (opțional)"
          name="descriere"
          type="textarea"
          placeholder="Experiență, certificări, tipuri de proiecte realizate..."
        />

        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="gdpr-listing"
            name="gdpr"
            required
            className="mt-1 w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label htmlFor="gdpr-listing" className="text-xs text-gray-600 leading-relaxed">
            Sunt de acord cu prelucrarea datelor transmise în conformitate cu GDPR.
            Datele vor fi folosite pentru verificarea și listarea firmei în directorul Instalatori Fotovoltaice. *
          </label>
        </div>

        <Button type="submit" variant="primary" size="lg" disabled={status === 'submitting'} className="w-full">
          {status === 'submitting' ? 'Se trimite...' : 'Trimite Cererea de Listare'}
        </Button>
      </form>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </>
  );
}
