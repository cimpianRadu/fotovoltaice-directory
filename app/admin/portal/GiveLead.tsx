'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * O cerere pe care o pot da firmei ăsteia: deschisă, cu loc liber și
 * nerevendicată deja de ea. Scorul și motivele vin din `lib/lead-match`,
 * aceeași potrivire ca sugestiile din /admin/crm — 0 pentru firmele din afara
 * directorului, unde n-avem pe ce potrivi. Se calculează la deschidere, prin
 * /api/admin/portal/dau-cerere, nu la încărcarea paginii.
 */
export interface LeadOption {
  id: string;
  label: string;
  /** Câte locuri mai are cererea din cele 3. */
  slots: number;
  score: number;
  reasons: string[];
  warnings: string[];
}

export interface GiveLeadFirm {
  email: string;
  numeFirma: string;
  numeContact: string;
  telefon: string;
}

export default function GiveLead({
  firm,
  count,
  members,
  companyId,
}: {
  firm: GiveLeadFirm;
  /** Câte cereri i-aș putea da, numărate pe server fără potrivire. */
  count: number;
  members: string[];
  companyId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  /** null până la prima deschidere: lista vine abia atunci. */
  const [leads, setLeads] = useState<LeadOption[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** Cererea la care plafonul a spus nu — se poate forța, ca bifa din CRM. */
  const [capped, setCapped] = useState<string | null>(null);
  const [done, setDone] = useState<string[]>([]);

  async function give(lead: LeadOption, override: boolean) {
    setBusy(lead.id);
    setError(null);
    setCapped(null);
    try {
      const res = await fetch('/api/admin/claims/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          numeFirma: firm.numeFirma,
          numeContact: firm.numeContact || '-',
          telefon: firm.telefon,
          email: firm.email,
          override,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (body.firmCapped || body.full) setCapped(lead.id);
        throw new Error(body.error || `Eroare ${res.status}`);
      }

      // Aprobarea imediată e tot rostul butonului: firma are cont, i-am dat
      // cererea, deci trebuie să vadă datele clientului, nu un card blocat.
      // Dacă pică, revendicarea rămâne scrisă — o aprobi din lista de sus.
      const apr = await fetch('/api/admin/claims/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimTimestamp: body.claimTimestamp,
          leadId: lead.id,
          approved: true,
        }),
      });
      if (!apr.ok) {
        const aprBody = await apr.json().catch(() => ({}));
        throw new Error(
          `Cererea e dată, dar aprobarea a picat: ${aprBody.error || apr.status}. Aprob-o din listă.`,
        );
      }

      setDone((prev) => [...prev, lead.id]);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Eroare');
    } finally {
      setBusy(null);
    }
  }

  async function deschide() {
    setOpen(true);
    if (leads !== null || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/portal/dau-cerere', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numeFirma: firm.numeFirma,
          telefon: firm.telefon,
          members,
          companyId,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `Eroare ${res.status}`);
      setLeads(body.options ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Eroare');
    } finally {
      setLoading(false);
    }
  }

  const remaining = (leads ?? []).filter((l) => !done.includes(l.id));

  if (!open) {
    return (
      <button
        type="button"
        onClick={deschide}
        disabled={count === 0}
        title={
          count === 0
            ? 'Nicio cerere deschisă cu loc liber pe care să n-o aibă deja'
            : 'Alege o cerere, se revendică pe firma asta și se aprobă pe loc'
        }
        className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-[11px] font-medium text-slate-700 transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:text-slate-400"
      >
        {count === 0 ? 'Nicio cerere de dat' : `Dă o cerere (${count} deschise)`}
      </button>
    );
  }

  return (
    <div className="rounded border border-slate-200 bg-white p-2">
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <p className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
          Dă o cerere · se aprobă automat
        </p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[10px] text-slate-400 hover:text-slate-900"
        >
          închide
        </button>
      </div>

      <ul className="max-h-56 space-y-1 overflow-y-auto">
        {remaining.map((lead) => (
          <li key={lead.id} className="rounded bg-slate-50 px-2 py-1.5 text-xs">
            <div className="flex items-baseline justify-between gap-2">
              <span className="min-w-0 truncate font-medium text-slate-800">{lead.label}</span>
              <span
                title="Locuri rămase din cele 3 ale cererii"
                className="shrink-0 text-[10px] tabular-nums text-slate-400"
              >
                {lead.slots} {lead.slots === 1 ? 'loc' : 'locuri'}
              </span>
            </div>

            {lead.reasons.length > 0 && (
              <p className="mt-0.5 text-[10px] text-emerald-700">{lead.reasons.join(' · ')}</p>
            )}
            {lead.warnings.length > 0 && (
              <p className="text-[10px] text-amber-700">{lead.warnings.join(' · ')}</p>
            )}

            <div className="mt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={() => give(lead, false)}
                disabled={busy !== null}
                className="rounded bg-slate-900 px-2 py-1 text-[11px] font-medium text-white transition hover:bg-slate-700 disabled:cursor-wait disabled:opacity-60"
              >
                {busy === lead.id ? 'se dă…' : 'Dă și aprobă'}
              </button>
              {capped === lead.id && (
                <button
                  type="button"
                  onClick={() => give(lead, true)}
                  disabled={busy !== null}
                  className="rounded border border-amber-300 bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-800 transition hover:bg-amber-100 disabled:cursor-wait"
                >
                  Dă oricum, peste plafon
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {loading && (
        <p className="px-2 py-3 text-center text-xs text-slate-500">Se calculează potrivirile…</p>
      )}
      {leads !== null && remaining.length === 0 && (
        <p className="px-2 py-3 text-center text-xs text-slate-500">
          Gata, toate cererile din listă i-au fost date.
        </p>
      )}
      {error && <p className="mt-1 text-[10px] text-red-600">{error}</p>}
    </div>
  );
}
