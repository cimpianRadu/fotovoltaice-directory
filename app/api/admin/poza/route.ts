// Aceleași poze, pentru /admin/crm. Sesiunea de admin e verificată de
// middleware pe tot `/api/admin`, deci aici rămâne doar verificarea că poza
// cerută e una dintre cele înregistrate pe cererea aia — nu o cale ghicită.

import { NextResponse, type NextRequest } from 'next/server';
import { isLeadPhotoPath, readLeadPhoto } from '@/lib/lead-photos';
import { getPhotosForLead } from '@/lib/sheets';

export async function GET(request: NextRequest) {
  const leadId = request.nextUrl.searchParams.get('cerere') || '';
  const pathname = request.nextUrl.searchParams.get('poza') || '';
  if (!leadId || !pathname || !isLeadPhotoPath(pathname, leadId)) {
    return new NextResponse('Cerere invalidă', { status: 400 });
  }

  const known = (await getPhotosForLead(leadId)).some((p) => p.pathname === pathname);
  if (!known) return new NextResponse('Nu există', { status: 404 });

  const result = await readLeadPhoto(pathname);
  if (!result) return new NextResponse('Nu există', { status: 404 });

  return new NextResponse(result.stream, {
    headers: {
      'Content-Type': result.blob.contentType || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, no-cache',
    },
  });
}
