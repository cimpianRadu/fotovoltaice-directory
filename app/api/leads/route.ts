import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

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

    const lead = {
      id: `lead-${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString(),
    };

    // Save to JSON file
    const leadsPath = path.join(process.cwd(), 'data', 'leads.json');
    let leads: unknown[] = [];

    try {
      const data = await fs.readFile(leadsPath, 'utf-8');
      leads = JSON.parse(data);
    } catch {
      // File doesn't exist yet
    }

    leads.push(lead);
    await fs.writeFile(leadsPath, JSON.stringify(leads, null, 2));

    return NextResponse.json({ success: true, id: lead.id });
  } catch {
    return NextResponse.json(
      { error: 'Eroare internă. Vă rugăm încercați din nou.' },
      { status: 500 }
    );
  }
}
