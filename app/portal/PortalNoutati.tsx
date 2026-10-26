'use client';

import { BellIcon, NoutatiCount, NoutatiModal, useNoutati } from '@/components/noutati/Noutati';
import { NOUTATI } from '@/lib/noutati';
import { formatShortDate } from '@/lib/utils-shared';

/**
 * Rândul din cardul contului care deschide noutățile. În portal stă la vedere,
 * nu doar în meniu: aici intră firma zilnic, deci aici îl observă.
 */
export default function PortalNoutati() {
  const { unreadCount, open, modalProps } = useNoutati('portal');
  if (!NOUTATI.length) return null;

  return (
    <div className="mt-3 border-t border-border pt-3">
      <button
        type="button"
        onClick={() => open()}
        aria-haspopup="dialog"
        className="flex w-full items-center justify-between gap-3 rounded-lg px-1 py-1.5 text-left text-sm text-gray-700 transition-colors hover:text-gray-900"
      >
        <span className="inline-flex items-center gap-2 font-medium">
          <BellIcon className="h-4 w-4 text-gray-400" />
          Noutăți în platformă
        </span>
        <span className="inline-flex items-center gap-2">
          {unreadCount > 0 ? (
            <NoutatiCount count={unreadCount} />
          ) : (
            <span className="text-xs text-gray-400">{formatShortDate(NOUTATI[0].data)}</span>
          )}
          <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </button>
      <NoutatiModal {...modalProps} />
    </div>
  );
}
