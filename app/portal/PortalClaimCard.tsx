'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { trackEvent } from '@/lib/analytics';
import {
  CLAIM_STATUSES,
  CLAIM_STATUS_HINTS,
  CLAIM_STATUS_LABELS,
  claimIdleDays,
  isClaimUntouched,
  type ClaimStatus,
  type LeadNote,
} from '@/lib/sheets-shared';
import { usePersistedToggle } from './usePersistedToggle';

export interface PortalClaim {
  claimTimestamp: string;
  leadId: string;
  numeFirma: string;
  claimedAt: string;
  releasedAt: string;
  releaseReason: string;
  contactedAt: string;
  approved: boolean;
  /** ISO — când i s-au deblocat datele clientului. Gol pe cele neaprobate. */
  approvedAt: string;
  offeredAt: string;
  firmStatus: ClaimStatus;
  notes: LeadNote[];
  tipLabel: string;
  judet: string;
  segment: string;
  specs: { label: string; value: string }[];
  mesaj: string;
  /** Doar pe revendicările aprobate — altfel null, datele nu pleacă spre browser. */
  client: {
    nume: string;
    companie: string;
    telefon: string;
    email: string;
    localitate: string;
    poze: string;
  } | null;
}

/** Culoarea de fundal a statusului selectat, aceeași în pastilă, badge și legendă. */
export const STATUS_TONE: Record<ClaimStatus, string> = {
  de_sunat: 'bg-slate-500',
  nu_raspunde: 'bg-amber-500',
  discutii: 'bg-indigo-500',
  ofertat: 'bg-sky-600',
  castigat: 'bg-emerald-600',
  pierdut: 'bg-rose-600',
};

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('ro-RO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Europe/Bucharest',
  });
}

/**
 * Două stări diferite, nu una: până la aprobare badge-ul arată unde suntem NOI
 * (apelul de confirmare), după aprobare arată unde e FIRMA cu clientul. Dacă
 * le-am amesteca, firma n-ar ști niciodată pe care dintre ele o schimbă.
 */
function StatusBadge({
  released,
  releasedAt,
  approved,
  status,
}: {
  released: boolean;
  releasedAt: string;
  approved: boolean;
  status: ClaimStatus;
}) {
  // `whitespace-nowrap`: pe 375px „În confirmare, te sunăm" se rupea în două
  // rânduri lângă titlu și dezalinia tot capul cardului.
  const base =
    'inline-block whitespace-nowrap px-2 py-0.5 rounded-full text-[11px] font-semibold';
  if (released) {
    return (
      <span className={`${base} bg-gray-100 text-gray-500`}>
        Renunțat{releasedAt && releasedAt !== 'acum' ? ` · ${fmtDate(releasedAt)}` : ''}
      </span>
    );
  }
  if (!approved) {
    return <span className={`${base} bg-amber-50 text-amber-700`}>În confirmare, te sunăm</span>;
  }
  return (
    <span className={`${base} text-white ${STATUS_TONE[status]}`}>
      {CLAIM_STATUS_LABELS[status]}
    </span>
  );
}

export default function PortalClaimCard({ claim }: { claim: PortalClaim }) {
  const [notes, setNotes] = useState<LeadNote[]>(claim.notes);
  const [noteText, setNoteText] = useState('');
  const [noteBusy, setNoteBusy] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  const [status, setStatus] = useState<ClaimStatus>(claim.firmStatus);
  const [offeredAt, setOfferedAt] = useState(claim.offeredAt);
  const [statusBusy, setStatusBusy] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  const [releaseOpen, setReleaseOpen] = useState(false);
  const [motiv, setMotiv] = useState('');
  const [releaseBusy, setReleaseBusy] = useState(false);
  const [releaseError, setReleaseError] = useState<string | null>(null);
  const [released, setReleased] = useState(Boolean(claim.releasedAt));
  const [detailsOpen, setDetailsOpen] = usePersistedToggle('portal-card-details-open', true);

  async function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteText.trim()) return;
    setNoteBusy(true);
    setNoteError(null);
    try {
      const res = await fetch('/api/portal/claims/note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimTimestamp: claim.claimTimestamp,
          leadId: claim.leadId,
          text: noteText,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNoteError(json.error || 'A apărut o eroare. Încearcă din nou.');
        return;
      }
      trackEvent('portal_note_added');
      setNotes(json.notes || []);
      setNoteText('');
    } catch {
      setNoteError('A apărut o eroare. Încearcă din nou.');
    } finally {
      setNoteBusy(false);
    }
  }

  async function pickStatus(next: ClaimStatus) {
    if (next === status) return;
    // `pierdut` eliberează locul cererii pentru altă firmă, deci trece prin
    // formularul de renunțare, cu motiv, nu printr-un click simplu.
    if (next === 'pierdut') {
      setReleaseOpen(true);
      return;
    }
    setStatusBusy(true);
    setStatusError(null);
    try {
      const res = await fetch('/api/portal/claims/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimTimestamp: claim.claimTimestamp,
          leadId: claim.leadId,
          status: next,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatusError(json.error || 'A apărut o eroare. Încearcă din nou.');
        return;
      }
      trackEvent('portal_status_set', { status: next });
      setStatus(json.status || next);
      setOfferedAt(json.offeredAt || '');
    } catch {
      setStatusError('A apărut o eroare. Încearcă din nou.');
    } finally {
      setStatusBusy(false);
    }
  }

  async function release(e: React.FormEvent) {
    e.preventDefault();
    setReleaseBusy(true);
    setReleaseError(null);
    try {
      const res = await fetch('/api/portal/claims/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimTimestamp: claim.claimTimestamp,
          leadId: claim.leadId,
          motiv,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setReleaseError(json.error || 'A apărut o eroare. Încearcă din nou.');
        return;
      }
      trackEvent('portal_claim_released');
      setReleased(true);
      setStatus('pierdut');
      setReleaseOpen(false);
    } catch {
      setReleaseError('A apărut o eroare. Încearcă din nou.');
    } finally {
      setReleaseBusy(false);
    }
  }

  const inactive = released;

  return (
    <div className={`bg-white rounded-xl border border-border p-5 ${inactive ? 'opacity-70' : ''}`}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-gray-900">
            {claim.tipLabel}
            {claim.judet ? ` · ${claim.judet}` : ''}
          </h3>
          <StatusBadge
            released={released}
            releasedAt={claim.releasedAt}
            approved={claim.approved}
            status={status}
          />
        </div>
        <span className="text-xs text-gray-400">revendicat {fmtDate(claim.claimedAt)}</span>
      </div>

      {/* Detaliile proiectului se citesc o dată, la primul contact, apoi cardul
          e despre apel, status și note. Pe telefon ocupau jumătate de ecran
          înaintea datelor clientului, deci se pot strânge; alegerea se ține
          minte pentru toate cardurile, nu o repeți la fiecare cerere. */}
      {(claim.specs.length > 0 || claim.mesaj) && (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => setDetailsOpen(!detailsOpen)}
            aria-expanded={detailsOpen}
            className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400 hover:text-gray-600"
          >
            Detalii proiect
            {claim.specs.length > 0 && (
              <span className="font-normal normal-case tracking-normal">
                ({claim.specs.length})
              </span>
            )}
            <svg
              className={`h-3.5 w-3.5 transition-transform ${detailsOpen ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {detailsOpen && (
            <>
              {claim.specs.length > 0 && (
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {claim.specs.map((s) => (
                    <li
                      key={s.label}
                      className="rounded-md bg-surface border border-border px-2 py-0.5 text-[11px] text-gray-600"
                    >
                      <span className="text-gray-400">{s.label}:</span> {s.value}
                    </li>
                  ))}
                </ul>
              )}
              {claim.mesaj && (
                <p className="mt-2 text-sm text-gray-500 italic leading-relaxed">„{claim.mesaj}”</p>
              )}
            </>
          )}
        </div>
      )}

      {claim.client ? (
        <div className="mt-4 rounded-lg bg-emerald-50/60 border border-emerald-200 p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 mb-2">
            Datele clientului
          </div>
          <div className="text-sm text-gray-800 space-y-1">
            <p className="font-medium">
              {claim.client.nume}
              {claim.client.companie ? ` · ${claim.client.companie}` : ''}
            </p>
            {claim.client.localitate && <p className="text-gray-600">{claim.client.localitate}</p>}

            {/* Pe telefon apelul e acțiunea principală a întregului portal, iar
                înainte era un link de 17px într-un rând de text. Buton pe toată
                lățimea pe mobil, inline pe desktop. */}
            <a
              href={`tel:${claim.client.telefon.replace(/\s/g, '')}`}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 sm:inline-flex sm:w-auto sm:py-2"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              Sună {claim.client.telefon}
            </a>

            <p className="pt-1">
              <a
                href={`mailto:${claim.client.email}`}
                className="break-all text-primary-dark hover:underline"
              >
                {claim.client.email}
              </a>
            </p>
            {claim.client.poze && (
              <p>
                <a
                  href={claim.client.poze}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-dark underline hover:no-underline"
                >
                  Pozele acoperișului / locației
                </a>
              </p>
            )}
          </div>
        </div>
      ) : (
        !inactive && (
          <div className="mt-4 rounded-lg bg-surface border border-border px-4 py-3 text-sm text-gray-500">
            Datele clientului se deblochează după apelul nostru de confirmare (durează de
            obicei sub o zi lucrătoare).
          </div>
        )
      )}

      {/* Pipeline-ul firmei pe cererea asta. Apare abia după deblocarea datelor:
          înainte n-are pe cine suna, deci n-are ce raporta. */}
      {/* Nimic nu s-a mișcat de două zile de când firma are datele: nici status
          mutat, nici notă. Bannerul e pentru client, nu pentru noi — el așteaptă
          un telefon care nu vine. Dispare în clipa în care firma atinge ceva,
          pentru că se calculează din starea locală, nu din ce a venit de pe
          server. */}
      {!inactive &&
        isClaimUntouched({
          approvedAt: claim.approvedAt,
          releasedAt: claim.releasedAt,
          firmStatus: status,
          noteCount: notes.length,
        }) && (
          <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-semibold">
              Au trecut {claimIdleDays(claim.approvedAt)} zile de când ai datele clientului. Mai
              ești interesat de cererea asta?
            </p>
            <p className="mt-1 text-amber-800">
              Nu văd nicio activitate pe cerere, dar poate ai vorbit deja cu el. M-ar ajuta să
              știu unde ești: mută statusul sau lasă o notă. Dacă nu mai lucrezi la ea, renunță
              și o preia altă firmă. Clientul așteaptă.
            </p>
          </div>
        )}

      {!inactive && claim.approved && (
        <div className="mt-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">
            Unde ești cu clientul
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CLAIM_STATUSES.map((s) => {
              const active = s === status;
              // 30px înălțime era sub pragul de atingere pe telefon, iar o
              // atingere greșită aici scrie alt status în Sheet. Pe mobil
              // pastila crește la ~42px, pe desktop rămâne compactă.
              return (
                <button
                  key={s}
                  type="button"
                  title={CLAIM_STATUS_HINTS[s]}
                  disabled={statusBusy}
                  onClick={() => pickStatus(s)}
                  className={`rounded-full border px-3 py-2.5 text-[13px] font-medium transition-colors disabled:cursor-wait disabled:opacity-60 sm:py-1.5 sm:text-xs ${
                    active
                      ? `${STATUS_TONE[s]} text-white border-transparent`
                      : 'bg-white text-gray-600 border-border hover:border-secondary/40 hover:text-secondary-dark'
                  }`}
                >
                  {CLAIM_STATUS_LABELS[s]}
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-xs text-gray-400">
            {CLAIM_STATUS_HINTS[status]}
            {status === 'ofertat' && offeredAt ? ` · marcat pe ${fmtDate(offeredAt)}` : ''}
          </p>
          {status === 'castigat' && (
            <p className="mt-1 text-xs text-emerald-700">
              Felicitări. Închidem cererea la noi, ca să nu mai fie sunat de alte firme.
            </p>
          )}
          {statusError && <p className="mt-1 text-xs text-red-600">{statusError}</p>}
        </div>
      )}

      {released && claim.releaseReason && (
        <div className="mt-3 rounded-lg bg-surface border border-border px-4 py-3 text-sm text-gray-500">
          <span className="text-gray-400">Motivul renunțării:</span> {claim.releaseReason}
        </div>
      )}

      {/* Jurnalul de note — vizibil și pentru noi în CRM, deci ce scrii aici chiar ajută la realocare. */}
      <div className="mt-4 border-t border-border pt-4">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">
          Notele tale
        </div>
        {notes.length > 0 && (
          <ul className="space-y-2 mb-3">
            {notes.map((n, i) => (
              <li key={`${n.date}-${i}`} className="text-sm text-gray-700">
                <span className="text-xs text-gray-400 mr-2">
                  {n.date}
                  {n.time ? ` ${n.time}` : ''}
                </span>
                {n.text}
              </li>
            ))}
          </ul>
        )}
        {/* Pe 375px input + buton pe același rând lăsau ~198px de scris, în
            care nici placeholderul nu încăpea. Se stivuiesc pe telefon. */}
        {!inactive && (
          <form onSubmit={addNote} className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Ex: am sunat, nu răspunde, reîncerc mâine"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
            <Button type="submit" variant="outline" disabled={noteBusy || !noteText.trim()}>
              {noteBusy ? '...' : 'Adaugă'}
            </Button>
          </form>
        )}
        {noteError && <p className="mt-1 text-xs text-red-600">{noteError}</p>}
      </div>

      {!inactive && (
        <div className="mt-4 border-t border-border pt-3">
          {releaseOpen ? (
            <form onSubmit={release} className="space-y-2">
              <label htmlFor={`motiv-${claim.claimTimestamp}`} className="block text-sm font-medium text-gray-700">
                De ce nu a mers această cerere?
              </label>
              <textarea
                id={`motiv-${claim.claimTimestamp}`}
                value={motiv}
                onChange={(e) => setMotiv(e.target.value)}
                required
                rows={2}
                placeholder="Ex: clientul nu răspunde după 3 încercări / prea departe de zona noastră / a ales altă ofertă"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              />
              {releaseError && <p className="text-xs text-red-600">{releaseError}</p>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={releaseBusy}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {releaseBusy ? 'Se trimite...' : 'Renunț și eliberez locul'}
                </button>
                <Button type="button" variant="ghost" onClick={() => setReleaseOpen(false)}>
                  Anulează
                </Button>
              </div>
            </form>
          ) : (
            /* Link gri de 12px, firmele nu-l vedeau. Renunțarea nu e o acțiune
               de ascuns: fără ea cererea stă ocupată la o firmă care nu mai
               lucrează la ea, iar clientul așteaptă degeaba. */
            <div>
              <button
                type="button"
                onClick={() => setReleaseOpen(true)}
                className="inline-flex items-center rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 transition-colors hover:border-red-300 hover:bg-red-100 sm:py-2"
              >
                Renunț la această cerere
              </button>
              <p className="mt-1.5 text-xs text-gray-500">
                Eliberezi locul pentru altă firmă. Îți cerem doar motivul.
              </p>
            </div>
          )}
        </div>
      )}

      {released && !claim.releasedAt && (
        <p className="mt-3 text-sm text-emerald-700">
          Locul a fost eliberat. Mulțumim că ai lăsat motivul, ne ajută să realocăm cererea.
        </p>
      )}
    </div>
  );
}
