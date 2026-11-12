import { isOpenToken, recordEmailOpen } from '@/lib/lead-sends';

// Pixelul de deschidere din emailurile cu cereri către firme (27 oct 2026). Imaginea
// e cerută ca /api/e/<cod>.gif când firma deschide emailul; răspunsul e mereu
// același GIF transparent, și pentru coduri necunoscute, ca un email vechi sau
// o eroare de bază să nu arate o imagine ruptă.

export const dynamic = 'force-dynamic';

// GIF 1×1 transparent.
const GIF = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const token = (await params).token.replace(/\.gif$/, '');
  if (isOpenToken(token)) {
    try {
      await recordEmailOpen(token, request.headers.get('user-agent'));
    } catch (err) {
      console.error('[email-open]', err);
    }
  }
  return new Response(GIF, {
    headers: {
      'Content-Type': 'image/gif',
      'Content-Length': String(GIF.length),
      // Fără cache: altfel a doua deschidere nu mai ajunge la noi.
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    },
  });
}
