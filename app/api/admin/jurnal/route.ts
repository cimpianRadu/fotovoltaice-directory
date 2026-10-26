import { NextResponse } from 'next/server';
import { addJournalEntry, deleteJournalEntry, updateJournalEntry, type JournalSubject } from '@/lib/jurnal';
import { bucharestDay } from '@/lib/daily-agenda';

const MAX_TEXT = 4000;
const KINDS = new Set(['firma', 'cerere']);

// Subiectul vine de pe rândul din /admin/azi; păstrăm doar câmpuri text scurte.
function cleanSubject(raw: unknown): JournalSubject | null {
  if (!raw || typeof raw !== 'object') return null;
  const s = raw as Record<string, unknown>;
  if (typeof s.kind !== 'string' || !KINDS.has(s.kind)) return null;
  if (typeof s.id !== 'string' || typeof s.label !== 'string' || !s.label.trim()) return null;
  const meta: Record<string, string> = {};
  if (s.meta && typeof s.meta === 'object') {
    for (const [k, v] of Object.entries(s.meta as Record<string, unknown>).slice(0, 12)) {
      if (typeof v === 'string' && v.trim()) meta[k.slice(0, 40)] = v.trim().slice(0, 500);
    }
  }
  return {
    kind: s.kind as JournalSubject['kind'],
    id: s.id.slice(0, 100),
    label: s.label.trim().slice(0, 200),
    ...(Object.keys(meta).length ? { meta } : {}),
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      create?: { text?: string; subject?: unknown };
      id?: number;
      text?: string;
      delete?: boolean;
    };

    if (body.create) {
      const text = body.create.text?.trim();
      if (!text) return NextResponse.json({ error: 'nota e goală' }, { status: 400 });
      const entry = await addJournalEntry({
        day: bucharestDay(Date.now()),
        text: text.slice(0, MAX_TEXT),
        subject: cleanSubject(body.create.subject),
      });
      return NextResponse.json({ ok: true, entry });
    }

    const id = Number(body.id);
    if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: 'id lipsă' }, { status: 400 });

    if (body.delete) {
      const ok = await deleteJournalEntry(id);
      if (!ok) return NextResponse.json({ error: 'nota nu mai există' }, { status: 404 });
      return NextResponse.json({ ok: true });
    }

    const text = body.text?.trim();
    if (!text) return NextResponse.json({ error: 'nota nu poate fi goală' }, { status: 400 });
    const entry = await updateJournalEntry(id, text.slice(0, MAX_TEXT));
    if (!entry) return NextResponse.json({ error: 'nota nu mai există' }, { status: 404 });
    return NextResponse.json({ ok: true, entry });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Eroare necunoscută';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
