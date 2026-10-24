import type { Metadata } from 'next';
import Link from 'next/link';
import AccountLeadView from '@/components/cont/AccountLeadView';
import LoginForm from '@/components/cont/LoginForm';
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

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <AccountLeadView
        data={data}
        readyUrl={data.informez ? clientLinkUrl(access.lead.timestamp, 'actualizare') : undefined}
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
