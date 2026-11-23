'use client';

// Formular „anunță-mă" Casa Verde Baterii. Trăiește în ghidurile CVB, lângă
// secțiunea de calendar, și sub calculatorul de punctaj.
//
// Până pe 20 nov 2026 anunța deschiderea sesiunii. Din 23 nov anunță ziua în care
// AFM publică lista aprobaților: de atunci curg cele 90 de zile pentru alegerea
// instalatorului validat (întrebările frecvente AFM, nr. 37), deci e momentul în
// care omul are nevoie de oferte. Textul se schimbă singur după închiderea
// înscrierii (25.11.2026, 23:59, Dispoziția AFM 454/2026).
//
// Emailul e singurul câmp obligatoriu. Capacitatea dorită și brandul de
// invertor sunt opționale, dar valoroase de două ori: pre-califică tehnic
// cererea (compatibilitatea invertor-baterie decide ce firme pot oferta) și
// ne spun din timp cum arată cererea reală pe capacități, înainte de sesiune.
// Rândurile ajung în tabul „AlerteCVB" din Sheet.

import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';
import SearchableSelect from '@/components/ui/SearchableSelect';
import { trackEvent } from '@/lib/analytics';

// Etichetele poartă și informația din ghid: pragul e 10 kWh, subvenția maximă de
// 15.000 lei se atinge de la ~13,4 kWh (la standardul de cost de 1.500 lei/kWh),
// iar punctajul pe capacitate e maxim de la 15 kWh (Ordinul nr. 2.314/2026; până
// la el, de la 20 kWh). Valorile ('10', '11-13', '14-19', 'peste-20' și cele vechi
// '12', '13-15', '16-20') rămân neschimbate: sunt în rândurile deja scrise în Sheet
// și în lista din /api/alerta-cvb. Se schimbă doar etichetele.
const CAPACITATE_OPTIONS = [
  { value: '10', label: '10 kWh (minimul programului)' },
  { value: '11-13', label: '11 - 13 kWh' },
  { value: '14-19', label: '14 - 19 kWh (subvenția maximă; punctaj maxim de la 15 kWh)' },
  { value: 'peste-20', label: '20 kWh sau mai mult' },
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

// 25 noiembrie 2026, 23:59 la București (EET, UTC+2).
const INSCRIERE_INCHISA_LA = Date.parse('2026-11-25T21:59:00Z');

export default function CvbAlertForm({ sursa }: { sursa: string }) {
  // Calculat după montare: paginile sunt generate static, iar ora build-ului nu e
  // ora la care citește omul.
  const [inchisa, setInchisa] = useState(false);
  useEffect(() => {
    setInchisa(Date.now() > INSCRIERE_INCHISA_LA);
  }, []);
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
          Vă scriem un singur email, în ziua în care AFM publică lista aprobaților. Până atunci,
          actualizăm ghidul de fiecare dată când apare ceva oficial.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-primary/5 rounded-xl border border-primary/10 p-6 my-10">
      <h3 className="font-bold text-gray-900 text-lg">
        Vă anunțăm când AFM publică lista aprobaților
      </h3>
      <p className="text-sm text-gray-600 mt-2 mb-5 leading-relaxed">
        {inchisa
          ? 'Înscrierea persoanelor fizice s-a închis pe 25 noiembrie 2026, la ora 23:59.'
          : 'Înscrierea persoanelor fizice e deschisă până pe 25 noiembrie 2026, la ora 23:59, direct în aplicația AFM, fără instalator ales dinainte.'}{' '}
        Din ziua în care AFM publică lista celor aprobați aveți 90 de zile să alegeți un instalator
        validat. Lăsați un email și vă scriem în ziua aceea. Dacă ne spuneți și ce capacitate vă
        interesează și ce invertor aveți, vă putem trimite direct informația care contează pentru
        instalația dumneavoastră.
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
            {status === 'submitting' ? 'Se trimite...' : 'Anunțați-mă când apare lista'}
          </Button>
        </div>
      </form>

      <p className="text-xs text-gray-500 mt-3 leading-relaxed">
        Un singur email, când apare lista. Adresa nu se folosește pentru altceva și nu se
        transmite nimănui.
      </p>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
