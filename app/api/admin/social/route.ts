import { NextResponse } from 'next/server';
import { SOCIAL_PLATFORMS, toggleSocialPlatform, type SocialPlatform } from '@/lib/sheets';

function todayBucharest(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Bucharest' });
}

export async function POST(request: Request) {
  try {
    const { id, platform } = (await request.json()) as { id?: number; platform?: string };

    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: 'id lipsă' }, { status: 400 });
    }
    if (!platform || !SOCIAL_PLATFORMS.includes(platform as SocialPlatform)) {
      return NextResponse.json({ error: 'platformă necunoscută' }, { status: 400 });
    }

    const posts = await toggleSocialPlatform(id as number, platform as SocialPlatform, todayBucharest());
    const post = posts.find((p) => p.id === id);
    return NextResponse.json({ ok: true, post });
  } catch (err) {
    console.error('Social toggle error:', err);
    const message = err instanceof Error ? err.message : 'Eroare internă';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
