import { NextResponse } from 'next/server';
import { getLeadsSince } from '@/lib/sheets';
import { leadDetail } from '@/app/admin/portal/account-data';

/** Detaliile cererii din modalul unei revendicări în /admin/portal, la deschidere. Auth: middleware. */
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get('lead') || '';
  if (!id) return NextResponse.json({ error: 'Lipsește cererea.' }, { status: 400 });
  try {
    const leads = await getLeadsSince(new Date(0));
    return NextResponse.json({ detail: leadDetail(leads.find((l) => l.timestamp === id)) ?? null });
  } catch (err) {
    console.error('[admin/portal] cerere:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Eroare internă' },
      { status: 500 },
    );
  }
}
