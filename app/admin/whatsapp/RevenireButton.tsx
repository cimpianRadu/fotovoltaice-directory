'use client';

import { useState } from 'react';

// Revenirea pe WhatsApp (18 nov 2026, lib/whatsapp-verificare): deschide
// WhatsApp cu numărul clientului și textul revenirii, iar click-ul notează în
// DB că a plecat, ca să nu revenim de două ori. Trimiterea o faci tu.
export default function RevenireButton({
  leadId,
  kind,
  motiv,
  href,
  text,
}: {
  leadId: string;
  kind: 'oferta' | 'firma';
  motiv: 'oferta' | 'firma' | 'nume_firma' | 'ultimul';
  href: string;
  text: string;
}) {
  const [sentAt, setSentAt] = useState<string | null>(null);

  function mark() {
    setSentAt(new Date().toISOString());
    fetch('/api/admin/whatsapp/revenire', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId, kind, motiv }),
      keepalive: true,
    }).catch(() => {});
  }

  const label =
    motiv === 'nume_firma' ? 'Revino: ce firmă?' : motiv === 'ultimul' ? 'Ultimul mesaj pe WhatsApp' : 'Revino pe WhatsApp';
  return (
    <div className="space-y-1">
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={mark}
        title={`Deschide WhatsApp cu mesajul:\n\n${text}`}
        className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-semibold ${
          sentAt ? 'bg-slate-100 text-slate-500' : 'bg-emerald-600 text-white hover:bg-emerald-700'
        }`}
      >
        {sentAt ? (motiv === 'ultimul' ? 'Ultimul mesaj marcat' : 'Revenire marcată') : label}
      </a>
      <p className="whitespace-pre-line rounded bg-slate-50 px-2 py-1 text-[11px] text-slate-600">{text}</p>
    </div>
  );
}
