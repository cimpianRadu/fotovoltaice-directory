// Miniatura de pe cardul din /cereri: prima poză a cererii, redusă la câțiva
// pixeli și estompată aici, pe server. Clientul a urcat pozele cu promisiunea
// „Le vede doar instalatorul care preia cererea" (LeadPhotoUpload), deci în
// browserul unui vizitator nu ajunge niciodată poza, nici măcar ascunsă sub un
// filtru CSS, care se scoate din devtools. Pleacă de aici doar pete de culoare:
// firma vede că cererea are poze, fără să vadă ce e în ele. Poza adevărată
// rămâne după poarta din /api/portal/poza.

import { NextResponse, type NextRequest } from 'next/server';
import sharp from 'sharp';
import { readLeadPhoto } from '@/lib/lead-photos';
import { getPhotosForLead, getPublicLeads } from '@/lib/sheets';

function notFound() {
  return new NextResponse('Nu există', { status: 404 });
}

export async function GET(request: NextRequest) {
  const leadId = request.nextUrl.searchParams.get('cerere') || '';
  // ID-ul cererii e timestamp-ul ei. Verificarea ieftină vine înaintea
  // citirilor din Sheets, a căror cotă e comună cu restul site-ului.
  if (!Number.isFinite(Date.parse(leadId))) return notFound();

  // Doar cererile care sunt pe /cereri: una ascunsă sau închisă nu-și arată
  // nici măcar petele.
  if (!(await getPublicLeads()).some((l) => l.id === leadId)) return notFound();
  const [first] = await getPhotosForLead(leadId);
  if (!first) return notFound();

  const photo = await readLeadPhoto(first.pathname);
  if (!photo) return notFound();

  try {
    const original = Buffer.from(await new Response(photo.stream).arrayBuffer());
    // 12×9 pixeli: rămân culorile pozei, dar prea puțin ca să se mai vadă o
    // casă, o stradă sau un număr. Mărirea de după doar netezește petele.
    const tiny = await sharp(original).rotate().resize(12, 9, { fit: 'cover' }).png().toBuffer();
    const blurred = await sharp(tiny)
      .resize(192, 144, { kernel: 'cubic' })
      .blur(6)
      .jpeg({ quality: 70 })
      .toBuffer();
    return new NextResponse(new Uint8Array(blurred), {
      headers: {
        'Content-Type': 'image/jpeg',
        // Petele nu se schimbă cât prima poză rămâne aceeași. O săptămână pe
        // CDN: fiecare miss descarcă poza întreagă din Blob, iar pe planul
        // Hobby limita strânsă e transferul de date.
        'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
      },
    });
  } catch {
    // HEIC-ul de pe iPhone nu trece prin sharp; cardul arată atunci iconița.
    return notFound();
  }
}
