import { NextResponse } from 'next/server';
import { getClaims, getCrmFirms, getLeadsSince } from '@/lib/sheets';
import { getCompanies } from '@/lib/utils';
import { eligibleLeads, openLeadsWithHolders, scoreGiveOptions } from '@/app/admin/portal/give-options';

/**
 * Cererile de dat unei firme din /admin/portal, cu potrivirea calculată acum,
 * doar pentru ea. Se cheamă când se deschide „Dă o cerere”, nu la încărcarea
 * paginii. Autentificarea o face middleware-ul (/api/admin/*).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const numeFirma = String(body?.numeFirma || '').trim();
    const telefon = String(body?.telefon || '').trim();
    const companyId = String(body?.companyId || '');
    const members: string[] = Array.isArray(body?.members)
      ? body.members.map((e: unknown) => String(e || '').trim().toLowerCase()).filter(Boolean)
      : [];
    if (!numeFirma || !telefon) {
      return NextResponse.json({ error: 'Firma și telefonul sunt obligatorii.' }, { status: 400 });
    }

    const [leads, claims, firms] = await Promise.all([
      getLeadsSince(new Date(0)),
      getClaims(),
      getCrmFirms(),
    ]);
    const { open, held } = openLeadsWithHolders(leads, claims);
    const eligible = eligibleLeads(open, held, { numeFirma, telefon }, members);
    const company = companyId ? getCompanies().find((c) => c.id === companyId) : undefined;

    return NextResponse.json({ options: scoreGiveOptions(eligible, held, company, claims, firms) });
  } catch (err) {
    console.error('[admin/portal] dau-cerere:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Eroare internă' },
      { status: 500 },
    );
  }
}
