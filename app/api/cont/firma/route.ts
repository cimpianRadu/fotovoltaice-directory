import { NextResponse } from 'next/server';
import { getClaims } from '@/lib/sheets';
import { deliveredClaims, isFirmReport, leadForViewer, reportFirm } from '@/lib/client-account';
import { isRefuzReason } from '@/lib/client-account-shared';
import { normalizeKw } from '@/lib/client-response-details';

// Clientul spune ce a făcut o firmă care i-a preluat cererea: nu l-a sunat, l-a
// sunat fără ofertă, a primit ofertă, a semnat. Doar pentru firmele care au
// primit datele lui (revendicare aprobată, neretrasă).

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const leadId = typeof body?.leadId === 'string' ? body.leadId : '';
  const claimTs = typeof body?.claimTs === 'string' ? body.claimTs : '';
  const status = body?.status;
  if (!leadId || !claimTs || !isFirmReport(status)) {
    return NextResponse.json({ error: 'Alegeți ce s-a întâmplat cu firma.' }, { status: 400 });
  }
  const access = await leadForViewer(leadId);
  if (!access) return NextResponse.json({ error: 'Intrați în cont ca să răspundeți.' }, { status: 401 });

  try {
    const claim = deliveredClaims(await getClaims(), leadId).find((c) => c.timestamp === claimTs);
    if (!claim) return NextResponse.json({ error: 'Firma nu mai are cererea dumneavoastră.' }, { status: 404 });
    const putere = typeof body?.putere === 'string' ? normalizeKw(body.putere) : undefined;
    const motiv = isRefuzReason(body?.motiv) ? body.motiv : undefined;
    await reportFirm({ lead: access.lead, claim, status, putere: putere || undefined, motiv });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[cont] firmă:', err);
    return NextResponse.json({ error: 'Nu am putut salva răspunsul. Încercați din nou.' }, { status: 500 });
  }
}
