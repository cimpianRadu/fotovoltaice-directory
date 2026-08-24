import { NextResponse } from 'next/server';
import { enrichLeadInSheet, LEAD_ENRICH_FIELDS, type LeadEnrichField } from '@/lib/sheets';

// Detaliile de după trimitere. Cererea există deja în Sheet (a scris-o
// /api/leads și a întors timestamp-ul ca `id`), aici doar completăm coloanele
// pe care nu le mai cerem în fluxul principal.
//
// Ce NU face ruta asta: nu creează cereri și nu atinge datele de contact,
// consimțământul sau coloanele de CRM. `id` singur nu e un secret, dar
// suprafața pe care o expune e strict setul de mai jos, iar valorile goale
// sunt ignorate, deci nimeni nu poate șterge cu ea o cerere completată.

const MAX_VALUE_LENGTH = 120;
// Mesajul e text liber, nu o valoare de listă; 120 de caractere l-ar reteza la
// mijloc de propoziție. Restul câmpurilor rămân scurte.
const MAX_MESSAGE_LENGTH = 1000;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = typeof body.id === 'string' ? body.id.trim() : '';

    if (!id) {
      return NextResponse.json({ error: 'Cerere necunoscută.' }, { status: 400 });
    }

    const fields: Partial<Record<LeadEnrichField, string>> = {};
    for (const field of LEAD_ENRICH_FIELDS) {
      const raw = body[field];
      if (typeof raw !== 'string') continue;
      const value = raw.trim().slice(0, field === 'mesaj' ? MAX_MESSAGE_LENGTH : MAX_VALUE_LENGTH);
      if (value) fields[field] = value;
    }

    if (!Object.keys(fields).length) {
      return NextResponse.json({ success: true, written: [] });
    }

    const written = await enrichLeadInSheet(id, fields);
    return NextResponse.json({ success: true, written });
  } catch (err) {
    console.error('Lead enrich error:', err);
    // Cererea e deja salvată, deci un eșec aici nu pierde leadul. Clientul
    // afișează un mesaj blând, nu o eroare care să-l sperie că s-a pierdut tot.
    return NextResponse.json(
      { error: 'Nu am putut salva detaliile. Cererea dumneavoastră este însă înregistrată.' },
      { status: 500 }
    );
  }
}
