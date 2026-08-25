import { NextResponse } from 'next/server';
import { addTodo, updateTodo } from '@/lib/sheets';

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(request: Request) {
  try {
    const { create, id, done, due, text } = (await request.json()) as {
      create?: { text?: string; due?: string; link?: string };
      id?: string;
      done?: boolean;
      due?: string;
      text?: string;
    };

    if (create) {
      const t = create.text?.trim();
      if (!t) return NextResponse.json({ error: 'textul lipsește' }, { status: 400 });
      if (!create.due || !DAY_RE.test(create.due)) {
        return NextResponse.json({ error: 'dată invalidă' }, { status: 400 });
      }
      const todo = await addTodo({ text: t, due: create.due, link: create.link?.trim() || '' });
      return NextResponse.json({ ok: true, todo });
    }

    if (!id) return NextResponse.json({ error: 'id lipsă' }, { status: 400 });
    if (due !== undefined && !DAY_RE.test(due)) {
      return NextResponse.json({ error: 'dată invalidă' }, { status: 400 });
    }
    if (text !== undefined && !text.trim()) {
      return NextResponse.json({ error: 'textul nu poate fi gol' }, { status: 400 });
    }
    if (done === undefined && due === undefined && text === undefined) {
      return NextResponse.json({ error: 'nimic de salvat' }, { status: 400 });
    }
    const todo = await updateTodo(id, {
      ...(done !== undefined ? { done } : {}),
      ...(due !== undefined ? { due } : {}),
      ...(text !== undefined ? { text: text.trim() } : {}),
    });
    return NextResponse.json({ ok: true, todo });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Eroare necunoscută';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
