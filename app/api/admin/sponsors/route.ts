import { NextResponse } from 'next/server';
import {
  writeSponsorData,
  SponsorValidationError,
  SponsorConflictError,
  type SponsorData,
} from '@/lib/sponsors-store';

// Ruta stă sub /api/admin, deci middleware-ul cere cookie-ul de admin înainte
// să ajungă cererea aici. Aici rămâne doar validarea de formă a corpului;
// validarea de conținut (câmp cu câmp) e în store, lângă scriere.
export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as Partial<SponsorData> | null;
    if (!body || !Array.isArray(body.sponsors) || !body.popup) {
      return NextResponse.json({ error: 'Corp invalid' }, { status: 400 });
    }

    const result = await writeSponsorData({ popup: body.popup, sponsors: body.sponsors });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    if (err instanceof SponsorValidationError) {
      return NextResponse.json({ error: 'Date invalide', issues: err.issues }, { status: 400 });
    }
    if (err instanceof SponsorConflictError) {
      return NextResponse.json(
        { error: 'Repo-ul s-a schimbat între timp. Reîncarcă pagina și aplică din nou modificarea.' },
        { status: 409 },
      );
    }
    console.error('Sponsor save error:', err);
    const message = err instanceof Error ? err.message : 'Eroare internă';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
