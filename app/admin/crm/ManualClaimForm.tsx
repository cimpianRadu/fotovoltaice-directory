'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import SearchableSelect from '@/components/ui/SearchableSelect';

/** Trimis din server component ca lista să fie deja filtrată pe segment. */
export interface FirmOption {
  id: string;
  name: string;
  phone: string;
  city: string;
  email: string;
}

interface Props {
  leadId: string;
  firms: FirmOption[];
  /** true = cererea are deja 3/3 revendicări. Se poate trece, cu bifă. */
  full: boolean;
  onDone?: () => void;
}

export default function ManualClaimForm({ leadId, firms, full, onDone }: Props) {
  const [open, setOpen] = useState(false);
  const [firmId, setFirmId] = useState('');
  const [numeFirma, setNumeFirma] = useState('');
  const [numeContact, setNumeContact] = useState('');
  const [telefon, setTelefon] = useState('');
  const [email, setEmail] = useState('');
  // Peste plafon se trece doar cu bifa asta, ca a patra firmă pe o cerere să
  // rămână o decizie luată, nu un accident de click.
  const [override, setOverride] = useState(false);
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const options = useMemo(
    () =>
      firms.map((f) => ({
        value: f.id,
        label: f.city ? `${f.name} · ${f.city}` : f.name,
      })),
    [firms],
  );

  function chooseFirm(id: string) {
    setFirmId(id);
    if (!id) return;
    const firm = firms.find((f) => f.id === id);
    if (!firm) return;
    // Numele + telefonul + emailul sunt din director; numele contactului îl
    // completezi tu — nu-l știm din companies.json și e cel mai important
    // pentru firmă, ca să nu ajungă la persoana greșită.
    setNumeFirma(firm.name);
    setTelefon(firm.phone);
    setEmail(firm.email);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState('saving');
    setError(null);
    try {
      const res = await fetch('/api/admin/claims/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          numeFirma: numeFirma.trim(),
          numeContact: numeContact.trim(),
          telefon: telefon.trim(),
          email: email.trim(),
          override,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `Eroare ${res.status}`);
      setState('saved');
      setFirmId('');
      setNumeFirma('');
      setNumeContact('');
      setTelefon('');
      setEmail('');
      setOverride(false);
      setTimeout(() => {
        setOpen(false);
        setState('idle');
        // revalidatePath din API nu recitește pagina la client fără router.refresh
        router.refresh();
        onDone?.();
      }, 800);
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'Eroare la salvare');
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          // La 3/3 formularul se deschide direct în regim peste plafon: dacă
          // tot ai dat cererea și firmei a patra, rândul trebuie consemnat.
          setOverride(full);
          setOpen(true);
        }}
        title={
          full
            ? 'Cererea are 3/3 revendicări — se poate adăuga peste plafon, cu bifă'
            : 'Marchează revendicare după apel telefonic (nu trimite email firmei)'
        }
        className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium transition ${
          full
            ? 'border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-300 hover:bg-amber-100'
            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
        }`}
      >
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3.5 w-3.5"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
          <path d="M17 11l2 2 4-4" />
        </svg>
        {full ? 'Revendică peste plafon' : 'Revendică pt firmă'}
      </button>
    );
  }

  const canSubmit =
    numeFirma.trim() &&
    numeContact.trim() &&
    telefon.trim() &&
    (!full || override) &&
    state !== 'saving';

  return (
    <form
      onSubmit={submit}
      className="w-full space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3"
    >
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
          Marchează revendicare (după apel telefonic)
        </span>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setState('idle');
            setError(null);
          }}
          className="text-[11px] text-slate-400 hover:text-slate-700"
        >
          renunță
        </button>
      </div>

      <div className="text-[10px] text-slate-500 leading-snug">
        Preumple câmpurile alegând o firmă din director, sau scrie manual dacă
        nu e listată. Emailul de confirmare <strong>nu</strong> se trimite —
        i-ai dat deja cererea telefonic.
      </div>

      {full && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-2 text-[10px] leading-snug text-amber-900">
          Cererea are deja 3/3 revendicări. Bifa de mai jos scrie a patra: o
          folosești când ai dat cererea telefonic și vrei ca firma să și-o vadă
          în portal, nu ca să încarci cererea.
        </div>
      )}

      <SearchableSelect
        name="firm"
        options={options}
        value={firmId}
        onValueChange={chooseFirm}
        placeholder="Alege firmă din director (opțional)"
      />

      <input
        type="text"
        required
        value={numeFirma}
        onChange={(e) => setNumeFirma(e.target.value)}
        placeholder="Nume firmă *"
        className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5"
      />

      <input
        type="text"
        required
        value={numeContact}
        onChange={(e) => setNumeContact(e.target.value)}
        placeholder="Persoană de contact *"
        className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5"
      />

      <input
        type="tel"
        required
        value={telefon}
        onChange={(e) => setTelefon(e.target.value)}
        placeholder="Telefon *"
        className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5"
      />

      {/* Emailul e cheia contului de portal: pe el se leagă revendicarea de
          firmă. A fost opțional până pe 12 aug 2026 și așa au ieșit 11
          revendicări invizibile în portal — firme cărora le dădusem cererea la
          telefon și care intrau pe o pagină goală. Acum e obligatoriu. */}
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email (contul de portal al firmei) *"
        className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5"
      />
      <p className="text-[10px] leading-snug text-slate-500">
        {email.trim()
          ? 'Firma vede cererea în /portal dacă intră cu exact acest email.'
          : 'Fără email, revendicarea nu apare în /portal, oricât ar căuta firma acolo.'}
      </p>

      <label className="flex items-start gap-2 text-[10px] leading-snug text-slate-600">
        <input
          type="checkbox"
          checked={override}
          onChange={(e) => setOverride(e.target.checked)}
          className="mt-0.5 h-3 w-3 rounded border-slate-300"
        />
        <span>
          Treci peste plafoane (a 4-a firmă pe cerere / firma are deja 3
          revendicări necontactate)
        </span>
      </label>

      <div className="flex items-center justify-between gap-2">
        <span
          className={`text-[11px] ${
            state === 'error'
              ? 'text-red-600'
              : state === 'saved'
                ? 'text-emerald-600'
                : 'text-slate-400'
          }`}
        >
          {state === 'saving' && 'se salvează…'}
          {state === 'saved' && 'revendicare salvată'}
          {state === 'error' && error}
        </span>
        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-3 py-1 text-[11px] font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          Adaugă revendicare
        </button>
      </div>
    </form>
  );
}
