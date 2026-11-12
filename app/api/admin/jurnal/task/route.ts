import { NextResponse } from 'next/server';
import { addTask, deleteTask, updateTask } from '@/lib/jurnal';

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_TEXT = 1000;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      create?: { text?: string; due?: string };
      id?: number;
      done?: boolean;
      due?: string;
      text?: string;
      delete?: boolean;
    };

    if (body.create) {
      const text = body.create.text?.trim();
      if (!text) return NextResponse.json({ error: 'taskul e gol' }, { status: 400 });
      if (!body.create.due || !DAY_RE.test(body.create.due)) {
        return NextResponse.json({ error: 'dată invalidă' }, { status: 400 });
      }
      const task = await addTask({ due: body.create.due, text: text.slice(0, MAX_TEXT) });
      return NextResponse.json({ ok: true, task });
    }

    const id = Number(body.id);
    if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: 'id lipsă' }, { status: 400 });

    if (body.delete) {
      const ok = await deleteTask(id);
      if (!ok) return NextResponse.json({ error: 'taskul nu mai există' }, { status: 404 });
      return NextResponse.json({ ok: true });
    }

    if (body.due !== undefined && !DAY_RE.test(body.due)) {
      return NextResponse.json({ error: 'dată invalidă' }, { status: 400 });
    }
    if (body.text !== undefined && !body.text.trim()) {
      return NextResponse.json({ error: 'taskul nu poate fi gol' }, { status: 400 });
    }
    if (body.done === undefined && body.due === undefined && body.text === undefined) {
      return NextResponse.json({ error: 'nimic de salvat' }, { status: 400 });
    }
    const task = await updateTask(id, {
      ...(body.done !== undefined ? { done: Boolean(body.done) } : {}),
      ...(body.due !== undefined ? { due: body.due } : {}),
      ...(body.text !== undefined ? { text: body.text.trim().slice(0, MAX_TEXT) } : {}),
    });
    if (!task) return NextResponse.json({ error: 'taskul nu mai există' }, { status: 404 });
    return NextResponse.json({ ok: true, task });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Eroare necunoscută';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
