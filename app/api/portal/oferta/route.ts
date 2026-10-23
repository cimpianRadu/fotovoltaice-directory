import { NextResponse, after } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getPortalEmail } from '@/lib/portal-session';
import { getFullLeadById, setClaimFirmStatus } from '@/lib/sheets';
import { createOffer, headOfferFile, offerClaimFor } from '@/lib/oferte';
import { OFFER_MAX_FILES, isOfferPath, safeOfferName, type OfferFile } from '@/lib/oferte-shared';
import { describeLead, firmDisplayName } from '@/lib/client-account';
import { sendOfferEmail } from '@/lib/email-cont';
import { escapeHtml, sendEmail } from '@/lib/email';

// Înregistrează oferta după ce fișierele au urcat în Blob: le leagă de cerere,
// trece statusul firmei pe „Ofertă trimisă” și anunță clientul pe email.

const num = (v: unknown, max: number): number | null => {
  const n = Number(String(v ?? '').replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) && n > 0 && n <= max ? n : null;
};

export async function POST(request: Request) {
  const email = await getPortalEmail();
  if (!email) return NextResponse.json({ error: 'Intră în portal.' }, { status: 401 });
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const leadId = typeof body?.leadId === 'string' ? body.leadId : '';
  const rawFiles = Array.isArray(body?.files) ? body.files : [];

  const claim = leadId ? await offerClaimFor(email, leadId) : null;
  if (!claim) return NextResponse.json({ error: 'Nu poți trimite ofertă pe cererea asta.' }, { status: 403 });
  if (!rawFiles.length || rawFiles.length > OFFER_MAX_FILES) {
    return NextResponse.json({ error: `Atașează între 1 și ${OFFER_MAX_FILES} fișiere.` }, { status: 400 });
  }

  try {
    // Mărimea și tipul se iau din Blob, nu din ce spune browserul.
    const files: OfferFile[] = [];
    for (const f of rawFiles as { pathname?: unknown; name?: unknown }[]) {
      const pathname = typeof f.pathname === 'string' ? f.pathname : '';
      if (!isOfferPath(pathname, leadId)) return NextResponse.json({ error: 'Fișier nepermis.' }, { status: 400 });
      const meta = await headOfferFile(pathname);
      files.push({
        pathname,
        name: safeOfferName(typeof f.name === 'string' ? f.name : pathname.split('/').pop() || 'oferta.pdf'),
        size: meta.size,
        contentType: meta.contentType,
      });
    }
    const valoare = num(body?.valoare, 100_000_000);
    const putere = num(body?.putere, 100_000);
    const mesaj = typeof body?.mesaj === 'string' ? body.mesaj.trim().slice(0, 500) || null : null;
    const firmName = firmDisplayName(claim.numeFirma);

    const id = await createOffer({
      leadId,
      claimTs: claim.timestamp,
      firmName,
      firmEmail: email,
      files,
      valoareFaraTva: valoare,
      putereKw: putere,
      mesaj,
    });
    if (claim.firmStatus !== 'ofertat' && claim.firmStatus !== 'castigat') {
      await setClaimFirmStatus(claim.timestamp, leadId, 'ofertat');
    }

    after(async () => {
      try {
        const lead = await getFullLeadById(leadId);
        if (!lead) return;
        await sendOfferEmail(lead, id, firmName);
        await sendEmail({
          to: 'contact@instalatori-fotovoltaice.ro',
          subject: `[Ofertă prin platformă] ${lead.judet}: ${firmName}${valoare ? `, ${valoare.toLocaleString('ro-RO')} lei fără TVA` : ''}`,
          html: `<p>${escapeHtml(firmName)} a urcat o ofertă pentru ${escapeHtml(describeLead(lead))} (${escapeHtml(lead.judet)}), cererea ${escapeHtml(leadId)}: ${files.length} fișiere${putere ? `, ${putere} kW` : ''}.</p>${mesaj ? `<p>Mesaj: „${escapeHtml(mesaj)}”</p>` : ''}`,
        });
      } catch (err) {
        console.error('[oferte] anunț:', err);
      }
    });

    revalidatePath('/portal');
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error('[oferte] salvare:', err);
    return NextResponse.json({ error: 'Oferta nu s-a putut salva. Încearcă din nou.' }, { status: 500 });
  }
}
