import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE } from '@/lib/admin-auth';
import { BROWSER_EVENTS, recordClientEvent, type ClientEvent } from '@/lib/client-events';

// Evenimentele din browser ale ecranului de după formular: blocul „Urmăriți-vă
// cererea” văzut și apăsat. Răspunde mereu 204 (sendBeacon).

const LEAD_ID_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

export async function POST(req: Request) {
  const done = new NextResponse(null, { status: 204 });
  const body = (await req.json().catch(() => null)) as { leadId?: unknown; event?: unknown } | null;
  const leadId = typeof body?.leadId === 'string' ? body.leadId : '';
  const event = body?.event;
  if (!LEAD_ID_RE.test(leadId) || typeof event !== 'string' || !BROWSER_EVENTS.includes(event as ClientEvent)) return done;
  // Testele lui Radu din browserul de admin nu intră în experiment.
  if ((await cookies()).get(ADMIN_COOKIE)) return done;
  await recordClientEvent(leadId, event as ClientEvent);
  return done;
}
