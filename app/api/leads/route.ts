import { NextResponse } from 'next/server';
import { saveLeadToSheet } from '@/lib/sheets';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { numeCompanie, numeContact, email, telefon, tipProiect, judet, gdpr } = body;

    if (!numeCompanie || !numeContact || !email || !telefon || !tipProiect || !judet) {
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

    await saveLeadToSheet(body);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Lead API error:', err);
    return NextResponse.json(
      { error: 'Eroare internă. Vă rugăm încercați din nou.' },
      { status: 500 }
    );
  }
}
