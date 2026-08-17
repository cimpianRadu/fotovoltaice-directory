import { getEventValues, resolveRange } from '@/lib/umami';
import RangePicker, { resolvePreset } from '../../RangePicker';
import { ErrorBanner } from '../page';
export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ range?: string }>;

import sponsorsData from '@/data/sponsors.json';

type Sponsor = {
  slug: string;
  name: string;
  active: boolean;
  positions: string[] | 'all';
};

// Popup-ul e o plasare pe aceeași intrare de partener, nu o listă separată.
const PARTNERS = (sponsorsData.sponsors as Sponsor[]).filter(
  (s) => s.active && (s.positions === 'all' || s.positions.includes('popup')),
);

const SPONSOR_BANNER_NAMES: string[] = (sponsorsData.sponsors as Sponsor[])
  .filter((s) => s.active)
  .map((s) => s.slug);

import { SPONSOR_POSITION_LABELS } from '@/lib/sponsor-positions';

// Perechea poziție → audiență e ținută în SponsorBanner; aici e doar eticheta.
const POSITION_LABELS: Record<string, string> = SPONSOR_POSITION_LABELS;

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

  // Proprietatea compusă `sp` = `slug|poziție`. Umami întoarce valorile unei
  // singure proprietăți odată, agregate peste toți partenerii; cu doi parteneri
  // pe aceleași pagini, tabelul „per locație" de mai jos nu mai spune ale cui
  // sunt impresiile. `sp` e singurul mod în care putem da unui partener plătitor
  // raportul lui, separat de al celuilalt.
  const [impSp, clickSp, callSp, waSp, socialSp] = await Promise.all([
    safe(() => getEventValues(startAt, endAt, 'sponsor-impression', 'sp')),
    safe(() => getEventValues(startAt, endAt, 'sponsor-click', 'sp')),
    safe(() => getEventValues(startAt, endAt, 'sponsor-call', 'sp')),
    safe(() => getEventValues(startAt, endAt, 'sponsor-whatsapp', 'sp')),
    safe(() => getEventValues(startAt, endAt, 'sponsor-social', 'sp')),
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
    impSp.error,
    clickSp.error,
    callSp.error,
    waSp.error,
    socialSp.error,
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

  // `sp` vine ca "slug|poziție". Îl spargem o dată și construim, din aceleași
  // rânduri, atât matricea partener × plasare cât și totalurile per partener
  // pentru apeluri și Facebook (suma peste plasări), ca să nu mai interogăm
  // Umami încă de patru ori pentru date pe care le avem deja.
  type SpCell = { imp: number; clicks: number; calls: number; wa: number; social: number };

  const spCells = new Map<string, SpCell>();
  const emptyCell = (): SpCell => ({ imp: 0, clicks: 0, calls: 0, wa: 0, social: 0 });

  const fillCells = (rows: { value: string; total: number }[] | null, key: keyof SpCell) => {
    (rows ?? []).forEach((r) => {
      if (!r.value.includes('|')) return;
      const cell = spCells.get(r.value) ?? emptyCell();
      cell[key] = r.total;
      spCells.set(r.value, cell);
    });
  };

  fillCells(impSp.data, 'imp');
  fillCells(clickSp.data, 'clicks');
  fillCells(callSp.data, 'calls');
  fillCells(waSp.data, 'wa');
  fillCells(socialSp.data, 'social');

  const spRows = Array.from(spCells.entries())
    .map(([key, cell]) => {
      const [sponsor, pos] = key.split('|');
      return { sponsor, pos, ...cell };
    })
    .sort((a, b) => a.sponsor.localeCompare(b.sponsor) || b.imp - a.imp);

  const sponsorTotals = new Map<string, SpCell>();
  spRows.forEach((r) => {
    const t = sponsorTotals.get(r.sponsor) ?? emptyCell();
    t.imp += r.imp;
    t.clicks += r.clicks;
    t.calls += r.calls;
    t.wa += r.wa;
    t.social += r.social;
    sponsorTotals.set(r.sponsor, t);
  });

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
            {label} · impressions / clicks / CTR per locație · cache 1h ·{' '}
            <a href="/admin/sponsori" className="underline hover:text-slate-900">
              control parteneri →
            </a>
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

        {/* Raportul per partener × plasare. Ăsta e tabelul pe care îl trimiți
            unui partener plătitor: numai rândurile lui, fără să se amestece cu
            ale altcuiva. Apelurile, conversațiile de WhatsApp și clickurile pe
            Facebook stau aici, nu la grămadă, pentru că pe audiența de
            instalatori apelul e conversia, nu clickul pe site. */}
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="text-sm font-semibold text-slate-900 mb-1">
            Per partener × plasare
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Singura vedere care separă doi parteneri afișați pe aceleași pagini. Datele există
            de la deploy-ul care a adăugat proprietatea <code className="font-mono">sp</code>.
          </p>
          {spRows.length === 0 ? (
            <div className="text-xs text-slate-500">
              Încă niciun eveniment cu <code className="font-mono">sp</code>. Apar după ce
              vizitatori reali încarcă paginile cu un partener activ.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[640px]">
                <thead className="text-xs uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="text-left py-2 font-medium">Partener</th>
                    <th className="text-left py-2 font-medium">Plasare</th>
                    <th className="text-right py-2 font-medium">Impresii</th>
                    <th className="text-right py-2 font-medium">Clickuri site</th>
                    <th className="text-right py-2 font-medium">Apeluri</th>
                    <th className="text-right py-2 font-medium">WhatsApp</th>
                    <th className="text-right py-2 font-medium">Facebook</th>
                    <th className="text-right py-2 font-medium">CTR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {spRows.map((r) => {
                    const engaged = r.clicks + r.calls + r.wa + r.social;
                    const ctr = r.imp > 0 ? (engaged / r.imp) * 100 : 0;
                    return (
                      <tr key={`${r.sponsor}|${r.pos}`}>
                        <td className="py-2 capitalize">{r.sponsor}</td>
                        <td className="py-2 text-slate-600">
                          {POSITION_LABELS[r.pos] ?? r.pos}
                        </td>
                        <td className="py-2 text-right tabular-nums">
                          {r.imp.toLocaleString('ro-RO')}
                        </td>
                        <td className="py-2 text-right tabular-nums">
                          {r.clicks.toLocaleString('ro-RO')}
                        </td>
                        <td className="py-2 text-right tabular-nums font-medium text-emerald-700">
                          {r.calls.toLocaleString('ro-RO')}
                        </td>
                        <td className="py-2 text-right tabular-nums font-medium text-emerald-700">
                          {r.wa.toLocaleString('ro-RO')}
                        </td>
                        <td className="py-2 text-right tabular-nums text-slate-500">
                          {r.social.toLocaleString('ro-RO')}
                        </td>
                        <td className="py-2 text-right tabular-nums font-medium">
                          {r.imp > 0 ? `${ctr.toFixed(2)}%` : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-2 text-[11px] text-slate-400">
            CTR = (clickuri site + apeluri + WhatsApp + Facebook) / impresii. Previzualizările
            (<code className="font-mono">?preview=</code>) nu trimit evenimente, deci nu intră
            în cifrele de mai sus.
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
                    <th className="text-right py-2 font-medium">Apeluri</th>
                    <th className="text-right py-2 font-medium">WhatsApp</th>
                    <th className="text-right py-2 font-medium">CTR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {SPONSOR_BANNER_NAMES.map((name) => {
                    const imp = sponsorImps.get(name) ?? 0;
                    const clk = sponsorClicks.get(name) ?? 0;
                    const calls = sponsorTotals.get(name)?.calls ?? 0;
                    const wa = sponsorTotals.get(name)?.wa ?? 0;
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
                        <td className="py-2 text-right tabular-nums font-medium text-emerald-700">
                          {calls.toLocaleString('ro-RO')}
                        </td>
                        <td className="py-2 text-right tabular-nums font-medium text-emerald-700">
                          {wa.toLocaleString('ro-RO')}
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
            Apare după 15s pe orice pagină, rotește la fiecare{' '}
            {sponsorsData.popup.rotationSeconds}s partenerii cu plasarea „popup".
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
