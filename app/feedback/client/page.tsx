import type { Metadata } from 'next';
import { getFullLeadById, hasFeedback } from '@/lib/sheets';
import { verifyFeedbackToken } from '@/lib/feedback-token';
import { ClientFeedbackForm, FeedbackThanks } from '../FeedbackForms';
import { FeedbackShell, InvalidFeedbackLink } from '../FeedbackShell';

// Feedbackul clientului după ce a semnat. Pagina nu are linkuri spre ea și nu
// se indexează: linkul semnat îl scoate scripts/feedback-links.mjs și îl
// trimite userul de mână. Fără token valid nu arată nimic din cerere.

export const metadata: Metadata = {
  title: 'Părerea dumneavoastră',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function ClientFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; t?: string }>;
}) {
  const { id = '', t = '' } = await searchParams;
  if (!id || !t || !verifyFeedbackToken(t, 'client', id)) return <InvalidFeedbackLink />;

  const [lead, answered] = await Promise.all([getFullLeadById(id), hasFeedback('client', id)]);
  if (!lead) return <InvalidFeedbackLink />;

  const prenume = (lead.numeContact || '').trim().split(/\s+/)[0];

  return (
    <FeedbackShell title={prenume ? `${prenume}, cum a fost?` : 'Cum a fost?'}>
      {answered ? (
        <FeedbackThanks />
      ) : (
        <>
          <p>
            Ați cerut oferte pentru un sistem fotovoltaic în județul {lead.judet} și ați ajuns la o
            semnătură. Ne-ar ajuta mult să aflăm cum a decurs. Durează cam două minute.
          </p>
          <div className="mt-6">
            <ClientFeedbackForm id={id} token={t} />
          </div>
        </>
      )}
    </FeedbackShell>
  );
}
