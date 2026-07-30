import { NextResponse } from 'next/server';
import {
  CONTACT_STATES,
  LEAD_STATUSES,
  updateLeadCrm,
  type ContactState,
  type LeadStatus,
} from '@/lib/sheets';

function todayBucharest(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Bucharest' });
}

export async function POST(request: Request) {
  try {
    const { id, status, contacted, note, editNote, deleteNote } = (await request.json()) as {
      id?: string;
      status?: string;
      contacted?: string;
      note?: string;
      editNote?: { index?: number; text?: string; expected?: string };
      deleteNote?: { index?: number; expected?: string };
    };

    if (!id) return NextResponse.json({ error: 'id lipsă' }, { status: 400 });
    if (status && !(LEAD_STATUSES as readonly string[]).includes(status)) {
      return NextResponse.json({ error: 'status necunoscut' }, { status: 400 });
    }
    // Șirul gol e valid: înseamnă „încă neverificat".
    if (contacted !== undefined && contacted !== '' && !(CONTACT_STATES as readonly string[]).includes(contacted)) {
      return NextResponse.json({ error: 'valoare necunoscută pentru contactare' }, { status: 400 });
    }
    // Toate trei scriu în aceeași celulă de note, deci nu pot veni împreună.
    const noteOps = [note?.trim() ? 1 : 0, editNote ? 1 : 0, deleteNote ? 1 : 0].reduce(
      (a, b) => a + b,
      0,
    );
    if (noteOps > 1) {
      return NextResponse.json(
        { error: 'o singură operație pe note per cerere' },
        { status: 400 },
      );
    }

    const ref = editNote || deleteNote;
    if (ref && (typeof ref.index !== 'number' || ref.index < 0 || typeof ref.expected !== 'string')) {
      return NextResponse.json({ error: 'referință de notă invalidă' }, { status: 400 });
    }
    if (editNote && typeof editNote.text !== 'string') {
      return NextResponse.json({ error: 'text de notă invalid' }, { status: 400 });
    }

    if (!status && contacted === undefined && !noteOps) {
      return NextResponse.json({ error: 'nimic de salvat' }, { status: 400 });
    }

    const fields = await updateLeadCrm(id, {
      status: status as LeadStatus | undefined,
      contacted: contacted as ContactState | undefined,
      note,
      editNote: editNote
        ? { index: editNote.index as number, expected: editNote.expected as string, text: editNote.text as string }
        : undefined,
      deleteNote: deleteNote
        ? { index: deleteNote.index as number, expected: deleteNote.expected as string }
        : undefined,
      today: todayBucharest(),
    });
    return NextResponse.json({ ok: true, ...fields });
  } catch (err) {
    console.error('Lead CRM update error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Eroare internă' },
      { status: 500 },
    );
  }
}
