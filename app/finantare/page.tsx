import type { Metadata } from 'next';
import type { ReactElement } from 'react';
import Link from 'next/link';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import FAQ from '@/components/seo/FAQ';
import InstallerCta from '@/components/InstallerCta';
import { SponsorFeature } from '@/components/sponsor/SponsorBanner';
import { generateBreadcrumbJsonLd, generateFAQJsonLd } from '@/lib/seo';
import { getKitPriceCurve } from '@/lib/kit-price-curve';
import { formatCurrency } from '@/lib/utils-shared';

// Pagina acoperă clusterul „în rate", singurul gol comercial verificat cu volum:
// „panouri fotovoltaice în rate" 480 căutări/lună și „panouri solare în rate"
// 170, la un CPC de 2,3-2,7 euro, adică de trei ori mai mult decât pe „preț
// panouri fotovoltaice". Concurentul care ține poziția 2 pe tot clusterul
// (greenlead.ro) scoate 41% din traficul lui organic dintr-o singură pagină de
// rate — analiza din 26 aug 2026.
//
// Decizia veche „nu publicăm dobânzi" (OUG 50/2010) a fost înlocuită la 26 aug
// 2026 cu o linie mai precisă: publicăm DOAR dobânzile pe care băncile le
// afișează public, ca informare editorială cu sursa și data la vedere, plus
// calcule aritmetice marcate explicit ca ilustrare. Nu suntem finanțator și nu
// promovăm un credit anume; prezentăm piața așa cum arată ea public. Regula
// never-invent rămâne: fiecare cifră de mai jos are pagină-sursă verificată la
// data din DOBANZI_VERIFICATE_LA; la refresh se re-verifică toate.
//
// Sursa de atribuire e `finantare`, ca să se vadă separat în coloana K din Sheet.

const SURSA = 'finantare';

export const metadata: Metadata = {
  title: 'Panouri fotovoltaice în rate 2026: dobânzi reale și simulare',
  description:
    'Dobânzile afișate de bănci în august 2026 pentru panouri fotovoltaice în rate, simulare de rată lunară pe prețuri reale de piață și cum stau PPC, Enel și Hidroelectrica.',
  alternates: { canonical: '/finantare' },
  openGraph: {
    type: 'article',
    url: '/finantare',
    title: 'Panouri fotovoltaice în rate 2026: dobânzi reale și simulare',
    description:
      'Dobânzile afișate public de bănci, simulare de rată pe prețuri reale și opțiunile de la furnizorii de energie. Verificat în august 2026.',
  },
};

const faqs = [
  {
    question: 'Se pot instala panouri fotovoltaice în rate?',
    answer:
      'Da. Există patru variante uzuale: un credit de nevoi personale luat de dumneavoastră de la o bancă sau un IFN, plata în rate oferită direct de instalator prin partenerul lui de finanțare, leasingul (disponibil pentru firme, nu pentru persoane fizice) și programele de sprijin, care nu sunt finanțare, ci reduc suma de plată. Multe firme din platformă lucrează deja cu una dintre aceste variante.',
  },
  {
    question: 'Ce sumă trebuie finanțată, de fapt?',
    answer:
      'Depinde de puterea sistemului. Din ofertele publice pe care le urmărim, un sistem rezidențial cu montaj inclus se situează în intervalele afișate mai sus, pe kWp instalat. Un sistem de 5 kWp înseamnă tipic o investiție de ordinul zecilor de mii de lei, iar ce finanțați e diferența dintre acest cost și eventualul sprijin primit printr-un program.',
  },
  {
    question: 'Ce e mai bine, credit propriu sau rate prin instalator?',
    answer:
      'Nu există un răspuns unic și depinde de dobânda efectivă pe care o obțineți în fiecare variantă. Ratele prin instalator sunt de obicei mai rapide, pentru că dosarul se face odată cu comanda, dar costul total poate fi diferit de al unui credit negociat separat. Comparați întotdeauna DAE, nu rata lunară: o rată mică pe o perioadă lungă poate însemna un cost total mai mare.',
  },
  {
    question: 'Pot combina un credit cu Casa Verde sau alt program?',
    answer:
      'Da, iar în practică asta se face des: programul acoperă o parte din valoare, restul se finanțează. Atenție însă la calendar. Programele au sesiuni de înscriere și termene de finalizare, iar montajul trebuie făcut de un instalator eligibil în programul respectiv. Verificați condiția asta înainte de a semna orice.',
  },
  {
    question: 'Ce verifică finanțatorul înainte să aprobe?',
    answer:
      'În general vechimea la locul de muncă, nivelul venitului, vârsta și istoricul din Biroul de Credit. Condițiile exacte diferă de la un finanțator la altul și se schimbă în timp, așa că singura sursă corectă rămâne finanțatorul însuși. Noi nu facem analiză de credit și nu promitem aprobări.',
  },
  {
    question: 'Cum funcționează dacă cer o ofertă aici?',
    answer:
      'Completați formularul de cerere, iar la pasul de detalii alegeți varianta de finanțare care vi se potrivește. Cererea ajunge la firmele de instalare care acoperă zona dumneavoastră, iar dacă ați indicat că doriți finanțare, credit sau un program de sprijin, poate ajunge și la un partener de finanțare. Dacă ați indicat fonduri proprii, cererea nu se transmite niciunui finanțator.',
  },
  {
    question: 'Pot lua panouri fotovoltaice în rate, ca persoană fizică, fără avans?',
    answer:
      'Da, există cel puțin un produs bancar dedicat fotovoltaicelor care nu cere avans: la data verificării noastre, creditul ProGreen de la ProCredit Bank era afișat cu avans zero, până la 150.000 de lei pe 5 ani. Și creditele de nevoi personale obișnuite se acordă fără avans, pentru că banii vin în contul dumneavoastră. Condițiile exacte le confirmă banca, nu noi.',
  },
  {
    question: 'PPC oferă panouri fotovoltaice în rate?',
    answer:
      'PPC Energie vinde sisteme fotovoltaice la pachet, cu prețuri afișate public între 19.090 lei (3 kWp monofazat) și 45.580 lei (10 kWp trifazat), cu dosarul de prosumator inclus. Plata în tranșe pe factura de energie e afișată la baterii (3 până la 36 de tranșe egale); la panouri, pagina publică nu afișează rate, deci condițiile se cer în ofertă. Cifrele sunt cele publicate de PPC la data verificării noastre din august 2026.',
  },
  {
    question: 'Mai există oferta Enel de panouri în rate?',
    answer:
      'Nu. Enel nu mai operează în România: grupul grec PPC a preluat operațiunile Enel în octombrie 2023, iar clienții au fost transferați automat la PPC Energie. Dacă ați căutat oferta Enel pentru panouri, oferta echivalentă de astăzi este cea a PPC, descrisă mai sus.',
  },
  {
    question: 'Hidroelectrica vinde panouri fotovoltaice în rate?',
    answer:
      'Nu. Hidroelectrica este furnizor de energie, nu instalator: nu vinde sisteme fotovoltaice și nu oferă rate pentru echipamente. Rolul ei pentru un prosumator e altul: vă cumpără surplusul injectat în rețea, la prețul din contractul de furnizare. Panourile le luați de la un instalator, iar Hidroelectrica rămâne o opțiune de furnizor.',
  },
  {
    question: 'De ce dobânda din reclamă nu e dobânda pe care o primesc eu?',
    answer:
      'Pentru că dobânda minimă afișată e de obicei pentru sume mari sau vine la pachet cu condiții: venituri încasate la banca respectivă, asigurare de viață, pachete de beneficii. La suma tipică a unui sistem rezidențial, mai multe bănci aplică tranșa de sumă mică, unde dobânda e vizibil mai mare decât cea de afiș. De asta comparați întotdeauna DAE pe suma și perioada dumneavoastră, nu dobânda din titlu.',
  },
];

// Dobânzile afișate public de bănci, citite direct din paginile lor de produs.
// Fiecare rând are pagina-sursă verificată la DOBANZI_VERIFICATE_LA; dacă
// actualizezi o cifră, actualizează și data. Nu adăuga rânduri fără sursă.
const DOBANZI_VERIFICATE_LA = '26 august 2026';

const CREDITE: { produs: string; dobanda: string; suma: string; nota: string }[] = [
  {
    produs: 'ProCredit Bank, creditul ProGreen',
    dobanda: '7,40% - 10,40% fixă',
    suma: 'până la 150.000 lei, 5 ani',
    nota: 'Singurul credit dedicat exclusiv fotovoltaicelor găsit la o bancă; fără avans, există și variantă variabilă IRCC + 3,28%.',
  },
  {
    produs: 'ING Personal, categoria Eco',
    dobanda: '7,79% variabilă, indiferent de sumă',
    suma: 'până la 200.000 lei, 5 ani',
    nota: 'Fixă doar pe tranșe de sumă (11,49% sub 40.000 lei). Cere document de la instalator, emis în ultimele 30 de zile.',
  },
  {
    produs: 'UniCredit, Creditul Verde fără ipotecă',
    dobanda: '9,49% - 18,99% fixă, după sumă',
    suma: 'până la 250.000 lei, 60 de rate',
    nota: 'Panourile sunt pe lista tehnologiilor eligibile, dar la suma unui sistem rezidențial tipic se aplică tranșa mică, 16,99% - 18,99%.',
  },
  {
    produs: 'CEC Bank, nevoi personale online',
    dobanda: '6,99% cu venituri la CEC / 8,49% standard',
    suma: 'până la 120.000 lei online, 5 ani',
    nota: 'Credit generic, fără variantă verde pentru persoane fizice; 20 lei pe lună comision de administrare.',
  },
  {
    produs: 'BCR, nevoi personale George',
    dobanda: '7,99% - 14,99% fixă',
    suma: 'până la 250.000 lei, 60 de luni',
    nota: 'Credit generic; 6,29% doar cu pachet de beneficii și asigurare. Fosta campanie cu dobândă dedicată pentru solar are text expirat din 2023.',
  },
  {
    produs: 'Raiffeisen, Flexicredit',
    dobanda: '5,95% - 18,35% fixă',
    suma: '60 de luni',
    nota: 'Credit generic; varianta „Flexicredit Verde" nu mai apare în oferta publică. Intervalul e larg, dobânda finală depinde de profil.',
  },
  {
    produs: 'TBI Bank, programul Green Energy',
    dobanda: '9,9% între 10.000 și 60.000 lei',
    suma: 'până la 60.000 lei, 60 de luni',
    nota: 'Se acordă prin instalatori parteneri; cifra vine din grila publicată de un partener, TBI nu o afișează pe site-ul propriu.',
  },
];

// Ilustrare de rată lunară cu formula anuității, pe dobânzi reale din tabelul
// de mai sus. Doar dobânda nominală, fără comisioane și asigurări, deci DAE
// real e mai mare; e o comparație între variante, nu o ofertă.
const SIMULARE: { label: string; dobandaAnuala: number; nota: string }[] = [
  { label: 'CEC 6,99%', dobandaAnuala: 6.99, nota: 'condiționat de încasarea veniturilor la CEC' },
  { label: 'ProCredit ProGreen 7,40%', dobandaAnuala: 7.4, nota: 'credit dedicat fotovoltaicelor, fără avans' },
  { label: 'ING Eco 7,79%', dobandaAnuala: 7.79, nota: 'dobândă variabilă, se mișcă odată cu IRCC' },
  { label: 'TBI Green Energy 9,9%', dobandaAnuala: 9.9, nota: 'prin instalatori parteneri' },
];

const LUNI_SIMULARE = 60;

/** Rata lunară cu formula anuității: S × i / (1 − (1+i)^−n), i = dobânda anuală / 12. */
function rataLunara(suma: number, dobandaAnuala: number, luni: number): number {
  const i = dobandaAnuala / 100 / 12;
  return (suma * i) / (1 - Math.pow(1 + i, -luni));
}

// Cardurile variantelor: o propoziție de esență + bife scanabile în loc de
// paragraf. `ok: false` = lucrul la care trebuie să fii atent, nu un avantaj.
const ROUTES: {
  title: string;
  who: string;
  tagline: string;
  icon: 'bank' | 'bolt' | 'building' | 'percent';
  points: { ok: boolean; text: string }[];
  href?: string;
  hrefLabel?: string;
}[] = [
  {
    title: 'Credit luat de dumneavoastră',
    who: 'Persoane fizice',
    tagline: 'Bani în cont, plătiți instalatorul ca și cash',
    icon: 'bank',
    points: [
      { ok: true, text: 'Negociați dobânda separat, la banca aleasă de dumneavoastră' },
      { ok: true, text: 'Rămâneți liber să alegeți orice instalator' },
      { ok: false, text: 'Două demersuri în loc de unul: creditul și oferta, separat' },
    ],
  },
  {
    title: 'Rate prin instalator',
    who: 'Persoane fizice',
    tagline: 'Totul într-un singur dosar, odată cu comanda',
    icon: 'bolt',
    points: [
      { ok: true, text: 'Cel mai rapid drum: dosarul de finanțare se face la comandă' },
      { ok: true, text: 'O singură discuție, un singur contract' },
      { ok: false, text: 'Cereți costul total, nu doar rata lunară, ca să puteți compara' },
    ],
  },
  {
    title: 'Leasing',
    who: 'Firme',
    tagline: 'Rată lunară, sistemul devine al firmei la final',
    icon: 'building',
    points: [
      { ok: true, text: 'Ratele au tratament contabil propriu' },
      { ok: true, text: 'Economia lunară la energie poate acoperi o parte din rată' },
      { ok: false, text: 'Sistemul e al finanțatorului până la achitarea integrală' },
    ],
    href: '/finantare/firme',
    hrefLabel: 'Vedeți variantele pentru firme',
  },
  {
    title: 'Programe de sprijin',
    who: 'Depinde de program',
    tagline: 'Bani nerambursabili care taie din suma de plată',
    icon: 'percent',
    points: [
      { ok: true, text: 'Casa Verde, Electric Up, fondurile pentru IMM-uri și agricole' },
      { ok: true, text: 'Se combină cu un credit: programul acoperă o parte, restul se finanțează' },
      { ok: false, text: 'Sesiuni, termene, instalatori eligibili: calendarul contează cât banii' },
    ],
  },
];

// Iconurile cardurilor: SVG-uri inline pe currentColor, ca badge-urile să ia
// culoarea brandului din clasa containerului, fără fișiere separate.
const ROUTE_ICONS: Record<string, ReactElement> = {
  bank: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V10m14 11V10M9 21v-6h6v6M3 9l9-6 9 6H3z" />
    </svg>
  ),
  bolt: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 2L4.5 13.5H11L10 22l8.5-11.5H12L13 2z" />
    </svg>
  ),
  building: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 21V5a1 1 0 011-1h9a1 1 0 011 1v16m0-12h4a1 1 0 011 1v11M3 21h18M8 8h1m-1 4h1m-1 4h1m3-8h1m-1 4h1m-1 4h1" />
    </svg>
  ),
  percent: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 5L5 19M8.5 6.5a2 2 0 11-4 0 2 2 0 014 0zm11 11a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
};

export default function FinantarePage() {
  const curve = getKitPriceCurve();
  // Doar intervalele cu eșantion decent. 11-20 kWp stă pe 2 oferte și peste 20
  // kWp pe una, iar o mediană din 2 oferte nu e preț de piață. Le lăsăm afară
  // și spunem de ce, în loc să publicăm o cifră care pare solidă și nu e.
  const solidPoints = curve.points.filter((p) => p.offers >= 4);

  // Baza simulării de rată: un sistem de 5 kWp la mediana intervalului 4-7 kWp
  // din ofertele scrapate. Se recalculează singură la fiecare refresh de prețuri.
  const bucket47 = curve.points.find((p) => p.minKwp === 4);
  const cost5kwp = bucket47 && bucket47.offers >= 4 ? bucket47.median * 5 : null;

  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: 'Acasă', url: '/' },
          { name: 'Finanțare', url: '/finantare' },
        ])}
      />
      <JsonLd data={generateFAQJsonLd(faqs)} />

      <article className="max-w-4xl mx-auto px-4 py-6">
        <Breadcrumbs items={[{ label: 'Finanțare' }]} />

        <div className="mt-6 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
            Panouri fotovoltaice în rate: ce opțiuni aveți în 2026
          </h1>
          <p className="text-gray-500 mt-3 text-lg">
            Patru variante prin care se plătește un sistem fotovoltaic fără să scoateți toată suma
            deodată, ce presupune fiecare și la ce să vă uitați înainte să semnați.
          </p>
          {/* Trei promisiuni verificabile, nu slogane: fiecare chip corespunde
              unei secțiuni de mai jos care chiar o susține. */}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface border border-border px-3 py-1 text-xs text-gray-600">
              <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Dobânzi verificate la {DOBANZI_VERIFICATE_LA}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface border border-border px-3 py-1 text-xs text-gray-600">
              <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Prețuri din {curve.totalOffers} de oferte publice
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface border border-border px-3 py-1 text-xs text-gray-600">
              <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Zero cifre estimate
            </span>
          </div>
        </div>

        {/* Plasarea principală de partener, sus, cum e vândută. */}
        <div className="mb-10">
          <SponsorFeature position="finantare" />
        </div>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Cele patru variante</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {ROUTES.map((r) => (
              <div
                key={r.title}
                className="flex flex-col rounded-xl border border-border bg-white p-5 hover:border-primary/30 hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-3">
                  <span className="w-10 h-10 rounded-lg bg-primary/10 text-primary-dark flex items-center justify-center shrink-0">
                    {ROUTE_ICONS[r.icon]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h3 className="font-bold text-gray-900">{r.title}</h3>
                      <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-primary-dark bg-primary/10 rounded-full px-2 py-0.5">
                        {r.who}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{r.tagline}</p>
                  </div>
                </div>
                <ul className="mt-4 space-y-2">
                  {r.points.map((p) => (
                    <li key={p.text} className="flex items-start gap-2 text-sm text-gray-600 leading-snug">
                      {p.ok ? (
                        <svg
                          className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4 mt-0.5 text-amber-500 shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                          />
                        </svg>
                      )}
                      <span>{p.text}</span>
                    </li>
                  ))}
                </ul>
                {r.href && (
                  <Link
                    href={r.href}
                    className="mt-auto pt-3 inline-block text-sm font-medium text-primary-dark underline hover:text-primary"
                  >
                    {r.hrefLabel} &rarr;
                  </Link>
                )}
              </div>
            ))}
          </div>
        </section>

        <InstallerCta
          sursa={SURSA}
          title="Aflați întâi cât costă sistemul dumneavoastră"
          description="Înainte de orice discuție despre rate, aveți nevoie de o ofertă concretă. Spuneți-ne ce aveți nevoie și primiți oferte de la instalatori atestați ANRE din zona dumneavoastră."
          ctaLabel="Cere oferte gratuit"
        />

        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Ce sumă se finanțează, de fapt</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            Rata depinde de suma finanțată, iar suma finanțată depinde de sistem. Mai jos e costul
            pe kWp instalat, cu montaj inclus, calculat din oferte publice ale magazinelor
            româneşti. Publicăm și câte oferte stau în spatele fiecărei cifre, pentru că o mediană
            din trei oferte nu înseamnă același lucru cu una din opt.
          </p>

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
                {solidPoints.map((p) => (
                  <tr key={p.label} className="hover:bg-surface/50 transition-colors">
                    <td className="px-4 py-2.5 text-gray-900 border-b border-border/50">{p.label}</td>
                    <td className="px-4 py-2.5 text-gray-900 font-semibold border-b border-border/50">
                      {formatCurrency(p.median)}
                    </td>
                    <td className="px-4 py-2.5 text-gray-600 border-b border-border/50">
                      {formatCurrency(p.min)} &ndash; {formatCurrency(p.max)}
                    </td>
                    <td className="px-4 py-2.5 text-gray-600 border-b border-border/50">{p.offers}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-xs text-gray-500 leading-relaxed">
            Prețuri cu TVA 21%, aduse pe aceeași bază, doar oferte on-grid cu montaj inclus și fără
            baterie. Scanate pe {curve.scrapedAt}. Nu afișăm intervalele de peste 11 kWp: au sub
            patru oferte fiecare, prea puține ca o mediană să însemne ceva. Pentru un calcul pe
            consumul dumneavoastră, folosiți{' '}
            <Link href="/calculator-panouri-fotovoltaice" className="underline hover:text-gray-700">
              calculatorul
            </Link>
            .
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            Ce dobânzi afișează băncile pentru panouri fotovoltaice
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            Am citit paginile publice de produs ale băncilor la {DOBANZI_VERIFICATE_LA} și am
            notat exact ce afișează fiecare. Nu sunt oferte de la noi și nu sunt promisiuni:
            sunt cifrele pe care le veți găsi chiar dumneavoastră pe site-urile lor, puse una
            lângă alta ca să aveți de unde porni comparația.
          </p>

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface text-left">
                <tr>
                  <th className="px-4 py-2.5 font-semibold text-gray-900 text-xs uppercase tracking-wide">
                    Produs
                  </th>
                  <th className="px-4 py-2.5 font-semibold text-gray-900 text-xs uppercase tracking-wide">
                    Dobânda afișată
                  </th>
                  <th className="px-4 py-2.5 font-semibold text-gray-900 text-xs uppercase tracking-wide">
                    Sumă și perioadă
                  </th>
                  <th className="px-4 py-2.5 font-semibold text-gray-900 text-xs uppercase tracking-wide">
                    De reținut
                  </th>
                </tr>
              </thead>
              <tbody>
                {CREDITE.map((c) => (
                  <tr key={c.produs} className="hover:bg-surface/50 transition-colors">
                    <td className="px-4 py-2.5 text-gray-900 font-medium border-b border-border/50">
                      {c.produs}
                    </td>
                    <td className="px-4 py-2.5 text-gray-900 border-b border-border/50 whitespace-nowrap">
                      {c.dobanda}
                    </td>
                    <td className="px-4 py-2.5 text-gray-600 border-b border-border/50">{c.suma}</td>
                    <td className="px-4 py-2.5 text-gray-600 border-b border-border/50">{c.nota}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-xs text-gray-500 leading-relaxed">
            Dobânzi nominale afișate public, verificate la {DOBANZI_VERIFICATE_LA}. DAE include
            în plus comisioane și asigurări, deci e mai mare. Băncile își schimbă condițiile
            fără preaviz; înainte de a semna, verificați cifra direct la bancă.
          </p>

          <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4">
            <p className="text-sm text-amber-900 leading-relaxed">
              <strong>Capcana tranșelor de sumă:</strong> dobânda minimă din reclame e de obicei
              pentru credite mari. La suma unui sistem rezidențial, mai multe bănci aplică
              tranșa mică, unde dobânda e alta: la UniCredit, un credit sub 50.000 lei intră pe
              16,99% - 18,99%, nu pe minimul de afiș, iar la ING dobânda fixă sub 40.000 lei e
              11,49%. Dintre produsele verificate, cele la care suma tipică a unui sistem
              rezidențial chiar ia dobânda de afiș sunt ProCredit ProGreen (7,40%) și CEC
              (6,99%, cu venituri încasate acolo).
            </p>
          </div>
        </section>

        {cost5kwp && bucket47 && (
          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              Cât ar însemna pe lună: o ilustrare pe cifre reale
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              Luăm un sistem de 5 kWp la mediana pieței din tabelul de mai sus:{' '}
              {formatCurrency(bucket47.median)}/kWp × 5 = <strong>{formatCurrency(cost5kwp)}</strong>{' '}
              cu montaj (din {bucket47.offers} oferte publice, scanate pe {curve.scrapedAt}).
              Aplicăm formula anuității pe {LUNI_SIMULARE} de luni, cu dobânzile reale din tabel.
            </p>

            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-surface text-left">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold text-gray-900 text-xs uppercase tracking-wide">
                      Varianta
                    </th>
                    <th className="px-4 py-2.5 font-semibold text-gray-900 text-xs uppercase tracking-wide">
                      Rată lunară
                    </th>
                    <th className="px-4 py-2.5 font-semibold text-gray-900 text-xs uppercase tracking-wide">
                      Total rambursat
                    </th>
                    <th className="px-4 py-2.5 font-semibold text-gray-900 text-xs uppercase tracking-wide">
                      De reținut
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-surface/50 transition-colors">
                    <td className="px-4 py-2.5 text-gray-900 font-medium border-b border-border/50">
                      Plată integrală
                    </td>
                    <td className="px-4 py-2.5 text-gray-900 border-b border-border/50">0 lei/lună</td>
                    <td className="px-4 py-2.5 text-gray-600 border-b border-border/50">
                      {formatCurrency(cost5kwp)}
                    </td>
                    <td className="px-4 py-2.5 text-gray-600 border-b border-border/50">
                      cel mai mic cost total, dar cere toată suma acum
                    </td>
                  </tr>
                  {SIMULARE.map((s) => {
                    const rata = rataLunara(cost5kwp, s.dobandaAnuala, LUNI_SIMULARE);
                    return (
                      <tr key={s.label} className="hover:bg-surface/50 transition-colors">
                        <td className="px-4 py-2.5 text-gray-900 font-medium border-b border-border/50">
                          {s.label}
                        </td>
                        <td className="px-4 py-2.5 text-gray-900 font-semibold border-b border-border/50 whitespace-nowrap">
                          ~{formatCurrency(Math.round(rata))}/lună
                        </td>
                        <td className="px-4 py-2.5 text-gray-600 border-b border-border/50 whitespace-nowrap">
                          ~{formatCurrency(Math.round(rata * LUNI_SIMULARE))}
                        </td>
                        <td className="px-4 py-2.5 text-gray-600 border-b border-border/50">{s.nota}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p className="mt-3 text-xs text-gray-500 leading-relaxed">
              Calcul aritmetic cu formula anuității, doar pe dobânda nominală, fără comisioane de
              analiză, administrare sau asigurări; costul real (DAE) e mai mare la fiecare. E o
              comparație între variante pe aceeași sumă, nu o ofertă de credit și nu o promisiune
              de aprobare.
            </p>
          </section>
        )}

        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            Rate de la furnizorul de energie: PPC, Enel, Hidroelectrica
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            Mulți caută direct oferta furnizorului de curent, așa că am verificat ce există de
            fapt, la {DOBANZI_VERIFICATE_LA}, pe paginile publice ale fiecăruia.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-white p-5">
              <h3 className="font-bold text-gray-900 mb-2">PPC Energie</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Vinde sisteme la pachet, cu prețuri afișate de la 19.090 lei (3 kWp monofazat) la
                45.580 lei (10 kWp trifazat), cu panouri JA Solar, invertor Foxess și dosarul de
                prosumator incluse. Plata în tranșe pe factură e afișată la baterii (3 - 36 de
                tranșe egale); la panouri, pagina publică nu afișează rate. E un singur catalog,
                la un singur preț, fără termen de comparație.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-white p-5">
              <h3 className="font-bold text-gray-900 mb-2">Enel</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Nu mai există în România: grupul grec PPC a preluat operațiunile Enel în octombrie
                2023, iar clienții au fost transferați automat la PPC Energie. Orice căutare după
                „panouri în rate Enel" duce, în 2026, la oferta PPC de alături.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-white p-5">
              <h3 className="font-bold text-gray-900 mb-2">Hidroelectrica</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Este furnizor, nu instalator: nu vinde sisteme fotovoltaice și nu oferă rate
                pentru echipamente. Pentru un prosumator contează altfel: vă cumpără surplusul
                injectat în rețea la prețul energiei active din contract. Panourile le luați de
                la un instalator; Hidroelectrica rămâne o opțiune de furnizor.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-3">De unde vin cifrele de pe pagina asta</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Nu suntem finanțator și nu intermediem credite, deci nu avem nimic de vândut în
            tabelele de mai sus. Dobânzile sunt cele afișate public de bănci pe paginile lor de
            produs, citite la {DOBANZI_VERIFICATE_LA}; costul sistemelor vine din ofertele
            publice ale magazinelor, cu eșantionul la vedere; ratele lunare sunt aritmetică pe
            aceste două cifre, nimic mai mult. Condițiile finale, DAE-ul și aprobarea le
            stabilește fiecare finanțator pe dosarul dumneavoastră. Când o cifră de aici nu mai
            corespunde cu pagina băncii, are întâietate pagina băncii.
          </p>
        </section>

        <section id="faq" className="scroll-mt-20 mb-10">
          <FAQ items={faqs} title="Întrebări frecvente despre finanțare" />
        </section>

        <InstallerCta
          sursa={SURSA}
          title="Gata să cereți oferte?"
          description="Primiți oferte de la instalatori atestați ANRE din județul dumneavoastră. La pasul de detalii puteți spune ce variantă de finanțare vă interesează, iar cererea ajunge la firmele potrivite situației."
          ctaLabel="Cere oferte gratuit"
        />

        <div className="border-t border-border pt-8">
          <h3 className="font-bold text-gray-900 mb-4">Ghiduri legate</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href="/ghid/casa-verde-fotovoltaice-2026"
              className="p-4 rounded-lg border border-border hover:border-primary/30 hover:shadow-sm transition-all text-sm font-medium text-gray-900"
            >
              Casa Verde Fotovoltaice 2026
            </Link>
            <Link
              href="/ghid/electric-up-2026-ghid-aplicare"
              className="p-4 rounded-lg border border-border hover:border-primary/30 hover:shadow-sm transition-all text-sm font-medium text-gray-900"
            >
              Electric Up 2026: ghid de aplicare
            </Link>
            <Link
              href="/ghid/fonduri-nerambursabile-panouri-fotovoltaice-imm-2026"
              className="p-4 rounded-lg border border-border hover:border-primary/30 hover:shadow-sm transition-all text-sm font-medium text-gray-900"
            >
              Fonduri nerambursabile pentru IMM-uri
            </Link>
            <Link
              href="/calculator-panouri-fotovoltaice"
              className="p-4 rounded-lg border border-border hover:border-primary/30 hover:shadow-sm transition-all text-sm font-medium text-gray-900"
            >
              Calculator: cât costă și în cât se amortizează
            </Link>
            <Link
              href="/finantare/firme"
              className="p-4 rounded-lg border border-border hover:border-primary/30 hover:shadow-sm transition-all text-sm font-medium text-gray-900"
            >
              Finanțare pentru firme: leasing, credit, ESCO
            </Link>
          </div>
        </div>
      </article>
    </>
  );
}
