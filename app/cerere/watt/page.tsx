import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import AsistentCerere from '@/components/asistent/AsistentCerere';
import { ASISTENT_TIPURI } from '@/lib/asistent-shared';
import { recordClientEvent } from '@/lib/client-events';
import { verifyClientToken } from '@/lib/lead-client-token';
import { createLeadPhotoToken } from '@/lib/lead-photos';
import { getFullLeadById, isLeadClosed } from '@/lib/sheets';

// Linkul direct spre Watt AI (19 nov 2026, Radu: „orice info de la oameni e
// dată și cred că poate să ajute”). Pentru cererile vechi, Watt se deschidea
// doar în contul clientului, după logare. Linkul semnat din WhatsApp
// (lib/lead-client-token, acțiunea „watt”) deschide aici chatul pe cerere, cu
// aceeași conversație ca în cont. Răspunsurile ajung la firme ca la Watt de pe
// ecranul de confirmare.

export const metadata: Metadata = {
  title: 'Câteva detalii pentru instalatori',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

/** Preview-uri de link și crawlere: nu sunt clientul (ca în /cerere/verificare). */
const PREVIEW_UA =
  /whatsapp|facebookexternalhit|facebot|meta-externalagent|telegrambot|slackbot|twitterbot|discordbot|skypeuripreview|linkedinbot|viber|googlebot|bingbot|bot\b|crawler|spider|preview/i;

function fmtDay(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('ro-RO', { timeZone: 'Europe/Bucharest', day: 'numeric', month: 'long', year: 'numeric' });
}

function Message({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:py-14">
      <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{title}</h1>
      <div className="mt-4 leading-relaxed text-gray-700">{children}</div>
      <p className="mt-6">
        <Link href="/" className="text-primary-dark underline hover:no-underline">
          Înapoi la prima pagină
        </Link>
      </p>
    </div>
  );
}

const contact = (
  <a href="mailto:contact@instalatori-fotovoltaice.ro" className="text-primary-dark underline">
    contact@instalatori-fotovoltaice.ro
  </a>
);

export default async function WattPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; t?: string; via?: string }>;
}) {
  const { id = '', t = '', via = '' } = await searchParams;
  const invalid = (
    <Message title="Legătura nu mai este validă">
      Linkul a expirat sau a fost modificat. Ne puteți scrie la {contact} și rezolvăm manual.
    </Message>
  );
  if (!id || !t || !verifyClientToken(t, id, 'watt')) return invalid;

  const lead = await getFullLeadById(id);
  if (!lead) return invalid;

  const ua = (await headers()).get('user-agent') || '';
  if (!PREVIEW_UA.test(ua)) {
    await recordClientEvent(id, 'watt_link_deschis', { ...(via ? { via } : {}), ua: ua.slice(0, 160) });
  }

  if (isLeadClosed(lead.crmStatus)) {
    return (
      <Message title="Cererea este închisă">
        Cererea dumneavoastră din {fmtDay(lead.timestamp)} este închisă. Dacă s-a schimbat ceva, ne puteți scrie la{' '}
        {contact}.
      </Message>
    );
  }

  let token = '';
  try {
    token = createLeadPhotoToken(lead.timestamp);
  } catch (err) {
    console.error('[cerere/watt] token detalii:', err);
  }
  const eligibila = (ASISTENT_TIPURI as readonly string[]).includes(lead.tipLucrare);
  if (!token || !eligibila) {
    return (
      <Message title="Câteva detalii pentru instalatori">
        Ne puteți scrie detaliile cererii (consumul, acoperișul, când ați vrea să montați) la {contact} și le trimitem
        noi firmelor.
      </Message>
    );
  }

  const unde = !lead.judet ? '' : lead.judet === 'București' ? ' în București' : ` în județul ${lead.judet}`;
  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:py-14">
      <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Câteva detalii pentru instalatori</h1>
      <p className="mt-4 leading-relaxed text-gray-700">
        Pe {fmtDay(lead.timestamp)} ați cerut oferte pentru un sistem fotovoltaic{unde}. Watt, asistentul nostru, vă
        pune câteva întrebări scurte. Răspunsurile ajung la instalatori, ca să vă poată face o ofertă potrivită.
      </p>
      <p className="mt-3 text-sm text-gray-500">
        Durează 2 minute. Vedeți tot timpul ce pleacă la firme. Dacă s-a închis fereastra, apăsați bula din colțul din
        dreapta-jos.
      </p>
      <AsistentCerere leadId={lead.timestamp} token={token} sursa="whatsapp" deschideImediat />
    </div>
  );
}
