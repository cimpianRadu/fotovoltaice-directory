import { NextResponse } from 'next/server';
import { getClaims, getCrmFirms, getLeadsSince, getListingsSince } from '@/lib/sheets';
import { getCompanies } from '@/lib/utils';
import { matchFirmsForLead } from '@/lib/lead-match';
import { matchNecesitFirms } from '@/lib/necesit-match';

/**
 * Pe cine sun pentru o cerere: potrivirile din director și de pe necesit.ro,
 * calculate doar când le cer, pe o singură cerere (/admin/crm și fișa din
 * /admin/cereri). Până pe 24 nov 2026 se calculau la încărcarea paginii pentru
 * fiecare cerere afișată. Autentificarea o face middleware-ul (/api/admin/*).
 */
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get('lead') || '';
  if (!id) return NextResponse.json({ error: 'Lipsește cererea.' }, { status: 400 });
  try {
    const [leads, claims, crmFirms, listings] = await Promise.all([
      getLeadsSince(new Date(0)),
      getClaims(),
      getCrmFirms(),
      getListingsSince(new Date(0)),
    ]);
    const lead = leads.find((l) => l.timestamp === id);
    if (!lead) return NextResponse.json({ error: 'Cererea nu există.' }, { status: 404 });
    return NextResponse.json({
      matches: matchFirmsForLead(lead, id, getCompanies(), claims, crmFirms),
      necesit: matchNecesitFirms(lead, listings),
    });
  } catch (err) {
    console.error('[admin] potriviri:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Eroare internă' },
      { status: 500 },
    );
  }
}
