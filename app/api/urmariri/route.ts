import { NextResponse } from 'next/server';
import {
  getFirmIdentity,
  getFullLeadById,
  getWatches,
  isLeadClosed,
  isLeadInformez,
  saveWatchToSheet,
} from '@/lib/sheets';
import { isValidEmail, normalizeEmail } from '@/lib/portal-auth';
import { peekPortalEmail } from '@/lib/portal-session';

// „Urmărește cererea": firma își pune un semn pe o cerere pe care clientul se
// informează. Nu e revendicare: nu consumă loc, nu cere telefonul nostru de
// confirmare, nu deblochează date. Singurul efect e emailul de la reactivare,
// trimis înaintea alertelor pe județ (vezi lib/informez.reactivateLead).

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const leadId = typeof body.leadId === 'string' ? body.leadId.trim() : '';
    let numeFirma = typeof body.numeFirma === 'string' ? body.numeFirma.trim().slice(0, 120) : '';
    let emailRaw = typeof body.email === 'string' ? body.email.trim() : '';

    // Din cont: numele din ultima revendicare, emailul din sesiune — ca la
    // /api/claims. Fără sesiune sau istoric, clientul cade pe formular.
    if (body.fromAccount === true) {
      const sessionEmail = await peekPortalEmail();
      const identity = sessionEmail
        ? await getFirmIdentity(sessionEmail)
        : null;
      if (!sessionEmail || !identity) {
        return NextResponse.json(
          { error: 'Sesiunea a expirat. Completează datele firmei.', needsForm: true },
          { status: 401 },
        );
      }
      numeFirma = identity.numeFirma;
      emailRaw = sessionEmail;
    }

    if (!leadId || !numeFirma || !emailRaw) {
      return NextResponse.json({ error: 'Numele firmei și emailul sunt obligatorii.' }, { status: 400 });
    }
    if (!isValidEmail(emailRaw)) {
      return NextResponse.json({ error: 'Adresa de email nu este validă.' }, { status: 400 });
    }
    const email = normalizeEmail(emailRaw);

    const lead = await getFullLeadById(leadId);
    if (!lead || isLeadClosed(lead.crmStatus)) {
      return NextResponse.json({ error: 'Cererea nu mai este activă.' }, { status: 404 });
    }
    // Pe o cerere activă nu există „urmărire": se revendică. Butonul apare
    // doar la „se informează", dar id-ul poate veni dintr-un feed vechi.
    if (!isLeadInformez(lead)) {
      return NextResponse.json(
        { error: 'Clientul e gata pentru oferte: cererea se revendică, nu se urmărește.', active: true },
        { status: 409 },
      );
    }

    const watches = await getWatches();
    if (watches.some((w) => w.leadId === leadId && w.email === email)) {
      return NextResponse.json({ success: true, duplicate: true });
    }

    await saveWatchToSheet({ leadId, numeFirma, email });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Watch API error:', err);
    return NextResponse.json({ error: 'Eroare internă. Încearcă din nou.' }, { status: 500 });
  }
}
