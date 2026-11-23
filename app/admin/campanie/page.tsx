import {
  CAMPANIE_TINTA,
  PASI,
  getCampanie,
  metrici,
  urmatorul,
  type FirmaCampanie,
  type Pas,
} from '@/lib/campanie-furnizori';
import ActiuniFirma from './ActiuniFirma';

export const dynamic = 'force-dynamic';

// Campania de parteneri furnizori (23 nov 2026): câte emailuri, câte răspunsuri,
// câți au semnat, ca să se vadă dacă merită continuată. Follow-up-urile le
// trimite rutina locală din Chrome (contact@), la 3, 7 și 10 zile; o firmă care
// răspunde se oprește până decide Radu aici.

const pct = (a: number, b: number) => (b ? `${Math.round((100 * a) / b)}%` : '–');

const ziua = (d: string | null) =>
  d ? new Date(`${d}T12:00:00Z`).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' }) : '';

const PAS_ETICHETA: Record<'email' | Pas, string> = {
  email: 'primul email',
  fu1: 'follow-up 1',
  fu2: 'follow-up 2',
  fu3: 'follow-up 3',
};

const STATUS: Record<string, { label: string; cls: string }> = {
  activ: { label: 'Activ', cls: 'bg-blue-50 text-blue-800' },
  a_raspuns: { label: 'A răspuns: decizi tu', cls: 'bg-amber-100 text-amber-900 font-semibold' },
  oprit: { label: 'Oprit', cls: 'bg-slate-100 text-slate-600' },
  respins: { label: 'Adresă respinsă', cls: 'bg-red-50 text-red-700' },
  semnat: { label: 'Semnat', cls: 'bg-emerald-100 text-emerald-800 font-semibold' },
  refuzat: { label: 'Refuzat', cls: 'bg-slate-100 text-slate-600' },
  manual: { label: 'Manual', cls: 'bg-slate-100 text-slate-600' },
};

function Rand({ eticheta, valoare, nota }: { eticheta: string; valoare: string | number; nota?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-slate-100 py-1.5 text-sm last:border-0">
      <span className="text-slate-600">{eticheta}</span>
      <span className="text-right">
        <span className="font-semibold text-slate-900">{valoare}</span>
        {nota && <span className="ml-1.5 text-xs text-slate-500">{nota}</span>}
      </span>
    </div>
  );
}

function Mesaje({ f }: { f: FirmaCampanie }) {
  const next = urmatorul(f);
  return (
    <div className="space-y-0.5 text-xs text-slate-600">
      <div>Primul email: {ziua(f.primulEmail)}</div>
      {PASI.filter((p) => f.trimis[p]).map((p) => (
        <div key={p}>
          {PAS_ETICHETA[p]}: {ziua(f.trimis[p])}
        </div>
      ))}
      {next && (
        <div className="text-slate-500">
          Urmează {PAS_ETICHETA[next.pas]}: {ziua(next.data)}
        </div>
      )}
    </div>
  );
}

export default async function CampaniePage() {
  let firme: FirmaCampanie[] = [];
  let eroare = '';
  try {
    firme = await getCampanie();
  } catch (e) {
    eroare = e instanceof Error ? e.message : String(e);
  }
  const m = metrici(firme);
  const deDecis = firme.filter((f) => f.status === 'a_raspuns');

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Campanie parteneri furnizori</h1>
        <p className="mt-1 text-sm text-slate-600">
          Magazine și distribuitori de echipamente, propunere Premium 79 €/lună. Follow-up-urile pleacă singure din
          contact@ la 3, 7 și 10 zile; când o firmă răspunde, se oprește până decizi aici.
        </p>
      </div>

      {eroare && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Nu s-a putut citi baza: {eroare}
        </p>
      )}

      {deDecis.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>De decis:</strong> {deDecis.map((f) => f.firma).join(', ')} {deDecis.length === 1 ? 'a' : 'au'}{' '}
          răspuns. Citește răspunsul în contact@, apoi alege mai jos.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Rezultat</h2>
          <Rand eticheta="Parteneri semnați" valoare={`${m.parteneri} / ${CAMPANIE_TINTA}`} nota="ținta" />
          <Rand eticheta="Firme contactate de noi" valoare={m.contactate} />
          <Rand eticheta="Au răspuns" valoare={m.auRaspuns} nota={pct(m.auRaspuns, m.contactate)} />
          <Rand eticheta="Au semnat" valoare={m.semnate} nota={pct(m.semnate, m.contactate)} />
          <Rand eticheta="Au refuzat" valoare={m.refuzate} />
          <Rand eticheta="Fără răspuns după toate follow-up-urile" valoare={m.faraRaspunsLaFinal} />
          <Rand eticheta="Adrese respinse" valoare={m.respinse} />
        </section>
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Emailuri</h2>
          <Rand eticheta="Emailuri trimise" valoare={m.emailuriTrimise} nota={`din care ${m.followUpTrimise} follow-up`} />
          <Rand eticheta="În curs (follow-up-uri de trimis)" valoare={m.inCurs} />
          <p className="mb-1 mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            După ce mesaj au răspuns
          </p>
          {(['email', ...PASI] as const).map((p) => (
            <Rand
              key={p}
              eticheta={PAS_ETICHETA[p]}
              valoare={m.raspunsuriPePas[p]}
              nota={pct(m.raspunsuriPePas[p], m.auRaspuns)}
            />
          ))}
        </section>
      </div>

      <section className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Firmă</th>
              <th className="px-3 py-2">Mesaje</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Acțiuni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {firme.map((f) => {
              const st = STATUS[f.status] ?? { label: f.status, cls: 'bg-slate-100 text-slate-600' };
              return (
                <tr key={f.id} className={f.status === 'a_raspuns' ? 'bg-amber-50/50' : ''}>
                  <td className="px-3 py-2 align-top">
                    <div className="font-semibold text-slate-900">{f.firma}</div>
                    <div className="text-xs text-slate-500">{f.email}</div>
                    {f.sursa === 'inbound' && <div className="text-[11px] text-slate-500">ne-a scris ea</div>}
                    {f.nota && <div className="mt-1 text-[11px] text-slate-500">{f.nota}</div>}
                  </td>
                  <td className="px-3 py-2 align-top">
                    <Mesaje f={f} />
                  </td>
                  <td className="px-3 py-2 align-top">
                    <span className={`inline-block rounded px-2 py-0.5 text-xs ${st.cls}`}>{st.label}</span>
                    {f.raspunsLa && (
                      <div className="mt-1 text-[11px] text-slate-500">
                        răspuns {ziua(f.raspunsLa)}
                        {f.raspunsDupa ? `, după ${PAS_ETICHETA[f.raspunsDupa]}` : ''}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 align-top">
                    <ActiuniFirma id={f.id} status={f.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
