'use client';

import { useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { FIRM_REPORT_OPTIONS, BUMPS_PER_WEEK, type FirmReport } from '@/lib/client-account-shared';
import { RENUNT_REASON_OPTIONS } from '@/lib/client-response-details';
import { fileSizeLabel } from '@/lib/oferte-shared';
import type { AccountLeadData, AccountFirm } from '@/lib/client-account';

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

function Stat({ value, label, hint }: { value: string; label: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-white px-4 py-3">
      <p className="text-2xl font-bold tabular-nums text-gray-900">{value}</p>
      <p className="mt-0.5 text-sm text-gray-600">{label}</p>
      {hint && <p className="mt-0.5 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function FirmCard({ leadId, firm, demo, open }: { leadId: string; firm: AccountFirm; demo: boolean; open: boolean }) {
  const [report, setReport] = useState<FirmReport | null>(firm.report);
  const [pending, setPending] = useState<FirmReport | null>(null);
  const [putere, setPutere] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save(status: FirmReport) {
    if (demo) {
      setReport(status);
      setPending(null);
      setMsg(DEMO_NOTE);
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      await postJson('/api/cont/firma', { leadId, claimTs: firm.claimTs, status, putere: status === 'semnat' ? putere : undefined });
      setReport(status);
      setPending(null);
      setMsg(status === 'nesunat' ? 'Mulțumim. Am aflat și verificăm cu firma.' : 'Mulțumim, am notat.');
      if (status === 'semnat') window.location.reload();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  function choose(status: FirmReport) {
    if (status === 'semnat') setPending('semnat');
    else void save(status);
  }

  return (
    <li className="rounded-xl border border-border bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold text-gray-900">
            {firm.profileSlug ? (
              <Link href={`/firme/${firm.profileSlug}`} className="hover:underline">
                {firm.name}
              </Link>
            ) : (
              firm.name
            )}
          </p>
          <p className="text-sm text-gray-500">
            {firm.city ? `${firm.city} · ` : ''}a preluat cererea pe {dayShort(firm.claimedAt)}
          </p>
        </div>
        {firm.phone && (
          <a
            href={`tel:${firm.phone.replace(/\s/g, '')}`}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border-2 border-primary px-4 text-sm font-semibold text-primary-dark hover:bg-primary/5"
          >
            <span aria-hidden>📞</span> {firm.phone}
          </a>
        )}
      </div>

      {firm.offers.length > 0 && (
        <div className="mt-4 rounded-lg bg-amber-50 px-4 py-3">
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

      {open && (
        <div className="mt-4 border-t border-border pt-4">
          <p className="text-sm font-medium text-gray-800">Ce s-a întâmplat cu această firmă?</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {FIRM_REPORT_OPTIONS.map((o) => {
              const active = report === o.value || pending === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  disabled={busy}
                  aria-pressed={active}
                  onClick={() => choose(o.value)}
                  className={`min-h-[40px] rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                    active ? 'border-primary bg-primary/10 font-semibold text-gray-900' : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
          {pending === 'semnat' && (
            <div className="mt-3 flex flex-wrap items-end gap-2">
              <label className="text-sm text-gray-700">
                Puterea din contract (opțional)
                <span className="mt-1 flex items-center gap-1">
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
              <Button size="sm" onClick={() => void save('semnat')} disabled={busy}>
                Confirmați
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setPending(null)}>
                Renunțați
              </Button>
            </div>
          )}
          {firm.reportedAt && !msg && (
            <p className="mt-2 text-xs text-gray-400">Ultimul răspuns: {dayTime(firm.reportedAt)}</p>
          )}
          {msg && <p className="mt-2 text-sm text-gray-600">{msg}</p>}
        </div>
      )}
    </li>
  );
}

function BumpCard({ leadId, data, demo }: { leadId: string; data: AccountLeadData; demo: boolean }) {
  const [state, setState] = useState(data.bump);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const left = BUMPS_PER_WEEK - state.usedLast7;

  async function bump() {
    if (demo) {
      setMsg(`Exemplu: în contul real, cererea urcă în capul listei și pleacă din nou la firmele din ${data.judet} și din județele vecine.`);
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const json = await postJson('/api/cont/inca-vreau', { leadId });
      setState((s) => ({ ...s, usedLast7: s.usedLast7 + 1, allowed: s.usedLast7 + 1 < BUMPS_PER_WEEK, lastAt: new Date().toISOString() }));
      setMsg(
        json.firms
          ? `Gata. Cererea e din nou în capul listei și am trimis-o la ${json.firms} ${json.firms === 1 ? 'firmă' : 'firme'}.`
          : 'Gata. Cererea e din nou în capul listei pentru firmele care caută lucrări.',
      );
    } catch (err) {
      setMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-white p-5">
      <h2 className="text-base font-semibold text-gray-900">Încă așteptați oferte?</h2>
      <p className="mt-1 text-sm text-gray-600">
        Urcăm cererea în capul listei și o trimitem din nou firmelor din {data.judet} și din județele vecine. Puteți
        apăsa de {BUMPS_PER_WEEK} ori pe săptămână.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button onClick={() => void bump()} disabled={busy || !state.allowed}>
          {busy ? 'Se trimite…' : 'Încă vreau oferte'}
        </Button>
        <span className="text-xs text-gray-500">
          {state.allowed
            ? `${left} ${left === 1 ? 'apăsare rămasă' : 'apăsări rămase'} săptămâna aceasta`
            : state.nextAt
              ? `Butonul revine pe ${dayTime(state.nextAt)}`
              : ''}
        </span>
      </div>
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

      <div className="grid gap-3 sm:grid-cols-3">
        {data.stats.sentTo > 0 ? (
          <Stat value={String(data.stats.sentTo)} label={data.stats.sentTo === 1 ? 'firmă a primit-o pe email' : 'firme au primit-o pe email'} />
        ) : (
          <Stat value="✓" label="Publicată pentru firme" hint="pe pagina de cereri a instalatorilor" />
        )}
        <Stat
          value={String(data.stats.clickVisitors)}
          label={data.stats.clickVisitors === 1 ? 'instalator a apăsat pe ea' : 'instalatori au apăsat pe ea'}
          hint="pe pagina de cereri pentru instalatori"
        />
        <Stat value={String(data.stats.claimed)} label={data.stats.claimed === 1 ? 'firmă a preluat-o' : 'firme au preluat-o'} hint="maximum 3" />
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
        {data.firms.length === 0 ? (
          <p className="mt-2 rounded-xl border border-dashed border-border bg-white px-5 py-6 text-sm text-gray-600">
            Încă nicio firmă nu a preluat cererea. Când o preia una, vă trimitem pe email numele și telefonul ei, iar aici
            apare cu tot cu ofertă, dacă o trimite prin noi.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {data.firms.map((f) => (
              <FirmCard key={f.claimTs} leadId={data.id} firm={f} demo={demo} open={data.open} />
            ))}
          </ul>
        )}
      </section>

      {data.open && !data.informez && <BumpCard leadId={data.id} data={data} demo={demo} />}
      {data.open && <CloseCard leadId={data.id} firms={data.firms} demo={demo} />}

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
