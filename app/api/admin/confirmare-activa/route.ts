import { NextResponse } from 'next/server';
import { sendActiveChecks } from '@/lib/confirmare-activa';

// Emailul „mai căutați oferte?" către clienții cu cereri deschise, trimis manual,
// pe loturi mici (21 sept 2026: primul test pe 10-20 de cereri vechi). Protejat
// de middleware ca restul /api/admin. `dry` întoarce lista fără să trimită.

export const maxDuration = 60;

const MAX_LIMIT = 25;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      limit?: number;
      minDays?: number;
      maxDays?: number;
      exclude?: string[];
      dry?: boolean;
    };
    const limit = Math.min(Math.max(Number(body.limit) || 0, 1), MAX_LIMIT);
    const result = await sendActiveChecks({
      limit,
      minDays: Number(body.minDays) || undefined,
      maxDays: Number(body.maxDays) || undefined,
      exclude: Array.isArray(body.exclude) ? body.exclude.filter((x) => typeof x === 'string') : [],
      dry: body.dry !== false,
    });
    return NextResponse.json({ ok: true, dry: body.dry !== false, ...result });
  } catch (err) {
    console.error('[admin/confirmare-activa] error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Eroare internă' }, { status: 500 });
  }
}
