import { NextResponse } from 'next/server';
import { saveAdInquiryToSheet } from '@/lib/sheets';

const ALLOWED_TIERS = ['waitlist', 'basic', 'plus', 'plus-first-mover', 'premium', 'bundle'] as const;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tier, numeFirma, numeContact, email, telefon, gdpr } = body;

    if (!tier || !ALLOWED_TIERS.includes(tier)) {
      return NextResponse.json({ error: 'Pachet invalid.' }, { status: 400 });
    }

    if (!numeFirma || !numeContact || !email || !telefon) {
      return NextResponse.json(
        { error: 'Toate câmpurile obligatorii trebuie completate.' },
        { status: 400 },
      );
    }

    if (!gdpr && gdpr !== 'on') {
      return NextResponse.json(
        { error: 'Trebuie să acceptați prelucrarea datelor personale.' },
        { status: 400 },
      );
    }

    await saveAdInquiryToSheet(body);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Ad inquiry API error:', err);
    return NextResponse.json(
      { error: 'Eroare internă. Vă rugăm încercați din nou.' },
      { status: 500 },
    );
  }
}
