import type { Metadata } from 'next';
import Link from 'next/link';
import { clientLinkUrl, verifyClientToken } from '@/lib/lead-client-token';
import { getClaims, getFullLeadById, isLeadClosed } from '@/lib/sheets';
import { offerFirms } from '@/lib/whatsapp-verificare';
import { recordClientEvent } from '@/lib/client-events';

// „Ați găsit o ofertă bună?” pentru linkul din mesajul de WhatsApp (12 nov 2026,
// lib/whatsapp-verificare). Un singur link în mesaj, iar aici aceleași butoane
// ca în emailul din lib/email-client (statusCheckEmail). Fiecare duce la pagina
// obișnuită de răspuns, /cerere/raspuns/[action], care confirmă la click și
// scrie răspunsul. Pagina asta doar arată butoanele și notează deschiderea.

export const metadata: Metadata = {
  title: 'Ați găsit o ofertă bună?',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

function fmtDay(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('ro-RO', { timeZone: 'Europe/Bucharest', day: 'numeric', month: 'long', year: 'numeric' });
}

/** Linkul semnat, fără domeniu, ca să rămână pe același site (și local). */
function localLink(...args: Parameters<typeof clientLinkUrl>): string {
  const u = new URL(clientLinkUrl(...args));
  return `${u.pathname}${u.search}`;
}

function Invalid() {
  return (
    <div className="max-w-xl mx-auto px-4 py-10 sm:py-14">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Legătura nu mai este validă</h1>
      <p className="mt-4 text-gray-700 leading-relaxed">
        Linkul a expirat sau a fost modificat. Ne puteți scrie la{' '}
        <a href="mailto:contact@instalatori-fotovoltaice.ro" className="text-primary-dark underline">
          contact@instalatori-fotovoltaice.ro
        </a>{' '}
        și rezolvăm manual.
      </p>
    </div>
  );
}

const secondary =
  'block w-full rounded-xl border border-gray-300 bg-white px-5 py-3 text-center text-[15px] font-medium text-gray-800 hover:bg-gray-50';

export default async function VerificarePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; t?: string; via?: string }>;
}) {
  const { id = '', t = '', via = '' } = await searchParams;
  if (!id || !t || !verifyClientToken(t, id, 'verificare')) return <Invalid />;

  const [lead, claims] = await Promise.all([getFullLeadById(id), getClaims()]);
  if (!lead) return <Invalid />;
  await recordClientEvent(id, 'verificare_deschisa', via ? { via } : undefined);

  if (isLeadClosed(lead.crmStatus)) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10 sm:py-14">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Mulțumim, avem deja răspunsul</h1>
        <p className="mt-4 text-gray-700 leading-relaxed">
          Cererea dumneavoastră din {fmtDay(lead.timestamp)} este închisă. Dacă s-a schimbat ceva, ne puteți scrie la{' '}
          <a href="mailto:contact@instalatori-fotovoltaice.ro" className="text-primary-dark underline">
            contact@instalatori-fotovoltaice.ro
          </a>
          .
        </p>
        <p className="mt-6">
          <Link href="/" className="text-primary-dark underline hover:no-underline">
            Înapoi la prima pagină
          </Link>
        </p>
      </div>
    );
  }

  // Aceleași firme ca în mesaj: cele care au trimis ofertă.
  const firms = offerFirms(lead.timestamp, claims);
  const names = firms.map((f) => f.name);
  const joined = names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} și ${names.at(-1)}`;
  const putere = lead.putere ? ` de ${lead.putere} kW` : '';
  const unde = !lead.judet ? '' : lead.judet === 'București' ? ' în București' : ` în județul ${lead.judet}`;

  return (
    <div className="max-w-xl mx-auto px-4 py-10 sm:py-14">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Ați găsit o ofertă bună?</h1>
      <p className="mt-4 text-gray-700 leading-relaxed">
        Pe {fmtDay(lead.timestamp)} ați trimis o cerere pentru un sistem fotovoltaic{putere}
        {unde}.
        {firms.length === 1 && ` Din ce ne-a transmis firma, ${joined} v-a trimis o ofertă.`}
        {firms.length > 1 && ` Din ce ne-au transmis firmele, ${joined} v-au trimis oferte.`}
      </p>
      <p className="mt-3 text-gray-700 leading-relaxed">Alegeți varianta care vi se potrivește:</p>

      <div className="mt-6 space-y-2">
        {firms.map((f) => (
          <a
            key={f.claimTs}
            href={localLink(lead.timestamp, 'semnat', f.claimTs)}
            className="block w-full rounded-xl bg-primary px-5 py-3 text-center text-[15px] font-semibold text-white hover:bg-primary-dark"
          >
            ✅ Am semnat cu {f.name}
          </a>
        ))}
        <a href={localLink(lead.timestamp, 'decid')} className={secondary}>
          🤔 Încă mă decid
        </a>
        <a href={localLink(lead.timestamp, 'altafirma')} className={secondary}>
          ❌ Am ales altă firmă sau nu mai fac lucrarea
        </a>
        <a href={localLink(lead.timestamp, 'necontactat')} className={secondary}>
          📵 Nu m-a contactat nicio firmă
        </a>
      </div>

      <p className="mt-6 text-sm text-gray-500 leading-relaxed">
        După click urmează câteva întrebări scurte, cam două minute. Dacă nu răspundeți, cererea rămâne așa cum e.
      </p>
    </div>
  );
}
