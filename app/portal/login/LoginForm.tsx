'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { trackEvent } from '@/lib/analytics';

type Step = 'email' | 'code';

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    params.get('eroare') === 'link-expirat'
      ? 'Linkul de acces a expirat. Cere un cod nou mai jos.'
      : null,
  );

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/portal/auth/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || 'A apărut o eroare. Încearcă din nou.');
        return;
      }
      trackEvent('portal_login_requested');
      setStep('code');
    } catch {
      setError('A apărut o eroare. Încearcă din nou.');
    } finally {
      setBusy(false);
    }
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/portal/auth/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || 'A apărut o eroare. Încearcă din nou.');
        return;
      }
      trackEvent('portal_login_completed');
      router.push('/portal');
      router.refresh();
    } catch {
      setError('A apărut o eroare. Încearcă din nou.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-border p-6">
      {step === 'email' ? (
        <form onSubmit={requestCode} className="space-y-4">
          <Input
            label="Emailul firmei"
            name="email"
            type="email"
            required
            placeholder="contact@firma.ro"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            hint="Orice email de firmă merge. Dacă ai revendicat deja cereri, folosește-l pe cel din revendicare."
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <Button type="submit" variant="primary" disabled={busy} className="w-full">
            {busy ? 'Se trimite...' : 'Trimite-mi codul de acces'}
          </Button>
        </form>
      ) : (
        <form onSubmit={submitCode} className="space-y-4">
          <p className="text-sm text-gray-600">
            Am trimis un cod de 6 cifre la <strong>{email}</strong>. Introdu codul de mai jos
            sau apasă butonul din email, oricare merge.
          </p>
          <Input
            label="Codul din email"
            name="code"
            required
            placeholder="123456"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <Button type="submit" variant="primary" disabled={busy} className="w-full">
            {busy ? 'Se verifică...' : 'Intră în portal'}
          </Button>
          <button
            type="button"
            onClick={() => {
              setStep('email');
              setCode('');
              setError(null);
            }}
            className="w-full text-xs text-gray-500 hover:text-gray-700 underline"
          >
            N-a ajuns emailul? Verifică Spam sau cere alt cod
          </button>
        </form>
      )}
    </div>
  );
}
