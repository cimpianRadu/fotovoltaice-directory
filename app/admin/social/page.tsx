import { getSocialPosts, type SocialPost } from '@/lib/sheets';
import PlatformToggles from './PlatformToggles';

export const dynamic = 'force-dynamic';

type Post = SocialPost;

function todayBucharest(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Bucharest' });
}

function fmtDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('ro-RO', {
    day: 'numeric',
    month: 'short',
  });
}

function badge(p: Post, today: string): { cls: string; label: string } {
  if (p.postat) {
    return { cls: 'bg-emerald-50 text-emerald-700', label: `✅ Postat ${fmtDate(p.postat)}` };
  }
  if (p.status === 'idee') {
    return { cls: 'bg-slate-100 text-slate-600', label: '💡 Idee' };
  }
  if (p.programat) {
    if (p.programat < today) {
      return { cls: 'bg-red-50 text-red-700', label: `⚠️ Întârziat (era ${fmtDate(p.programat)})` };
    }
    if (p.programat === today) {
      return { cls: 'bg-amber-100 text-amber-800 ring-2 ring-amber-400', label: '📌 AZI' };
    }
    return { cls: 'bg-amber-50 text-amber-700', label: '🕒 Programat' };
  }
  return { cls: 'bg-amber-50 text-amber-700', label: '🕒 De programat' };
}

function PostRow({ p, dateCol, today }: { p: Post; dateCol: string; today: string }) {
  const b = badge(p, today);
  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="px-4 py-3 whitespace-nowrap tabular-nums text-slate-700">{dateCol}</td>
      <td className="px-4 py-3">
        <span className="font-medium text-slate-900">
          #{p.id} {p.tema}
        </span>
        {p.format && <div className="text-xs text-slate-500">{p.format}</div>}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${b.cls}`}>
          {b.label}
        </span>
      </td>
      <td className="px-4 py-3">
        <PlatformToggles id={p.id} platforme={p.platforme} />
      </td>
      <td className="hidden md:table-cell px-4 py-3 text-xs font-mono text-slate-500">
        {p.folder ? `social/${p.folder}/` : p.cta || ''}
      </td>
      <td className="hidden lg:table-cell px-4 py-3 text-xs text-slate-500 max-w-xs">{p.nota || ''}</td>
    </tr>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">{title}</h2>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="px-4 py-2.5 font-medium">Data</th>
              <th className="px-4 py-2.5 font-medium">Temă</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">Platforme</th>
              <th className="hidden md:table-cell px-4 py-2.5 font-medium">Fișiere / CTA</th>
              <th className="hidden lg:table-cell px-4 py-2.5 font-medium">Notă</th>
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}

export default async function SocialDashboardPage() {
  const today = todayBucharest();

  let posts: Post[] = [];
  let error: string | null = null;
  try {
    posts = await getSocialPosts();
  } catch (e) {
    error = e instanceof Error ? e.message : 'Nu am putut citi tabul „Social".';
  }

  const coada = posts
    .filter((p) => !p.postat && p.status !== 'idee')
    .sort((a, b) => (a.programat || '9') < (b.programat || '9') ? -1 : 1);
  const postate = posts.filter((p) => p.postat).sort((a, b) => (a.postat! < b.postat! ? 1 : -1));
  const idei = posts.filter((p) => p.status === 'idee');
  const intarziate = coada.filter((p) => p.programat && p.programat < today);
  const next = coada.find((p) => p.programat && p.programat >= today) || coada[0];

  const tiles = [
    { n: postate.length, l: 'postate' },
    { n: coada.length, l: 'în coadă' },
    { n: intarziate.length, l: intarziate.length ? 'întârziate ⚠️' : 'întârziate' },
    { n: idei.length, l: 'idei' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Social</h1>
        <p className="text-sm text-slate-500 mt-1">
          Pipeline postări · sursa: tabul „Social" din Google Sheets, editabil direct
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Badge-uri platforme: verde = postat · galben = programat · gri = nedistribuit. Click pe
          badge ca să marchezi postarea pe canalul ăla, cu data de azi.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {tiles.map((t) => (
          <div key={t.l} className="rounded-lg border border-slate-200 bg-white px-4 py-3">
            <div className="text-2xl font-semibold tabular-nums text-slate-900">{t.n}</div>
            <div className="text-xs text-slate-500">{t.l}</div>
          </div>
        ))}
      </div>

      {next && (
        <div className="rounded-lg border border-amber-400 bg-white px-4 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-amber-600">
            Următoarea postare
          </div>
          <div className="font-semibold text-slate-900 mt-0.5">
            #{next.id} {next.tema}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {next.programat ? `${fmtDate(next.programat)} · ` : ''}
            {next.folder ? `social/${next.folder}/` : ''}
          </div>
        </div>
      )}

      <Section title="Coadă (programate)">
        {coada.length > 0 ? (
          coada.map((p) => (
            <PostRow key={p.id} p={p} dateCol={p.programat ? fmtDate(p.programat) : '—'} today={today} />
          ))
        ) : (
          <tr>
            <td colSpan={6} className="px-4 py-3 text-sm text-slate-500">
              Nimic în coadă.
            </td>
          </tr>
        )}
      </Section>

      <Section title="Postate">
        {postate.map((p) => (
          <PostRow key={p.id} p={p} dateCol={fmtDate(p.postat!)} today={today} />
        ))}
      </Section>

      <Section title="Idei (negenerate)">
        {idei.map((p) => (
          <PostRow key={p.id} p={p} dateCol="—" today={today} />
        ))}
      </Section>
    </div>
  );
}
