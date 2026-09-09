// Confirmarea că o poză chiar a ajuns în Blob, trimisă de browser imediat după
// încărcare. De aici se scrie evidența din tabul „Poze" și rezumatul din
// coloana AD a cererii.
//
// De ce nu din `onUploadCompleted`: webhookul lui Vercel nu ajunge pe
// localhost, deci fluxul n-ar putea fi testat până în producție. Confirmarea
// din browser e verificată oricum aici — token semnat, cale în folderul
// cererii și `head()` pe fișier — deci nu putem fi păcăliți să înregistrăm
// poze care nu există.

import { BlobNotFoundError } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { headLeadPhoto, isLeadPhotoPath, verifyLeadPhotoToken } from '@/lib/lead-photos';
import { addLeadPhoto, getPhotosForLead } from '@/lib/sheets';

export async function POST(request: Request) {
  try {
    const { leadId, token, pathname } = (await request.json()) as {
      leadId?: string;
      token?: string;
      pathname?: string;
    };

    if (!leadId || !token || !pathname) {
      return NextResponse.json({ error: 'date lipsă' }, { status: 400 });
    }
    if (!verifyLeadPhotoToken(token, leadId) || !isLeadPhotoPath(pathname, leadId)) {
      return NextResponse.json({ error: 'neautorizat' }, { status: 403 });
    }

    // Aceeași poză confirmată de două ori (reîncercare, dublu click) nu trebuie
    // să apară de două ori în evidență.
    const existing = await getPhotosForLead(leadId);
    const already = existing.find((p) => p.pathname === pathname);
    if (already) return NextResponse.json({ ok: true, count: existing.length });

    // Martorul: dacă fișierul nu e acolo, nu-l trecem în evidență. `head`
    // aruncă BlobNotFoundError când calea nu există, nu întoarce null.
    let blob;
    try {
      blob = await headLeadPhoto(pathname);
    } catch (err) {
      if (err instanceof BlobNotFoundError) {
        return NextResponse.json({ error: 'fișierul nu există' }, { status: 404 });
      }
      throw err;
    }

    const count = await addLeadPhoto({
      leadId,
      pathname,
      fileName: blob.pathname.split('/').pop() || '',
      contentType: blob.contentType || '',
      size: blob.size,
    });

    return NextResponse.json({ ok: true, count });
  } catch (err) {
    console.error('[poze] salvare:', err);
    return NextResponse.json({ error: 'Eroare internă' }, { status: 500 });
  }
}
