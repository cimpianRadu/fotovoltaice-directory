// Asistentul de după cerere (pilot 12 nov 2026). Autorizarea e tokenul de la
// poze și adresă: îl primește doar cine tocmai a trimis cererea, iar pagina din
// cont îl emite din nou după ce verifică sesiunea. Id-ul cererii singur nu
// ajunge, apare în feedul public.
//
//   GET  ?leadId&token          → starea: eligibilă, mesajele, ce s-a salvat
//   POST {leadId, token, mesaj} → o replică
//   POST {leadId, token, gata}  → clientul a apăsat „Am terminat”
//   POST {leadId, token, nota, motiv} → clientul spune dacă i-a fost util

import { NextResponse } from 'next/server';
import { verifyLeadPhotoToken } from '@/lib/lead-photos';
import { getFullLeadById } from '@/lib/sheets';
import {
  AsistentEroare,
  asistentPornit,
  cerereEligibila,
  getConversatie,
  incheieConversatie,
  instantaneuCerere,
  mesajIntro,
  noteazaConversatia,
  raspunde,
  raspundeMock,
  startConversatie,
  type Conversatie,
} from '@/lib/asistent';
import { ASISTENT_MAX_CARACTERE, ASISTENT_MAX_MESAJE, rezumatCerere } from '@/lib/asistent-shared';

export const runtime = 'nodejs';
export const maxDuration = 60;

function stare(c: Conversatie) {
  return {
    eligibil: true,
    mesaje: c.mesaje.afisare.length
      ? c.mesaje.afisare
      : [{ rol: 'asistent', text: mesajIntro(c.cerere), la: c.updatedAt }],
    // Ce vede firma, arătat și clientului: știe exact ce pleacă din conversație.
    previzualizare: rezumatCerere(c.cerere, c.date, c.updatedAt),
    incheiata: Boolean(c.incheiataLa),
    notaClient: c.notaClient,
    ramase: Math.max(0, ASISTENT_MAX_MESAJE - c.replici),
  };
}

/**
 * Conversația cererii, creată la prima vizită. Cererea se citește din Sheets o
 * singură dată; de acolo încolo totul vine din Neon.
 */
async function conversatiePentru(leadId: string): Promise<Conversatie | null> {
  const existenta = await getConversatie(leadId);
  if (existenta) return existenta;
  const lead = await getFullLeadById(leadId);
  if (!lead || !cerereEligibila(lead)) return null;
  return startConversatie(leadId, instantaneuCerere(lead));
}

function autorizat(leadId: string, token: string): boolean {
  if (!leadId || !token) return false;
  try {
    return verifyLeadPhotoToken(token, leadId);
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const leadId = url.searchParams.get('leadId') || '';
  const token = url.searchParams.get('token') || '';
  if (!asistentPornit()) return NextResponse.json({ eligibil: false });
  // Fără cheie, bula nu apare deloc: altfel clientul ar vedea un chat care
  // răspunde cu eroare la primul mesaj. Modul de probă local merge fără cheie.
  if (!process.env.ANTHROPIC_API_KEY && process.env.ASISTENT_MOCK !== '1') {
    console.warn('[asistent] ANTHROPIC_API_KEY lipsește: bula Watt AI nu se arată.');
    return NextResponse.json({ eligibil: false });
  }
  if (!autorizat(leadId, token)) return NextResponse.json({ error: 'acces' }, { status: 403 });
  try {
    const c = await conversatiePentru(leadId);
    if (!c) return NextResponse.json({ eligibil: false });
    return NextResponse.json(stare(c));
  } catch (err) {
    console.error('[asistent] încărcare:', err);
    return NextResponse.json({ eligibil: false });
  }
}

export async function POST(request: Request) {
  if (!asistentPornit()) return NextResponse.json({ error: 'Asistentul nu e pornit.' }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Cerere invalidă.' }, { status: 400 });
  }
  const leadId = typeof body.leadId === 'string' ? body.leadId : '';
  const token = typeof body.token === 'string' ? body.token : '';
  if (!autorizat(leadId, token)) {
    return NextResponse.json(
      { error: 'Pagina e deschisă de prea mult timp. Reîncărcați-o și încercați din nou.' },
      { status: 403 },
    );
  }

  try {
    const c = await conversatiePentru(leadId);
    if (!c) return NextResponse.json({ error: 'Asistentul nu e disponibil pentru cererea asta.' }, { status: 404 });

    if (body.gata === true) {
      await incheieConversatie(leadId);
      return NextResponse.json(stare({ ...c, incheiataLa: new Date().toISOString() }));
    }

    if (body.nota === 'util' || body.nota === 'nu_prea') {
      const motiv = (typeof body.motiv === 'string' ? body.motiv : '').trim().slice(0, 500);
      await noteazaConversatia(leadId, body.nota, motiv);
      return NextResponse.json(
        stare({ ...c, notaClient: body.nota, motivClient: motiv, incheiataLa: c.incheiataLa || new Date().toISOString() }),
      );
    }

    const mesaj = (typeof body.mesaj === 'string' ? body.mesaj : '').trim();
    if (!mesaj) return NextResponse.json({ error: 'Mesajul e gol.' }, { status: 400 });
    if (mesaj.length > ASISTENT_MAX_CARACTERE) {
      return NextResponse.json({ error: 'Mesajul e prea lung.' }, { status: 400 });
    }
    if (c.replici >= ASISTENT_MAX_MESAJE) {
      return NextResponse.json(
        { error: 'Am ajuns la capătul conversației. Restul îl lămurește firma la telefon.' },
        { status: 429 },
      );
    }

    if (!process.env.ANTHROPIC_API_KEY && process.env.NODE_ENV !== 'production') {
      if (process.env.ASISTENT_MOCK === '1') {
        const { conv } = await raspundeMock(c, mesaj);
        return NextResponse.json(stare(conv));
      }
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'Asistentul nu e configurat.' }, { status: 503 });
    }

    const { conv } = await raspunde(c, mesaj);
    return NextResponse.json(stare(conv));
  } catch (err) {
    if (err instanceof AsistentEroare) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error('[asistent] replică:', err);
    return NextResponse.json(
      { error: 'Asistentul nu răspunde acum. Cererea dumneavoastră e salvată oricum.' },
      { status: 500 },
    );
  }
}
