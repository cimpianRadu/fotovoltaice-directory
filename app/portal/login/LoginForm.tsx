'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Input from '@/components/ui/Input';
import PhoneInput, { phoneInputOk } from '@/components/ui/PhoneInput';
import Button from '@/components/ui/Button';
import { trackEvent } from '@/lib/analytics';
import { getAttribution } from '@/lib/attribution';
import { PORTAL_EMAIL_KEY } from '@/lib/portal-email-handoff';

type Step = 'email' | 'code';

/** Telefonul de la ultima logare, ca firma să nu-l retasteze când îi expiră sesiunea. */
const PHONE_KEY = 'portal-login-telefon';

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [telefon, setTelefon] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    params.get('eroare') === 'link-expirat'
      ? 'Linkul de acces a expirat. Cere un cod nou mai jos.'
      : null,
  );

  // Emailul lăsat de ecranul de confirmare al revendicării (vezi
  // app/cereri/LeadCard.tsx): firma tocmai l-a tastat acolo, nu-l mai
  // retastează aici și nu nimerește alt email decât cel de pe revendicare, caz
  // în care portalul i-ar apărea gol. Se citește o dată și se șterge.
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(PORTAL_EMAIL_KEY);
      if (saved) {
        setEmail(saved);
        sessionStorage.removeItem(PORTAL_EMAIL_KEY);
      }
    } catch {
      /* private mode: rămâne câmpul gol */
    }
    try {
      const phone = localStorage.getItem(PHONE_KEY);
      if (phone) setTelefon(phone);
    } catch {
      /* fără stocare: firma îl scrie */
    }
  }, []);

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    if (!(await phoneInputOk(e.currentTarget as HTMLFormElement))) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/portal/auth/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, telefon, ...getAttribution() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || 'A apărut o eroare. Încearcă din nou.');
        return;
      }
      try {
        localStorage.setItem(PHONE_KEY, telefon.trim());
      } catch {
        /* fără stocare */
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
          {/* Obligatoriu de la logare (23 nov 2026): fără el, o firmă care intra și
              pleca de la formularul cu datele firmei rămânea fără niciun număr. */}
          <PhoneInput
            label="Telefon"
            name="telefon"
            required
            placeholder="0740 123 456"
            value={telefon}
            onChange={(e) => setTelefon(e.target.value)}
            hint="La el te sunăm dacă e ceva de lămurit despre o cerere."
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
