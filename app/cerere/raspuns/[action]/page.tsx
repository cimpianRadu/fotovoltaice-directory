import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isClientLinkAction, verifyClientToken } from '@/lib/lead-client-token';
import ResponseConfirm from './ResponseConfirm';

// Butoanele „încă mă informez" și „nu mai vreau" din emailurile către client.
// Efectul se produce la apăsarea butonului de pe pagină, nu la deschiderea
// linkului: unii clienți de email preîncarcă linkurile și ar închide cereri.

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
  searchParams: Promise<{ id?: string; t?: string }>;
}) {
  const { action } = await params;
  if (!isClientLinkAction(action) || action === 'actualizare') notFound();
  const { id = '', t = '' } = await searchParams;
  const valid = Boolean(id && t && verifyClientToken(t, id, action));

  return (
    <div className="max-w-xl mx-auto px-4 py-10 sm:py-14">
      <ResponseConfirm action={action} id={id} token={t} valid={valid} />
    </div>
  );
}
