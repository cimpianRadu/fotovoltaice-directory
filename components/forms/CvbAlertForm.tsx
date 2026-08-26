'use client';

// Formular „anunță-mă când se deschide Casa Verde Baterii". Trăiește în
// ghidurile CVB, lângă secțiunea de calendar: exact locul în care cititorul
// află că sesiunea nu are dată și rămâne cu întrebarea „și atunci când?".
//
// Emailul e singurul câmp obligatoriu. Capacitatea dorită și brandul de
// invertor sunt opționale, dar valoroase de două ori: pre-califică tehnic
// cererea (compatibilitatea invertor-baterie decide ce firme pot oferta) și
// ne spun din timp cum arată cererea reală pe capacități, înainte de sesiune.
// Rândurile ajung în tabul „AlerteCVB" din Sheet.

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';
import SearchableSelect from '@/components/ui/SearchableSelect';
import { trackEvent } from '@/lib/analytics';

// Etichetele poartă și informația din ghid: pragul de 12 kWh și faptul că
// subvenția maximă de 15.000 lei se atinge de la 16 kWh în sus.
const CAPACITATE_OPTIONS = [
  { value: '12', label: '12 kWh (minimul programului)' },
  { value: '13-15', label: '13 - 15 kWh' },
  { value: '16-20', label: '16 - 20 kWh (subvenția maximă)' },
  { value: 'peste-20', label: 'Peste 20 kWh' },
  { value: 'nu-stiu', label: 'Nu știu încă' },
];

const INVERTOR_OPTIONS = [
  { value: 'huawei', label: 'Huawei' },
  { value: 'deye', label: 'Deye' },
  { value: 'fronius', label: 'Fronius' },
  { value: 'goodwe', label: 'GoodWe' },
  { value: 'growatt', label: 'Growatt' },
  { value: 'sungrow', label: 'Sungrow' },
  { value: 'solaredge', label: 'SolarEdge' },
  { value: 'solax', label: 'SolaX' },
  { value: 'victron', label: 'Victron' },
  { value: 'solis', label: 'Solis' },
  { value: 'kstar', label: 'Kstar' },
  { value: 'alt-brand', label: 'Alt brand' },
  { value: 'nu-stiu', label: 'Nu știu / nu am încă' },
];

export default function CvbAlertForm({ sursa }: { sursa: string }) {
  const [email, setEmail] = useState('');
  const [capacitate, setCapacitate] = useState('');
  const [invertor, setInvertor] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');

    try {
      const res = await fetch('/api/alerta-cvb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, capacitate, invertor, sursa }),
      });

      if (!res.ok) throw new Error('Eroare');

      trackEvent('cvb_alert_signup', { sursa, capacitate: capacitate || 'nespecificat' });
      setStatus('success');
      setEmail('');
    } catch {
      setStatus('error');
      setToast({ message: 'A apărut o eroare. Încercați din nou.', type: 'error' });
    }
  }

  if (status === 'success') {
    return (
      <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-6 my-10 text-center">
        <p className="font-bold text-emerald-900">V-ați înscris.</p>
        <p className="text-sm text-emerald-900 mt-2 leading-relaxed">
          Vă scriem un singur email, în ziua în care se anunță deschiderea sesiunii. Până atunci,
          actualizăm ghidul de fiecare dată când apare ceva oficial.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-primary/5 rounded-xl border border-primary/10 p-6 my-10">
      <h3 className="font-bold text-gray-900 text-lg">
        Vă anunțăm când se deschide sesiunea
      </h3>
      <p className="text-sm text-gray-600 mt-2 mb-5 leading-relaxed">
        Data înscrierilor nu e anunțată, iar sesiunile de acest fel se mișcă repede. Lăsați un
        email și vă scriem în ziua în care apare anunțul oficial. Dacă ne spuneți și ce
        capacitate vă interesează și ce invertor aveți, vă putem trimite direct informația care
        contează pentru instalația dumneavoastră.
      </p>

      <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="adresa@email.ro"
            aria-label="Adresa de email"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none bg-white"
          />
        </div>
        <SearchableSelect
          name="capacitate"
          options={CAPACITATE_OPTIONS}
          value={capacitate}
          onValueChange={setCapacitate}
          placeholder="Capacitate dorită (opțional)"
        />
        <SearchableSelect
          name="invertor"
          options={INVERTOR_OPTIONS}
          value={invertor}
          onValueChange={setInvertor}
          placeholder="Invertorul actual (opțional)"
        />
        <div className="sm:col-span-2">
          <Button type="submit" disabled={status === 'submitting'} className="w-full sm:w-auto">
            {status === 'submitting' ? 'Se trimite...' : 'Anunțați-mă la deschidere'}
          </Button>
        </div>
      </form>

      <p className="text-xs text-gray-500 mt-3 leading-relaxed">
        Un singur email, la deschiderea sesiunii. Adresa nu se folosește pentru altceva și nu se
        transmite nimănui.
      </p>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
