import { NextResponse } from 'next/server';
import { saveListingToSheet } from '@/lib/sheets';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { numeFirma, cui, numeContact, email, telefon, judet, gdpr } = body;

    if (!numeFirma || !cui || !numeContact || !email || !telefon || !judet) {
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

    await saveListingToSheet(body);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Listing API error:', err);
    return NextResponse.json(
      { error: 'Eroare internă. Vă rugăm încercați din nou.' },
      { status: 500 }
    );
  }
}
