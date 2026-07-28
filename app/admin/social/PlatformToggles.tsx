'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

const PLATFORME = [
  { key: 'facebook', label: 'FB' },
  { key: 'instagram', label: 'IG' },
  { key: 'youtube', label: 'YT' },
  { key: 'tiktok', label: 'TT' },
];

function cls(v?: string): string {
  if (!v) return 'bg-slate-50 text-slate-300 ring-1 ring-inset ring-slate-200 hover:ring-slate-400';
  if (v === 'sarit') return 'bg-slate-100 text-slate-400 line-through';
  if (v === 'programat') return 'bg-amber-100 text-amber-800 hover:bg-amber-200';
  return 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200';
}

export default function PlatformToggles({
  id,
  platforme,
}: {
  id: number;
  platforme: Record<string, string | undefined>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggle(platform: string) {
    setBusy(platform);
    setError(null);
    try {
      const res = await fetch('/api/admin/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, platform }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Eroare ${res.status}`);
      }
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Eroare');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className={`flex gap-1 ${pending ? 'opacity-60' : ''}`}>
        {PLATFORME.map(({ key, label }) => {
          const v = platforme[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggle(key)}
              disabled={busy !== null}
              title={`${key}: ${v || 'nedistribuit'} — click ca să comuți`}
              className={`inline-flex h-6 w-8 items-center justify-center rounded text-[11px] font-semibold transition disabled:cursor-wait ${cls(v)}`}
            >
              {busy === key ? '·' : label}
            </button>
          );
        })}
      </div>
      {error && <p className="mt-1 text-[11px] text-red-600">{error}</p>}
    </div>
  );
}
