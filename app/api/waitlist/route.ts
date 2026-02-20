import { NextResponse } from 'next/server';
import { saveWaitlistToSheet } from '@/lib/sheets';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Adresa de email este invalidă.' },
        { status: 400 }
      );
    }

    await saveWaitlistToSheet(email);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Waitlist API error:', err);
    return NextResponse.json(
      { error: 'Eroare internă.' },
      { status: 500 }
    );
  }
}
