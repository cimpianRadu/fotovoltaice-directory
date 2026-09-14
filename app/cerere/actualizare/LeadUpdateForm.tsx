'use client';

import { useState } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import SearchableSelect from '@/components/ui/SearchableSelect';
import { TIMELINE_OPTIONS } from '@/lib/utils-shared';

// Cele patru lucruri care se schimbă între „mă informez" și „sunt gata".
// Termenul e obligatoriu și fără opțiunea „mă informez": omul a apăsat un
// buton care spune că e gata, iar cererea reintră în feed doar cu un termen
// concret. Restul e opțional, ca la formularul de cerere.

type Option = { value: string; label: string };

interface LeadUpdateFormProps {
  id: string;
  token: string;
  initial: { termen: string; finantare: string; putere: string; mesaj: string };
  financing: Option[];
  judet: string;
}

const TIMELINES: Option[] = TIMELINE_OPTIONS.filter((o) => o.value !== 'ma-informez').map((o) => ({
  value: o.value,
  label: o.label,
}));

export default function LeadUpdateForm({ id, token, initial, financing, judet }: LeadUpdateFormProps) {
  const [termen, setTermen] = useState(initial.termen);
  const [finantare, setFinantare] = useState(initial.finantare);
  const [putere, setPutere] = useState(initial.putere);
  const [mesaj, setMesaj] = useState(initial.mesaj);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ watchersNotified: number; reservedFor: string | null } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!termen) {
      setError('Alegeți cât de repede vreți instalarea.');
      return;
    }
    setStatus('submitting');
    try {
      const res = await fetch('/api/leads/reactivare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, token, termen, finantare, putere, mesaj }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus('idle');
        setError(typeof json.error === 'string' ? json.error : 'A apărut o eroare. Încercați din nou.');
        return;
      }
      setResult({ watchersNotified: json.watchersNotified ?? 0, reservedFor: json.reservedFor ?? null });
      setStatus('done');
    } catch {
      setStatus('idle');
      setError('A apărut o eroare. Încercați din nou.');
    }
  }

  if (status === 'done') {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
        <h2 className="font-bold text-emerald-900">Cererea este activă ✓</h2>
        <p className="mt-2 text-sm text-emerald-800 leading-relaxed">
          {result?.reservedFor
            ? `Cererea ajunge întâi la firma partener din județul ${judet}, care are câteva ore să o preia, apoi la celelalte firme din județ.`
            : result && result.watchersNotified > 0
              ? `${result.watchersNotified === 1 ? 'O firmă care urmărea cererea a fost anunțată' : `${result.watchersNotified} firme care urmăreau cererea au fost anunțate`} chiar acum. Celelalte firme din județul ${judet} primesc vestea mâine dimineață.`
              : `Firmele din județul ${judet} primesc vestea mâine dimineață, iar cererea apare deja în lista lor.`}{' '}
          Vă contactăm noi telefonic după prima revendicare, ca să confirmăm că totul e în regulă.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border bg-white p-5 sm:p-6">
      <SearchableSelect
        label="Cât de repede vreți instalarea"
        name="termen"
        options={TIMELINES}
        value={termen}
        onValueChange={setTermen}
        placeholder="Alegeți..."
        required
      />
      <SearchableSelect
        label="Cum finanțați investiția"
        name="finantare"
        options={financing}
        value={finantare}
        onValueChange={setFinantare}
        placeholder="Alegeți..."
      />
      <Input
        label="Putere dorită (kW)"
        name="putere"
        type="number"
        inputMode="numeric"
        placeholder="ex: 6"
        value={putere}
        onChange={(e) => setPutere(e.target.value)}
        hint="Lăsați gol dacă nu știți, instalatorul o recomandă."
      />
      <Input
        label="Mesaj pentru instalatori"
        name="mesaj"
        type="textarea"
        placeholder="Ce s-a schimbat de la prima cerere, detalii utile..."
        value={mesaj}
        onChange={(e) => setMesaj(e.target.value)}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" variant="primary" size="lg" disabled={status === 'submitting'} className="w-full">
        {status === 'submitting' ? 'Se trimite...' : 'Sunt gata pentru oferte'}
      </Button>
      <p className="text-[11px] text-gray-500 leading-relaxed">
        Datele de contact rămân cele din cererea inițială și se dau firmelor doar după apelul nostru de
        confirmare, ca până acum.
      </p>
    </form>
  );
}
