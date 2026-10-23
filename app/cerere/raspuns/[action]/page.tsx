import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isClientLinkAction, verifyClientToken } from '@/lib/lead-client-token';
import { createFeedbackToken } from '@/lib/feedback-token';
import { getFullLeadById, hasFeedback, isLeadInformez } from '@/lib/sheets';
import { claimedFirmsFor, declaredFirmsFor, findNamedClaim } from '@/lib/verificare-status';
import { TIMELINE_OPTIONS } from '@/lib/utils-shared';
import ResponseConfirm from './ResponseConfirm';

// Butoanele „încă mă informez" și „nu mai vreau" din emailurile către client.
// Efectul se produce la apăsarea butonului de pe pagină, nu la deschiderea
// linkului: unii clienți de email preîncarcă linkurile și ar închide cereri.
// La „Ați găsit o ofertă bună?" (6 oct 2026), după confirmare urmează pe loc
// chestionarul de feedback, cu tokenul lui generat aici.
// Din 12 oct 2026 pagina pune și întrebări opționale, trimise odată cu
// confirmarea (lib/client-response-details); datele pentru ele vin de aici:
// firmele numite în email, firmele care au revendicat cererea, termenul actual.

export const metadata: Metadata = {
  title: 'Răspunsul dumneavoastră',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function RaspunsPage({
  params,
  searchParams,
}: {
  params: Promise<{ action: string }>;
  searchParams: Promise<{ id?: string; t?: string; f?: string }>;
}) {
  const { action } = await params;
  if (!isClientLinkAction(action) || action === 'actualizare') notFound();
  const { id = '', t = '', f = '' } = await searchParams;
  const signedExtra = action === 'semnat' ? f : '';
  let valid = Boolean(id && t && verifyClientToken(t, id, action, signedExtra));

  const statusCheck =
    action === 'semnat' || action === 'decid' || action === 'altafirma' || action === 'necontactat';
  let firmName = '';
  let feedback: { token: string; done: boolean } | undefined;
  if (valid && statusCheck) {
    if (action === 'semnat') {
      firmName = (await findNamedClaim(id, f)) || '';
      if (!firmName) valid = false;
    }
    feedback = { token: createFeedbackToken('client', id), done: await hasFeedback('client', id) };
  }

  let firms: { claimTs: string; name: string }[] = [];
  let showNesunat = true;
  let currentTermen = '';
  if (valid) {
    if (action === 'decid' || action === 'necontactat') firms = await declaredFirmsFor(id);
    else if (action === 'aleasa') firms = await claimedFirmsFor(id);
    else if (action === 'renunt' || action === 'activa') {
      const lead = await getFullLeadById(id);
      // La „mă informez" firmele doar urmăresc, nu sună: „nu m-a sunat nicio firmă" ar fi o alarmă falsă.
      if (lead && action === 'renunt') showNesunat = !isLeadInformez(lead);
      if (lead && action === 'activa') currentTermen = TIMELINE_OPTIONS.find((o) => o.value === lead.termen)?.label ?? '';
    }
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10 sm:py-14">
      <ResponseConfirm
        action={action}
        id={id}
        token={t}
        f={signedExtra}
        valid={valid}
        firmName={firmName}
        feedback={feedback}
        firms={firms}
        showNesunat={showNesunat}
        currentTermen={currentTermen}
      />
    </div>
  );
}
