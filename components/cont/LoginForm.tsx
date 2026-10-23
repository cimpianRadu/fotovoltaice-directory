'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';

// Intrarea în cont fără parolă: emailul cu care a fost trimisă cererea, apoi
// codul de 6 cifre primit pe email (sau butonul din același email).

export default function LoginForm({ message }: { message?: string }) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'cod'>('email');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function post(url: string, body: unknown) {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(typeof json.error === 'string' ? json.error : 'A apărut o eroare. Încercați din nou.');
    return json;
  }

  async function askCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const json = await post('/api/cont/cod', { email });
      setInfo(json.message ?? null);
      setStep('cod');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function enter(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await post('/api/cont/intra', { email, code });
      window.location.assign('/cont');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  const input =
    'w-full rounded-lg border border-border bg-white px-3 py-2.5 text-base text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

  return (
    <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
      {message && <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{message}</p>}
      {step === 'email' ? (
        <form onSubmit={askCode} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-800">Emailul cu care ați trimis cererea</span>
            <input
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`mt-1 ${input}`}
              placeholder="nume@exemplu.ro"
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? 'Se trimite…' : 'Trimiteți-mi un cod'}
          </Button>
          <p className="text-xs text-gray-500">Fără parolă: primiți pe email un cod de 6 cifre și un buton de intrare.</p>
        </form>
      ) : (
        <form onSubmit={enter} className="space-y-4">
          {info && <p className="text-sm text-gray-700">{info}</p>}
          <label className="block">
            <span className="text-sm font-medium text-gray-800">Codul din email</span>
            <input
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className={`mt-1 ${input} tracking-[0.4em] text-center text-lg font-semibold`}
              placeholder="000000"
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={busy || code.length !== 6} className="w-full">
            {busy ? 'Se verifică…' : 'Intrați în cont'}
          </Button>
          <button
            type="button"
            onClick={() => {
              setStep('email');
              setCode('');
              setError(null);
            }}
            className="w-full text-center text-xs text-gray-500 underline hover:text-gray-800"
          >
            Altă adresă sau alt cod
          </button>
        </form>
      )}
    </div>
  );
}
