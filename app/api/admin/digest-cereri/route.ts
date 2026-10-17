import { NextResponse } from 'next/server';
import { renderOpenLeadsDigest } from '@/lib/email';
import { digestEmailData, planOpenLeadsDigest, sendOpenLeadsDigestPlan } from '@/lib/open-leads-digest';

// Emailul cu cererile deschise (fonduri proprii, cât mai repede), trimis manual
// (17 oct 2026, vezi lib/open-leads-digest.ts). Protejat de middleware ca restul
// /api/admin. Implicit `dry`: întoarce cine ce ar primi, fără să trimită.
//   - `withoutAlerts`: și firmele cu cont fără alerte (prima ediție, o dată);
//   - `maxAgeDays`: fereastra cererilor, implicit 14 (rezumatul de luni);
//   - `only` / `exclude`: firmele cu una din adresele date;
//   - `preview` (o adresă): emailul randat al firmei, ca HTML;
//   - `dry: false`: trimite.

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      dry?: boolean;
      withoutAlerts?: boolean;
      maxAgeDays?: number;
      only?: string[];
      exclude?: string[];
      preview?: string;
    };
    let plan = await planOpenLeadsDigest({
      withoutAlerts: Boolean(body.withoutAlerts),
      maxAgeDays: Number(body.maxAgeDays) || undefined,
    });
    const norm = (list: unknown[]) => new Set(list.map((e) => String(e).trim().toLowerCase()));
    if (Array.isArray(body.only) && body.only.length) {
      const only = norm(body.only);
      plan = plan.filter((p) => p.to.some((e) => only.has(e)));
    }
    if (Array.isArray(body.exclude) && body.exclude.length) {
      const exclude = norm(body.exclude);
      plan = plan.filter((p) => !p.to.some((e) => exclude.has(e)));
    }
    if (body.preview) {
      const item = plan.find((p) => p.to.includes(body.preview!.trim().toLowerCase()));
      if (!item) return NextResponse.json({ error: 'Firma nu e în plan.' }, { status: 404 });
      const { subject, html } = renderOpenLeadsDigest(digestEmailData(item, body.preview.trim().toLowerCase()));
      return new NextResponse(html.replace('<body', `<body data-subject="${subject.replace(/"/g, '')}"`), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      });
    }
    if (body.dry !== false) return NextResponse.json({ ok: true, dry: true, plan });
    const results = await sendOpenLeadsDigestPlan(plan);
    return NextResponse.json({ ok: true, dry: false, results });
  } catch (err) {
    console.error('[admin/digest-cereri] error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Eroare internă' }, { status: 500 });
  }
}
