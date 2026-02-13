'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Toast from '@/components/ui/Toast';
import { trackEvent } from '@/lib/analytics';

export default function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('submitting');

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) throw new Error('Eroare');

      trackEvent('waitlist_signup', { source: 'rezidential' });
      setStatus('success');
      setToast({ message: 'Te-ai înscris cu succes! Te vom anunța când lansăm.', type: 'success' });
      setEmail('');
    } catch {
      setStatus('error');
      setToast({ message: 'A apărut o eroare. Încearcă din nou.', type: 'error' });
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="email@firma.ro"
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
        />
        <Button type="submit" disabled={status === 'submitting'}>
          {status === 'submitting' ? 'Se trimite...' : 'Înscrie-te'}
        </Button>
      </form>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </>
  );
}
