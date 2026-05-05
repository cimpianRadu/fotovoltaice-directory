'use client';

export default function AnalyticsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-sm text-red-900">
      <div className="font-semibold mb-2">Eroare la rendare</div>
      <div className="font-mono text-xs whitespace-pre-wrap break-all">{error.message}</div>
      {error.digest && (
        <div className="mt-2 text-xs text-red-700">digest: {error.digest}</div>
      )}
      <button
        onClick={reset}
        className="mt-4 px-3 py-1.5 bg-red-900 text-white rounded text-xs"
      >
        Retry
      </button>
    </div>
  );
}
