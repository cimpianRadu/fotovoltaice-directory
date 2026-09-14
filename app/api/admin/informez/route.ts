import { NextResponse } from 'next/server';
import { ANNOUNCEABLE_PROGRAMS, announceProgramOpened, type AnnounceableProgram } from '@/lib/informez';

// Anunțul „s-a deschis programul", trimis o dată, din /admin/informez, celor
// care se informează și au bifat programul la finanțare. Protejat de
// middleware ca restul /api/admin. `dry` întoarce lista fără să trimită.

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { program?: string; openedOn?: string; dry?: boolean };
    const program = body.program || '';
    if (!(ANNOUNCEABLE_PROGRAMS as readonly string[]).includes(program)) {
      return NextResponse.json({ error: 'Program necunoscut.' }, { status: 400 });
    }
    const openedOn = (body.openedOn || '').trim().slice(0, 80);
    if (!openedOn) {
      return NextResponse.json({ error: 'Spune când s-a deschis (ex: „pe 6 octombrie 2026").' }, { status: 400 });
    }
    const result = await announceProgramOpened({
      program: program as AnnounceableProgram,
      openedOn,
      dry: Boolean(body.dry),
    });
    return NextResponse.json({ ok: true, dry: Boolean(body.dry), ...result });
  } catch (err) {
    console.error('[admin/informez] error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Eroare internă' }, { status: 500 });
  }
}
