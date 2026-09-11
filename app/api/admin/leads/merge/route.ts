import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { LeadMergeError, mergeLeads } from '@/lib/sheets';

function todayBucharest(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Bucharest' });
}

// Serverul (Vercel) e pe UTC; jurnalul trebuie să arate ora din România.
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
    const { id, duplicates, force } = (await request.json()) as {
      id?: string;
      duplicates?: unknown;
      force?: boolean;
    };

    if (!id) return NextResponse.json({ error: 'id lipsă' }, { status: 400 });
    const dups = Array.isArray(duplicates)
      ? [...new Set(duplicates.filter((d): d is string => typeof d === 'string' && d.trim() !== ''))]
      : [];
    if (!dups.length) {
      return NextResponse.json({ error: 'nicio retrimitere selectată' }, { status: 400 });
    }

    const result = await mergeLeads(id, dups, {
      force: force === true,
      today: todayBucharest(),
      time: timeBucharest(),
    });

    // Retrimiterile ies din feedul public (M = „Ascuns"), iar canonicul poate
    // primi firme cerute în plus — fără asta s-ar vedea până la 5 minute vechiul
    // conținut (ISR-ul din /cereri).
    revalidatePath('/cereri');

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    // Refuzurile de comasare sunt decizii, nu erori de sistem: „forceable" îi
    // spune UI-ului să ofere bifa de forțare în loc să pice cu roșu.
    if (err instanceof LeadMergeError) {
      return NextResponse.json({ error: err.message, forceable: err.forceable }, { status: 400 });
    }
    console.error('Lead merge error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Eroare internă' },
      { status: 500 },
    );
  }
}
