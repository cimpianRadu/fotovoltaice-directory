'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// „Dă și aprobă” pe o cerere, către o firmă cu cont: aceleași rute ca butonul
// din /admin/portal (GiveLead), doar privit dinspre cerere. Revendicarea se
// scrie pe firmă (source manual, fără email de confirmare) și se aprobă pe loc,
// ca firma să vadă datele clientului în portal. Plafoanele se aplică; peste ele
// doar cu „Dă oricum”.

export interface GiveFirm {
  email: string;
  numeFirma: string;
  numeContact: string;
  telefon: string;
}

export default function GiveToFirm({ leadId, firm }: { leadId: string; firm: GiveFirm }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [capped, setCapped] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function give(override: boolean) {
    if (!override && !window.confirm(`Dai cererea firmei ${firm.numeFirma}? Apare imediat în portalul ei, aprobată.`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/claims/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          numeFirma: firm.numeFirma,
          numeContact: firm.numeContact || '-',
          telefon: firm.telefon,
          email: firm.email,
          override,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (body.firmCapped || body.full) setCapped(true);
        throw new Error(body.error || `Eroare ${res.status}`);
      }
      const apr = await fetch('/api/admin/claims/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimTimestamp: body.claimTimestamp, leadId, approved: true }),
      });
      if (!apr.ok) {
        const aprBody = await apr.json().catch(() => ({}));
        throw new Error(`Dată, dar aprobarea a picat: ${aprBody.error || apr.status}. Aprob-o din Conturi portal.`);
      }
      setDone(true);
      setCapped(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Eroare');
    } finally {
      setBusy(false);
    }
  }

  if (done) return <span className="text-[11px] font-medium text-emerald-700">dată ✓</span>;

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        onClick={() => give(false)}
        disabled={busy}
        className="rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[11px] font-medium text-slate-700 hover:border-slate-500 hover:text-slate-900 disabled:cursor-wait disabled:opacity-60"
      >
        {busy ? 'se dă…' : 'Dă și aprobă'}
      </button>
      {capped && (
        <button
          type="button"
          onClick={() => give(true)}
          disabled={busy}
          className="rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-800 hover:bg-amber-100"
        >
          Dă oricum, peste plafon
        </button>
      )}
      {error && <span className="text-[11px] text-red-600">{error}</span>}
    </span>
  );
}
