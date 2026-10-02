'use client';

import { useState } from 'react';

/**
 * Documentul pleacă la firmă manual: PDF din dialogul de print (WhatsApp, email)
 * și mesajul de însoțire copiat în clipboard. De aici nu se trimite nimic.
 */
export default function DocumentActions({ mesaj }: { mesaj: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(mesaj);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocat: selectăm caseta, ca mesajul să se poată copia cu mâna.
      const el = document.getElementById('mesaj-insotire') as HTMLTextAreaElement | null;
      el?.select();
    }
  };

  return (
    <div className="flex items-center gap-2 print:hidden">
      <button
        type="button"
        onClick={() => window.print()}
        className="px-3 py-1.5 text-xs rounded-md bg-slate-900 text-white hover:bg-slate-700 transition"
      >
        Printează / PDF
      </button>
      <button
        type="button"
        onClick={copy}
        className="px-3 py-1.5 text-xs rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 transition"
      >
        {copied ? 'Copiat ✓' : 'Copiază mesajul'}
      </button>
    </div>
  );
}
