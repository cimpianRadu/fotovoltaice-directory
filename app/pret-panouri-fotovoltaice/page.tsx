import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import FAQ from '@/components/seo/FAQ';
import InstallerCta from '@/components/InstallerCta';
import SponsorBanner from '@/components/sponsor/SponsorBanner';
import { generateBreadcrumbJsonLd, generateFAQJsonLd } from '@/lib/seo';
import { getKitPriceCurve } from '@/lib/kit-price-curve';
import { getPublishedLabour } from '@/lib/kit-labour';
import { formatCurrency } from '@/lib/utils-shared';

// „Preț panouri fotovoltaice" face 880 de căutări pe lună, cel mai mare termen
// comercial din nișă, și e motorul cu care necesit.ro ne bate. O singură pagină,
// nu 34 pe județe: „preț panouri fotovoltaice cluj" și variantele pe județ sunt
// sub pragul de raportare, adică nu le caută nimeni.
//
// Diferențiatorul nu e cifra, pe care o are toată lumea, ci eșantionul. Fiecare
// mediană de aici vine cu numărul de oferte din spate și cu data scrapării, iar
// intervalele prea subțiri sunt marcate ca atare în loc să fie prezentate ca
// fapte. Nimeni din piață nu publică asta.

const SURSA = 'pret';

/** Sub atâtea oferte, o mediană descrie zgomotul, nu piața. */
const PRAG_SOLID = 4;

export const metadata: Metadata = {
  title: 'Preț panouri fotovoltaice 2026: cât costă pe kWp, cu montaj',
  description:
    'Cât costă panourile fotovoltaice în 2026, pe kWp instalat, din oferte publice reale. Prețuri cu TVA, montaj inclus, cu numărul de oferte din spatele fiecărei cifre.',
  alternates: { canonical: '/pret-panouri-fotovoltaice' },
  openGraph: {
    type: 'article',
    url: '/pret-panouri-fotovoltaice',
    title: 'Preț panouri fotovoltaice 2026: cât costă pe kWp, cu montaj',
    description:
      'Prețuri din oferte publice, aduse pe aceeași bază de TVA, cu eșantionul la vedere.',
  },
};

const faqs = [
  {
    question: 'Cât costă un sistem fotovoltaic de 5 kW în 2026?',
    answer:
      'Din ofertele publice pe care le urmărim, intervalul de 4-7 kWp are o mediană în jur de 2.700 RON pe kWp instalat, cu montaj inclus și TVA. Pentru un sistem de 5 kWp asta înseamnă un ordin de mărime de 13.000-14.000 lei la mediană, dar intervalul observat e larg, de la circa 1.800 la peste 4.300 RON pe kWp, în funcție de echipamente și de complexitatea montajului. Cifra exactă o dă doar o ofertă pe casa dumneavoastră.',
  },
  {
    question: 'De ce prețul pe kWp scade la sistemele mai mari?',
    answer:
      'Pentru că o parte din cost nu depinde de numărul de panouri: deplasarea echipei, tabloul electric, priza de pământ, dosarul de prosumator, manopera de bază. Acestea se împart la mai mulți kWp pe un sistem mare, deci costul unitar scade. De aceea un sistem de 3 kWp e mai scump pe kWp decât unul de 10 kWp.',
  },
  {
    question: 'Prețurile astea includ montajul?',
    answer:
      'Da. Luăm în calcul doar ofertele on-grid care declară montaj inclus și care nu conțin baterie, tocmai ca cifrele să fie comparabile între ele. Un kit fără montaj e mai ieftin, dar nu e același produs, iar amestecarea celor două e principala sursă de confuzie la prețurile din piață.',
  },
  {
    question: 'Cât costă separat manopera?',
    answer:
      'Puține magazine o publică. Am găsit patru cazuri în care același magazin afișează atât prețul cu montaj cât și pe cel fără, deci manopera se poate deduce prin scădere, dintr-o sursă publică. Valorile obținute sunt între circa 225 și 988 RON pe kW, ceea ce e un interval prea larg ca să vorbim de un preț de piață, dar arată ordinul de mărime.',
  },
  {
    question: 'De ce publicați câte oferte stau în spatele fiecărei cifre?',
    answer:
      'Pentru că o mediană din trei oferte și una din opt nu înseamnă același lucru, iar cititorul are dreptul să știe pe ce se bazează cifra pe care o citește. Restul pieței publică un număr fără să spună de unde vine. Acolo unde eșantionul nostru e prea subțire, spunem asta în loc să prezentăm cifra ca pe un fapt.',
  },
  {
    question: 'Cât de des se actualizează?',
    answer:
      'Prețurile sunt scanate periodic din paginile publice ale magazinelor și aduse toate la TVA 21%, cota legală pentru panouri de la 1 august 2025. Data ultimei scanări e afișată sub tabel. Dacă vedeți o dată veche, tratați cifrele ca orientative.',
  },
];

export default function PretPage() {
  const curve = getKitPriceCurve();
  const labour = getPublishedLabour();

  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: 'Acasă', url: '/' },
          { name: 'Preț panouri fotovoltaice', url: '/pret-panouri-fotovoltaice' },
        ])}
      />
      <JsonLd data={generateFAQJsonLd(faqs)} />

      <article className="max-w-4xl mx-auto px-4 py-6">
        <Breadcrumbs items={[{ label: 'Preț panouri fotovoltaice' }]} />

        <div className="mt-6 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
            Preț panouri fotovoltaice 2026: cât costă pe kWp, cu montaj
          </h1>
          <p className="text-gray-500 mt-3 text-lg">
            Cifrele de mai jos vin din oferte publice ale magazinelor românești, aduse toate pe
            aceeași bază de TVA. Lângă fiecare scrie câte oferte stau în spatele ei.
          </p>
        </div>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Preț pe kWp instalat</h2>

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface text-left">
                <tr>
                  <th className="px-4 py-2.5 font-semibold text-gray-900 text-xs uppercase tracking-wide">
                    Dimensiune sistem
                  </th>
                  <th className="px-4 py-2.5 font-semibold text-gray-900 text-xs uppercase tracking-wide">
                    Mediană RON/kWp
                  </th>
                  <th className="px-4 py-2.5 font-semibold text-gray-900 text-xs uppercase tracking-wide">
                    Interval observat
                  </th>
                  <th className="px-4 py-2.5 font-semibold text-gray-900 text-xs uppercase tracking-wide">
                    Oferte
                  </th>
                </tr>
              </thead>
              <tbody>
                {curve.points.map((p) => {
                  const thin = p.offers < PRAG_SOLID;
                  return (
                    <tr key={p.label} className="hover:bg-surface/50 transition-colors">
                      <td className="px-4 py-2.5 text-gray-900 border-b border-border/50">
                        {p.label}
                      </td>
                      <td
                        className={`px-4 py-2.5 font-semibold border-b border-border/50 ${
                          thin ? 'text-gray-400' : 'text-gray-900'
                        }`}
                      >
                        {formatCurrency(p.median)}
                      </td>
                      <td className="px-4 py-2.5 text-gray-600 border-b border-border/50">
                        {formatCurrency(p.min)} &ndash; {formatCurrency(p.max)}
                      </td>
                      <td className="px-4 py-2.5 border-b border-border/50">
                        {thin ? (
                          <span className="text-amber-700 font-medium">
                            {p.offers} · prea puține
                          </span>
                        ) : (
                          <span className="text-gray-600">{p.offers}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-xs text-gray-500 leading-relaxed">
            Prețuri cu TVA 21%, cota legală pentru panouri din 1 august 2025. Doar oferte on-grid,
            cu montaj inclus și fără baterie, ca să fie comparabile între ele. Scanate pe{' '}
            {curve.scrapedAt}. Rândurile marcate <span className="text-amber-700">prea puține</span>{' '}
            au sub {PRAG_SOLID} oferte în spate: mediana lor descrie mai degrabă cine e în eșantion
            decât cât costă în piață, așa că tratați-le ca pe un indiciu, nu ca pe o cifră.
          </p>
        </section>

        <InstallerCta
          sursa={SURSA}
          title="Prețul din tabel nu e prețul dumneavoastră"
          description="Costul real depinde de acoperiș, de distanța la tablou, de fazare și de echipamentele alese. Cereți oferte de la instalatori atestați ANRE din județul dumneavoastră și comparați cifre pe casa dumneavoastră, nu medii."
          ctaLabel="Cere ofertă gratuit"
        />

        {labour.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-3">Cât din preț e manopera</h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              Aproape nimeni nu publică asta separat. Am găsit {labour.length} cazuri în care
              același magazin afișează, pentru același kit, atât prețul cu montaj cât și pe cel
              fără. Diferența dintre ele e manopera, dedusă dintr-o sursă publică, nu estimată de
              noi.
            </p>

            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-surface text-left">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold text-gray-900 text-xs uppercase tracking-wide">
                      Magazin
                    </th>
                    <th className="px-4 py-2.5 font-semibold text-gray-900 text-xs uppercase tracking-wide">
                      Sistem
                    </th>
                    <th className="px-4 py-2.5 font-semibold text-gray-900 text-xs uppercase tracking-wide">
                      Manoperă
                    </th>
                    <th className="px-4 py-2.5 font-semibold text-gray-900 text-xs uppercase tracking-wide">
                      Pe kW
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {labour.map((l, i) => (
                    <tr key={`${l.store}-${i}`} className="hover:bg-surface/50 transition-colors">
                      <td className="px-4 py-2.5 text-gray-900 border-b border-border/50">
                        {l.store}
                      </td>
                      <td className="px-4 py-2.5 text-gray-600 border-b border-border/50">
                        {l.kw} kW
                      </td>
                      <td className="px-4 py-2.5 text-gray-900 border-b border-border/50">
                        {formatCurrency(Math.round(l.manoperaRon))}
                      </td>
                      <td className="px-4 py-2.5 text-gray-900 font-semibold border-b border-border/50">
                        {formatCurrency(l.manoperaPeKw)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mt-3 text-xs text-gray-500 leading-relaxed">
              Aduse la TVA 21%, ca și prețurile. Intervalul e larg, de la{' '}
              {formatCurrency(labour[labour.length - 1].manoperaPeKw)} la{' '}
              {formatCurrency(labour[0].manoperaPeKw)} pe kW, deci nu vorbim de un preț de piață, ci
              de ordinul de mărime. Patru observații sunt prea puține pentru o medie, motiv pentru
              care le arătăm una câte una în loc să le comprimăm într-o cifră.
            </p>
          </section>
        )}

        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Ce mută prețul, în practică</h2>
          <ul className="space-y-2 text-sm text-gray-600 leading-relaxed list-disc list-inside">
            <li>
              <strong className="text-gray-800">Dimensiunea sistemului.</strong> Costurile fixe
              (deplasare, tablouri, priză de pământ, dosar) se împart la mai mulți kWp, deci prețul
              unitar scade cu puterea.
            </li>
            <li>
              <strong className="text-gray-800">Tipul acoperișului.</strong> Tabla și panourile
              sandwich sunt cele mai simple. Țigla ceramică, azbocimentul și montajul la sol cer
              structuri sau manoperă în plus.
            </li>
            <li>
              <strong className="text-gray-800">Echipamentele.</strong> Diferența dintre un invertor
              de clasă economică și unul premium se vede în ofertă și explică o bună parte din
              intervalele largi de mai sus.
            </li>
            <li>
              <strong className="text-gray-800">Bateria.</strong> Nu e inclusă în cifrele de aici
              tocmai pentru că schimbă complet ordinul de mărime al investiției.
            </li>
            <li>
              <strong className="text-gray-800">Fazarea și distanța la tablou.</strong> Trifazatul și
              traseele lungi de cablu adaugă materiale și ore.
            </li>
          </ul>
        </section>

        <div className="mb-10">
          <SponsorBanner position="pret" />
        </div>

        <section id="faq" className="scroll-mt-20 mb-10">
          <FAQ items={faqs} title="Întrebări frecvente despre preț" />
        </section>

        <div className="border-t border-border pt-8">
          <h3 className="font-bold text-gray-900 mb-4">Mai departe</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href="/calculator-panouri-fotovoltaice"
              className="p-4 rounded-lg border border-border hover:border-primary/30 hover:shadow-sm transition-all text-sm font-medium text-gray-900"
            >
              Calculator: cât produce și în cât se amortizează
            </Link>
            <Link
              href="/finantare"
              className="p-4 rounded-lg border border-border hover:border-primary/30 hover:shadow-sm transition-all text-sm font-medium text-gray-900"
            >
              Panouri fotovoltaice în rate: ce opțiuni aveți
            </Link>
            <Link
              href="/ghid/cost-sistem-fotovoltaic-comercial"
              className="p-4 rounded-lg border border-border hover:border-primary/30 hover:shadow-sm transition-all text-sm font-medium text-gray-900"
            >
              Cost sistem fotovoltaic comercial
            </Link>
            <Link
              href="/firme"
              className="p-4 rounded-lg border border-border hover:border-primary/30 hover:shadow-sm transition-all text-sm font-medium text-gray-900"
            >
              Instalatori verificați, pe județe
            </Link>
          </div>
        </div>
      </article>
    </>
  );
}
