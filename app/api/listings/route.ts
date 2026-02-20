import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

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

    const listing = {
      id: `listing-${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString(),
    };

    const listingsPath = path.join(process.cwd(), 'data', 'listings.json');
    let listings: unknown[] = [];

    try {
      const data = await fs.readFile(listingsPath, 'utf-8');
      listings = JSON.parse(data);
    } catch {
      // File doesn't exist yet
    }

    listings.push(listing);
    await fs.writeFile(listingsPath, JSON.stringify(listings, null, 2));

    return NextResponse.json({ success: true, id: listing.id });
  } catch {
    return NextResponse.json(
      { error: 'Eroare internă. Vă rugăm încercați din nou.' },
      { status: 500 }
    );
  }
}
