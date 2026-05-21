'use client';

import { useSegment } from '@/components/segment/SegmentProvider';
import SegmentToggle from '@/components/segment/SegmentToggle';

export default function SegmentNotice() {
  const { segment } = useSegment();
  const isRezidential = segment === 'rezidential';

  return (
    <div className="mb-6 rounded-xl border-2 border-primary/30 bg-primary/5 p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm sm:text-base text-gray-800 leading-relaxed">
          Trimitem cererea ta către instalatorii{' '}
          {isRezidential ? (
            <strong className="text-primary-dark">pentru casă (rezidențial, Casa Verde)</strong>
          ) : (
            <strong className="text-primary-dark">pentru firmă (comercial / industrial)</strong>
          )}{' '}
          din zona ta.
        </p>
        <div className="shrink-0">
          <SegmentToggle />
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-2">Nu e ce cauți? Comută mai sus între Casă și Firmă.</p>
    </div>
  );
}
