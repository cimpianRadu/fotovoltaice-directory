import { raportAsistent, type RaportConversatie } from '@/lib/asistent';
import { getWorkTypeShort } from '@/lib/utils-shared';

export const dynamic = 'force-dynamic';

// Watt AI (pilot 12 nov 2026): toate conversațiile, cu transcriptul întreg,
// ce a salvat asistentul, ce firme au văzut rezumatul și ce note au dat.
// Aceleași cifre ca raportul de luni, pe fereastra aleasă (`?zile=`, implicit 30).
// `?lead=` deschide direct conversația din linkul din email.

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('ro-RO', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Bucharest',
  });

function Cifra({ eticheta, valoare }: { eticheta: string; valoare: string | number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <div className="text-xl font-bold text-slate-900">{valoare}</div>
      <div className="text-xs text-slate-500">{eticheta}</div>
    </div>
  );
}

function Conversatie({ c, deschisa }: { c: RaportConversatie; deschisa: boolean }) {
  const x = c.cerere;
  const titlu = [
    getWorkTypeShort(x.tipLucrare) || x.tipLucrare,
    x.judet,
    x.putere ? `are ${x.putere} kW` : '',
    x.capacitateBaterie ? `cere ${x.capacitateBaterie} kWh` : '',
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <details open={deschisa} id={c.leadId} className="rounded-lg border border-slate-200 bg-white">
      <summary className="cursor-pointer px-4 py-3">
        <span className="font-medium text-slate-900">{titlu}</span>
        <span className="ml-2 text-xs text-slate-500">
          {fmt(c.createdAt)} · {c.replici} mesaje · {c.incheiata ? 'terminată' : c.replici ? 'neterminată' : 'neîncepută'} ·
          văzut de {c.vizualizari.length} firme · {c.costUsd.toFixed(3)} $
          {c.rescrieri > 0 && <span className="ml-1 font-semibold text-amber-700">· {c.rescrieri} rescrieri</span>}
          {c.note.map((n) => (
            <span key={n.firma} className="ml-1">
              {n.nota === 'util' ? '👍' : '👎'}
            </span>
          ))}
        </span>
      </summary>
      <div className="grid gap-4 border-t border-slate-100 px-4 py-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-2">
          {c.afisare.length === 0 && <p className="text-sm text-slate-400">Clientul n-a scris nimic.</p>}
          {c.afisare.map((m, i) => (
            <div key={i} className={m.rol === 'client' ? 'flex justify-end' : 'flex justify-start'}>
              <div
                className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3 py-2 text-sm ${
                  m.rol === 'client' ? 'bg-amber-500 text-white' : 'border border-slate-200 bg-slate-50 text-slate-800'
                }`}
              >
                {m.text}
                {m.variante && m.variante.length > 0 && (
                  <div className="mt-1 text-[11px] text-slate-500">Butoane: {m.variante.join(' / ')}</div>
                )}
              </div>
            </div>
          ))}
        </div>
        <aside className="space-y-3 text-sm">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Salvat de asistent</p>
            <pre className="mt-1 whitespace-pre-wrap break-words rounded bg-slate-50 p-2 text-xs text-slate-700">
              {JSON.stringify(c.date, null, 2)}
            </pre>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Firme care au văzut rezumatul</p>
            {c.vizualizari.length === 0 ? (
              <p className="text-slate-400">Niciuna încă.</p>
            ) : (
              c.vizualizari.map((v) => (
                <p key={v.firma} className="text-slate-700">
                  {v.firma} <span className="text-xs text-slate-400">({v.sursa}, {v.de}×, de la {fmt(v.primaLa)})</span>
                </p>
              ))
            )}
          </div>
          {c.note.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">Note</p>
              {c.note.map((n) => (
                <p key={n.firma} className={n.nota === 'util' ? 'text-emerald-700' : 'text-amber-800'}>
                  {n.nota === 'util' ? '👍' : '👎'} {n.firma}
                  {n.motiv && <span className="block text-slate-700">„{n.motiv}”</span>}
                </p>
              ))}
            </div>
          )}
          <p className="text-xs text-slate-400">Cerere {c.leadId}</p>
        </aside>
      </div>
    </details>
  );
}

export default async function AsistentAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ zile?: string; lead?: string; teste?: string }>;
}) {
  const { zile: zileRaw, lead, teste } = await searchParams;
  const zile = Math.min(365, Math.max(1, Number(zileRaw) || 30));
  const pana = new Date();
  const de = new Date(pana.getTime() - zile * 86_400_000);
  const r = await raportAsistent(de, pana, teste === '1');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Watt AI</h1>
        <p className="mt-1 text-sm text-slate-600">
          Asistentul de după cerere, la baterie și extindere. Ultimele {zile} zile ·{' '}
          {[7, 30, 90].map((z) => (
            <a key={z} href={`?zile=${z}`} className={`mr-2 underline ${z === zile ? 'font-semibold' : ''}`}>
              {z} zile
            </a>
          ))}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        <Cifra eticheta="au văzut bula" valoare={r.afisate} />
        <Cifra eticheta="au început" valoare={r.incepute} />
        <Cifra eticheta="au terminat" valoare={r.terminate} />
        <Cifra eticheta="mesaje" valoare={r.mesajeClient} />
        <Cifra eticheta="firme care au văzut" valoare={r.firmeCareAuVazut} />
        <Cifra eticheta="👍 util" valoare={r.noteUtil} />
        <Cifra eticheta="👎 nu prea" valoare={r.noteNuPrea} />
        <Cifra eticheta="cost total" valoare={`${r.costUsd.toFixed(2)} $`} />
      </div>
      <p className="text-sm text-slate-600">
        Lămurite:{' '}
        {Object.entries(r.completate)
          .map(([k, v]) => `${k} ${v}`)
          .join(' · ')}
        {r.rescrieri > 0 && (
          <span className="ml-2 font-medium text-amber-700">
            · {r.rescrieri} replici rescrise de verificarea automată
          </span>
        )}
      </p>

      <div className="space-y-2">
        {r.conversatii.length === 0 && <p className="text-sm text-slate-500">Nicio conversație în fereastra asta.</p>}
        {r.conversatii.map((c) => (
          <Conversatie key={c.leadId} c={c} deschisa={c.leadId === lead} />
        ))}
      </div>
    </div>
  );
}
