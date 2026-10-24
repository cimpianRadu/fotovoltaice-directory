'use client';

import { useState } from 'react';

// „Trimite invitația” de pe cardul clientului: emailul cu linkul spre pagina
// cererii (lib/email-cont → sendInvitationEmail). Doar luni–vineri, 08–21.

export default function InviteButton({ leadId, sentAt, windowOpen }: { leadId: string; sentAt: string | null; windowOpen: boolean }) {
  const [state, setState] = useState<'idle' | 'busy' | 'sent'>(sentAt ? 'sent' : 'idle');
  const [error, setError] = useState<string | null>(null);

  if (state === 'sent') {
    return <span className="text-xs font-medium text-emerald-700">✓ Invitație trimisă{sentAt ? '' : ' acum'}</span>;
  }
  if (!windowOpen) {
    return <span className="text-xs text-slate-500">Invitația se poate trimite de luni până vineri, 8–21</span>;
  }
  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        disabled={state === 'busy'}
        onClick={async () => {
          if (!window.confirm('Trimitem clientului emailul cu linkul spre pagina cererii?')) return;
          setState('busy');
          setError(null);
          const res = await fetch('/api/admin/cont-client/invitatie', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ leadId }),
          }).catch(() => null);
          const json = res ? await res.json().catch(() => ({})) : {};
          if (res?.ok) setState('sent');
          else {
            setState('idle');
            setError(typeof json.error === 'string' ? json.error : 'Emailul n-a plecat.');
          }
        }}
        className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-60"
      >
        {state === 'busy' ? 'Se trimite…' : 'Trimite invitația'}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </span>
  );
}
