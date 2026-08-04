import { NextResponse } from 'next/server';
import {
  FIRM_STATUSES,
  addCrmFirm,
  updateCrmFirm,
  type FirmStatus,
} from '@/lib/sheets';

function todayBucharest(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Bucharest' });
}

// Serverul (Vercel) e pe UTC; ora din jurnal trebuie să fie cea de pe ceasul
// userului din România, altfel timeline-ul minte cu 2-3 ore.
function timeBucharest(): string {
  return new Date().toLocaleTimeString('ro-RO', {
    timeZone: 'Europe/Bucharest',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export async function POST(request: Request) {
  try {
    const { create, id, status, followUp, note, editNote, deleteNote } =
      (await request.json()) as {
        create?: { firmId?: string; numeFirma?: string; telefon?: string };
        id?: string;
        status?: string;
        followUp?: string;
        note?: string;
        editNote?: { index?: number; text?: string; expected?: string };
        deleteNote?: { index?: number; expected?: string };
      };

    // Crearea unei fișe noi e o cerere separată de update: nu are id încă.
    if (create) {
      const numeFirma = create.numeFirma?.trim();
      if (!numeFirma) {
        return NextResponse.json({ error: 'numele firmei lipsește' }, { status: 400 });
      }
      const firm = await addCrmFirm({
        firmId: create.firmId?.trim(),
        numeFirma,
        telefon: create.telefon?.trim() || '',
      });
      return NextResponse.json({ ok: true, firm });
    }

    if (!id) return NextResponse.json({ error: 'id lipsă' }, { status: 400 });
    if (status && !(FIRM_STATUSES as readonly string[]).includes(status)) {
      return NextResponse.json({ error: 'status necunoscut' }, { status: 400 });
    }
    // Șirul gol e valid: șterge termenul de follow-up.
    if (followUp !== undefined && followUp !== '' && !/^\d{4}-\d{2}-\d{2}$/.test(followUp)) {
      return NextResponse.json({ error: 'dată de follow-up invalidă' }, { status: 400 });
    }
    // Toate trei scriu în aceeași celulă de note, deci nu pot veni împreună.
    const noteOps = [note?.trim() ? 1 : 0, editNote ? 1 : 0, deleteNote ? 1 : 0].reduce(
      (a, b) => a + b,
      0,
    );
    if (noteOps > 1) {
      return NextResponse.json({ error: 'o singură operație pe note per cerere' }, { status: 400 });
    }

    const ref = editNote || deleteNote;
    if (ref && (typeof ref.index !== 'number' || ref.index < 0 || typeof ref.expected !== 'string')) {
      return NextResponse.json({ error: 'referință de notă invalidă' }, { status: 400 });
    }
    if (editNote && typeof editNote.text !== 'string') {
      return NextResponse.json({ error: 'text de notă invalid' }, { status: 400 });
    }

    if (!status && followUp === undefined && !noteOps) {
      return NextResponse.json({ error: 'nimic de salvat' }, { status: 400 });
    }

    const firm = await updateCrmFirm(id, {
      status: status as FirmStatus | undefined,
      followUp,
      note,
      editNote: editNote
        ? { index: editNote.index as number, expected: editNote.expected as string, text: editNote.text as string }
        : undefined,
      deleteNote: deleteNote
        ? { index: deleteNote.index as number, expected: deleteNote.expected as string }
        : undefined,
      today: todayBucharest(),
      time: timeBucharest(),
    });

    return NextResponse.json({ ok: true, firm });
  } catch (err) {
    console.error('Firm CRM update error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Eroare internă' },
      { status: 500 },
    );
  }
}
