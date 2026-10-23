// Autorizează încărcarea unei oferte direct din browserul firmei în Blob (ca la
// pozele cererii, app/api/leads/poze). Nu primește fișierul, doar decide dacă
// firma logată are voie și cu ce limite.
//
// Stă în afara /api/portal fiindcă middleware-ul de acolo cere sesiunea de
// portal pe orice apel, iar Blob trimite confirmarea încărcării de pe serverele
// lui, fără cookie. Sesiunea se verifică aici, doar la cererea de token.

import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { getPortalEmail } from '@/lib/portal-session';
import { offerClaimFor } from '@/lib/oferte';
import { OFFER_MAX_BYTES, OFFER_TYPES, isOfferPath } from '@/lib/oferte-shared';

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;
  const email = body.type === 'blob.generate-client-token' ? await getPortalEmail() : null;
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (!email) throw new Error('Intră în portal ca să trimiți oferta.');
        let leadId = '';
        try {
          leadId = String((JSON.parse(clientPayload || '{}') as { leadId?: unknown }).leadId || '');
        } catch {
          leadId = '';
        }
        if (!leadId || !(await offerClaimFor(email, leadId))) {
          throw new Error('Nu poți trimite ofertă pe cererea asta.');
        }
        // Calea vine din browser: singurul folder permis e al cererii.
        if (!isOfferPath(pathname, leadId)) throw new Error('Cale de fișier nepermisă.');
        return { allowedContentTypes: OFFER_TYPES, maximumSizeInBytes: OFFER_MAX_BYTES, addRandomSuffix: true };
      },
      // Evidența o face browserul, pe /api/portal/oferta, după încărcare (ca la poze:
      // webhookul nu vine pe localhost, iar o ofertă neînregistrată ar fi pierdută).
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error('[oferte] upload token:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Eroare la încărcare' }, { status: 400 });
  }
}
