import { raportWattFirme, wattFirmePornit } from '@/lib/watt-firme';
import { WATT_FIRME_MESAJE_PE_ZI } from '@/lib/watt-firme-shared';
import { AnuntForm, OpresteAnunt } from './AnuntForm';

export const dynamic = 'force-dynamic';

// Watt AI pentru firmele logate (19 nov 2026): ce întreabă firmele și cum
// vorbesc, plus anunțurile care apar în bula lor.

const pct = (a: number, b: number) => (b ? `${Math.round((100 * a) / b)}%` : '–');

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

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('ro-RO', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Bucharest',
  });

export default async function WattFirmePage() {
  const r = await raportWattFirme();
  const pornit = wattFirmePornit();
  const cost = r.conversatii.reduce((s, c) => s + c.costUsd, 0);
  const m = r.masuratori;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Watt AI pentru firme</h1>
        <p className="mt-1 text-sm text-slate-600">
          Bula de jos-stânga, doar pentru firmele logate. Gratuit până pe 10 decembrie, {WATT_FIRME_MESAJE_PE_ZI} mesaje pe zi de
          firmă.{' '}
          <span className={pornit ? 'font-semibold text-emerald-700' : 'font-semibold text-amber-700'}>
            {pornit ? 'Pornită.' : 'Oprită (WATT_FIRME=on pe Vercel o pornește).'}
          </span>
        </p>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="font-semibold text-slate-900">Măsurători</h2>
        <p className="mb-3 text-xs text-slate-500">
          {m.dela ? `De la ${fmt(m.dela)}, când prima firmă a văzut bula.` : 'Nicio firmă n-a văzut încă bula.'}
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Pâlnia (firme)</h3>
            <Rand eticheta="Au văzut bula" valoare={m.firme.auVazut} />
            <Rand eticheta="Au deschis-o" valoare={m.firme.auDeschis} nota={pct(m.firme.auDeschis, m.firme.auVazut)} />
            <Rand eticheta="Au scris" valoare={m.firme.auScris} nota={pct(m.firme.auScris, m.firme.auDeschis)} />
            <Rand eticheta="Au atins limita de 5 pe zi" valoare={m.firme.auAtinsLimita} />
          </div>
          <div>
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Mesaje și calitate</h3>
            <Rand eticheta="Mesaje" valoare={m.mesaje.total} nota={`${m.mesaje.rapide} rapide · ${m.mesaje.scrise} scrise`} />
            <Rand eticheta="Răspunsuri la un anunț" valoare={m.mesaje.laAnunt} />
            <Rand
              eticheta="Note pe răspunsuri"
              valoare={`👍 ${m.note.util} · 👎 ${m.note.nuPrea}`}
              nota={m.mesaje.total ? `${pct(m.note.util + m.note.nuPrea, m.mesaje.total)} din mesaje notate` : undefined}
            />
            <Rand eticheta="Cost" valoare={`${cost.toFixed(2)} $`} nota={m.mesaje.total ? `${(cost / m.mesaje.total).toFixed(3)} $ pe mesaj` : undefined} />
          </div>
          <div>
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Balonul anunțului</h3>
            <Rand eticheta="Afișat (o dată pe firmă și anunț)" valoare={m.balon.afisat} />
            <Rand eticheta="Deschis din balon" valoare={m.balon.deschis} nota={pct(m.balon.deschis, m.balon.afisat)} />
            <Rand eticheta="Închis cu ×" valoare={m.balon.inchis} nota={pct(m.balon.inchis, m.balon.afisat)} />
          </div>
          <div>
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Rezultat</h3>
            <Rand eticheta="Clicuri din Watt spre o cerere sau portal" valoare={m.linkuri} />
            <Rand
              eticheta={`Precalificări deschise pe card, ultimele ${m.precalificare.zile} zile`}
              valoare={m.dela ? m.precalificare.dupa : '–'}
              nota={m.dela ? `față de ${m.precalificare.inainte} în cele ${m.precalificare.zile} zile dinainte` : undefined}
            />
          </div>
        </div>

        {m.peFirma.length > 0 && (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-1.5 pr-3 font-medium">Firma</th>
                  <th className="py-1.5 pr-3 font-medium">Zile cu bula</th>
                  <th className="py-1.5 pr-3 font-medium">Deschideri</th>
                  <th className="py-1.5 pr-3 font-medium">Mesaje</th>
                  <th className="py-1.5 pr-3 font-medium">👍 / 👎</th>
                  <th className="py-1.5 pr-3 font-medium">Clicuri</th>
                  <th className="py-1.5 font-medium">Ultima dată</th>
                </tr>
              </thead>
              <tbody>
                {m.peFirma.map((f) => (
                  <tr key={f.email} className="border-t border-slate-100">
                    <td className="py-1.5 pr-3">
                      <span className="font-medium text-slate-900">{f.numeFirma || f.email}</span>
                      {f.numeFirma && <span className="block text-xs text-slate-500">{f.email}</span>}
                    </td>
                    <td className="py-1.5 pr-3">{f.zileCuBula}</td>
                    <td className="py-1.5 pr-3">{f.deschideri}</td>
                    <td className="py-1.5 pr-3">{f.mesaje}</td>
                    <td className="py-1.5 pr-3">
                      {f.util} / {f.nuPrea}
                    </td>
                    <td className="py-1.5 pr-3">{f.linkuri}</td>
                    <td className="py-1.5 text-xs text-slate-500">{fmt(f.ultima)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 font-semibold text-slate-900">Anunț nou în bulă</h2>
        <AnuntForm />
        {r.anunturi.length > 0 && (
          <ul className="mt-4 space-y-2 border-t border-slate-100 pt-3">
            {r.anunturi.map((a) => (
              <li key={a.id} className="text-sm">
                <span className={a.activ ? 'font-semibold text-emerald-700' : 'text-slate-400'}>
                  {a.activ ? 'Activ' : 'Oprit'}
                </span>{' '}
                · {fmt(a.createdAt)} · văzut de {a.vazut} {a.vazut === 1 ? 'firmă' : 'firme'} · au răspuns {a.raspunsuri}
                {a.activ && (
                  <>
                    {' '}
                    · <OpresteAnunt id={a.id} />
                  </>
                )}
                <p className="mt-0.5 text-slate-700">{a.text}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-slate-900">Conversațiile firmelor</h2>
        {r.conversatii.length === 0 && <p className="text-sm text-slate-500">Nicio firmă n-a scris încă.</p>}
        {r.conversatii.map((c) => (
          <details key={c.email} className="rounded-lg border border-slate-200 bg-white">
            <summary className="cursor-pointer px-4 py-3">
              <span className="font-medium text-slate-900">{c.numeFirma || c.email}</span>
              <span className="ml-2 text-xs text-slate-500">
                {c.email} · {c.mesaje.filter((m) => m.rol === 'firma').length} mesaje · ultima {fmt(c.updatedAt)} ·{' '}
                {c.costUsd.toFixed(3)} $
              </span>
            </summary>
            <div className="space-y-2 border-t border-slate-100 px-4 py-4">
              {c.mesaje.map((m, i) => (
                <div key={i} className={m.rol === 'firma' ? 'flex justify-end' : 'flex'}>
                  <p
                    className={`max-w-[80%] whitespace-pre-line rounded-xl px-3 py-2 text-sm ${
                      m.rol === 'firma'
                        ? 'bg-amber-500 text-white'
                        : m.anunt
                          ? 'border border-amber-200 bg-amber-50 text-slate-800'
                          : 'border border-slate-200 bg-slate-50 text-slate-800'
                    }`}
                  >
                    {m.anunt && <span className="mb-1 block text-[10px] font-semibold uppercase text-amber-700">Anunț</span>}
                    {m.text}
                    <span className={`mt-1 block text-[10px] ${m.rol === 'firma' ? 'text-amber-100' : 'text-slate-400'}`}>
                      {fmt(m.la)}
                      {m.unelte?.length ? ` · unelte: ${m.unelte.join(', ')}` : ''}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          </details>
        ))}
      </section>
    </div>
  );
}
