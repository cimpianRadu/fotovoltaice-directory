'use client';

import { useState, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import {
  FIRM_REPORT_OPTIONS,
  BUMPS_PER_WEEK,
  NOTE_MAX,
  REFUZ_REASON_OPTIONS,
  type FirmReport,
  type RefuzReason,
} from '@/lib/client-account-shared';
import { RENUNT_REASON_OPTIONS } from '@/lib/client-response-details';
import { fileSizeLabel } from '@/lib/oferte-shared';
import type { AccountLeadData, AccountFirm, AccountNote } from '@/lib/client-account';

// Pagina cererii din contul clientului (23 oct 2026). Datele vin gata făcute de pe
// server (lib/client-account → loadAccountLead). Cu `demo`, nicio apăsare nu
// pleacă nicăieri: e varianta din /admin/cont-client, pe date inventate.

const day = (iso: string) =>
  new Date(iso).toLocaleDateString('ro-RO', { timeZone: 'Europe/Bucharest', day: 'numeric', month: 'long', year: 'numeric' });
const dayShort = (iso: string) =>
  new Date(iso).toLocaleDateString('ro-RO', { timeZone: 'Europe/Bucharest', day: 'numeric', month: 'long' });
const dayTime = (iso: string) =>
  new Date(iso).toLocaleString('ro-RO', { timeZone: 'Europe/Bucharest', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
const lei = (n: number) => `${n.toLocaleString('ro-RO', { maximumFractionDigits: 0 })} lei`;

function capitalize(s: string) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(typeof json.error === 'string' ? json.error : 'A apărut o eroare. Încercați din nou.');
  return json;
}

const DEMO_NOTE = 'Exemplu: în contul real, apăsarea salvează răspunsul.';

/** „1 vizualizare”, „5 vizualizări”, „20 de vizualizări”. */
function countRo(n: number, one: string, many: string) {
  if (n === 1) return `1 ${one}`;
  const r = n % 100;
  return `${n} ${n >= 20 && (r === 0 || r >= 20) ? 'de ' : ''}${many}`;
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/**
 * De câte ori au deschis instalatorii cererea (Radu, 30 oct: „să poată să vadă nr
 * de vizualizări, poate cu un eye icon”). Cifra e din lead_clicks: câte un
 * instalator pe zi, din pagina de cereri sau din linkul din email.
 */
function ViewsBadge({ n }: { n: number }) {
  return (
    <span
      title="De câte ori au deschis-o instalatorii, din pagina de cereri sau din email. Un instalator contează o dată pe zi."
      className="mt-1 inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700"
    >
      <EyeIcon className="h-3.5 w-3.5" />
      {n ? countRo(n, 'vizualizare', 'vizualizări') : 'nicio vizualizare încă'}
    </span>
  );
}

/**
 * Unde a ajuns cererea, ca un drum, nu ca niște casete: nu e nimic de apăsat
 * aici (Radu, 23 oct: casetele arătau a butoane care nu fac nimic).
 */
function ProgressSteps({ data }: { data: AccountLeadData }) {
  const offers = data.firms.reduce((n, f) => n + f.offers.length, 0);
  const saidOffer = data.firms.some((f) => f.report === 'oferta' || f.report === 'refuzat' || f.report === 'semnat');
  const { sentTo, clickVisitors, claimed, withdrawn } = data.stats;
  const gaveUp = withdrawn ? `${withdrawn} ${withdrawn === 1 ? 'firmă a renunțat' : 'firme au renunțat'}` : '';
  const raw: { label: string; detail: string; done: boolean; extra?: ReactNode }[] = [
    { label: 'Trimisă', detail: dayShort(data.createdAt), done: true },
    {
      label: 'Văzută de instalatori',
      detail: sentTo ? `trimisă la ${sentTo} ${sentTo === 1 ? 'firmă' : 'firme'}` : '',
      done: Boolean(sentTo || clickVisitors),
      extra: <ViewsBadge n={clickVisitors} />,
    },
    {
      label: 'Preluată',
      detail: claimed ? [`de ${claimed} ${claimed === 1 ? 'firmă' : 'firme'}`, gaveUp].filter(Boolean).join(' · ') : gaveUp || 'încă nu',
      done: claimed > 0,
    },
    { label: 'Ofertă', detail: offers ? `${offers} prin platformă` : saidOffer ? 'primită' : 'încă nu', done: offers > 0 || saidOffer },
    { label: 'Semnat', detail: data.won ? 'felicitări' : '', done: data.won },
  ];
  // Un pas făcut îi bifează și pe cei dinainte: o cerere preluată a fost și văzută.
  const lastDone = raw.map((s) => s.done).lastIndexOf(true);
  const steps = raw.map((s, i) => ({ ...s, done: i <= lastDone }));
  const current = steps.findIndex((s) => !s.done);

  return (
    <ol className="relative grid gap-4 sm:grid-cols-5 sm:gap-2">
      {steps.map((step, i) => (
        <li key={step.label} className="relative flex gap-3 sm:flex-col sm:items-center sm:gap-2 sm:text-center">
          {/* Linia dintre pași: verticală pe telefon, orizontală pe ecran lat. */}
          {i < steps.length - 1 && (
            <span
              aria-hidden
              className={`absolute left-[11px] top-7 h-[calc(100%-4px)] w-0.5 sm:left-[calc(50%+16px)] sm:top-[11px] sm:h-0.5 sm:w-[calc(100%-24px)] ${
                steps[i + 1].done ? 'bg-primary' : 'bg-gray-200'
              }`}
            />
          )}
          <span
            className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              step.done
                ? 'bg-primary text-white'
                : i === current
                  ? 'border-2 border-primary bg-white text-primary-dark'
                  : 'border-2 border-gray-200 bg-white text-gray-400'
            }`}
          >
            {step.done ? '✓' : i + 1}
          </span>
          <span>
            <span className={`block text-sm font-semibold ${step.done || i === current ? 'text-gray-900' : 'text-gray-400'}`}>
              {step.label}
            </span>
            {step.detail && <span className="block text-xs text-gray-500">{step.detail}</span>}
            {step.extra}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Logoul de pe fișa din director sau, fără el, inițialele, ca pe cardurile din director. */
function FirmAvatar({ firm }: { firm: AccountFirm }) {
  if (firm.logo) {
    return (
      <Image
        src={firm.logo}
        alt={`Logo ${firm.name}`}
        width={56}
        height={56}
        className="h-14 w-14 shrink-0 rounded-xl border border-border bg-white object-contain p-1"
      />
    );
  }
  const initials =
    firm.name
      .split(/[\s-]+/)
      .filter((w) => w.length > 1 && w[0] === w[0].toUpperCase())
      .slice(0, 2)
      .map((w) => w[0])
      .join('') || firm.name.slice(0, 1).toUpperCase();
  return (
    <span
      aria-hidden
      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-secondary/15 text-lg font-bold text-secondary"
    >
      {initials}
    </span>
  );
}

type HistoryItem = {
  at: string;
  kind: 'preluare' | 'oferta' | 'raspuns' | 'notita' | 'renuntare';
  text: string;
  noteId?: number;
};

/** Tot ce s-a întâmplat cu o firmă, în ordine: preluarea, ofertele, răspunsurile clientului, notițele, renunțarea. */
function firmHistory(firm: AccountFirm, reports: AccountFirm['reports'], notes: AccountNote[]): HistoryItem[] {
  const items: HistoryItem[] = [{ at: firm.claimedAt, kind: 'preluare', text: 'A preluat cererea și a primit datele dumneavoastră' }];
  for (const o of firm.offers) {
    const extra = [o.valoareFaraTva ? `${lei(o.valoareFaraTva)} fără TVA` : '', o.putereKw ? `${String(o.putereKw).replace('.', ',')} kW` : '']
      .filter(Boolean)
      .join(' · ');
    items.push({ at: o.createdAt, kind: 'oferta', text: `V-a trimis oferta prin platformă${extra ? ` (${extra})` : ''}` });
  }
  for (const r of reports) {
    const label = FIRM_REPORT_OPTIONS.find((o) => o.value === r.status)?.label ?? r.status;
    const motiv = r.motiv ? REFUZ_REASON_OPTIONS.find((o) => o.value === r.motiv)?.label.toLowerCase() : '';
    const extra = motiv || (r.putere ? `${r.putere} kW în contract` : '');
    items.push({ at: r.at, kind: 'raspuns', text: `Ați răspuns: „${label}”${extra ? ` (${extra})` : ''}` });
  }
  for (const n of notes) items.push({ at: n.at, kind: 'notita', text: n.text, noteId: n.id });
  if (firm.withdrawnAt) items.push({ at: firm.withdrawnAt, kind: 'renuntare', text: 'A renunțat la cerere' });
  return items.sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
}

const DOT: Record<HistoryItem['kind'], string> = {
  preluare: 'bg-primary',
  oferta: 'bg-amber-500',
  raspuns: 'bg-secondary',
  notita: 'bg-gray-400',
  renuntare: 'bg-red-500',
};

function FirmCard({
  leadId,
  firm,
  demo,
  open,
  notesReady,
}: {
  leadId: string;
  firm: AccountFirm;
  demo: boolean;
  open: boolean;
  notesReady: boolean;
}) {
  const withdrawn = Boolean(firm.withdrawnAt);
  const [report, setReport] = useState<FirmReport | null>(firm.report);
  const [reports, setReports] = useState(firm.reports);
  const [pending, setPending] = useState<FirmReport | null>(null);
  const [putere, setPutere] = useState('');
  const [motiv, setMotiv] = useState<RefuzReason | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  // Notițele (Radu, 30 oct: „să poată să își lase comments sau notițe”, gen „am vorbit cu X, mi-a zis asta”).
  const [notes, setNotes] = useState<AccountNote[]>(firm.notes);
  const [draft, setDraft] = useState('');
  const [noteBusy, setNoteBusy] = useState(false);
  const [noteMsg, setNoteMsg] = useState<string | null>(null);

  async function save(status: FirmReport) {
    const entry = {
      status,
      at: new Date().toISOString(),
      motiv: status === 'refuzat' ? motiv : null,
      putere: status === 'semnat' && putere.trim() ? putere.trim() : null,
    };
    const done = () => {
      setReport(status);
      setPending(null);
      setReports((r) => [...r, entry]);
    };
    if (demo) {
      done();
      setMsg(DEMO_NOTE);
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      await postJson('/api/cont/firma', {
        leadId,
        claimTs: firm.claimTs,
        status,
        putere: status === 'semnat' ? putere : undefined,
        motiv: status === 'refuzat' ? motiv ?? undefined : undefined,
      });
      done();
      setMsg(status === 'nesunat' ? 'Mulțumim. Am aflat și verificăm cu firma.' : 'Mulțumim, am notat.');
      if (status === 'semnat') window.location.reload();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  // „Am semnat” și „Oferta nu mi-a convenit” cer încă un pas (puterea, motivul), opțional.
  function choose(status: FirmReport) {
    if (status === 'semnat' || status === 'refuzat') setPending(status);
    else void save(status);
  }

  async function addNote() {
    const nota = draft.trim();
    if (!nota) return;
    if (demo) {
      setNotes((n) => [...n, { id: -Date.now(), text: nota, at: new Date().toISOString() }]);
      setDraft('');
      setNoteMsg(DEMO_NOTE);
      return;
    }
    setNoteBusy(true);
    setNoteMsg(null);
    try {
      const json = await postJson('/api/cont/notita', { leadId, claimTs: firm.claimTs, nota });
      setNotes((n) => [...n, json.note as AccountNote]);
      setDraft('');
    } catch (err) {
      setNoteMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setNoteBusy(false);
    }
  }

  async function removeNote(id: number) {
    if (!window.confirm('Ștergeți notița?')) return;
    if (!demo) {
      try {
        const res = await fetch('/api/cont/notita', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ leadId, id }),
        });
        if (!res.ok) throw new Error('Nu am putut șterge notița. Încercați din nou.');
      } catch (err) {
        setNoteMsg(err instanceof Error ? err.message : String(err));
        return;
      }
    }
    setNotes((n) => n.filter((x) => x.id !== id));
  }

  const chip = (active: boolean) =>
    `inline-flex min-h-[40px] items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
      active
        ? 'border-primary bg-primary/10 font-semibold text-gray-900'
        : 'border-gray-300 bg-white text-gray-700 hover:border-primary/60 hover:bg-primary/5'
    }`;

  const history = firmHistory(firm, reports, notes);

  return (
    <li className={`overflow-hidden rounded-xl border ${withdrawn ? 'border-red-200 bg-gray-50' : 'border-border bg-white'}`}>
      <div className="flex flex-wrap items-center gap-4 p-5">
        <div className={withdrawn ? 'opacity-50 grayscale' : undefined}>
          <FirmAvatar firm={firm} />
        </div>
        <div className="min-w-0 flex-1">
          {withdrawn && (
            <span className="mb-1 inline-block rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-red-200">
              A renunțat la cerere
            </span>
          )}
          <p className={`text-lg font-semibold leading-snug ${withdrawn ? 'text-gray-500' : 'text-gray-900'}`}>
            {firm.profileSlug ? (
              <Link href={`/firme/${firm.profileSlug}`} className="hover:underline">
                {firm.name}
              </Link>
            ) : (
              firm.name
            )}
          </p>
          <p className="mt-0.5 text-sm text-gray-500">
            {firm.city ? `${firm.city} · ` : ''}a preluat cererea pe {dayShort(firm.claimedAt)}
            {firm.withdrawnAt && <span className="text-red-700"> · a renunțat pe {dayShort(firm.withdrawnAt)}</span>}
          </p>
        </div>
        {firm.phone && !withdrawn && (
          <a
            href={`tel:${firm.phone.replace(/\s/g, '')}`}
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border-2 border-primary px-4 text-sm font-semibold text-primary-dark hover:bg-primary/5 sm:w-auto"
          >
            <span aria-hidden>📞</span> {firm.phone}
          </a>
        )}
      </div>

      {firm.offers.length > 0 && (
        <div className="mx-5 mb-5 rounded-lg bg-amber-50 px-4 py-3">
          {firm.offers.map((o) => (
            <div key={o.id} className="text-sm">
              <p className="font-semibold text-amber-900">
                Oferta trimisă pe {dayShort(o.createdAt)}
                {o.valoareFaraTva ? ` · ${lei(o.valoareFaraTva)} fără TVA` : ''}
                {o.putereKw ? ` · ${String(o.putereKw).replace('.', ',')} kW` : ''}
              </p>
              {o.mesaj && <p className="mt-1 text-amber-900/80">„{o.mesaj}”</p>}
              <ul className="mt-2 flex flex-wrap gap-2">
                {o.files.map((f, i) => (
                  <li key={i}>
                    <a
                      href={demo ? '#' : `/api/cont/oferta?id=${o.id}&f=${i}`}
                      target={demo ? undefined : '_blank'}
                      rel="noreferrer"
                      onClick={demo ? (e) => (e.preventDefault(), setMsg('Exemplu: în contul real se deschide fișierul ofertei.')) : undefined}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-900 hover:border-amber-400"
                    >
                      <span aria-hidden>📄</span> {f.name}
                      <span className="text-xs text-gray-400">{fileSizeLabel(f.size)}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {open && !withdrawn && (
        <div className="border-t border-border bg-gray-50 px-5 py-4">
          <p className="text-sm font-medium text-gray-800">Ce s-a întâmplat cu această firmă?</p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {FIRM_REPORT_OPTIONS.map((o) => {
              const active = pending ? pending === o.value : report === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  disabled={busy}
                  aria-pressed={active}
                  onClick={() => choose(o.value)}
                  className={chip(active)}
                >
                  {active && (
                    <span aria-hidden className="text-primary-dark">
                      ✓
                    </span>
                  )}
                  {o.label}
                </button>
              );
            })}
          </div>
          {msg && <p className="mt-3 text-sm text-gray-700">{msg}</p>}

          {pending && (
            <div className="mt-4 space-y-4 rounded-lg border border-border bg-white p-4">
              {pending === 'semnat' && (
                <label className="block text-sm font-medium text-gray-800">
                  Puterea din contract <span className="font-normal text-gray-400">(opțional)</span>
                  <span className="mt-1.5 flex items-center gap-1.5 font-normal">
                    <input
                      inputMode="decimal"
                      value={putere}
                      onChange={(e) => setPutere(e.target.value)}
                      className="w-24 rounded-lg border border-border px-2 py-1.5 text-sm"
                      placeholder="ex. 10"
                    />
                    kW
                  </span>
                </label>
              )}
              {pending === 'refuzat' && (
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    De ce? <span className="font-normal text-gray-400">(opțional)</span>
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {REFUZ_REASON_OPTIONS.map((o) => (
                      <button
                        key={o.value}
                        type="button"
                        aria-pressed={motiv === o.value}
                        onClick={() => setMotiv(motiv === o.value ? null : o.value)}
                        className={chip(motiv === o.value)}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <Button size="sm" onClick={() => void save(pending)} disabled={busy}>
                  Confirmați
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setPending(null)}>
                  Renunțați
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="border-t border-border px-5 py-4">
        <p className="text-sm font-medium text-gray-800">Istoric</p>
        <ol className="mt-3 space-y-3">
          {history.map((h, i) => (
            <li key={`${h.kind}-${h.noteId ?? h.at}-${i}`} className="relative flex gap-3">
              {i < history.length - 1 && <span aria-hidden className="absolute left-[4px] top-4 h-[calc(100%+4px)] w-px bg-gray-200" />}
              <span aria-hidden className={`relative mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${DOT[h.kind]}`} />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-500">{dayTime(h.at)}</p>
                {h.kind === 'notita' ? (
                  <div className="mt-1 rounded-lg border border-border bg-white px-3 py-2">
                    <p className="text-xs font-medium text-gray-500">Notița dumneavoastră</p>
                    <p className="mt-0.5 whitespace-pre-line break-words text-sm text-gray-800">{h.text}</p>
                    <button
                      type="button"
                      onClick={() => void removeNote(h.noteId as number)}
                      className="mt-1 text-xs font-medium text-gray-500 hover:text-red-700 hover:underline"
                    >
                      Ștergeți
                    </button>
                  </div>
                ) : (
                  <p
                    className={`text-sm ${
                      h.kind === 'renuntare' ? 'font-semibold text-red-700' : h.kind === 'raspuns' ? 'text-gray-600' : 'text-gray-800'
                    }`}
                  >
                    {h.text}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>

        {notesReady && (
          <>
            <label className="mt-4 block text-sm font-medium text-gray-800">
              Notițele dumneavoastră despre această firmă
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={3}
                maxLength={NOTE_MAX}
                placeholder="De exemplu: am vorbit cu Andrei, mi-a zis că revine luni cu oferta"
                className="mt-1.5 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm font-normal text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
              <Button size="sm" variant="secondary" onClick={() => void addNote()} disabled={noteBusy || !draft.trim()}>
                {noteBusy ? 'Se salvează…' : 'Adăugați notița'}
              </Button>
              <span className="text-xs text-gray-500">Firma nu le vede. Le citim doar noi, ca să vă putem ajuta.</span>
            </div>
            {noteMsg && <p className="mt-2 text-sm text-gray-700">{noteMsg}</p>}
          </>
        )}
      </div>
    </li>
  );
}

/**
 * Pentru cine nu e sunat: întâi îl trimitem să sune chiar el firmele din județ,
 * abia apoi oferim retrimiterea. Altfel omul apasă „încă vreau oferte” și așteaptă
 * la nesfârșit (Radu, 23 oct 2026: „așa o să tot aștepte oamenii oferte”).
 */
/**
 * Pentru cine n-a fost sunat sau n-a primit o ofertă bună. Rămâne în platformă:
 * îl îndemnăm să sune doar firmele care i-au preluat cererea (telefonul e pe card)
 * și îi oferim retrimiterea prin noi, nu lista tuturor firmelor din județ (Radu,
 * 23 oct: „asta ne cam scoate din schemă dacă sună ei direct”). Fără promisiuni:
 * omul nu trebuie lăsat să aștepte la nesfârșit.
 */
function HelpCard({ data, demo }: { data: AccountLeadData; demo: boolean }) {
  const [state, setState] = useState(data.bump);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const active = data.firms.filter((f) => !f.withdrawnAt);
  const noFirm = active.length === 0;
  const refused = !noFirm && active.every((f) => f.report === 'refuzat');
  const withPhone = active.filter((f) => f.phone && f.report === 'nesunat');

  async function bump() {
    if (demo) {
      setMsg(`Exemplu: în contul real, cererea pleacă din nou la firmele din ${data.judet} și din județele vecine.`);
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const json = await postJson('/api/cont/inca-vreau', { leadId: data.id });
      setState((s) => ({ ...s, usedLast7: s.usedLast7 + 1, allowed: s.usedLast7 + 1 < BUMPS_PER_WEEK }));
      setMsg(
        json.firms
          ? `Am trimis-o din nou la ${json.firms} ${json.firms === 1 ? 'firmă' : 'firme'}. Când o preia una, apare aici, cu telefonul ei.`
          : 'Am urcat-o din nou în lista firmelor. Când o preia una, apare aici, cu telefonul ei.',
      );
    } catch (err) {
      setMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  const title = noFirm
    ? data.stats.withdrawn
      ? data.stats.withdrawn === 1
        ? 'Firma care v-a preluat cererea a renunțat'
        : 'Firmele care v-au preluat cererea au renunțat'
      : 'Încă nu v-a preluat nicio firmă cererea'
    : refused
      ? 'Ofertele nu v-au convenit?'
      : 'Firma nu v-a sunat?';
  const body = noFirm
    ? data.stats.withdrawn
      ? `Cererea e din nou pe pagina de cereri, pentru firmele din ${data.judet}. O putem trimite și pe email, din nou, firmelor din ${data.judet} și din județele vecine.`
      : `Firmele din ${data.judet} o văd pe pagina de cereri. O putem trimite și pe email, din nou, firmelor din ${data.judet} și din județele vecine.`
    : refused
      ? `O putem trimite și altor firme din ${data.judet} și din județele vecine, ca să mai primiți oferte.`
      : withPhone.length
        ? `Am aflat și verificăm cu firma. Puteți suna și dumneavoastră: telefonul e mai sus, pe cardul firmei. Sau o trimitem și altor firme din zonă.`
        : `Am aflat și verificăm cu firma. Între timp, o putem trimite și altor firme din ${data.judet} și din județele vecine.`;

  return (
    <section className="rounded-xl border border-border bg-white p-5">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      <p className="mt-1 text-sm text-gray-600">{body}</p>
      {!state.emailWindow ? (
        <p className="mt-3 text-xs text-gray-500">Retrimiterea pe email o facem de luni până vineri, între 8 și 21.</p>
      ) : state.allowed ? (
        <div className="mt-3">
          <Button onClick={() => void bump()} disabled={busy}>
            {busy ? 'Se trimite…' : 'Trimiteți cererea din nou'}
          </Button>
          <p className="mt-1.5 text-xs text-gray-500">
            De {BUMPS_PER_WEEK} ori pe săptămână. Nu vă putem promite că o preia cineva, dar o vede fiecare firmă din zonă.
          </p>
        </div>
      ) : (
        <p className="mt-3 text-xs text-gray-500">
          Am retrimis-o deja de {BUMPS_PER_WEEK} ori săptămâna aceasta
          {state.nextAt ? `; se poate din nou pe ${dayTime(state.nextAt)}` : ''}.
        </p>
      )}
      {msg && <p className="mt-2 text-sm text-gray-700">{msg}</p>}
    </section>
  );
}

function CloseCard({ leadId, firms, demo }: { leadId: string; firms: AccountFirm[]; demo: boolean }) {
  const [mode, setMode] = useState<'none' | 'aleasa' | 'renunt'>('none');
  const [claimTs, setClaimTs] = useState('');
  const [firma, setFirma] = useState('');
  const [motive, setMotive] = useState<string[]>([]);
  const [altceva, setAltceva] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit() {
    if (demo) {
      setMsg('Exemplu: în contul real, cererea se închide și nu mai sunteți contactat.');
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      await postJson(
        '/api/cont/inchide',
        mode === 'aleasa' ? { leadId, kind: 'aleasa', claimTs: claimTs || undefined, firma } : { leadId, kind: 'renunt', motive, altceva },
      );
      window.location.reload();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  const chip = (active: boolean) =>
    `min-h-[40px] rounded-lg border px-3 py-1.5 text-sm ${active ? 'border-primary bg-primary/10 font-semibold text-gray-900' : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'}`;

  return (
    <section className="rounded-xl border border-border bg-white p-5">
      <h2 className="text-base font-semibold text-gray-900">Ați rezolvat?</h2>
      <p className="mt-1 text-sm text-gray-600">Închidem cererea, iar firmele nu vă mai caută.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className={chip(mode === 'aleasa')} onClick={() => setMode('aleasa')}>
          Am ales o firmă
        </button>
        <button type="button" className={chip(mode === 'renunt')} onClick={() => setMode('renunt')}>
          Nu mai fac lucrarea
        </button>
      </div>

      {mode === 'aleasa' && (
        <div className="mt-4 space-y-2">
          {firms.map((f) => (
            <label key={f.claimTs} className="flex items-center gap-2 text-sm text-gray-800">
              <input type="radio" name="aleasa" checked={claimTs === f.claimTs} onChange={() => (setClaimTs(f.claimTs), setFirma(''))} />
              {f.name}
            </label>
          ))}
          <label className="flex items-center gap-2 text-sm text-gray-800">
            <input type="radio" name="aleasa" checked={claimTs === ''} onChange={() => setClaimTs('')} />
            Altă firmă
          </label>
          {claimTs === '' && (
            <input
              value={firma}
              onChange={(e) => setFirma(e.target.value)}
              placeholder="Numele firmei (opțional)"
              className="w-full max-w-sm rounded-lg border border-border px-3 py-2 text-sm"
            />
          )}
        </div>
      )}

      {mode === 'renunt' && (
        <div className="mt-4">
          <p className="text-sm text-gray-700">De ce? (opțional)</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {RENUNT_REASON_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                className={chip(motive.includes(o.value))}
                onClick={() => setMotive((m) => (m.includes(o.value) ? m.filter((x) => x !== o.value) : [...m, o.value]))}
              >
                {o.label}
              </button>
            ))}
          </div>
          <textarea
            value={altceva}
            onChange={(e) => setAltceva(e.target.value)}
            rows={2}
            placeholder="Altceva (opțional)"
            className="mt-2 w-full rounded-lg border border-border px-3 py-2 text-sm"
          />
        </div>
      )}

      {mode !== 'none' && (
        <div className="mt-3">
          <Button variant="secondary" onClick={() => void submit()} disabled={busy}>
            {busy ? 'Se închide…' : 'Închideți cererea'}
          </Button>
        </div>
      )}
      {msg && <p className="mt-2 text-sm text-gray-700">{msg}</p>}
    </section>
  );
}

export default function AccountLeadView({
  data,
  demo = false,
  readyUrl,
}: {
  data: AccountLeadData;
  demo?: boolean;
  /** La „mă informez”: linkul „Sunt gata pentru oferte” (lib/lead-client-token). */
  readyUrl?: string;
}) {
  // Firmele care au renunțat rămân pe pagină, dedesubt (Radu, 30 oct: „să își vadă tot journey-ul”).
  const active = data.firms.filter((f) => !f.withdrawnAt);
  const firms = [...active, ...data.firms.filter((f) => f.withdrawnAt)];
  return (
    <div className="space-y-6">
      <div>
        <Link href={demo ? '#' : '/cont'} className="text-sm text-gray-500 hover:text-gray-900">
          ← Cererile mele
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              data.open ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {data.open ? 'Activă' : data.closedLabel}
          </span>
          <span className="text-xs text-gray-500">trimisă pe {day(data.createdAt)}</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">{capitalize(data.descriere)}</h1>
        <p className="mt-1 text-gray-600">
          {data.localitate ? `${data.localitate}, ` : ''}județul {data.judet}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-white px-5 py-5">
        <ProgressSteps data={data} />
      </div>

      {data.informez && data.open && (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="text-base font-semibold text-amber-900">Deocamdată vă informați</h2>
          <p className="mt-1 text-sm text-amber-900/80">
            Firmele vă urmăresc cererea, dar nu vă sună până nu spuneți că sunteți gata. Când vreți oferte, apăsați butonul.
          </p>
          {readyUrl && (
            <div className="mt-3">
              <Button href={demo ? undefined : readyUrl}>Sunt gata pentru oferte</Button>
            </div>
          )}
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold text-gray-900">Firmele care v-au preluat cererea</h2>
        {firms.length === 0 ? (
          <p className="mt-2 rounded-xl border border-dashed border-border bg-white px-5 py-6 text-sm text-gray-600">
            Încă nicio firmă nu a preluat cererea. Când o preia una, vă trimitem pe email numele și telefonul ei, iar aici
            apare cu tot cu ofertă, dacă o trimite prin noi.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {firms.map((f) => (
              <FirmCard key={f.claimTs} leadId={data.id} firm={f} demo={demo} open={data.open} notesReady={data.notesReady} />
            ))}
          </ul>
        )}
      </section>

      {data.open &&
        !data.informez &&
        (active.length === 0 || active.every((f) => f.report === 'nesunat' || f.report === 'refuzat')) && (
        <HelpCard data={data} demo={demo} />
      )}
      {data.open && <CloseCard leadId={data.id} firms={active} demo={demo} />}

      {data.details.length > 0 && (
        <details className="rounded-xl border border-border bg-white px-5 py-4">
          <summary className="cursor-pointer text-sm font-semibold text-gray-900">Ce ați cerut</summary>
          <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            {data.details.map((d) => (
              <div key={d.label}>
                <dt className="text-gray-500">{d.label}</dt>
                <dd className="text-gray-900">{d.value}</dd>
              </div>
            ))}
          </dl>
        </details>
      )}
    </div>
  );
}
