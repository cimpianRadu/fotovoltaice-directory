import Link from 'next/link';

/**
 * Widget de finanțare pentru audiența de firme, pus în ghidurile comerciale.
 *
 * De ce există: /finantare/firme nu are de unde primi trafic din Google.
 * Clusterul B2B de finanțare e sub 100 de căutări pe lună în total (Google Ads,
 * RO, verificat 25 aug 2026), în timp ce ghidurile comerciale au trafic real pe
 * programe și pe preț. Deci pagina nu se promovează singură, o hrănesc ghidurile.
 *
 * Nu dublează InstallerCta și nu concurează cu el: acela cere o ofertă, ăsta
 * răspunde la obiecția care vine imediat după preț, „n-am banii acum". Din
 * motivul ăsta stă DUPĂ conținut și înainte de CTA-ul principal, nu invers.
 *
 * Nu afișează parteneri aici, deliberat. Slotul plătit de parteneri e pe
 * /finantare/firme, iar dacă logourile ar apărea în fiecare ghid, ar deveni
 * inventar gratuit pe care nu l-a cumpărat nimeni. Widgetul trimite trafic în
 * pagina unde stau ei, ceea ce e exact ce se poate vinde.
 *
 * Componentă de server, deliberat: tracking-ul merge pe atributele `data-umami-event`,
 * ca la bannerul de parteneri, deci nu are nevoie de `'use client'`. Conta:
 * `FINANTARE_B2B_GUIDES` se citește din pagina de ghid, care e server, iar un Set
 * exportat dintr-un modul de client ajunge acolo ca referință, nu ca Set.
 */

const ROUTES = [
  { label: 'Leasing', note: 'cu avans' },
  { label: 'Credit de investiții', note: 'cu garanții' },
  { label: 'ESCO', note: 'fără investiție proprie' },
];

export default function FinantareB2B({ slug }: { slug: string }) {
  return (
    <aside className="my-10 rounded-xl border border-secondary/15 bg-secondary/[0.03] p-6">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-secondary/60">
        Finanțare
      </p>
      <h3 className="mt-1 font-bold text-gray-900">Proiectul e clar, bugetul nu?</h3>
      <p className="mt-2 text-sm text-gray-600 leading-relaxed">
        Un sistem pe hală nu se plătește obligatoriu dintr-o dată. Sunt trei variante private, plus
        programele nerambursabile, care se combină cu oricare dintre ele.
      </p>

      <ul className="mt-4 flex flex-wrap gap-2">
        {ROUTES.map((r) => (
          <li
            key={r.label}
            className="rounded-lg border border-border bg-white px-3 py-2 text-xs leading-tight"
          >
            <span className="font-semibold text-gray-900">{r.label}</span>
            <span className="block text-gray-500">{r.note}</span>
          </li>
        ))}
      </ul>

      <Link
        href="/finantare/firme"
        data-umami-event="finantare-b2b-click"
        data-umami-event-slug={slug}
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-secondary hover:text-primary-dark transition-colors"
      >
        Vedeți variantele, comparate
        <span aria-hidden="true">&rarr;</span>
      </Link>
    </aside>
  );
}

/**
 * Ghidurile pe care apare. Listă explicită, ca la GUIDE_CTA: `guides.json` nu are
 * câmp de segment, iar un widget scris pentru firme nu are ce căuta într-un ghid
 * de Casa Verde, unde cititorul e o persoană fizică.
 */
export const FINANTARE_B2B_GUIDES = new Set([
  'sisteme-fotovoltaice-comerciale-2026-pillar-decident-firma',
  'sistem-fotovoltaic-50-100-250-kw-firma-pret-suprafata-productie',
  'panouri-fotovoltaice-hale-industriale',
  'cost-sistem-fotovoltaic-comercial',
  'merita-panouri-fotovoltaice-firma-2026',
  'calculator-panouri-fotovoltaice-firma-2026-cost-roi',
  'amortizare-panouri-fotovoltaice-2026',
  'electric-up-2026-ghid-aplicare',
  'fonduri-nerambursabile-panouri-fotovoltaice-imm-2026',
  'fonduri-afir-panouri-fotovoltaice-ferma-industrie-alimentara-2026',
  'apel-150-milioane-euro-baterii-stocare-stand-alone-2026',
  'legea-prosumatorilor-2026-firma-plata-lunara-dezechilibre',
]);
