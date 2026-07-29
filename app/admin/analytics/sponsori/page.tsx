import { getEventValues, resolveRange } from '@/lib/umami';
import RangePicker, { resolvePreset } from '../../RangePicker';
import { ErrorBanner } from '../page';
import partnersData from '@/data/partners.json';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ range?: string }>;

type Partner = {
  slug: string;
  name: string;
  description: string;
  active: boolean;
};

const PARTNERS = (partnersData.partners as Partner[]).filter((p) => p.active);

import sponsorsData from '@/data/sponsors.json';

const SPONSOR_BANNER_NAMES: string[] = (
  sponsorsData.sponsors as { slug: string; active: boolean }[]
)
  .filter((s) => s.active)
  .map((s) => s.slug);

// Perechea poziție → audiență e ținută în SponsorBanner; aici e doar eticheta.
const POSITION_LABELS: Record<string, string> = {
  homepage: 'Homepage',
  'ghid-index': '/ghid (index)',
  'ghid-topic': '/ghid/[topic]',
  calculator: '/calculator',
  clasament: '/clasament',
  'clasament-featured': '/clasament (featured)',
  firme: '/firme',
  'cere-oferta-confirmare': '/cere-oferta (după trimitere) · doar Premium',
  cereri: '/cereri (instalatori) · doar Premium',
  'listeaza-firma': '/listeaza-firma (instalatori)',
};

const AUDIENCE_LABELS: Record<string, string> = {
  client: 'Clienți (caută instalator)',
  instalator: 'Instalatori (caută de lucru)',
};

async function safe<T>(fn: () => Promise<T>): Promise<{ data: T | null; error: string | null }> {
  try {
    return { data: await fn(), error: null };
  } catch (e) {
    return { data: null, error: e instanceof Error ? e.message : String(e) };
  }
}

export default async function SponsoriPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const preset = resolvePreset(sp.range);
  const { startAt, endAt, label } = resolveRange(preset);

  // Sponsor banner: impressions and clicks broken down by sponsor + position
  const [impSponsor, impPos, clickSponsor, clickPos, impAud, clickAud] = await Promise.all([
    safe(() => getEventValues(startAt, endAt, 'sponsor-impression', 'sponsor')),
    safe(() => getEventValues(startAt, endAt, 'sponsor-impression', 'position')),
    safe(() => getEventValues(startAt, endAt, 'sponsor-click', 'sponsor')),
    safe(() => getEventValues(startAt, endAt, 'sponsor-click', 'position')),
    safe(() => getEventValues(startAt, endAt, 'sponsor-impression', 'audience')),
    safe(() => getEventValues(startAt, endAt, 'sponsor-click', 'audience')),
  ]);

  // Carousel: views and clicks broken down by partner
  const [carView, carClick, carRotate, carDismiss] = await Promise.all([
    safe(() => getEventValues(startAt, endAt, 'partner-carousel-view', 'partner')),
    safe(() => getEventValues(startAt, endAt, 'partner-carousel-click', 'partner')),
    safe(() => getEventValues(startAt, endAt, 'partner-carousel-rotate', 'partner')),
    safe(() => getEventValues(startAt, endAt, 'partner-carousel-dismiss', 'partner')),
  ]);

  const errors = [
    impSponsor.error,
    impPos.error,
    clickSponsor.error,
    clickPos.error,
    impAud.error,
    clickAud.error,
    carView.error,
    carClick.error,
    carRotate.error,
    carDismiss.error,
  ].filter(Boolean) as string[];

  const toMap = (rows: { value: string; total: number }[] | null) => {
    const m = new Map<string, number>();
    (rows ?? []).forEach((r) => m.set(r.value, r.total));
    return m;
  };

  const sponsorImps = toMap(impSponsor.data);
  const sponsorClicks = toMap(clickSponsor.data);
  const positionImps = toMap(impPos.data);
  const positionClicks = toMap(clickPos.data);
  const audienceImps = toMap(impAud.data);
  const audienceClicks = toMap(clickAud.data);

  const carouselViews = toMap(carView.data);
  const carouselClicks = toMap(carClick.data);
  const carouselRotates = toMap(carRotate.data);
  const carouselDismisses = toMap(carDismiss.data);

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Sponsori &amp; Parteneri</h1>
          <p className="text-sm text-slate-500 mt-1">
            {label} · impressions / clicks / CTR per locație · cache 1h
          </p>
        </div>
        <RangePicker pathname="/admin/analytics/sponsori" preset={preset} />
      </div>

      {errors.length > 0 && <ErrorBanner errors={errors} />}

      {/* Sponsor Banner section */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Banner Sponsori (&quot;Furnizori Recomandați&quot;)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Apare pe homepage (sub fold), /ghid (sticky sidebar), /ghid/[topic] (sub
            cuprins), /calculator (sub rezultat) și /clasament (featured partner slot).
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Per sponsor */}
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="text-sm font-semibold text-slate-900 mb-3">Per sponsor</div>
            {SPONSOR_BANNER_NAMES.length === 0 ? (
              <div className="text-xs text-slate-500">Nu sunt sponsori configurați.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-xs uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="text-left py-2 font-medium">Sponsor</th>
                    <th className="text-right py-2 font-medium">Impressions</th>
                    <th className="text-right py-2 font-medium">Clicks</th>
                    <th className="text-right py-2 font-medium">CTR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {SPONSOR_BANNER_NAMES.map((name) => {
                    const imp = sponsorImps.get(name) ?? 0;
                    const clk = sponsorClicks.get(name) ?? 0;
                    const ctr = imp > 0 ? (clk / imp) * 100 : 0;
                    return (
                      <tr key={name}>
                        <td className="py-2 capitalize">{name}</td>
                        <td className="py-2 text-right tabular-nums">
                          {imp.toLocaleString('ro-RO')}
                        </td>
                        <td className="py-2 text-right tabular-nums">
                          {clk.toLocaleString('ro-RO')}
                        </td>
                        <td className="py-2 text-right tabular-nums font-medium">
                          {imp > 0 ? `${ctr.toFixed(2)}%` : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Per audiență: cine a văzut, nu unde. Un partener relevant pentru
              ambele părți (finanțare pentru clienți, asigurări pentru firme) are
              mesaje diferite, iar asta spune care dintre ele prinde. */}
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="text-sm font-semibold text-slate-900 mb-3">Per audiență</div>
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="text-left py-2 font-medium">Audiență</th>
                  <th className="text-right py-2 font-medium">Impressions</th>
                  <th className="text-right py-2 font-medium">Clicks</th>
                  <th className="text-right py-2 font-medium">CTR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.keys(AUDIENCE_LABELS).map((aud) => {
                  const imp = audienceImps.get(aud) ?? 0;
                  const clk = audienceClicks.get(aud) ?? 0;
                  const ctr = imp > 0 ? (clk / imp) * 100 : 0;
                  return (
                    <tr key={aud}>
                      <td className="py-2">{AUDIENCE_LABELS[aud]}</td>
                      <td className="py-2 text-right tabular-nums">
                        {imp.toLocaleString('ro-RO')}
                      </td>
                      <td className="py-2 text-right tabular-nums">
                        {clk.toLocaleString('ro-RO')}
                      </td>
                      <td className="py-2 text-right tabular-nums font-medium">
                        {imp > 0 ? `${ctr.toFixed(2)}%` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="mt-2 text-[11px] text-slate-400">
              Datele pe audiență există doar de la 29 iulie 2026 încoace.
            </p>
          </div>

          {/* Per locație */}
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="text-sm font-semibold text-slate-900 mb-3">Per locație</div>
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="text-left py-2 font-medium">Locație</th>
                  <th className="text-right py-2 font-medium">Impressions</th>
                  <th className="text-right py-2 font-medium">Clicks</th>
                  <th className="text-right py-2 font-medium">CTR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Object.keys(POSITION_LABELS).map((pos) => {
                  const imp = positionImps.get(pos) ?? 0;
                  const clk = positionClicks.get(pos) ?? 0;
                  const ctr = imp > 0 ? (clk / imp) * 100 : 0;
                  return (
                    <tr key={pos}>
                      <td className="py-2">{POSITION_LABELS[pos]}</td>
                      <td className="py-2 text-right tabular-nums">
                        {imp.toLocaleString('ro-RO')}
                      </td>
                      <td className="py-2 text-right tabular-nums">
                        {clk.toLocaleString('ro-RO')}
                      </td>
                      <td className="py-2 text-right tabular-nums font-medium">
                        {imp > 0 ? `${ctr.toFixed(2)}%` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {sponsorImps.size === 0 && sponsorClicks.size === 0 && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
            Nu vezi date încă? Tracking-ul de <code className="font-mono">sponsor-impression</code>{' '}
            și <code className="font-mono">position</code> a fost adăugat în acest deploy. Datele
            apar după ce vizitatori reali încarcă paginile.
          </div>
        )}
      </section>

      {/* Carousel section */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Carousel Parteneri (bottom-right popup)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Apare după 15s pe orice pagină, rotește la fiecare {partnersData.rotationSeconds}s.
            Maxim {partnersData.maxActive} parteneri activi.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="text-left py-2 font-medium">Partener</th>
                <th className="text-right py-2 font-medium">Views</th>
                <th className="text-right py-2 font-medium">Rotates</th>
                <th className="text-right py-2 font-medium">Dismisses</th>
                <th className="text-right py-2 font-medium">Clicks</th>
                <th className="text-right py-2 font-medium">CTR (clicks/views)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {PARTNERS.map((partner) => {
                const views = carouselViews.get(partner.slug) ?? 0;
                const rotates = carouselRotates.get(partner.slug) ?? 0;
                const dismisses = carouselDismisses.get(partner.slug) ?? 0;
                const clicks = carouselClicks.get(partner.slug) ?? 0;
                const totalShown = views + rotates;
                const ctr = totalShown > 0 ? (clicks / totalShown) * 100 : 0;
                return (
                  <tr key={partner.slug}>
                    <td className="py-2">
                      <div className="font-medium text-slate-900">{partner.name}</div>
                      <div className="text-xs text-slate-500">{partner.slug}</div>
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      {views.toLocaleString('ro-RO')}
                    </td>
                    <td className="py-2 text-right tabular-nums text-slate-500">
                      {rotates.toLocaleString('ro-RO')}
                    </td>
                    <td className="py-2 text-right tabular-nums text-slate-500">
                      {dismisses.toLocaleString('ro-RO')}
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      {clicks.toLocaleString('ro-RO')}
                    </td>
                    <td className="py-2 text-right tabular-nums font-medium">
                      {totalShown > 0 ? `${ctr.toFixed(2)}%` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="text-xs text-slate-400 mt-3">
            <strong>Notă:</strong> &quot;Views&quot; = prima apariție în session (când carousel-ul
            se deschide). &quot;Rotates&quot; = afișări ulterioare în rotație. CTR este clicks /
            (views + rotates) — câte impresii efective primește partenerul.
          </p>
        </div>
      </section>
    </div>
  );
}
