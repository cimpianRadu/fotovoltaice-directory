'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import { trackEvent } from '@/lib/analytics';
import type { LeadNote } from '@/lib/sheets-shared';

export interface PortalClaim {
  claimTimestamp: string;
  leadId: string;
  numeFirma: string;
  claimedAt: string;
  releasedAt: string;
  releaseReason: string;
  contactedAt: string;
  approved: boolean;
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

function StatusBadge({ claim }: { claim: PortalClaim }) {
  if (claim.releasedAt) {
    return (
      <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-500">
        Renunțat · {fmtDate(claim.releasedAt)}
      </span>
    );
  }
  if (claim.approved) {
    return (
      <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700">
        Date client disponibile
      </span>
    );
  }
  return (
    <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700">
      În confirmare, te sunăm
    </span>
  );
}

export default function PortalClaimCard({ claim }: { claim: PortalClaim }) {
  const [notes, setNotes] = useState<LeadNote[]>(claim.notes);
  const [noteText, setNoteText] = useState('');
  const [noteBusy, setNoteBusy] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  const [releaseOpen, setReleaseOpen] = useState(false);
  const [motiv, setMotiv] = useState('');
  const [releaseBusy, setReleaseBusy] = useState(false);
  const [releaseError, setReleaseError] = useState<string | null>(null);
  const [released, setReleased] = useState(Boolean(claim.releasedAt));

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
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">
            {claim.tipLabel}
            {claim.judet ? ` · ${claim.judet}` : ''}
          </h3>
          <StatusBadge claim={{ ...claim, releasedAt: released ? claim.releasedAt || 'acum' : '' }} />
        </div>
        <span className="text-xs text-gray-400">revendicat {fmtDate(claim.claimedAt)}</span>
      </div>

      {claim.specs.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
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
            <p>
              <a href={`tel:${claim.client.telefon.replace(/\s/g, '')}`} className="text-primary-dark font-medium hover:underline">
                {claim.client.telefon}
              </a>
              {' · '}
              <a href={`mailto:${claim.client.email}`} className="text-primary-dark hover:underline">
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
        {!inactive && (
          <form onSubmit={addNote} className="flex gap-2">
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
                De ce renunți la această cerere?
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
            <button
              type="button"
              onClick={() => setReleaseOpen(true)}
              className="text-xs text-gray-400 underline hover:text-red-600"
            >
              Renunț la această cerere
            </button>
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
