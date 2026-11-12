import { NextResponse } from 'next/server';
import { recordClientEvent } from '@/lib/client-events';

// Butonul WhatsApp din /admin/cereri: notează că Radu a deschis mesajul
// „ofertă bună?” pentru cererea asta (lib/whatsapp-verificare). Protejat de
// middleware, ca tot /api/admin.
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const leadId = typeof body?.leadId === 'string' ? body.leadId : '';
  if (!leadId) return NextResponse.json({ error: 'Lipsește cererea.' }, { status: 400 });
  await recordClientEvent(leadId, 'whatsapp_deschis');
  return NextResponse.json({ ok: true, at: new Date().toISOString() });
}
