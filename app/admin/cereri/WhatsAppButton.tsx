'use client';

import { useState } from 'react';

// „Ați găsit o ofertă bună?” pe WhatsApp (lib/whatsapp-verificare). Linkul
// deschide WhatsApp cu numărul clientului și textul gata scris; trimiterea o
// faci tu. Click-ul notează deschiderea, ca să știi pe cine ai întrebat.
// E link în rând, deci nu deschide modalul (ActivityTable ignoră linkurile).
// `kind: 'firma'` (13 nov 2026) = „Cu ce firmă ați lucrat?”, pe cererile închise
// pe altundeva.
export default function WhatsAppButton({
  leadId,
  kind = 'oferta',
  href,
  text,
  openedAt,
}: {
  leadId: string;
  kind?: 'oferta' | 'firma';
  href: string;
  text: string;
  openedAt: string | null;
}) {
  const [opened, setOpened] = useState(openedAt);

  function mark() {
    const now = new Date().toISOString();
    setOpened(now);
    fetch('/api/admin/cereri/whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId, kind }),
      keepalive: true,
    }).catch(() => {});
  }

  const day = opened
    ? new Date(opened).toLocaleDateString('ro-RO', { timeZone: 'Europe/Bucharest', day: 'numeric', month: 'short' })
    : '';

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={mark}
      title={`${opened ? `Deschis deja pe ${day}. ` : ''}Deschide WhatsApp cu mesajul:\n\n${text}`}
      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-semibold ${
        opened ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
      }`}
    >
      {opened ? `WhatsApp deschis ${day}` : kind === 'firma' ? 'WhatsApp: ce firmă?' : 'WhatsApp: ofertă bună?'}
    </a>
  );
}
