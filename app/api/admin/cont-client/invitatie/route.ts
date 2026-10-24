import { NextResponse } from 'next/server';
import { getAccountLead } from '@/lib/client-account';
import { sendInvitationEmail } from '@/lib/email-cont';

// Invitația în cont, trimisă din /admin/cont-client (24 oct 2026). Ruta e sub
// /api/admin, deci o protejează middleware-ul de admin.

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { leadId?: unknown } | null;
  const leadId = typeof body?.leadId === 'string' ? body.leadId : '';
  const lead = leadId ? await getAccountLead(leadId) : undefined;
  if (!lead) return NextResponse.json({ error: 'Cererea nu există.' }, { status: 404 });
  const res = await sendInvitationEmail(lead);
  if (!res.ok) return NextResponse.json({ error: res.reason ?? 'Emailul n-a plecat.' }, { status: 409 });
  return NextResponse.json({ ok: true });
}
