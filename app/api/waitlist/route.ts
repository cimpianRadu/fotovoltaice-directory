import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

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

    const entry = {
      email,
      createdAt: new Date().toISOString(),
    };

    const waitlistPath = path.join(process.cwd(), 'data', 'waitlist.json');
    let waitlist: unknown[] = [];

    try {
      const data = await fs.readFile(waitlistPath, 'utf-8');
      waitlist = JSON.parse(data);
    } catch {
      // File doesn't exist yet
    }

    // Check for duplicates
    if (waitlist.some((w: unknown) => (w as { email: string }).email === email)) {
      return NextResponse.json({ success: true, message: 'Deja înscris.' });
    }

    waitlist.push(entry);
    await fs.writeFile(waitlistPath, JSON.stringify(waitlist, null, 2));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Eroare internă.' },
      { status: 500 }
    );
  }
}
