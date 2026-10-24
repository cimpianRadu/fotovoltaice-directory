import Link from 'next/link';
import AccountLeadView from '@/components/cont/AccountLeadView';
import { db } from '@/lib/db';
import {
  clientAccountLive,
  clientEmailsLive,
  clientOffersLive,
  getClientCards,
  getExperimentFunnel,
  EXPERIMENT_VERDICT,
  inMessagingWindow,
  type ExperimentFunnel,
  type ClientCard,
  type AccountLeadData,
} from '@/lib/client-account';
import ClientCards from './ClientCards';
import { claimEmail, confirmationEmail, invitationEmail, loginCodeEmail, offerEmail, offerOpenedFirmEmail } from '@/lib/email-cont';
import { OFFER_PILOT_FIRMS } from '@/lib/oferte';

export const dynamic = 'force-dynamic';

/**
 * Contul clientului, văzut din admin (23 oct 2026): dacă e pornit, cum arată
 * pentru client (pe date inventate), emailurile noi și ce s-a strâns în Neon:
 * conturi, click-uri pe cereri, retrimiteri, răspunsuri pe firme, oferte.
 */

const when = (iso: string) =>
  new Date(iso).toLocaleString('ro-RO', { timeZone: 'Europe/Bucharest', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

// Datele de exemplu: o cerere inventată, cu două firme inventate. Nimic real.
const DEMO_LEAD = {
  timestamp: '2026-10-20T08:15:00.000Z',
  numeContact: 'Andrei Popescu',
  numeCompanie: '',
  email: 'andrei@exemplu.ro',
  judet: 'Prahova',
  localitate: 'Câmpina',
  tipLucrare: 'sistem-nou',
  putere: '10',
};

const DEMO_DATA: AccountLeadData = {
  id: DEMO_LEAD.timestamp,
  createdAt: DEMO_LEAD.timestamp,
  descriere: 'sistem fotovoltaic de 10 kW',
  judet: 'Prahova',
  localitate: 'Câmpina',
  open: true,
  closedLabel: null,
  numeContact: 'Andrei Popescu',
  informez: false,
  won: false,
  details: [
    { label: 'Tip clădire', value: 'Casă individuală' },
    { label: 'Lucrare', value: 'Sistem fotovoltaic nou (panouri + invertor)' },
    { label: 'Putere', value: '10 kW' },
    { label: 'Când', value: 'Cât mai repede' },
    { label: 'Finanțare', value: 'Fonduri proprii' },
  ],
  firms: [
    {
      claimTs: 'demo-1',
      name: 'Exemplu Solar SRL',
      phone: '0700 000 001',
      profileSlug: null,
      city: 'Ploiești',
      claimedAt: '2026-10-20T10:40:00.000Z',
      report: 'oferta',
      reportedAt: '2026-10-22T17:05:00.000Z',
      offers: [
        {
          id: 0,
          claimTs: 'demo-1',
          firmName: 'Exemplu Solar SRL',
          createdAt: '2026-10-22T09:30:00.000Z',
          files: [{ name: 'Oferta-10kW-Campina.pdf', size: 1_240_000, contentType: 'application/pdf' }],
          valoareFaraTva: 31_500,
          putereKw: 10,
          mesaj: 'Am inclus și varianta cu baterie de 10 kWh, pe pagina 3.',
          clientOpenedAt: '2026-10-22T18:12:00.000Z',
        },
      ],
    },
    {
      claimTs: 'demo-2',
      name: 'Demo Energie Verde',
      phone: null,
      profileSlug: null,
      city: null,
      claimedAt: '2026-10-21T08:05:00.000Z',
      report: null,
      reportedAt: null,
      offers: [],
    },
  ],
  stats: { sentTo: 6, clickVisitors: 9, claimed: 2 },
  bump: { allowed: true, usedLast7: 0, nextAt: null, lastAt: null, emailWindow: true },
};

// Aceeași cerere, înainte să o preia cineva: atunci apare îndemnul să sune singur.
const DEMO_DATA_EMPTY: AccountLeadData = {
  ...DEMO_DATA,
  firms: [],
  stats: { sentTo: 4, clickVisitors: 3, claimed: 0 },
};

const LINK = 'https://instalatori-fotovoltaice.ro/cont/intrare?t=exemplu';

async function overview() {
  const q = db();
  const [accounts, clicks7, topClicked, sends, bumps, reports, offers] = await Promise.all([
    q`SELECT count(*)::int AS total, count(verified_at)::int AS verified, count(deleted_at)::int AS deleted FROM client_accounts`,
    q`SELECT count(*)::int AS n, count(DISTINCT lead_id)::int AS leads FROM lead_clicks WHERE first_at > now() - interval '7 days'`,
    q`SELECT lead_id, count(DISTINCT visitor)::int AS visitors, count(*) FILTER (WHERE kind = 'vreau')::int AS vreau,
             count(DISTINCT firm_email)::int AS firms
      FROM lead_clicks GROUP BY lead_id ORDER BY visitors DESC LIMIT 10`,
    q`SELECT kind, count(*)::int AS n FROM lead_sends GROUP BY kind`,
    q`SELECT lead_id, at, firms_notified FROM lead_bumps ORDER BY at DESC LIMIT 10`,
    q`SELECT lead_id, firm_name, status, created_at FROM client_firm_reports ORDER BY created_at DESC LIMIT 15`,
    q`SELECT o.id, o.lead_id, o.firm_name, o.created_at, o.valoare_fara_tva, o.putere_kw,
             (SELECT min(at) FROM offer_views v WHERE v.offer_id = o.id AND v.viewer = 'client') AS opened
      FROM offers o WHERE o.withdrawn_at IS NULL ORDER BY o.created_at DESC LIMIT 15`,
  ]);
  return { accounts: accounts[0], clicks7: clicks7[0], topClicked, sends, bumps, reports, offers };
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <p className="text-2xl font-bold tabular-nums text-slate-900">{value}</p>
      <p className="mt-0.5 text-xs text-slate-500">{label}</p>
    </div>
  );
}

function EmailPreview({ title, email }: { title: string; email: { subject: string; html: string } }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-4 py-2">
        <p className="text-xs text-slate-500">{title}</p>
        <p className="text-sm font-semibold text-slate-900">{email.subject}</p>
      </div>
      <iframe title={title} srcDoc={email.html} className="h-[520px] w-full rounded-b-xl" sandbox="" />
    </div>
  );
}

export default async function ContClientAdminPage() {
  const live = clientAccountLive();
  const emailsOn = clientEmailsLive();
  const offersOn = clientOffersLive();
  const windowOpen = inMessagingWindow();
  let data: Awaited<ReturnType<typeof overview>> | null = null;
  let cards: ClientCard[] = [];
  let funnel: ExperimentFunnel | null = null;
  let dbError = '';
  try {
    [data, cards, funnel] = await Promise.all([overview(), getClientCards(), getExperimentFunnel()]);
  } catch (err) {
    dbError = err instanceof Error ? err.message : String(err);
  }
  const firm = { name: 'Exemplu Solar SRL', city: 'Ploiești', phone: '0700 000 001', profileSlug: null };

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-900">Clienții și pagina cererii</h1>
      <p className="mt-2 max-w-3xl text-sm text-slate-600">
        Fiecare om care trimite o cerere are automat o pagină a ei, gratuită și fără parolă. Aici vezi, pe fiecare client,
        dacă și-a deschis pagina, când a fost ultima dată, ce a făcut acolo și cum arată pagina pentru client.
      </p>

      {dbError && (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800">
          Baza de date nu răspunde ({dbError}).
        </p>
      )}

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-slate-900">Clienții din ultimele 30 de zile</h2>
        <ClientCards cards={cards} windowOpen={windowOpen} />
      </section>

      {funnel && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-slate-900">
            Experiment · verdict pe {EXPERIMENT_VERDICT.split('-').reverse().join('.')}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Cereri distincte de la {when(funnel.since)}, fără cele de test. Procentul e din cererile noi.
          </p>
          <div className="mt-2 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <ol className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white text-sm">
              {funnel.steps.map((st) => {
                const base = funnel.steps[0].leads;
                const pct = base ? Math.round((st.leads / base) * 100) : 0;
                return (
                  <li key={st.key} className="flex items-center gap-3 px-3 py-2">
                    <span className="w-56 shrink-0 text-slate-700">{st.label}</span>
                    <span className="h-2 flex-1 rounded-full bg-slate-100">
                      <span className="block h-2 rounded-full bg-amber-500" style={{ width: `${Math.min(100, pct)}%` }} />
                    </span>
                    <span className="w-20 text-right tabular-nums text-slate-900">
                      {st.leads}
                      {st.key !== 'cereri' && base ? <span className="text-slate-400"> · {pct}%</span> : null}
                    </span>
                  </li>
                );
              })}
              <li className="px-3 py-2 text-xs text-slate-500">
                Răspunsuri „nu m-a sunat”: {funnel.nesunat} cereri · „oferta nu mi-a convenit”: {funnel.refuzat} cereri
              </li>
            </ol>
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">Regula de decizie, fixată pe 24 oct</p>
              <p className="mt-1 text-xs text-slate-500">
                „Folosit” = cererea are un răspuns despre o firmă sau o revenire în altă zi. Pragul de 1 din 5 e rata de
                răspuns de acum la emailurile către clienți (6 din 33 și 3 din 10).
              </p>
              <ul className="mt-2 space-y-1.5">
                <li>
                  <strong>Cel puțin 1 din 5</strong> cereri noi folosite: contul merge; păstrăm și construim peste el.
                </li>
                <li>
                  <strong>Între 1 din 10 și 1 din 5</strong>: pornim emailurile (dacă nu sunt pornite) și mai măsurăm 2
                  săptămâni.
                </li>
                <li>
                  <strong>Sub 1 din 10</strong>: oamenii nu revin singuri. Devenim mai agresivi: email de revenire la 2-3 zile
                  („V-a sunat firma X?”), cu butoanele direct în email.
                </li>
              </ul>
            </div>
          </div>
        </section>
      )}

      <details className="mt-8 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <summary className="cursor-pointer text-sm font-semibold text-slate-900">Comutatoare: ce e pornit</summary>
      <ul className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white text-sm">
        {[
          {
            on: live,
            name: 'CLIENT_ACCOUNT',
            what: 'Contul se vede: butonul „Urmăriți cererea” după formular, pagina cererii.',
          },
          {
            on: emailsOn,
            name: 'CLIENT_EMAILS',
            what: `Emailurile către clienți. Confirmarea și codul pleacă imediat; anunțurile și emailurile către firme doar luni–vineri, 08–21 (acum: ${
              windowOpen ? 'în fereastră' : 'în afara ferestrei, pleacă la prima dimineață lucrătoare'
            }).`,
          },
          { on: offersOn, name: 'CLIENT_OFFERS', what: 'Firmele din pilot pot trimite oferte din portal.' },
        ].map((sw) => (
          <li key={sw.name} className="flex items-start gap-3 px-4 py-2.5">
            <span
              className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                sw.on ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'
              }`}
            >
              {sw.on ? 'pornit' : 'oprit'}
            </span>
            <span>
              <code className="text-xs">{sw.name}=on</code> <span className="text-slate-600">{sw.what}</span>
            </span>
          </li>
        ))}
      </ul>

      </details>

      <details className="mt-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <summary className="cursor-pointer text-sm font-semibold text-slate-900">
          Mai multe cifre: click-uri pe cereri, răspunsuri, oferte, retrimiteri
        </summary>
      {data && (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="conturi (din cereri)" value={data.accounts.total} />
            <Stat label="conturi în care s-a intrat" value={data.accounts.verified} />
            <Stat label="click-uri pe cereri, 7 zile" value={data.clicks7.n} />
            <Stat label="cereri cu click-uri, 7 zile" value={data.clicks7.leads} />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section>
              <h2 className="text-sm font-semibold text-slate-900">Cele mai apăsate cereri</h2>
              <table className="mt-2 w-full rounded-xl border border-slate-200 bg-white text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500">
                    <th className="px-3 py-2 font-medium">Cererea</th>
                    <th className="px-3 py-2 text-right font-medium" title="un vizitator pe zi">Apăsări</th>
                    <th className="px-3 py-2 text-right font-medium">„Vreau”</th>
                    <th className="px-3 py-2 text-right font-medium">Firme logate</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topClicked.map((r) => (
                    <tr key={String(r.lead_id)} className="border-t border-slate-100">
                      <td className="px-3 py-1.5">
                        <Link href={`/cereri?cerere=${encodeURIComponent(String(r.lead_id))}`} className="underline">
                          {when(String(r.lead_id))}
                        </Link>
                      </td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{r.visitors}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{r.vreau}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{r.firms}</td>
                    </tr>
                  ))}
                  {!data.topClicked.length && (
                    <tr>
                      <td colSpan={4} className="px-3 py-3 text-slate-500">Niciun click încă.</td>
                    </tr>
                  )}
                </tbody>
              </table>
              <p className="mt-2 text-xs text-slate-500">
                Emailuri cu cereri către firme, de la 23 oct:{' '}
                {data.sends.map((s) => `${s.kind} ${s.n}`).join(' · ') || 'niciunul încă'}
              </p>
            </section>

            <section>
              <h2 className="text-sm font-semibold text-slate-900">Ce spun clienții despre firme</h2>
              <ul className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white text-sm">
                {data.reports.map((r, i) => (
                  <li key={i} className="px-3 py-1.5">
                    <span className="text-slate-400">{when(String(r.created_at))} · </span>
                    {String(r.firm_name)}: <strong>{String(r.status)}</strong>
                  </li>
                ))}
                {!data.reports.length && <li className="px-3 py-3 text-slate-500">Niciun răspuns încă.</li>}
              </ul>
              <h2 className="mt-5 text-sm font-semibold text-slate-900">
                Oferte prin platformă <span className="font-normal text-slate-500">· pilot: {OFFER_PILOT_FIRMS.join(', ')}</span>
              </h2>
              <ul className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white text-sm">
                {data.offers.map((o) => (
                  <li key={String(o.id)} className="px-3 py-1.5">
                    <span className="text-slate-400">{when(String(o.created_at))} · </span>
                    {String(o.firm_name)}
                    {o.valoare_fara_tva ? ` · ${Number(o.valoare_fara_tva).toLocaleString('ro-RO')} lei` : ''}
                    {o.putere_kw ? ` · ${o.putere_kw} kW` : ''} ·{' '}
                    {o.opened ? <span className="text-emerald-700">deschisă {when(String(o.opened))}</span> : 'nedeschisă'}
                  </li>
                ))}
                {!data.offers.length && <li className="px-3 py-3 text-slate-500">Nicio ofertă încă.</li>}
              </ul>
              <h2 className="mt-5 text-sm font-semibold text-slate-900">„Încă vreau oferte”</h2>
              <ul className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white text-sm">
                {data.bumps.map((b, i) => (
                  <li key={i} className="px-3 py-1.5">
                    <span className="text-slate-400">{when(String(b.at))} · </span>
                    cererea {when(String(b.lead_id))}, retrimisă la {b.firms_notified} firme
                  </li>
                ))}
                {!data.bumps.length && <li className="px-3 py-3 text-slate-500">Nicio retrimitere încă.</li>}
              </ul>
            </section>
          </div>
        </>
      )}

      </details>

      <details className="mt-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
        <summary className="cursor-pointer text-sm font-semibold text-slate-900">Exemple pe date inventate: pagina și emailurile</summary>
      <section className="mt-10">
        <h2 className="text-sm font-semibold text-slate-900">Așa vede clientul cererea (date inventate)</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Butoanele merg, dar nu salvează nimic. Firma „Exemplu Solar” are o ofertă trimisă prin platformă; „Demo Energie
          Verde” nu e în director, deci nu are telefon public.
        </p>
        <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 sm:p-8">
          <div className="mx-auto max-w-3xl">
            <AccountLeadView data={DEMO_DATA} demo />
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold text-slate-900">Aceeași cerere, înainte să o preia o firmă</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Clientul nu e trimis la firmele din director (ar ieși din platformă): poate cere retrimiterea prin noi, de 2
          ori pe săptămână, fără promisiunea că o preia cineva.
        </p>
        <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 sm:p-8">
          <div className="mx-auto max-w-3xl">
            <AccountLeadView data={DEMO_DATA_EMPTY} demo />
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold text-slate-900">Emailurile noi (date inventate)</h2>
        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          <EmailPreview title="Invitația în cont (o trimiți tu, din cardul clientului)" email={invitationEmail(DEMO_LEAD, LINK)} />
          <EmailPreview title="1. La trimiterea cererii (nu la „mă informez”)" email={confirmationEmail(DEMO_LEAD, LINK)} />
          <EmailPreview title="2. Când o firmă preia cererea" email={claimEmail(DEMO_LEAD, firm, LINK)} />
          <EmailPreview title="3. Când firma trimite oferta prin platformă" email={offerEmail(DEMO_LEAD, firm.name, LINK)} />
          <EmailPreview title="4. Codul de intrare cerut din /cont" email={loginCodeEmail('482913', LINK)} />
          <EmailPreview
            title="5. Către firmă, când clientul îi deschide oferta"
            email={offerOpenedFirmEmail({
              firmName: firm.name,
              judet: 'Prahova',
              descriere: 'sistem fotovoltaic de 10 kW',
              openedAt: '2026-10-22T18:12:00.000Z',
            })}
          />
        </div>
      </section>
      </details>
    </div>
  );
}
