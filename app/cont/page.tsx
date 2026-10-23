import type { Metadata } from 'next';
import Link from 'next/link';
import LoginForm from '@/components/cont/LoginForm';
import AccountActions from '@/components/cont/AccountActions';
import { getClientViewer } from '@/lib/client-auth';
import { getLeadsForEmail, leadSummaryFor } from '@/lib/client-account';
import { getLeadsSince, isLeadHidden } from '@/lib/sheets';

// Contul clientului: cererile emailului dovedit, sau doar cele trimise din
// browserul ăsta (cookie-ul de după formular). Fără niciuna, intrarea cu cod.

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Contul meu',
  description: 'Cererile dumneavoastră pentru panouri fotovoltaice: firmele care le-au preluat, ofertele și ce urmează.',
  robots: { index: false, follow: false },
};

const ERRORS: Record<string, string> = {
  link: 'Linkul nu mai e valabil. Cereți un cod nou pe email.',
};

interface Props {
  searchParams: Promise<{ eroare?: string }>;
}

const day = (iso: string) =>
  new Date(iso).toLocaleDateString('ro-RO', { timeZone: 'Europe/Bucharest', day: 'numeric', month: 'long', year: 'numeric' });

export default async function ContPage({ searchParams }: Props) {
  const { eroare } = await searchParams;
  const viewer = await getClientViewer();

  let leads = viewer.email ? await getLeadsForEmail(viewer.email) : [];
  if (!viewer.email && viewer.leads.length) {
    const ids = new Set(viewer.leads);
    leads = (await getLeadsSince(new Date(0)))
      .filter((l) => ids.has(l.timestamp) && !isLeadHidden(l))
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  if (!leads.length) {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary-dark">Pentru clienți · gratuit</p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">Contul meu</h1>
        <p className="mt-2 text-sm text-gray-600">
          Vedeți ce s-a întâmplat cu cererea dumneavoastră: firmele care au preluat-o, telefoanele lor și ofertele primite.
          Intrați cu emailul cu care ați trimis cererea, fără parolă. Contul e gratuit, ca și cererea.
        </p>
        <div className="mt-6">
          <LoginForm message={eroare ? ERRORS[eroare] : undefined} />
        </div>
        <p className="mt-6 text-center text-sm text-gray-500">
          Nu ați trimis încă o cerere?{' '}
          <Link href="/cere-oferta" className="font-semibold text-primary-dark underline">
            Cereți oferte
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Cererile mele</h1>
      {viewer.email && <p className="mt-1 text-sm text-gray-500">{viewer.email}</p>}
      <ul className="mt-6 space-y-3">
        {leads.map((l) => {
          const s = leadSummaryFor(l);
          return (
            <li key={s.id}>
              <Link
                href={`/cont/cerere/${encodeURIComponent(s.id)}`}
                className="block rounded-xl border border-border bg-white p-5 transition-colors hover:border-primary"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-gray-900">{s.descriere[0].toUpperCase() + s.descriere.slice(1)}</p>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      s.open ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {s.open ? 'Activă' : s.closedLabel}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {s.localitate ? `${s.localitate}, ` : ''}județul {s.judet} · trimisă pe {day(s.createdAt)}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
      <AccountActions verified={Boolean(viewer.email)} />
    </div>
  );
}
