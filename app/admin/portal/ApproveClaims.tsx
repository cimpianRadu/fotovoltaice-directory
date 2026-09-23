'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import {
  CLAIM_STATUS_HINTS,
  CLAIM_STATUS_LABELS,
  claimIdleBusinessDays,
  isClaimUntouched,
  type ClaimStatus,
} from '@/lib/sheets-shared';

/**
 * O revendicare a firmei, redusă la ce trebuie ca să decizi aprobarea: ce
 * cerere e, de când o ține și dacă datele clientului i-au fost deja deblocate.
 */
/**
 * Cererea din spatele revendicării, gata de afișat: etichetele sunt rezolvate
 * pe server, ca modalul să nu tragă în client tabelele de opțiuni ale
 * formularului. Lipsește pe cererile care nu se mai găsesc în Leads.
 */
export interface ClaimLeadDetail {
  /** Data trimiterii cererii, deja formatată. */
  when: string;
  numeContact: string;
  numeCompanie: string;
  telefon: string;
  email: string;
  localitate: string;
  /** Intervalul de apel cerut de client, ca etichetă. */
  intervalApel: string;
  /** Specificațiile completate, în ordinea din formular: doar câmpurile cu valoare. */
  specs: { label: string; value: string }[];
  mesaj: string;
  /** Fișa cererii în /admin/crm. */
  crmHref: string;
}

export interface PortalClaimRow {
  timestamp: string;
  leadId: string;
  /** „Comercial · Timiș · 30 kW" — cererea, pe scurt. */
  label: string;
  detail?: ClaimLeadDetail;
  approvedAt: string;
  releasedAt: string;
  /** Motivul scris de firmă când a renunțat — de ce n-a mers cererea. */
  releaseReason: string;
  offeredAt: string;
  contactedAt: string;
  firmStatus: ClaimStatus;
  /** Câte note a scris firma din portal — 0 + status nemutat = n-a atins-o. */
  noteCount: number;
  /** Adresa de pe care s-a revendicat, scrisă doar pe conturile cu mai multe. */
  claimedBy?: string;
  /**
   * Numele firmei de pe revendicare, scris doar când diferă de cel din capul
   * cardului. Gol = revendicarea e pe firma din antet, deci n-are ce adăuga.
   */
  claimedAs?: string;
  /** Telefonul scris pe revendicarea aia — intră în hint lângă `claimedAs`. */
  claimedAsPhone?: string;
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
  /** Cererea deschisă în modal: cheia rândului, ca să nu ținem două copii. */
  const [openKey, setOpenKey] = useState<string | null>(null);

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

  const openRow = openKey ? claims.find((c) => keyOf(c) === openKey) : undefined;

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
          /* Tot cardul deschide cererea: contactul și specificațiile stau în
             modal, ca lista să rămână scanabilă. Butonul de aprobare oprește
             propagarea, altfel fiecare click pe el ar deschide și modalul. */
          <div
            key={keyOf(c)}
            role="button"
            tabIndex={0}
            onClick={() => setOpenKey(keyOf(c))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setOpenKey(keyOf(c));
              }
            }}
            title="Deschide cererea"
            className={`cursor-pointer rounded-md border border-slate-100 px-2 py-1.5 text-xs transition hover:border-slate-300 hover:bg-white ${
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
              {c.claimedAs && (
                <span
                  className="shrink-0 rounded bg-amber-100 px-1.5 py-px text-[10px] font-semibold text-amber-800"
                  title={`Revendicată pe alt nume de firmă decât cel din capul cardului: ${c.claimedAs}${
                    c.claimedAsPhone ? ` · ${c.claimedAsPhone}` : ''
                  }`}
                >
                  {c.claimedAs}
                </span>
              )}
              {c.claimedBy && (
                <span className="shrink-0 text-[10px] text-slate-400" title="Adresa care a revendicat">
                  {c.claimedBy}
                </span>
              )}
              <span
                title={CLAIM_STATUS_HINTS[c.firmStatus]}
                className={`shrink-0 rounded px-1.5 py-px text-[10px] font-semibold ${STATUS_CHIP[c.firmStatus]}`}
              >
                {CLAIM_STATUS_LABELS[c.firmStatus].toLowerCase()}
              </span>
            </div>

            {c.releasedAt ? (
              /* Motivul renunțării, pe un singur rând ca să nu umfle cardul —
                 textul complet stă în title, la hover. */
              <p
                className="mt-0.5 truncate text-[10px] text-slate-500"
                title={c.releaseReason ? `Motivul renunțării: ${c.releaseReason}` : undefined}
              >
                a renunțat · {fmtDay(c.releasedAt)}
                {c.releaseReason && <span className="italic"> · „{c.releaseReason}"</span>}
              </p>
            ) : (
              <div className="mt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(c, !at);
                  }}
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
                    n-a atins-o de {claimIdleBusinessDays(at)} zile lucrătoare
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

      {openRow && (
        <Modal open title={openRow.label} onClose={() => setOpenKey(null)}>
          <ClaimLeadDetails row={openRow} />
        </Modal>
      )}
    </div>
  );
}

/**
 * Conținutul modalului: contactul întâi (pentru asta se deschide), apoi ce a
 * completat clientul, apoi ce a făcut firma cu cererea. Aceleași date ca fișa
 * din /admin/crm, doar mai puține: linkul de jos duce la restul.
 */
function ClaimLeadDetails({ row }: { row: PortalClaimRow }) {
  const d = row.detail;
  if (!d) {
    return (
      <p className="text-sm text-slate-500">
        Cererea {row.leadId} nu mai apare în Leads (ștearsă sau comasată în altă cerere).
      </p>
    );
  }

  const firmLine = [
    row.releasedAt
      ? `a renunțat · ${fmtDay(row.releasedAt)}${row.releaseReason ? ` · „${row.releaseReason}"` : ''}`
      : '',
    row.approvedAt ? `date în portal · ${fmtDay(row.approvedAt)}` : 'date neaprobate',
    row.offeredAt ? `ofertă trimisă · ${fmtDay(row.offeredAt)}` : '',
    row.noteCount ? `${row.noteCount} ${row.noteCount === 1 ? 'notă' : 'note'} în portal` : '',
  ].filter(Boolean);

  return (
    <div className="space-y-4 text-sm">
      <p className="text-xs text-slate-400">
        Cerere din {d.when}
        {row.claimedBy && <> · revendicată de {row.claimedBy}</>}
        {row.claimedAs && (
          <>
            {' '}
            · pe numele{' '}
            <span className="font-semibold text-amber-700">
              {row.claimedAs}
              {row.claimedAsPhone ? ` · ${row.claimedAsPhone}` : ''}
            </span>
          </>
        )}
      </p>

      <section>
        <h3 className="mb-1 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
          Client
        </h3>
        <div className="font-medium text-slate-900">{d.numeContact || '—'}</div>
        {d.numeCompanie && <div className="text-slate-600">{d.numeCompanie}</div>}
        {d.telefon && (
          <a href={`tel:${d.telefon}`} className="block text-base font-semibold text-sky-700 hover:underline">
            {d.telefon}
          </a>
        )}
        {d.email && (
          <a href={`mailto:${d.email}`} className="block text-slate-600 hover:text-slate-900">
            {d.email}
          </a>
        )}
        {d.localitate && <div className="text-slate-600">{d.localitate}</div>}
        {d.intervalApel && <div className="text-emerald-700">sună: {d.intervalApel}</div>}
      </section>

      {d.specs.length > 0 && (
        <section>
          <h3 className="mb-1 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
            Cererea
          </h3>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-xs">
            {d.specs.map((s) => (
              <div key={s.label} className="contents">
                <dt className="text-slate-500">{s.label}</dt>
                <dd className="text-slate-800">{s.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {d.mesaj && (
        <section>
          <h3 className="mb-1 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
            Mesajul clientului
          </h3>
          <p className="whitespace-pre-wrap text-slate-700">{d.mesaj}</p>
        </section>
      )}

      <section>
        <h3 className="mb-1 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">
          La firmă
        </h3>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
          <span
            className={`rounded px-1.5 py-px text-[10px] font-semibold ${STATUS_CHIP[row.firmStatus]}`}
          >
            {CLAIM_STATUS_LABELS[row.firmStatus].toLowerCase()}
          </span>
          {firmLine.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </section>

      <a
        href={d.crmHref}
        className="inline-block text-xs font-medium text-sky-700 hover:underline"
      >
        Fișa completă în CRM →
      </a>
    </div>
  );
}
