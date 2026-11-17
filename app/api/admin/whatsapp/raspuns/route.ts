import { NextResponse } from 'next/server';
import { recordClientEvent } from '@/lib/client-events';

// Ce a scris clientul înapoi pe WhatsApp (17 nov 2026), din /admin/whatsapp sau
// de rutina de dimineață. Răspunsurile de pe WhatsApp nu intră singure în
// sistem: le notează cine le citește. Ultimul rând pe cerere câștigă, iar textul
// gol șterge răspunsul. Protejat de middleware, ca tot /api/admin.
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const leadId = typeof body?.leadId === 'string' ? body.leadId.trim() : '';
  if (!leadId) return NextResponse.json({ error: 'Lipsește cererea.' }, { status: 400 });
  const text = typeof body?.text === 'string' ? body.text.trim().slice(0, 2000) : '';
  const laRaw = typeof body?.la === 'string' ? body.la : '';
  const la = laRaw && !Number.isNaN(Date.parse(laRaw)) ? new Date(laRaw).toISOString() : '';
  await recordClientEvent(leadId, 'whatsapp_raspuns', { text, ...(la ? { la } : {}) });
  return NextResponse.json({ ok: true, at: new Date().toISOString() });
}
