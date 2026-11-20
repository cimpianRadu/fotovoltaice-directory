'use client';

// Poarta din /portal: firma care n-a bifat acordurile la versiunea curentă vede
// doar modalul, fără cereri, alerte sau Watt. După bifă pagina se reface de pe
// server și intră în portalul întreg.

import { useRouter } from 'next/navigation';
import AcorduriModal from '@/components/acorduri/AcorduriModal';
import type { AcordId } from '@/lib/acorduri-shared';

export default function PortalAcorduriGate({
  lipsa,
  actualizate,
}: {
  lipsa: AcordId[];
  actualizate: AcordId[];
}) {
  const router = useRouter();
  return <AcorduriModal lipsa={lipsa} actualizate={actualizate} onAccepted={() => router.refresh()} />;
}
