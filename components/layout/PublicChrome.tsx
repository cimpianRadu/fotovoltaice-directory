'use client';

import { usePathname } from 'next/navigation';

/**
 * Ascunde elementele de site public (header, footer, popup de ofertă, banner de
 * sponsor) pe rutele de admin. Panourile interne au propriul lor cadru, iar
 * popup-urile acopereau exact coloanele de lucru din CRM.
 */
export default function PublicChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin')) return null;
  return <>{children}</>;
}
