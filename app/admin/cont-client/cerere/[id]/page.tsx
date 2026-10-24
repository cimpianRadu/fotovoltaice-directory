import Link from 'next/link';
import { notFound } from 'next/navigation';
import AccountLeadView from '@/components/cont/AccountLeadView';
import { getAccountLead, loadAccountLead } from '@/lib/client-account';

export const dynamic = 'force-dynamic';

/**
 * Pagina cererii exact cum o vede clientul, deschisă din /admin/cont-client
 * (24 oct 2026, „să înțeleg ce văd beneficiarii”). Aceleași date ca în contul
 * clientului, dar butoanele nu salvează nimic și vizita nu se numără.
 */

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminClientViewPage({ params }: Props) {
  const { id } = await params;
  const lead = await getAccountLead(decodeURIComponent(id));
  if (!lead) notFound();
  const data = await loadAccountLead(lead);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
        <span>
          Așa vede <strong>{lead.numeContact || lead.email}</strong> pagina cererii. Butoanele nu salvează nimic, iar vizita
          ta nu se numără la vizitele clientului.
        </span>
        <Link href="/admin/cont-client" className="font-semibold underline">
          ← Înapoi la clienți
        </Link>
      </div>
      <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-slate-200 bg-white p-4 sm:p-8">
        <AccountLeadView data={data} demo />
      </div>
    </div>
  );
}
