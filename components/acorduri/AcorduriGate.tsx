'use client';

// Modalul de acorduri pe tot site-ul, pentru firma logată care n-a bifat
// versiunea curentă (de ex. intră direct pe /cereri din emailul de alertă).
// Pe /portal îl pune pagina, de pe server; aici sărim peste el. Pe paginile cu
// documentele (termeni, publicitate, confidențialitate) nu apare, ca firma să
// le poată citi. Accesul real îl taie serverul (revendicare, Watt AI), nu
// modalul: el doar explică de ce.

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { usePortalLoggedIn } from '@/lib/portal-hint';
import { PAGINI_FARA_MODAL, type AcordId } from '@/lib/acorduri-shared';
import AcorduriModal from './AcorduriModal';

export default function AcorduriGate() {
  const logat = usePortalLoggedIn();
  const pathname = usePathname() || '/';
  const sarim =
    pathname.startsWith('/portal') ||
    pathname.startsWith('/admin') ||
    PAGINI_FARA_MODAL.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const [stare, setStare] = useState<{ lipsa: AcordId[]; actualizate: AcordId[] }>({
    lipsa: [],
    actualizate: [],
  });

  useEffect(() => {
    if (!logat || sarim) return;
    let anulat = false;
    fetch('/api/portal/acorduri', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : {}))
      .then((j: { lipsa?: AcordId[]; actualizate?: AcordId[] }) => {
        if (anulat) return;
        setStare({
          lipsa: Array.isArray(j.lipsa) ? j.lipsa : [],
          actualizate: Array.isArray(j.actualizate) ? j.actualizate : [],
        });
      })
      .catch(() => {});
    return () => {
      anulat = true;
    };
  }, [logat, sarim]);

  if (!logat || sarim || stare.lipsa.length === 0) return null;
  // Reîncărcare, nu doar ascundere: bula Watt și cardurile de pe /cereri își
  // cer starea din nou, acum cu acordurile bifate.
  return (
    <AcorduriModal
      lipsa={stare.lipsa}
      actualizate={stare.actualizate}
      onAccepted={() => window.location.reload()}
    />
  );
}
