import { NextResponse, after, type NextRequest } from 'next/server';
import { getOffer, readOfferFile, recordOfferView } from '@/lib/oferte';
import { describeLead, leadForViewer } from '@/lib/client-account';
import { sendOfferOpenedToFirm } from '@/lib/email-cont';

// Singura poartă prin care clientul deschide un fișier de ofertă. Store-ul e
// privat; aici se verifică dacă browserul are voie să vadă cererea, se notează
// deschiderea, iar la prima deschidere firma află pe email.

export async function GET(request: NextRequest) {
  const id = Number(request.nextUrl.searchParams.get('id'));
  const f = Number(request.nextUrl.searchParams.get('f') ?? 0);
  if (!Number.isInteger(id) || id <= 0 || !Number.isInteger(f) || f < 0) {
    return new NextResponse('Cerere invalidă', { status: 400 });
  }
  const offer = await getOffer(id);
  const file = offer?.filesFull[f];
  // 404 și când nu are voie: cine nu e clientul nu trebuie să afle că oferta există.
  if (!offer || !file) return new NextResponse('Nu există', { status: 404 });
  const access = await leadForViewer(offer.leadId);
  if (!access) return new NextResponse('Nu există', { status: 404 });

  const result = await readOfferFile(file.pathname);
  if (!result) return new NextResponse('Nu există', { status: 404 });

  after(async () => {
    try {
      const first = await recordOfferView(offer.id, f, 'client');
      if (first) {
        await sendOfferOpenedToFirm(offer.firmEmail, {
          firmName: offer.firmName,
          judet: access.lead.judet,
          descriere: describeLead(access.lead),
          openedAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('[cont] deschidere ofertă:', err);
    }
  });

  return new NextResponse(result.stream, {
    headers: {
      'Content-Type': file.contentType || result.blob.contentType || 'application/octet-stream',
      'Content-Disposition': `inline; filename="${file.name.replace(/"/g, '')}"`,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, no-cache',
    },
  });
}
