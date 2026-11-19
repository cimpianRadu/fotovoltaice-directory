import { NextResponse } from 'next/server';
import { recordClientEvent } from '@/lib/client-events';

// Revenirea pe WhatsApp (18 nov 2026, lib/whatsapp-verificare): notează că a
// doua încercare a plecat, din butonul „Revino” din /admin/whatsapp sau de
// rutina de dimineață după trimitere. `kind` = mesajul la care revine, `motiv`
// = de ce (n-a răspuns / n-a spus firma / `ultimul`, a treia și ultima încercare). `la` doar pentru o revenire trimisă
// de mână și notată mai târziu. Protejat de middleware, ca tot /api/admin.
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const leadId = typeof body?.leadId === 'string' ? body.leadId.trim() : '';
  if (!leadId) return NextResponse.json({ error: 'Lipsește cererea.' }, { status: 400 });
  const kind = body?.kind === 'firma' ? 'firma' : 'oferta';
  // Ultimul mesaj (19 nov 2026): eveniment separat, doar pe „ofertă bună?”.
  if (body?.motiv === 'ultimul') {
    const laU = typeof body?.la === 'string' && !Number.isNaN(Date.parse(body.la)) ? new Date(body.la).toISOString() : '';
    await recordClientEvent(leadId, 'whatsapp_ultimul', { kind: 'oferta', ...(laU ? { la: laU } : {}) });
    return NextResponse.json({ ok: true, at: laU || new Date().toISOString() });
  }
  const motiv = body?.motiv === 'nume_firma' ? 'nume_firma' : kind;
  const laRaw = typeof body?.la === 'string' ? body.la : '';
  const la = laRaw && !Number.isNaN(Date.parse(laRaw)) ? new Date(laRaw).toISOString() : '';
  await recordClientEvent(leadId, 'whatsapp_revenire', { kind, motiv, ...(la ? { la } : {}) });
  return NextResponse.json({ ok: true, at: la || new Date().toISOString() });
}
