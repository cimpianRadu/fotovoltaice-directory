import type { Metadata } from 'next';
import Link from 'next/link';
import AccountLeadView from '@/components/cont/AccountLeadView';
import LeadDetailsChecklist from '@/components/cont/LeadDetailsChecklist';
import LoginForm from '@/components/cont/LoginForm';
import AsistentCerere from '@/components/asistent/AsistentCerere';
import { ASISTENT_TIPURI } from '@/lib/asistent-shared';
import { createLeadPhotoToken } from '@/lib/lead-photos';
import { getLeadLocation } from '@/lib/lead-location';
import { leadForViewer, loadAccountLead, recordLeadView } from '@/lib/client-account';
import { clientLinkUrl } from '@/lib/lead-client-token';

// Pagina unei cereri în contul clientului. Fără acces (alt browser, cookie șters)
// arată intrarea cu cod, nu o eroare: omul a ajuns aici dintr-un link vechi.

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Cererea dumneavoastră',
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ContCererePage({ params }: Props) {
  const { id } = await params;
  const leadId = decodeURIComponent(id);
  const access = await leadForViewer(leadId);

  if (!access) {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-900">Intrați în cont</h1>
        <p className="mt-2 text-sm text-gray-600">
          Ca să vedeți cererea, intrați cu emailul cu care ați trimis-o. Primiți un cod pe email, fără parolă.
        </p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    );
  }

  const data = await loadAccountLead(access.lead);
  await recordLeadView(access.lead, Boolean(access.viewer.email));

  // Același token ca pe ecranul de confirmare, emis din nou acum că sesiunea e
  // verificată: cu el clientul adaugă poze și adresa oricând, nu doar în ziua
  // în care a trimis cererea. Fără PORTAL_SECRET checklistul lipsește.
  const lead = access.lead;
  let detailsToken = '';
  try {
    detailsToken = createLeadPhotoToken(lead.timestamp);
  } catch (err) {
    console.error('[cont] token detalii:', err);
  }
  // Fără Neon (bază suspendată, eroare trecătoare) checklistul pornește gol,
  // pagina nu cade: adresa se poate oricum salva din nou.
  const location = await getLeadLocation(lead.timestamp).catch((err) => {
    console.error('[cont] locație:', err);
    return null;
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <AccountLeadView
        data={data}
        readyUrl={data.informez ? clientLinkUrl(lead.timestamp, 'actualizare') : undefined}
        details={
          detailsToken ? (
            <div className="space-y-6">
              <LeadDetailsChecklist
                leadId={lead.timestamp}
                token={detailsToken}
                photoCount={Number(lead.poze.match(/\d+/)?.[0]) || 0}
                adresa={location?.adresa ?? ''}
                coordonate={location?.coordonate ?? ''}
              />
              {/* Asistentul (pilot 12 nov 2026), cu aceeași conversație ca pe
                  ecranul de confirmare: omul o poate relua de aici. */}
              {(ASISTENT_TIPURI as readonly string[]).includes(lead.tipLucrare) && (
                <AsistentCerere leadId={lead.timestamp} token={detailsToken} sursa="cont" />
              )}
            </div>
          ) : undefined
        }
      />
      <p className="mt-10 text-center text-xs text-gray-400">
        Întrebări? Scrieți-ne la{' '}
        <a href="mailto:contact@instalatori-fotovoltaice.ro" className="underline">
          contact@instalatori-fotovoltaice.ro
        </a>
        . Îl citește un om. · <Link href="/cont" className="underline">Contul meu</Link>
      </p>
    </div>
  );
}
