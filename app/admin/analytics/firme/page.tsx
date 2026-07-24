import {
  getEventValues,
  getMetrics,
  resolveRange,
  type EventValueRow,
  type MetricRow,
} from '@/lib/umami';
import RangePicker, { resolvePreset } from '../../RangePicker';
import { ErrorBanner } from '../page';
import { getCompanies } from '@/lib/utils';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ range?: string }>;

const COMPANIES = getCompanies();

// `company_id` din evenimente e id-ul din companies.json, iar path-ul e /firme/<slug>.
// Sunt identice azi pentru toate firmele, dar le mapăm separat ca să nu depindem de asta.
const BY_ID = new Map(COMPANIES.map((c) => [c.id, c]));
const BY_SLUG = new Map(COMPANIES.map((c) => [c.slug, c]));

async function safe<T>(fn: () => Promise<T>): Promise<{ data: T | null; error: string | null }> {
  try {
    return { data: await fn(), error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : String(e) };
  }
}

function toMap(rows: EventValueRow[] | null): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of rows ?? []) m.set(r.value, (m.get(r.value) ?? 0) + r.total);
  return m;
}

const CONTACT_TYPE_LABELS: Record<string, string> = {
  phone: 'Telefon (link în listă)',
  phone_cta: 'Telefon (buton „Sună Acum")',
  email: 'Email',
};

const LINK_TYPE_LABELS: Record<string, string> = {
  website: 'Site (link în listă)',
  website_cta: 'Site (buton „Vizitează Site-ul")',
};

export default async function FirmeAnalyticsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const preset = resolvePreset(sp.range);
  const { startAt, endAt, label } = resolveRange(preset);

  const [paths, contactByCompany, contactByType, linkByCompany, linkByType] = await Promise.all([
    safe(() => getMetrics(startAt, endAt, 'path', 1000)),
    safe(() => getEventValues(startAt, endAt, 'company_contact_clicked', 'company_id')),
    safe(() => getEventValues(startAt, endAt, 'company_contact_clicked', 'contact_type')),
    safe(() => getEventValues(startAt, endAt, 'external_link_clicked', 'company_id')),
    safe(() => getEventValues(startAt, endAt, 'external_link_clicked', 'link_type')),
  ]);

  const errors = [
    paths.error,
    contactByCompany.error,
    contactByType.error,
    linkByCompany.error,
    linkByType.error,
  ].filter((e): e is string => Boolean(e));

  // Views pe profilele de firmă: /firme/<slug>, excluzând /firme, /firme/judet/*, /firme/oras/*
  const profileViews = new Map<string, number>();
  let indexViews = 0;
  for (const row of (paths.data ?? []) as MetricRow[]) {
    if (row.x === '/firme' || row.x === '/firme/') {
      indexViews += row.y;
      continue;
    }
    const m = /^\/firme\/([^/]+)\/?$/.exec(row.x);
    if (!m) continue;
    const slug = m[1];
    if (slug === 'judet' || slug === 'oras') continue;
    profileViews.set(slug, (profileViews.get(slug) ?? 0) + row.y);
  }

  const contactClicks = toMap(contactByCompany.data);
  const websiteClicks = toMap(linkByCompany.data);

  // Reunim cele trei surse pe firmă. Cheia e slug-ul, id-urile din evenimente
  // sunt traduse prin BY_ID ca să nu pierdem rânduri dacă vreodată diferă.
  const keys = new Set<string>();
  for (const slug of profileViews.keys()) keys.add(slug);
  for (const id of contactClicks.keys()) keys.add(BY_ID.get(id)?.slug ?? id);
  for (const id of websiteClicks.keys()) keys.add(BY_ID.get(id)?.slug ?? id);

  const rows = [...keys]
    .map((slug) => {
      const company = BY_SLUG.get(slug);
      const id = company?.id ?? slug;
      const views = profileViews.get(slug) ?? 0;
      const contact = contactClicks.get(id) ?? 0;
      const website = websiteClicks.get(id) ?? 0;
      return {
        slug,
        name: company?.name ?? slug,
        county: company?.location.county ?? '',
        known: Boolean(company),
        views,
        contact,
        website,
        clicks: contact + website,
      };
    })
    .sort((a, b) => b.clicks - a.clicks || b.views - a.views);

  const totalViews = rows.reduce((s, r) => s + r.views, 0);
  const totalContact = rows.reduce((s, r) => s + r.contact, 0);
  const totalWebsite = rows.reduce((s, r) => s + r.website, 0);
  const withClicks = rows.filter((r) => r.clicks > 0).length;
  const ctr = totalViews > 0 ? ((totalContact + totalWebsite) / totalViews) * 100 : 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Firme</h1>
          <p className="text-sm text-slate-500 mt-1">
            {label} · {COMPANIES.length} firme în director · cache 1h
          </p>
        </div>
        <RangePicker pathname="/admin/analytics/firme" preset={preset} />
      </div>

      {errors.length > 0 && <ErrorBanner errors={errors} />}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <SmallKpi label="Views profile firme" value={totalViews.toLocaleString('ro-RO')} />
        <SmallKpi label="Views /firme (index)" value={indexViews.toLocaleString('ro-RO')} />
        <SmallKpi label="Click contact" value={totalContact.toLocaleString('ro-RO')} />
        <SmallKpi label="Click site firmă" value={totalWebsite.toLocaleString('ro-RO')} />
        <SmallKpi label="Rată click / view" value={`${ctr.toFixed(1)}%`} />
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-1">
          <div className="text-sm font-semibold text-slate-900">
            Firme, sortate după interacțiuni
          </div>
          <div className="text-xs text-slate-400">
            {withClicks} cu cel puțin un click · {rows.length} cu activitate
          </div>
        </div>
        <p className="text-xs text-slate-500 mb-3">
          Cifrele de aici sunt cele pe care le poți arăta unei firme când discuți despre un
          articol sau o listare plătită. „Click contact" = telefon sau email, „click site" =
          trimitere către site-ul firmei.
        </p>

        {rows.length === 0 ? (
          <div className="text-xs text-slate-500">Nicio dată în perioada selectată.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="text-left py-2 font-medium">Firmă</th>
                <th className="text-left py-2 font-medium w-32">Județ</th>
                <th className="text-right py-2 font-medium w-24">Views</th>
                <th className="text-right py-2 font-medium w-28">Click contact</th>
                <th className="text-right py-2 font-medium w-24">Click site</th>
                <th className="text-right py-2 font-medium w-24">Total click</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.slug} className="hover:bg-slate-50">
                  <td className="py-2 pr-3 text-slate-900">
                    {r.name}
                    {!r.known && (
                      <span className="ml-2 text-xs text-amber-700">(slug necunoscut)</span>
                    )}
                    <div className="text-xs font-mono text-slate-400">/firme/{r.slug}</div>
                  </td>
                  <td className="py-2 text-slate-600">{r.county}</td>
                  <td className="py-2 text-right tabular-nums">
                    {r.views.toLocaleString('ro-RO')}
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {r.contact.toLocaleString('ro-RO')}
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {r.website.toLocaleString('ro-RO')}
                  </td>
                  <td className="py-2 text-right tabular-nums font-medium">
                    {r.clicks.toLocaleString('ro-RO')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BreakdownCard
          title="Click contact, pe tip"
          rows={contactByType.data}
          labels={CONTACT_TYPE_LABELS}
        />
        <BreakdownCard
          title="Click către site-ul firmei, pe tip"
          rows={linkByType.data}
          labels={LINK_TYPE_LABELS}
        />
      </div>
    </div>
  );
}

function BreakdownCard({
  title,
  rows,
  labels,
}: {
  title: string;
  rows: EventValueRow[] | null;
  labels: Record<string, string>;
}) {
  const sorted = [...(rows ?? [])].sort((a, b) => b.total - a.total);
  const total = sorted.reduce((s, r) => s + r.total, 0);

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
      <div className="text-sm font-semibold text-slate-900 mb-3">{title}</div>
      {sorted.length === 0 ? (
        <div className="text-xs text-slate-500">Nicio dată în perioada selectată.</div>
      ) : (
        <ul className="space-y-2 text-sm">
          {sorted.map((r) => (
            <li key={r.value} className="flex items-center justify-between gap-3">
              <span className="text-slate-700">{labels[r.value] ?? r.value}</span>
              <span className="tabular-nums text-slate-900 font-medium">
                {r.total.toLocaleString('ro-RO')}
                <span className="ml-2 text-xs font-normal text-slate-400">
                  {total > 0 ? `${((r.total / total) * 100).toFixed(0)}%` : ''}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SmallKpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 text-xl font-semibold text-slate-900">{value}</div>
    </div>
  );
}
