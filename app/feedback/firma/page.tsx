import type { Metadata } from 'next';
import { getFullLeadById, hasFeedback } from '@/lib/sheets';
import { verifyFeedbackToken } from '@/lib/feedback-token';
import { getProjectTypeLabel } from '@/lib/utils-shared';
import { FeedbackThanks, FirmFeedbackForm } from '../FeedbackForms';
import { FeedbackShell, InvalidFeedbackLink } from '../FeedbackShell';

// Feedbackul firmei care a semnat lucrarea. Ca la /feedback/client: fără
// linkuri spre pagină, neindexată, link semnat scos cu
// scripts/feedback-links.mjs. Numele firmei e în semnătură.

export const metadata: Metadata = {
  title: 'Feedback lucrare concretizată',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function FirmFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; f?: string; t?: string }>;
}) {
  const { id = '', f = '', t = '' } = await searchParams;
  if (!id || !f || !t || !verifyFeedbackToken(t, 'firma', id, f)) return <InvalidFeedbackLink />;

  const [lead, answered] = await Promise.all([getFullLeadById(id), hasFeedback('firma', id, f)]);
  if (!lead) return <InvalidFeedbackLink />;

  return (
    <FeedbackShell title="Felicitări pentru lucrare">
      {answered ? (
        <FeedbackThanks />
      ) : (
        <>
          <p>
            {f} a semnat cererea „{getProjectTypeLabel(lead.tipProiect)}” din județul {lead.judet}. Câteva
            întrebări scurte despre cum a decurs ne ajută să trimitem cereri mai bune.
          </p>
          <div className="mt-6">
            <FirmFeedbackForm
              id={id}
              token={t}
              firma={f}
              initialPutere={lead.putere}
              initialBaterie={lead.stocare === 'da' || lead.stocare === 'nu' ? lead.stocare : ''}
            />
          </div>
        </>
      )}
    </FeedbackShell>
  );
}
