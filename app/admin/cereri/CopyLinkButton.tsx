'use client';

import { useState } from 'react';

// Linkul public al unei singure cereri, pentru o firmă care o cere pe WhatsApp.
// Butonul e în rând, deci click-ul nu deschide modalul (ActivityTable ignoră butoanele).
export default function CopyLinkButton({ text }: { text: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'error'>('idle');

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setState('copied');
    } catch {
      setState('error');
    }
    setTimeout(() => setState('idle'), 1500);
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={`Copiază pentru WhatsApp:\n\n${text}`}
      className={`rounded px-1 text-[10px] font-semibold ${
        state === 'copied'
          ? 'bg-emerald-50 text-emerald-700'
          : state === 'error'
            ? 'bg-red-50 text-red-700'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      }`}
    >
      {state === 'copied' ? 'copiat' : state === 'error' ? 'blocat' : 'copiază link'}
    </button>
  );
}
