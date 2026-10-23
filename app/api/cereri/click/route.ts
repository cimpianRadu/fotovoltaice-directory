import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE } from '@/lib/admin-auth';
import { PORTAL_COOKIE, normalizeEmail, verifyToken } from '@/lib/portal-auth';
import { isLeadClickKind, recordLeadClick } from '@/lib/lead-clicks';

// Un click pe un card din /cereri (lib/lead-clicks.ts). Răspunde mereu 204: e
// apelat cu sendBeacon, nimeni nu citește răspunsul, iar o eroare de bază de
// date nu are de ce să ajungă în consola vizitatorului.

const LEAD_ID_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
const VISITOR_RE = /^[a-zA-Z0-9-]{8,64}$/;

export async function POST(req: Request) {
  const done = new NextResponse(null, { status: 204 });
  const body = (await req.json().catch(() => null)) as { leadId?: unknown; kind?: unknown; visitor?: unknown } | null;
  const leadId = typeof body?.leadId === 'string' ? body.leadId : '';
  const visitor = typeof body?.visitor === 'string' ? body.visitor : '';
  if (!LEAD_ID_RE.test(leadId) || !VISITOR_RE.test(visitor) || !isLeadClickKind(body?.kind)) return done;

  const jar = await cookies();
  // Apăsările lui Radu din browserul de admin nu sunt interes de la firme.
  if (jar.get(ADMIN_COOKIE)) return done;

  // Firma logată în portal, doar din semnătura cookie-ului: verificarea completă
  // (peekPortalEmail) citește din Sheets, iar un click nu merită o citire.
  let firmEmail: string | null = null;
  const secret = process.env.PORTAL_SECRET;
  if (secret) {
    const session = await verifyToken(jar.get(PORTAL_COOKIE)?.value, 'session', secret);
    if (session) firmEmail = normalizeEmail(session.email);
  }

  try {
    await recordLeadClick({ leadId, kind: body.kind, visitor, firmEmail });
  } catch (err) {
    console.error('[cereri/click]', err);
  }
  return done;
}
