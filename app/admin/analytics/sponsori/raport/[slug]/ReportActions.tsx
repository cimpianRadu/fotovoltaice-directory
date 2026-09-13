'use client';

import { useState } from 'react';

/**
 * Cele două moduri în care raportul ajunge la partener: lipit într-un email
 * (markdown) sau tipărit în PDF din dialogul browserului. Nu trimitem nimic de
 * aici — plecarea unui email către un client se decide manual.
 */
export default function ReportActions({ markdown }: { markdown: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocat (context non-secure sau permisiune refuzată):
      // selectăm textul din caseta de mai jos ca să poată fi copiat cu mâna.
      const el = document.getElementById('raport-markdown') as HTMLTextAreaElement | null;
      el?.select();
    }
  };

  return (
    <div className="flex items-center gap-2 print:hidden">
      <button
        type="button"
        onClick={copy}
        className="px-3 py-1.5 text-xs rounded-md bg-slate-900 text-white hover:bg-slate-700 transition"
      >
        {copied ? 'Copiat ✓' : 'Copiază markdown'}
      </button>
      <button
        type="button"
        onClick={() => window.print()}
        className="px-3 py-1.5 text-xs rounded-md border border-slate-300 text-slate-700 hover:bg-slate-100 transition"
      >
        Printează / PDF
      </button>
    </div>
  );
}
