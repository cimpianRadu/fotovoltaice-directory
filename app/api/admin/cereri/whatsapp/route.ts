import { NextResponse } from 'next/server';
import { recordClientEvent } from '@/lib/client-events';
import { WHATSAPP_OPENED_EVENT } from '@/lib/whatsapp-verificare';

// Butonul WhatsApp din /admin/cereri: notează că Radu a deschis mesajul
// „ofertă bună?” pentru cererea asta (lib/whatsapp-verificare). Protejat de
// middleware, ca tot /api/admin. Din 13 nov 2026, `kind: 'firma'` pentru
// mesajul „Cu ce firmă ați lucrat?” de pe cererile închise pe altundeva.
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const leadId = typeof body?.leadId === 'string' ? body.leadId : '';
  if (!leadId) return NextResponse.json({ error: 'Lipsește cererea.' }, { status: 400 });
  const kind = body?.kind === 'firma' ? 'firma' : 'oferta';
  await recordClientEvent(leadId, WHATSAPP_OPENED_EVENT[kind]);
  return NextResponse.json({ ok: true, at: new Date().toISOString() });
}
