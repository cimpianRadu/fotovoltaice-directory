import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getPortalEmail } from '@/lib/portal-session';
import {
  MAX_ACTIVE_CLAIMS_PER_FIRM,
  MAX_CLAIMS_PER_LEAD,
  countActiveClaimsForFirm,
  findSubscriptionForCounty,
  getClaims,
  getFullLeadById,
  getLeadSubscriptions,
  isLeadClosed,
  isSameFirm,
  saveClaimToSheet,
} from '@/lib/sheets';
import { sendClaimNotification } from '@/lib/email';
import {
  getConnectionLabel,
  getFinancingLabel,
  getPhaseLabel,
  getProjectTypeLabel,
  getRoofTypeLabel,
} from '@/lib/utils-shared';

// Preluarea unei cereri rezervate, din portal. Ruta publică de revendicare cere
// nume, contact și telefon tastate de firmă; aici toate trei vin din rândul de
// abonament, iar identitatea e sesiunea. Fereastra de prioritate nu se verifică
// pentru abonatul propriu: după ce expiră, cererea intră în feed și se ia de
// acolo, dar dacă e încă a lui, o poate lua de aici oricând.

export async function POST(request: Request) {
  const email = await getPortalEmail();
  if (!email) {
    return NextResponse.json({ error: 'Sesiune expirată. Intră din nou în portal.' }, { status: 401 });
  }

  try {
    const { leadId } = (await request.json()) as { leadId?: string };
    if (!leadId) {
      return NextResponse.json({ error: 'Cerere necunoscută.' }, { status: 400 });
    }

    const lead = await getFullLeadById(leadId);
    if (!lead || isLeadClosed(lead.crmStatus)) {
      return NextResponse.json({ error: 'Cererea nu mai este activă.' }, { status: 404 });
    }

    const sub = findSubscriptionForCounty(await getLeadSubscriptions(), lead.judet);
    if (!sub || sub.email !== email) {
      return NextResponse.json(
        { error: 'Cererea nu e rezervată pentru contul tău.' },
        { status: 403 },
      );
    }

    const firm = { numeFirma: sub.firma, telefon: sub.telefon };
    const allClaims = await getClaims();

    if (allClaims.some((c) => c.leadId === leadId && isSameFirm(c, firm))) {
      return NextResponse.json({ error: 'Ai preluat deja cererea asta.' }, { status: 409 });
    }

    // Același plafon ca pe ruta publică: abonamentul cumpără ordinea, nu dreptul
    // de a strânge cereri nesunate. Se eliberează mutând statusul în portal.
    const active = countActiveClaimsForFirm(allClaims, firm);
    if (active >= MAX_ACTIVE_CLAIMS_PER_FIRM) {
      return NextResponse.json(
        {
          error:
            `Ai deja ${active} cereri pe care nu le-ai mișcat. Mută-le statusul mai jos ` +
            '(„În discuții", „Ofertă trimisă") și locurile se eliberează pe loc.',
        },
        { status: 409 },
      );
    }

    const claim = {
      leadId,
      numeFirma: sub.firma,
      numeContact: sub.contact,
      telefon: sub.telefon,
      source: 'abonament' as const,
      email,
    };
    await saveClaimToSheet(claim);

    revalidatePath('/portal');
    revalidatePath('/cereri');

    await sendClaimNotification({
      claim,
      lead: {
        numeCompanie: lead.numeCompanie,
        numeContact: lead.numeContact,
        email: lead.email,
        telefon: lead.telefon,
        tipProiectLabel: getProjectTypeLabel(lead.tipProiect),
        judet: lead.judet,
        putere: lead.putere,
        suprafata: lead.suprafata,
        segment: lead.segment,
        timestamp: lead.timestamp,
        acoperisLabel: lead.tipAcoperis ? getRoofTypeLabel(lead.tipAcoperis) : '',
        fazareLabel: lead.fazare ? getPhaseLabel(lead.fazare) : '',
        consumLunar: lead.consumLunar,
        finantareLabel: lead.finantare ? getFinancingLabel(lead.finantare) : '',
        bransamentLabel: lead.bransament ? getConnectionLabel(lead.bransament) : '',
      },
      claimCount: allClaims.filter((c) => c.leadId === leadId).length + 1,
      maxClaims: MAX_CLAIMS_PER_LEAD,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[portal] preluare cerere rezervată:', err);
    return NextResponse.json({ error: 'Eroare internă. Încearcă din nou.' }, { status: 500 });
  }
}
