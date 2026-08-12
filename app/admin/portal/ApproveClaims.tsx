'use client';

import { useState } from 'react';
import {
  CLAIM_STATUS_HINTS,
  CLAIM_STATUS_LABELS,
  claimIdleDays,
  isClaimUntouched,
  type ClaimStatus,
} from '@/lib/sheets-shared';

/**
 * O revendicare a firmei, redusă la ce trebuie ca să decizi aprobarea: ce
 * cerere e, de când o ține și dacă datele clientului i-au fost deja deblocate.
 */
export interface PortalClaimRow {
  timestamp: string;
  leadId: string;
  /** „Comercial · Timiș · 30 kW" — cererea, pe scurt. */
  label: string;
  approvedAt: string;
  releasedAt: string;
  offeredAt: string;
  contactedAt: string;
  firmStatus: ClaimStatus;
  /** Câte note a scris firma din portal — 0 + status nemutat = n-a atins-o. */
  noteCount: number;
}

const STATUS_CHIP: Record<ClaimStatus, string> = {
  de_sunat: 'bg-slate-200 text-slate-600',
  nu_raspunde: 'bg-amber-100 text-amber-700',
  discutii: 'bg-indigo-100 text-indigo-700',
  ofertat: 'bg-sky-100 text-sky-700',
  castigat: 'bg-emerald-600 text-white',
  pierdut: 'bg-rose-100 text-rose-700',
};

function fmtDay(iso: string): string {
  const d = new Date(iso.includes('T') ? iso : `${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' });
}

/**
 * Aprobarea = datele de contact ale clientului devin vizibile firmei în
 * /portal, ca să poată trimite oferta. Același endpoint ca butonul din
 * /admin/crm, deci starea e una singură oriunde apeși.
 */
export default function ApproveClaims({ claims }: { claims: PortalClaimRow[] }) {
  const [approved, setApproved] = useState<Record<string, string>>(
    Object.fromEntries(claims.map((c) => [c.timestamp + c.leadId, c.approvedAt])),
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const keyOf = (c: PortalClaimRow) => c.timestamp + c.leadId;

  async function toggle(c: PortalClaimRow, next: boolean) {
    setBusy(keyOf(c));
    setError(null);
    try {
      const res = await fetch('/api/admin/claims/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimTimestamp: c.timestamp, leadId: c.leadId, approved: next }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `Eroare ${res.status}`);
      setApproved((prev) => ({ ...prev, [keyOf(c)]: body.approvedAt || '' }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Eroare');
    } finally {
      setBusy(null);
    }
  }

  const pending = claims.filter((c) => !c.releasedAt && !approved[keyOf(c)]);

  async function approveAll() {
    // Aprobarea deblochează datele unui client real către o firmă. În bloc, o
    // apăsare greșită le-ar debloca pe toate deodată, deci cere confirmare.
    if (
      !window.confirm(
        `Deblochezi datele clientului pentru ${pending.length} ${
          pending.length === 1 ? 'cerere' : 'cereri'
        }? Firma primește și un email pentru fiecare.`,
      )
    ) {
      return;
    }
    // Secvențial: fiecare aprobare scrie în Sheets și trimite un email.
    for (const c of pending) await toggle(c, true);
  }

  if (claims.length === 0) {
    return <p className="text-xs text-slate-400">Nicio revendicare pe emailul ăsta.</p>;
  }

  return (
    <div className="space-y-1.5">
      {pending.length > 1 && (
        <button
          type="button"
          onClick={approveAll}
          disabled={busy !== null}
          className="w-full rounded border border-sky-300 bg-sky-50 px-2 py-1 text-[11px] font-medium text-sky-800 transition hover:bg-sky-100 disabled:cursor-wait"
        >
          Aprobă toate cele {pending.length} → portal
        </button>
      )}

      {claims.map((c) => {
        const at = approved[keyOf(c)] ?? '';
        const saving = busy === keyOf(c);
        return (
          <div
            key={keyOf(c)}
            className={`rounded-md border border-slate-100 px-2 py-1.5 text-xs ${
              c.releasedAt ? 'bg-slate-50/40 opacity-70' : 'bg-slate-50/70'
            }`}
          >
            <div className="flex items-baseline justify-between gap-2">
              <span
                className={`min-w-0 truncate font-medium text-slate-800 ${
                  c.releasedAt ? 'text-slate-500 line-through' : ''
                }`}
              >
                {c.label}
              </span>
              <span
                title={CLAIM_STATUS_HINTS[c.firmStatus]}
                className={`shrink-0 rounded px-1.5 py-px text-[10px] font-semibold ${STATUS_CHIP[c.firmStatus]}`}
              >
                {CLAIM_STATUS_LABELS[c.firmStatus].toLowerCase()}
              </span>
            </div>

            {c.releasedAt ? (
              <p className="mt-0.5 text-[10px] text-slate-500">
                a renunțat · {fmtDay(c.releasedAt)}
              </p>
            ) : (
              <div className="mt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggle(c, !at)}
                  disabled={saving}
                  title={
                    at
                      ? 'Retrage aprobarea — datele clientului dispar din portalul firmei'
                      : 'Deblochează datele clientului în portalul firmei, ca să poată trimite oferta'
                  }
                  className={`rounded px-2 py-1 text-[11px] font-medium transition disabled:cursor-wait ${
                    at
                      ? 'bg-sky-600 text-white hover:bg-sky-700'
                      : 'border border-slate-300 bg-white text-slate-600 hover:border-slate-400 hover:text-slate-900'
                  }`}
                >
                  {saving ? '…' : at ? `Date în portal · ${fmtDay(at)}` : 'Aprobă → portal'}
                </button>
                {c.offeredAt && (
                  <span className="text-[10px] text-slate-500">
                    ofertă trimisă · {fmtDay(c.offeredAt)}
                  </span>
                )}
                {/* Are datele de 2+ zile și n-a atins nimic: firma asta se sună,
                    iar clientul ei stă degeaba. Aceeași regulă ca bannerul din
                    portal, ca să nu spună cele două locuri lucruri diferite. */}
                {isClaimUntouched({ ...c, approvedAt: at, noteCount: c.noteCount }) && (
                  <span
                    title="Nici status mutat, nici notă scrisă de când are datele"
                    className="rounded bg-red-100 px-1.5 py-px text-[10px] font-semibold text-red-700"
                  >
                    n-a atins-o de {claimIdleDays(at)} zile
                  </span>
                )}
                {!c.contactedAt && !at && (
                  <span className="text-[10px] text-slate-400">apel neconfirmat</span>
                )}
              </div>
            )}
          </div>
        );
      })}

      {error && <p className="text-[10px] text-red-600">{error}</p>}
    </div>
  );
}
