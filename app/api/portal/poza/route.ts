// Singura poartă prin care ies pozele clientului spre o firmă. Store-ul e
// privat, deci fișierele nu au URL public: cine vrea o poză trece pe aici, iar
// aici se verifică trei lucruri, în ordine — cine ești, că ai revendicat
// cererea, și că revendicarea ta e aprobată.
//
// Aprobarea e aceeași poartă ca la datele de contact: pe /cereri firma vede că
// „are poze", dar nu le vede, exact ca la numărul de telefon.

import { NextResponse, type NextRequest } from 'next/server';
import { isLeadPhotoPath, readLeadPhoto } from '@/lib/lead-photos';
import { getPortalEmail } from '@/lib/portal-session';
import { getClaims, getFirmEmailGroup, getPhotosForLead } from '@/lib/sheets';

export async function GET(request: NextRequest) {
  const email = await getPortalEmail();
  if (!email) return new NextResponse('Neautentificat', { status: 401 });

  const leadId = request.nextUrl.searchParams.get('cerere') || '';
  const pathname = request.nextUrl.searchParams.get('poza') || '';
  if (!leadId || !pathname || !isLeadPhotoPath(pathname, leadId)) {
    return new NextResponse('Cerere invalidă', { status: 400 });
  }

  // Aceleași adrese ale aceleiași firme ca în portal: omul revendică de pe o
  // adresă și intră de pe alta.
  const mine = new Set(await getFirmEmailGroup(email));
  const claims = await getClaims();
  const allowed = claims.some(
    (c) => c.leadId === leadId && mine.has(c.email) && c.approvedAt && !c.releasedAt,
  );
  // 404, nu 403: cine n-are voie nu trebuie să afle nici măcar că poza există.
  if (!allowed) return new NextResponse('Nu există', { status: 404 });

  // Calea trebuie să fie una pe care am înregistrat-o noi, nu una ghicită.
  const known = (await getPhotosForLead(leadId)).some((p) => p.pathname === pathname);
  if (!known) return new NextResponse('Nu există', { status: 404 });

  const result = await readLeadPhoto(pathname);
  if (!result) return new NextResponse('Nu există', { status: 404 });

  return new NextResponse(result.stream, {
    headers: {
      'Content-Type': result.blob.contentType || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
      // Privat: browserul poate ține poza, dar întreabă de fiecare dată, ca
      // verificarea de mai sus să ruleze la fiecare vizualizare. Fără CDN.
      'Cache-Control': 'private, no-cache',
    },
  });
}
