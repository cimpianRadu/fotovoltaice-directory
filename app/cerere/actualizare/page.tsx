import type { Metadata } from 'next';
import Link from 'next/link';
import { getFullLeadById, isLeadClosed, isLeadInformez } from '@/lib/sheets';
import { verifyClientToken } from '@/lib/lead-client-token';
import {
  getFinancingLabel,
  getProjectTypeLabel,
  getTimelineLabel,
  FINANCING_COMERCIAL,
  FINANCING_REZIDENTIAL,
} from '@/lib/utils-shared';
import LeadUpdateForm from './LeadUpdateForm';

// „Sunt gata pentru oferte", din emailurile către clientul care se informa.
// Pagina arată ce știm din cererea lui și îl lasă să corecteze cele patru
// lucruri care se schimbă între timp (termen, finanțare, putere, mesaj), apoi
// cererea reintră în feed datată de azi. Ajunge aici doar cu tokenul din
// email; fără el, pagina spune că legătura nu e validă, nu arată nimic.

export const metadata: Metadata = {
  title: 'Actualizați cererea de ofertă',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="max-w-xl mx-auto px-4 py-10 sm:py-14">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{title}</h1>
      <div className="mt-4 text-gray-700 leading-relaxed">{children}</div>
    </div>
  );
}

export default async function ActualizarePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; t?: string }>;
}) {
  const { id = '', t = '' } = await searchParams;
  const valid = id && t && verifyClientToken(t, id, 'actualizare');
  if (!valid) {
    return (
      <Shell title="Legătura nu mai este validă">
        <p>
          Linkul din email a expirat sau a fost modificat. Dacă vreți oferte, puteți trimite o
          cerere nouă în două minute sau ne puteți scrie la{' '}
          <a href="mailto:contact@instalatori-fotovoltaice.ro" className="text-primary-dark underline">
            contact@instalatori-fotovoltaice.ro
          </a>
          .
        </p>
        <Link href="/cere-oferta" className="mt-6 inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark">
          Trimite o cerere nouă
        </Link>
      </Shell>
    );
  }

  const lead = await getFullLeadById(id);
  if (!lead) {
    return (
      <Shell title="Nu am găsit cererea">
        <p>Cererea nu mai există în evidența noastră. Puteți trimite una nouă oricând.</p>
        <Link href="/cere-oferta" className="mt-6 inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark">
          Trimite o cerere nouă
        </Link>
      </Shell>
    );
  }

  if (isLeadClosed(lead.crmStatus)) {
    return (
      <Shell title="Cererea este închisă">
        <p>
          Cererea dumneavoastră din județul {lead.judet} a fost închisă. Dacă vreți oferte, cel mai
          simplu e să trimiteți o cerere nouă, cu datele de acum.
        </p>
        <Link href="/cere-oferta" className="mt-6 inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark">
          Trimite o cerere nouă
        </Link>
      </Shell>
    );
  }

  const rezidential = lead.segment === 'rezidential';
  const financing = (rezidential ? FINANCING_REZIDENTIAL : FINANCING_COMERCIAL).map((o) => ({
    value: o.value,
    label: o.label,
  }));
  const alreadyActive = !isLeadInformez(lead);

  return (
    <Shell title={alreadyActive ? 'Actualizați cererea' : 'Sunteți gata pentru oferte'}>
      <p>
        {alreadyActive
          ? 'Cererea dumneavoastră e deja activă la firmele din județ. Puteți actualiza datele de mai jos, iar firmele le vor vedea imediat.'
          : 'Confirmați sau corectați datele de mai jos. După trimitere, cererea intră la firmele din județ ca una nouă, iar cele care au urmărit-o între timp vă contactează primele.'}
      </p>

      <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl border border-border bg-surface p-4 text-sm">
        <dt className="text-gray-500">Proiect</dt>
        <dd className="text-gray-900">{getProjectTypeLabel(lead.tipProiect)}</dd>
        <dt className="text-gray-500">Județ</dt>
        <dd className="text-gray-900">{lead.judet}</dd>
        <dt className="text-gray-500">Termen actual</dt>
        <dd className="text-gray-900">{lead.termen ? getTimelineLabel(lead.termen) : 'nespecificat'}</dd>
        <dt className="text-gray-500">Finanțare actuală</dt>
        <dd className="text-gray-900">{lead.finantare ? getFinancingLabel(lead.finantare) : 'nespecificată'}</dd>
      </dl>

      <div className="mt-6">
        <LeadUpdateForm
          id={id}
          token={t}
          initial={{
            termen: lead.termen === 'ma-informez' ? '' : lead.termen,
            finantare: lead.finantare,
            putere: lead.putere,
            mesaj: lead.mesaj,
          }}
          financing={financing}
          judet={lead.judet}
        />
      </div>
    </Shell>
  );
}
