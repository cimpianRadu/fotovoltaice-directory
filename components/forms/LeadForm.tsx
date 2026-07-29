'use client';

import { useState } from 'react';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';
import {
  getCounties,
  ROOF_TYPES_REZIDENTIAL,
  ROOF_TYPES_COMERCIAL,
  PHASE_TYPES,
  FINANCING_REZIDENTIAL,
  FINANCING_COMERCIAL,
} from '@/lib/utils-shared';
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

const PHOTO_INBOX = 'contact@instalatori-fotovoltaice.ro';

export default function LeadForm({ preselectedCompany, sourcePage = 'cere-oferta' }: LeadFormProps) {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [leadRef, setLeadRef] = useState<string | null>(null);
  const counties = getCounties();
  const { segment } = useSegment();
  const isRezidential = segment === 'rezidential';
  const projectTypes = isRezidential ? residentialProjectTypes : commercialProjectTypes;
  const roofTypes = isRezidential ? ROOF_TYPES_REZIDENTIAL : ROOF_TYPES_COMERCIAL;
  const financingTypes = isRezidential ? FINANCING_REZIDENTIAL : FINANCING_COMERCIAL;

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
      const json = await res.json().catch(() => ({}));

      trackEvent('lead_form_submitted', {
        project_type: String(body.tipProiect),
        county: String(body.judet),
        segment,
        roof_type: String(body.tipAcoperis || ''),
        phase: String(body.fazare || ''),
        financing: String(body.finantare || ''),
      });

      setLeadRef(typeof json.id === 'string' ? json.id : null);
      setStatus('success');
      form.reset();
    } catch {
      setStatus('error');
      setToast({ message: 'A apărut o eroare. Vă rugăm încercați din nou.', type: 'error' });
    }
  }

  // Uploadul de poze vine DUPĂ trimitere, intenționat: pe mobil un câmp de fișier
  // înainte de submit pierde cereri, iar o cerere fără poze e tot o cerere.
  if (status === 'success') {
    const subject = `Poze pentru cererea mea${leadRef ? ` (ref. ${leadRef})` : ''}`;
    const mailto = `mailto:${PHOTO_INBOX}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
      'Atașez pozele cu acoperișul și cu tabloul electric.\n\n(Nu ștergeți referința din subiect, după ea legăm pozele de cererea dumneavoastră.)',
    )}`;

    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
        <h3 className="font-bold text-emerald-900">Cererea a fost trimisă ✓</h3>
        <p className="mt-1 text-sm text-emerald-800">
          Vă contactăm în cel mai scurt timp cu oferte de la firme care acoperă zona dumneavoastră.
        </p>

        <div className="mt-5 pt-5 border-t border-emerald-200">
          <p className="font-semibold text-gray-900 text-sm">Vreți oferte mai exacte?</p>
          <p className="mt-1 text-sm text-gray-700 leading-relaxed">
            Trimiteți 2-3 poze: una cu acoperișul văzut din exterior, una cu tabloul electric și
            contorul. Cu ele, instalatorii pot calcula montajul fără să mai vină întâi în vizită,
            iar oferta pe care o primiți e mult mai aproape de prețul final.
          </p>
          <a
            href={mailto}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
          >
            Trimite pozele pe email
          </a>
          <p className="mt-3 text-xs text-gray-500">
            Opțional. Cererea este deja înregistrată, pozele doar o completează.
          </p>
        </div>
      </div>
    );
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Tip acoperiș"
            name="tipAcoperis"
            options={roofTypes.map((o) => ({ value: o.value, label: o.label }))}
            required
          />
          <div>
            <Select
              label="Alimentare electrică (opțional)"
              name="fazare"
              options={PHASE_TYPES.map((o) => ({ value: o.value, label: o.label }))}
            />
            <p className="mt-1 text-[11px] text-gray-400">
              Scrie pe contor sau pe siguranța generală. Dacă nu găsiți, alegeți „Nu știu".
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Select
              label="Cum finanțați investiția"
              name="finantare"
              options={financingTypes.map((o) => ({ value: o.value, label: o.label }))}
              required
            />
            <p className="mt-1 text-[11px] text-gray-400">
              Instalatorii întreabă asta la primul telefon. Răspunsul aici vă scutește de un apel
              și vă aduce oferte potrivite situației.
            </p>
          </div>
          <div>
            <Input
              label="Consum lunar mediu (opțional)"
              name="consumLunar"
              placeholder="ex: 350 lei sau 250 kWh"
            />
            <p className="mt-1 text-[11px] text-gray-400">
              De pe ultima factură. Ajută instalatorul să dimensioneze sistemul corect, nu din
              estimare.
            </p>
          </div>
        </div>

        <div>
          <Input
            label="Mesaj (opțional)"
            name="mesaj"
            type="textarea"
            placeholder={
              isRezidential
                ? 'Descrieți pe scurt ce vă doriți (ex: vreau și baterie de stocare)...'
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
            . Datele vor fi transmise firmelor de instalare care acoperă zona mea și, dacă am cerut
            finanțare printr-un program, unui partener de finanțare, pentru a mă contacta cu oferte. *
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
