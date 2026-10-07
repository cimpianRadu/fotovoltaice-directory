import type { Metadata } from 'next';
import { PLATFORM_FEEDBACK_ID, hasFeedback } from '@/lib/sheets';
import { verifyFeedbackToken } from '@/lib/feedback-token';
import { FeedbackThanks, PlatformFeedbackForm } from '../FeedbackForms';
import { FeedbackShell, InvalidFeedbackLink } from '../FeedbackShell';

// Părerea unei firme despre platformă în general, nu despre o lucrare anume.
// Ca la /feedback/firma: neindexată, fără linkuri spre ea, link semnat pe
// numele firmei, scos cu `scripts/feedback-links.mjs --platforma --firma "X"`.

export const metadata: Metadata = {
  title: 'Părerea dumneavoastră despre platformă',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function PlatformFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ f?: string; t?: string }>;
}) {
  const { f = '', t = '' } = await searchParams;
  if (!f || !t || !verifyFeedbackToken(t, 'platforma', PLATFORM_FEEDBACK_ID, f)) return <InvalidFeedbackLink />;

  const answered = await hasFeedback('firma', PLATFORM_FEEDBACK_ID, f);

  return (
    <FeedbackShell title="Cum vi se pare platforma?">
      {answered ? (
        <FeedbackThanks />
      ) : (
        <>
          <p>
            Vă mulțumim că lucrați cu noi. Câteva rânduri despre cum vi se pare colaborarea ne ajută să
            facem platforma mai bună pentru {f} și pentru celelalte firme.
          </p>
          <div className="mt-6">
            <PlatformFeedbackForm token={t} firma={f} />
          </div>
        </>
      )}
    </FeedbackShell>
  );
}
