'use client';

// Poarta din /portal: firma care n-a bifat acordurile la versiunea curentă vede
// doar modalul, fără cereri, alerte sau Watt. După bifă pagina se reface de pe
// server și intră în portalul întreg.

import { useRouter } from 'next/navigation';
import AcorduriModal from '@/components/acorduri/AcorduriModal';
import { ACORDURI_ACCEPTATE_EVENT, type AcordId } from '@/lib/acorduri-shared';

export default function PortalAcorduriGate({
  lipsa,
  actualizate,
  firma,
}: {
  lipsa: AcordId[];
  actualizate: AcordId[];
  firma: string;
}) {
  const router = useRouter();
  return (
    <AcorduriModal
      lipsa={lipsa}
      actualizate={actualizate}
      firma={firma}
      onAccepted={() => {
        router.refresh();
        // Bula Watt din layout nu se remontează la refresh: îi spunem să reverifice.
        window.dispatchEvent(new Event(ACORDURI_ACCEPTATE_EVENT));
      }}
    />
  );
}
