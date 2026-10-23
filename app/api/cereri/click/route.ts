import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE } from '@/lib/admin-auth';
import { PORTAL_COOKIE, normalizeEmail, verifyToken } from '@/lib/portal-auth';
import { isLeadClickKind, recordLeadClick } from '@/lib/lead-clicks';

// Un click pe un card din /cereri (lib/lead-clicks.ts). Răspunde mereu 204: e
// apelat cu sendBeacon, nimeni nu citește răspunsul, iar o eroare de bază de
// date nu are de ce să ajungă în consola vizitatorului.

const LEAD_ID_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

/**
 * Vizitatorul, fără nimic scris în browser: un hash din IP, browser și ziua de
 * azi, cu secretul nostru. Se schimbă la miezul nopții, deci nu urmărește pe
 * nimeni de la o zi la alta; în aceeași zi, cinci apăsări contează o dată.
 */
function visitorFor(req: Request): string {
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || req.headers.get('x-real-ip') || '';
  const ua = req.headers.get('user-agent') || '';
  const day = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Bucharest' }).format(new Date());
  return createHash('sha256')
    .update(`lead-click:${process.env.PORTAL_SECRET || ''}:${day}:${ip}:${ua}`)
    .digest('hex')
    .slice(0, 32);
}

export async function POST(req: Request) {
  const done = new NextResponse(null, { status: 204 });
  const body = (await req.json().catch(() => null)) as { leadId?: unknown; kind?: unknown } | null;
  const leadId = typeof body?.leadId === 'string' ? body.leadId : '';
  if (!LEAD_ID_RE.test(leadId) || !isLeadClickKind(body?.kind)) return done;

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
    await recordLeadClick({ leadId, kind: body.kind, visitor: visitorFor(req), firmEmail });
  } catch (err) {
    console.error('[cereri/click]', err);
  }
  return done;
}
