// Autorizează încărcarea pozelor direct din browser în Blob. Nu primește
// fișierul: doar decide dacă cel care cere are voie și cu ce restricții, apoi
// SDK-ul îi dă un token cu care browserul urcă singur, fără să treacă prin
// funcția noastră.
//
// Fără verificarea de aici, ruta ar fi un depozit gratuit deschis pe internet,
// pe factura noastră. Tokenul e emis de /api/leads când se salvează cererea și
// e legat de timestampul ei, deci nu poate încărca decât cine tocmai a trimis
// acea cerere, și doar în folderul ei.

import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import {
  LEAD_PHOTO_MAX,
  LEAD_PHOTO_MAX_BYTES,
  LEAD_PHOTO_TYPES,
  isLeadPhotoPath,
  verifyLeadPhotoToken,
} from '@/lib/lead-photos';
import { getPhotosForLead } from '@/lib/sheets';

function readPayload(clientPayload: string | null): { leadId: string; token: string } | null {
  if (!clientPayload) return null;
  try {
    const parsed = JSON.parse(clientPayload) as { leadId?: unknown; token?: unknown };
    if (typeof parsed.leadId !== 'string' || typeof parsed.token !== 'string') return null;
    return { leadId: parsed.leadId, token: parsed.token };
  } catch {
    return null;
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const payload = readPayload(clientPayload);
        if (!payload || !verifyLeadPhotoToken(payload.token, payload.leadId)) {
          throw new Error('Legătura de încărcare a expirat. Retrimiteți cererea sau scrieți-ne.');
        }
        // Calea vine din browser, deci nu are încredere: singurul folder în
        // care poate scrie tokenul e cel al cererii lui.
        if (!isLeadPhotoPath(pathname, payload.leadId)) {
          throw new Error('Cale de fișier nepermisă.');
        }
        // Plafonul se verifică aici, nu în browser: altfel un client care ține
        // pagina deschisă poate urca oricâte.
        const existing = await getPhotosForLead(payload.leadId);
        if (existing.length >= LEAD_PHOTO_MAX) {
          throw new Error(`Sunt deja ${LEAD_PHOTO_MAX} poze pe cererea aceasta.`);
        }

        return {
          allowedContentTypes: LEAD_PHOTO_TYPES,
          maximumSizeInBytes: LEAD_PHOTO_MAX_BYTES,
          // Două poze pot veni cu același nume de pe același telefon.
          addRandomSuffix: true,
        };
      },
      // Evidența nu se ține de aici: webhookul nu se declanșează pe localhost,
      // deci fluxul n-ar fi testabil, iar o poză urcată dar neînregistrată e o
      // poză pierdută. Browserul confirmă explicit, pe /api/leads/poze/salveaza.
      onUploadCompleted: async () => {},
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error('[poze] upload token:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Eroare la încărcare' },
      { status: 400 },
    );
  }
}
