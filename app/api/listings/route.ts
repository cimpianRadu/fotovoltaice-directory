import { NextResponse } from 'next/server';
import { saveListingToSheet } from '@/lib/sheets';
import { lookupAnreForListing, getAnreCodeLabel } from '@/lib/anre';
import { sendListingNotification } from '@/lib/email';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^(?:\+?40|0040|0)\s*[0-9](?:[\s\-()]*[0-9]){8}$/;
const CUI_RE = /^(RO)?\d{2,10}$/i;

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      numeFirma,
      cui,
      numeContact,
      email,
      telefon,
      judet,
      specializare,
      website,
      gdpr,
    } = body;

    const errors: string[] = [];
    if (!String(numeFirma || '').trim()) errors.push('numele firmei');
    if (!String(cui || '').trim()) errors.push('CUI');
    if (!String(numeContact || '').trim()) errors.push('persoana de contact');
    if (!String(email || '').trim()) errors.push('email');
    if (!String(telefon || '').trim()) errors.push('telefon');
    if (!String(judet || '').trim()) errors.push('județ');
    if (!String(specializare || '').trim()) errors.push('activitate principală');

    if (errors.length > 0) {
      return NextResponse.json(
        { error: `Câmpuri obligatorii lipsă: ${errors.join(', ')}.` },
        { status: 400 }
      );
    }

    if (!CUI_RE.test(String(cui).replace(/\s/g, ''))) {
      return NextResponse.json({ error: 'CUI invalid.' }, { status: 400 });
    }
    if (!EMAIL_RE.test(String(email).trim())) {
      return NextResponse.json({ error: 'Adresă de email invalidă.' }, { status: 400 });
    }
    if (!PHONE_RE.test(String(telefon).trim())) {
      return NextResponse.json({ error: 'Număr de telefon invalid.' }, { status: 400 });
    }

    if (!gdpr && gdpr !== 'on') {
      return NextResponse.json(
        { error: 'Trebuie să acceptați prelucrarea datelor personale.' },
        { status: 400 }
      );
    }

    // Server-side ANRE verification — single source of truth, can't be bypassed by client.
    const { firm, certs } = lookupAnreForListing(String(numeFirma), String(judet));
    const anreVerified = !!firm && certs.length > 0;
    const anreCertsLabel = certs.map((c) => getAnreCodeLabel(c.code)).join(', ');
    const anreNote = firm
      ? certs.length > 0
        ? 'verified-pv'
        : 'found-no-pv-cert'
      : 'not-found';

    const listingPayload = {
      numeFirma: String(numeFirma),
      cui: String(cui),
      numeContact: String(numeContact),
      email: String(email),
      telefon: String(telefon),
      judet: String(judet),
      functie: body.functie ? String(body.functie) : undefined,
      website: website ? String(website) : undefined,
      specializare: String(specializare),
      descriere: body.descriere ? String(body.descriere) : undefined,
      anreFirmName: firm?.societate,
      anreCerts: anreCertsLabel,
      anreStatus: anreNote,
    };

    await saveListingToSheet(listingPayload);

    // Best-effort email notification — don't fail the request if it errors out.
    // The listing is already in the sheet.
    sendListingNotification(listingPayload).catch((err) => {
      console.warn('[listings] notification failed:', err);
    });

    return NextResponse.json({ success: true, anreVerified });
  } catch (err) {
    console.error('Listing API error:', err);
    return NextResponse.json(
      { error: 'Eroare internă. Vă rugăm încercați din nou.' },
      { status: 500 }
    );
  }
}
