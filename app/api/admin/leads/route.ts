import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
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
    const { id, status, contacted, poze, note, editNote, deleteNote } = (await request.json()) as {
      id?: string;
      status?: string;
      contacted?: string;
      poze?: string;
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
    // Coloana AD acceptă și marcaje scurte („da", „pe email"), nu doar linkul
    // Drive — vezi isPozeLink. Ce nu acceptă e un link stricat: firma îl vede în
    // portal ca pe singura cale către poze, deci un „drive.google.com/..." fără
    // schemă ar duce-o în gol.
    if (poze !== undefined) {
      if (typeof poze !== 'string') {
        return NextResponse.json({ error: 'valoare invalidă pentru poze' }, { status: 400 });
      }
      const value = poze.trim();
      if (value.length > 500) {
        return NextResponse.json({ error: 'legătura către poze e prea lungă' }, { status: 400 });
      }
      // Orice miroase a adresă web trebuie să fie una completă și clicabilă.
      if (/^(https?:|www\.)|\.(com|ro|org|net)\//i.test(value) && !/^https?:\/\/\S+$/.test(value)) {
        return NextResponse.json(
          { error: 'linkul trebuie să înceapă cu https:// și să nu conțină spații' },
          { status: 400 },
        );
      }
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

    if (!status && contacted === undefined && poze === undefined && !noteOps) {
      return NextResponse.json({ error: 'nimic de salvat' }, { status: 400 });
    }

    const fields = await updateLeadCrm(id, {
      status: status as LeadStatus | undefined,
      contacted: contacted as ContactState | undefined,
      poze,
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

    // Statusul decide dacă cererea mai apare în feedul public, pozele aprind
    // badge-ul „Cu poze" pe cardul ei. Fără asta, schimbarea ar mai sta
    // nevăzută până la 5 minute (ISR-ul din /cereri).
    if (status || poze !== undefined) revalidatePath('/cereri');

    return NextResponse.json({ ok: true, ...fields });
  } catch (err) {
    console.error('Lead CRM update error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Eroare internă' },
      { status: 500 },
    );
  }
}
