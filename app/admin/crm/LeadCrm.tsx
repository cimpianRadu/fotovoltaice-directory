'use client';

import { useState } from 'react';
import {
  LEAD_STATUSES,
  LEAD_STATUS_HINTS,
  LEAD_STATUS_LABELS,
  isLeadClosed,
  type ContactState,
  type LeadNote,
  type LeadStatus,
} from '@/lib/sheets-shared';
import Band, { Caption } from './Band';
import NotesJournal, { type SaveState } from './NotesJournal';

const STATUS_TONE: Record<LeadStatus, string> = {
  noua: 'bg-slate-500',
  valida: 'bg-sky-600',
  ofertare: 'bg-amber-500',
  castigata: 'bg-emerald-600',
  altundeva: 'bg-orange-600',
  renuntat: 'bg-slate-400',
};

const CONTACT_TONE: Record<string, string> = {
  da: 'bg-emerald-600',
  nu: 'bg-red-500',
  '': 'bg-slate-400',
};

const CONTACT_OPTIONS: { value: ContactState; label: string; hint: string }[] = [
  { value: '', label: 'Neverificat', hint: 'încă nu l-am întrebat pe client' },
  { value: 'da', label: 'Da', hint: 'l-a sunat cel puțin o firmă' },
  { value: 'nu', label: 'Nu', hint: 'nu l-a căutat nimeni' },
];

export default function LeadCrm({
  id,
  status: initialStatus,
  contacted: initialContacted,
  notes: initialNotes,
}: {
  id: string;
  status: LeadStatus;
  contacted: ContactState;
  notes: LeadNote[];
}) {
  const [status, setStatus] = useState(initialStatus);
  const [contacted, setContacted] = useState(initialContacted);
  const [notes, setNotes] = useState(initialNotes);
  const [state, setState] = useState<SaveState>('idle');
  const [message, setMessage] = useState<string | null>(null);

  async function save(payload: {
    status?: LeadStatus;
    contacted?: ContactState;
    note?: string;
    editNote?: { index: number; text: string; expected: string };
    deleteNote?: { index: number; expected: string };
  }) {
    setState('saving');
    setMessage(null);
    // Optimist pe selecții: cursorul trebuie să plece în clipa clickului, nu
    // după ce răspunde Sheets. Răspunsul rescrie oricum valoarea la final.
    if (payload.status) setStatus(payload.status);
    if (payload.contacted !== undefined) setContacted(payload.contacted);
    try {
      const res = await fetch('/api/admin/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...payload }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || `Eroare ${res.status}`);
      setStatus(body.crmStatus);
      setContacted(body.contactedByFirm);
      setNotes(body.notes);
      setState('saved');
      setTimeout(() => setState('idle'), 1500);
    } catch (e) {
      setState('error');
      setMessage(e instanceof Error ? e.message : 'Eroare');
    }
  }

  const busy = state === 'saving';

  return (
    <div className="space-y-3">
      {/* Banda de stare ține toată lățimea: cu șase trepte, orice coloană
          alăturată i-ar tăia etichetele („În ofertare" e cea mai lungă). */}
      <div className="space-y-1">
        <Caption>Stare</Caption>
        <Band
          options={LEAD_STATUSES.map((s) => ({
            value: s,
            label: LEAD_STATUS_LABELS[s],
            hint: LEAD_STATUS_HINTS[s],
          }))}
          value={status}
          tone={STATUS_TONE}
          disabled={busy}
          onPick={(s) => save({ status: s })}
        />
        {/* Statusul are un efect vizibil în afara CRM-ului, deci se scrie unde
            se apasă: altfel nu se vede de ce dispar cereri din feed. */}
        {isLeadClosed(status) && (
          <p className="text-[10px] text-slate-400">
            Scoasă din feedul public /cereri — nu mai poate fi revendicată.
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Caption>Contactat de firmă</Caption>
        <div className="w-full max-w-60">
          <Band
            options={CONTACT_OPTIONS}
            value={contacted}
            tone={CONTACT_TONE}
            disabled={busy}
            onPick={(c) => save({ contacted: c })}
          />
        </div>
      </div>

      <NotesJournal
        notes={notes}
        state={state}
        message={message}
        onAdd={(note) => save({ note })}
        onEdit={(editNote) => save({ editNote })}
        onDelete={(deleteNote) => save({ deleteNote })}
      />
    </div>
  );
}
