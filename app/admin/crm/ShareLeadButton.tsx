'use client';

import { useState } from 'react';

type Feedback = 'idle' | 'copied' | 'error';

export default function ShareLeadButton({ text }: { text: string }) {
  const [feedback, setFeedback] = useState<Feedback>('idle');

  async function copy() {
    try {
      // navigator.clipboard cere fie HTTPS, fie localhost — pe /admin ambele
      // condiții sunt îndeplinite. Fallback-ul cu textarea a fost scos ca să
      // nu maschez un blocaj de permisiuni pe care e mai bine să-l văd.
      await navigator.clipboard.writeText(text);
      setFeedback('copied');
      setTimeout(() => setFeedback('idle'), 1500);
    } catch {
      setFeedback('error');
      setTimeout(() => setFeedback('idle'), 2500);
    }
  }

  // wa.me fără număr de telefon deschide WhatsApp și lasă utilizatorul să
  // aleagă destinatarul. Perfect pentru „îl trimit la instalatorul X".
  const waHref = `https://wa.me/?text=${encodeURIComponent(text)}`;

  const copyLabel =
    feedback === 'copied'
      ? 'Copiat'
      : feedback === 'error'
        ? 'Blocat — permite clipboard'
        : 'Copiază detalii';

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        onClick={copy}
        title="Copiază în clipboard textul cu toate detaliile cererii, gata de lipit în WhatsApp"
        className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium transition ${
          feedback === 'copied'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
            : feedback === 'error'
              ? 'border-red-200 bg-red-50 text-red-700'
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
          {feedback === 'copied' ? (
            <polyline points="20 6 9 17 4 12" />
          ) : (
            <>
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </>
          )}
        </svg>
        {copyLabel}
      </button>

      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        title="Deschide WhatsApp cu textul deja completat, alegi destinatarul acolo"
        className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700 transition hover:bg-emerald-100"
      >
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-3.5 w-3.5"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.017 21.785h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884zm8.413-18.297A11.815 11.815 0 0012.02 0C5.495 0 .185 5.31.183 11.834c0 2.086.545 4.122 1.58 5.916L.057 24l6.412-1.682a11.828 11.828 0 005.652 1.438h.005c6.526 0 11.837-5.31 11.84-11.834a11.762 11.762 0 00-3.443-8.434z" />
        </svg>
        WhatsApp
      </a>
    </div>
  );
}
