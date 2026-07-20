import { NextResponse } from 'next/server';
import { saveLeadToSheet } from '@/lib/sheets';

const CONSENT_VERSION = 'v2-2026-07-20';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // numeCompanie is optional — residential leads have no company name.
    const { numeContact, email, telefon, tipProiect, judet, gdpr } = body;

    if (!numeContact || !email || !telefon || !tipProiect || !judet) {
      return NextResponse.json(
        { error: 'Toate câmpurile obligatorii trebuie completate.' },
        { status: 400 }
      );
    }

    if (!gdpr && gdpr !== 'on') {
      return NextResponse.json(
        { error: 'Trebuie să acceptați prelucrarea datelor personale.' },
        { status: 400 }
      );
    }

    // Versiunea textului de consimțământ acceptat — dovadă GDPR per lead.
    await saveLeadToSheet({ ...body, gdprConsent: `da (${CONSENT_VERSION})` });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Lead API error:', err);
    return NextResponse.json(
      { error: 'Eroare internă. Vă rugăm încercați din nou.' },
      { status: 500 }
    );
  }
}
