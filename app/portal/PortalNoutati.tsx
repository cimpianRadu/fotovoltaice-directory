'use client';

import { BellIcon, NoutatiCount, NoutatiModal, useNoutati } from '@/components/noutati/Noutati';
import { NOUTATI } from '@/lib/noutati';

/**
 * Butonul din cardul contului care deschide noutățile, lângă „Ieși din cont”.
 * În portal stă la vedere, nu doar în meniu: aici intră firma zilnic. Mic,
 * ca să nu împingă cererile în jos (23 nov 2026).
 */
export default function PortalNoutati() {
  const { unreadCount, open, modalProps } = useNoutati('portal');
  if (!NOUTATI.length) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => open()}
        aria-haspopup="dialog"
        aria-label="Noutăți în platformă"
        title="Noutăți în platformă"
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-2.5 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
      >
        <BellIcon className="h-4 w-4" />
        <span className="hidden sm:inline">Noutăți</span>
        <NoutatiCount count={unreadCount} />
      </button>
      <NoutatiModal {...modalProps} />
    </>
  );
}
