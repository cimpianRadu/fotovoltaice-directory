import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import FAQ from '@/components/seo/FAQ';
import InstallerCta from '@/components/InstallerCta';
import SponsorBanner from '@/components/sponsor/SponsorBanner';
import { generateBreadcrumbJsonLd, generateFAQJsonLd } from '@/lib/seo';
import { getKitPriceCurve } from '@/lib/kit-price-curve';
import { pricePerKwp } from '@/lib/pv-estimate';
import { formatCurrency } from '@/lib/utils-shared';

// Pagina soră a lui /finantare, pe cealaltă audiență. /finantare stă pe clusterul
// „panouri fotovoltaice în rate" (rezidențial, 480 + 170 căutări/lună); aici e
// firma care are hală, depozit sau fabrică și caută cu ce plătește proiectul.
//
// Onest despre ce e pagina asta: NU e o pagină de trafic. Clusterul B2B de
// finanțare e aproape gol în Google Ads (Romania, ro, verificat 25 aug 2026):
// „finantare parc fotovoltaic" 30/lună, „leasing panouri fotovoltaice" 20,
// „finantare proiecte fotovoltaice" 10, „finantare sisteme fotovoltaice" 10, iar
// „finantare panouri fotovoltaice firma", „credit panouri fotovoltaice firma",
// „leasing fotovoltaice firma" și „finantare fotovoltaice IMM" nu întorc volum
// deloc. Adică sub 100 de căutări pe lună pe tot clusterul.
//
// Deci pagina se hrănește din trei surse, nu din Google: linkurile interne din
// ghidurile comerciale (care au trafic pe programe), postările de Facebook și
// articolul de finanțare. Iar ce se măsoară la final de lună nu e „vizite din
// organic", ci clickurile pe parteneri și cererile comerciale cu `sursa`
// `finantare-firme`.
//
// Ca și pe /finantare: nu publicăm dobânzi, DAE sau exemple de rate. Aici nu e
// vorba de OUG 50/2010 (aceea acoperă creditul de consum, nu B2B), ci de faptul
// că nu suntem finanțator și condițiile se dau pe dosar.

const SURSA = 'finantare-firme';

export const metadata: Metadata = {
  title: 'Finanțare pentru proiecte fotovoltaice: opțiuni pentru firme în 2026',
  description:
    'Leasing, credit de investiții, ESCO și programe nerambursabile pentru un sistem fotovoltaic pe hală, depozit sau fabrică. Ce presupune fiecare variantă și ce cere finanțatorul.',
  alternates: { canonical: '/finantare/firme' },
  openGraph: {
    type: 'article',
    url: '/finantare/firme',
    title: 'Finanțare pentru proiecte fotovoltaice: opțiuni pentru firme în 2026',
    description:
      'Leasing, credit de investiții, ESCO și programe nerambursabile pentru sisteme fotovoltaice comerciale. Ce presupune fiecare variantă și ce cere finanțatorul.',
  },
};

// Patru variante, dar omul nu vrea patru descrieri, vrea să vadă care i se
// potrivește. Deci coloanele sunt exact întrebările care le despart:
// cine rămâne proprietar, cât scoate din buzunar la început, ce i se cere.
const ROUTES = [
  {
    name: 'Leasing financiar',
    owner: 'Finanțatorul, până la ultima rată',
    upfront: 'Avans',
    asks: 'Bilanț. Bunul finanțat garantează contractul, deci de obicei fără garanții în plus.',
    best: 'Firma care vrea sistemul al ei, fără să blocheze garanții',
  },
  {
    name: 'Credit de investiții',
    owner: 'Firma, din prima zi',
    upfront: 'Avans și garanții',
    asks: 'Bilanț, grad de îndatorare și de regulă garanții din afara proiectului.',
    best: 'Firma cu bilanț bun care negociază un cost total mai mic',
  },
  {
    name: 'Leasing operațional și ESCO',
    owner: 'Investitorul terț',
    upfront: 'Zero',
    asks: 'Un contract lung, tipic peste zece ani, și un consum care merită investiția lui. Plătiți fie energia produsă, fie pe baza economiilor garantate prin contract, în funcție de partener.',
    best: 'Firma care nu vrea să atingă CAPEX-ul sau linia de credit',
  },
  {
    name: 'Programe nerambursabile',
    owner: 'Firma',
    upfront: 'Cofinanțare',
    asks: 'Dosar, eligibilitate și respectarea calendarului sesiunii.',
    best: 'Oricine se încadrează. Se combină cu variantele de mai sus.',
  },
];

// Ferestre confirmate din sursă primară, nu din presă. Vezi ghidurile legate
// pentru actul care le stabilește.
const PROGRAMS = [
  {
    name: 'Apel stocare stand-alone (BESS)',
    who: 'Firme, proiecte de stocare în baterii',
    window: '1 septembrie – 30 octombrie 2026',
    note: 'Buget 150 mil. EUR, Ghidul solicitantului aprobat prin Ordinul ministrului energiei nr. 915/14.08.2026.',
    href: '/ghid/apel-150-milioane-euro-baterii-stocare-stand-alone-2026',
  },
  {
    name: 'SME Eco-Tech',
    who: 'IMM-uri din industria prelucrătoare',
    window: 'până la 24 septembrie 2026',
    note: 'Fonduri elvețiene, cu listă proprie de cheltuieli eligibile.',
    href: '/ghid/fonduri-nerambursabile-panouri-fotovoltaice-imm-2026',
  },
  {
    name: 'Electric Up',
    who: 'IMM-uri și HoReCa',
    window: 'Ciclul 2 în evaluare',
    note: 'Fără sesiune deschisă la data actualizării paginii. Un ciclu nou se anunță pe energie.gov.ro.',
    href: '/ghid/electric-up-2026-ghid-aplicare',
  },
  {
    name: 'Schema de Energie AFIR',
    who: 'Fermieri și industrie alimentară',
    window: 'sesiunea 2026 s-a închis pe 14 august',
    note: 'Rămâne relevantă ca reper pentru o sesiune viitoare.',
    href: '/ghid/fonduri-afir-panouri-fotovoltaice-ferma-industrie-alimentara-2026',
  },
];

// Aceleași informații ca înainte, dar ca listă de verificat, nu ca patru
// paragrafe. Omul se uită aici ca să știe ce să pregătească, deci contează
// să poată bifa, nu să citească.
const CHECKS = [
  ['Ultimul bilanț', 'Majoritatea cer cel puțin un exercițiu financiar încheiat, unii doi.'],
  ['Gradul de îndatorare', 'Cât din capacitatea de plată e deja ocupată de alte credite sau leasinguri.'],
  ['Oferta fermă a instalatorului', 'Fără ea nu se calculează nici rata, nici avansul.'],
  ['Devizul proiectului', 'Defalcat pe echipamente și manoperă, nu o sumă unică.'],
  ['Avizul tehnic de racordare', 'Pentru sistemele racordate la rețea.'],
  ['Actele firmei', 'Certificat constatator, act constitutiv, situația datoriilor la stat.'],
];

const faqs = [
  {
    question: 'Se poate lua un sistem fotovoltaic în leasing pe firmă?',
    answer:
      'Da, iar leasingul e varianta cea mai frecventă pentru firme. Sistemul rămâne în proprietatea finanțatorului până la achitarea integrală, ceea ce înseamnă că bunul finanțat garantează el însuși contractul. Condițiile exacte, avansul și durata se stabilesc pe dosar, de către finanțator.',
  },
  {
    question: 'Ce e mai bun pentru o firmă, leasingul sau creditul de investiții?',
    answer:
      'Depinde de ce vă blochează. Leasingul e mai rapid și cere de obicei mai puține garanții din afara proiectului, pentru că echipamentul garantează contractul. Creditul de investiții vă lasă proprietar din prima zi și poate avea un cost total mai mic, dar analiza e mai grea și consumă din capacitatea de îndatorare. Comparați costul total al finanțării, nu rata lunară.',
  },
  {
    question: 'Pot combina un program nerambursabil cu leasing sau credit?',
    answer:
      'Da, și în practică așa se face des: programul acoperă o parte din valoarea proiectului, iar restul se finanțează. Atenție la două lucruri. Primul e calendarul, pentru că programele au termene de implementare care nu se prelungesc după bunul plac. Al doilea e regula de dublă finanțare: aceeași cheltuială nu poate fi decontată de două ori, deci structura trebuie discutată înainte de semnare, nu după.',
  },
  {
    question: 'Ce e un contract ESCO și de ce nu apare ca datorie?',
    // Prima versiune băga ESCO și contractul de performanță energetică în
    // aceeași frază, cu un singur mecanism: „firma plătește pentru energia
    // produsă". Nu e mecanismul unui CPE, iar partenerul afișat chiar deasupra
    // lucrează pe CPE, deci întrebarea îl descria greșit exact pe el.
    answer:
      'E umbrela sub care un terț investește în sistem, îl deține și îl operează, iar firma nu scoate bani la început. De aici încolo sunt două mecanisme diferite, iar diferența decide ce semnați. În varianta cu plata energiei, plătiți energia produsă de sistem sau folosința instalației, de obicei sub prețul din rețea. În contractul de performanță energetică se pleacă de la economii: investitorul le calculează, le trece în contract, apoi monitorizează consumul real, iar dacă economisiți mai puțin decât s-a prevăzut vă rambursează diferența. Comun le e că nu cumpărați activul, deci angajamentul are alt tratament decât un credit, că economia se împarte cu investitorul și că vorbim de contracte lungi. Tratamentul contabil exact se confirmă cu contabilul dumneavoastră, pe contractul concret.',
  },
  {
    question: 'De ce nu publicați dobânzi și rate pe pagina asta?',
    answer:
      'Pentru că nu suntem finanțator. Dobânda, avansul și durata depind de bilanțul firmei, de valoarea proiectului și de politica fiecărui finanțator la momentul respectiv. Orice cifră pusă aici ar fi o ilustrare, nu o ofertă. Ce putem susține cu date proprii e costul sistemului, și pe acela îl publicăm mai jos.',
  },
  {
    question: 'Cum ajung la un partener de finanțare prin platformă?',
    answer:
      'Partenerii de finanțare sunt afișați pe pagina aceasta, cu datele lor de contact, și îi puteți contacta direct. Separat, dacă cereți oferte prin formular și indicați că vă interesează finanțarea, cererea ajunge la firmele de instalare care acoperă zona dumneavoastră. Nu facem analiză de credit, nu intermediem finanțarea și nu promitem aprobări.',
  },
];

export default function FinantareFirmePage() {
  const curve = getKitPriceCurve();
  // Întrebarea omului nu e „cât e prețul pe kWp", ci „ce sumă am eu de acoperit".
  // Deci afișăm valoarea totală a proiectului, iar prețul pe kWp rămâne doar
  // coloana din care iese. Sursa unică e `pricePerKwp`, aceeași funcție care
  // alimentează calculatorul, ca să nu existe două seturi de cifre pe site.
  //
  // ATENȚIE la ce sunt de fapt cifrele astea, ca să nu fie prezentate greșit:
  // peste `SCRAPED_DATA_MAX_KWP` (20 kWp) NU mai avem oferte scanate. Cele trei
  // praguri (4.500 / 3.800 / 3.500) sunt medianele intervalelor publicate în
  // ghidul comercial („Sub 50 kWp 4.300-4.700", „50-200 kWp 3.600-4.000",
  // „Peste 200 kWp 3.300-3.700"), adică praguri uzuale de piață, nu mediane
  // măsurate din oferte, cum sunt cele de pe /finantare pentru rezidențial.
  //
  // Și sunt FĂRĂ TVA, spre deosebire de tabelul rezidențial, care e cu TVA 21%.
  // De aceea totalurile se afișează rotunjite și marcate „fără TVA": aceleași
  // cifre înmulțite exact ar da o precizie pe care datele nu o susțin, iar un om
  // care compară cele două pagini ar compara baze diferite.
  const sizes = [
    { kwp: 30, hint: 'atelier, birouri, retail mic' },
    { kwp: 50, hint: 'hală mică, service auto' },
    { kwp: 100, hint: 'hală de producție, depozit' },
    { kwp: 250, hint: 'industrial, logistică' },
    { kwp: 500, hint: 'fabrică, parc logistic' },
  ].map((b) => {
    const price = pricePerKwp(b.kwp, curve).value;
    return { ...b, price, total: price * b.kwp };
  });

  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: 'Acasă', url: '/' },
          { name: 'Finanțare', url: '/finantare' },
          { name: 'Firme', url: '/finantare/firme' },
        ])}
      />
      <JsonLd data={generateFAQJsonLd(faqs)} />

      <article className="max-w-4xl mx-auto px-4 py-6">
        <Breadcrumbs
          items={[{ label: 'Finanțare', href: '/finantare' }, { label: 'Firme' }]}
        />

        <div className="mt-6 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
            Finanțare pentru proiecte fotovoltaice: ce opțiuni are o firmă în 2026
          </h1>
          <p className="text-gray-500 mt-3 text-lg">
            Patru variante prin care se plătește un sistem fotovoltaic pe hală, depozit sau fabrică, ce
            presupune fiecare și ce se uită finanțatorul la dumneavoastră înainte să spună da.
          </p>
        </div>

        {/* Partenerii stau ÎNAINTEA tabelului, nu după: pagina asta există ca să-i
            promoveze, iar dacă îi pui sub patru rânduri de tabel îi vede jumătate
            din cine intră. Fundalul navy îi desparte de restul paginii și îi scoate
            din albul în care se pierdeau. */}
        <section className="mb-10 rounded-2xl bg-gradient-to-br from-secondary-dark via-secondary to-secondary-light p-6 sm:p-7">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-primary mb-1.5">
            Parteneri de finanțare
          </p>
          <h2 className="text-xl font-bold text-white">Cu cine puteți vorbi direct</h2>
          <p className="text-white/70 text-sm leading-relaxed mt-2 mb-5">
            Firmele de mai jos lucrează cu proiecte fotovoltaice și le puteți contacta direct.
            Sunt parteneri comerciali ai platformei, nu instalatori din{' '}
            <Link href="/firme" className="underline decoration-white/40 hover:text-white">
              directorul de firme verificate
            </Link>
            . Nu primim comision din finanțările încheiate și nu facem analiză de credit.
          </p>

          {/* Bannerul e desenat pentru fundal deschis: are `bg-primary/5` peste alb,
              iar etichetele „Publicitate" și „Firma ta aici?" sunt gri. Pus direct
              pe navy ieșeau închis pe închis. Suprafața albă de dedesubt îl lasă să
              se compună exact cum o face pe restul site-ului. */}
          <div className="rounded-xl bg-white">
            <SponsorBanner position="finantare-firme" />
          </div>

          <p className="mt-4 text-sm text-white/70">
            Varianta fără investiție proprie e cea mai puțin cunoscută dintre cele patru.{' '}
            <Link
              href="/parteneri/helexia"
              className="font-semibold text-primary underline decoration-primary/40 underline-offset-2 hover:text-primary-light"
            >
              Vedeți cum funcționează, pas cu pas
            </Link>
            .
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Cele patru variante, comparate</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            Diferența dintre ele nu e dobânda, ci cine rămâne proprietar și ce scoateți din
            buzunar la început. Restul se negociază.
          </p>

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm min-w-[46rem]">
              <thead className="bg-surface text-left">
                <tr>
                  {['Variantă', 'Cine deține sistemul', 'La început', 'Ce vi se cere'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 font-semibold text-gray-900 text-xs uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROUTES.map((r) => (
                  <tr key={r.name} className="align-top hover:bg-surface/50 transition-colors">
                    <td className="px-4 py-3 border-b border-border/50">
                      <span className="font-semibold text-secondary">{r.name}</span>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{r.best}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 border-b border-border/50">{r.owner}</td>
                    <td className="px-4 py-3 border-b border-border/50">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                          r.upfront === 'Zero'
                            ? 'bg-primary/15 text-primary-dark'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {r.upfront}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 border-b border-border/50">{r.asks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <InstallerCta
          sursa={SURSA}
          segment="comercial"
          title="Aflați întâi cât costă proiectul dumneavoastră"
          description="Înainte de orice discuție de finanțare aveți nevoie de o ofertă fermă, pentru că fără ea nu se poate calcula nici rata, nici avansul. Spuneți-ne ce aveți nevoie și primiți oferte de la instalatori atestați ANRE."
          ctaLabel="Cere oferte gratuit"
        />

        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Ce sumă aveți de acoperit</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            Înainte să vorbiți de rate, trebuie să știți despre ce sumă e vorba. Mai jos sunt
            ordinele de mărime pe câteva dimensiuni uzuale, ca să vă puteți face o idee
            înainte de prima discuție.
          </p>

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm min-w-[34rem]">
              <thead className="bg-surface text-left">
                <tr>
                  {['Sistem', 'Valoare proiect', 'Prag RON/kWp', 'Tipic pentru'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 font-semibold text-gray-900 text-xs uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sizes.map((b) => (
                  <tr key={b.kwp} className="hover:bg-surface/50 transition-colors">
                    <td className="px-4 py-2.5 font-semibold text-gray-900 border-b border-border/50">
                      {b.kwp} kWp
                    </td>
                    <td className="px-4 py-2.5 border-b border-border/50">
                      <span className="font-semibold text-primary-dark">
                        {b.total >= 1_000_000
                          ? `~${(b.total / 1_000_000).toFixed(2).replace('.', ',')} mil. lei`
                          : `~${Math.round(b.total / 1000)}.000 lei`}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-gray-600 border-b border-border/50">
                      {formatCurrency(b.price)}
                    </td>
                    <td className="px-4 py-2.5 text-gray-600 border-b border-border/50">{b.hint}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-xs text-gray-500 leading-relaxed">
            <strong className="font-semibold text-gray-600">Prețuri fără TVA</strong>, ordine de
            mărime, nu oferte. Pragurile pe kWp sunt cele publicate în{' '}
            <Link
              href="/ghid/sisteme-fotovoltaice-comerciale-2026-pillar-decident-firma"
              className="underline hover:text-gray-700"
            >
              ghidul pentru firme
            </Link>{' '}
            (intervale de piață 2026: 4.300 - 4.700 sub 50 kWp, 3.600 - 4.000 între 50 și 200,
            3.300 - 3.700 peste 200), nu mediane din oferte scanate: peste 20 kWp nu există
            oferte publice comparabile. Un proiect comercial are în plus racord trifazat, aviz
            tehnic de racordare și avize care nu intră într-un preț de catalog. Din suma de mai
            sus scădeți partea acoperită de un program, iar ce rămâne e ce finanțați. Pentru un
            calcul pe consumul firmei dumneavoastră, folosiți{' '}
            <Link
              href="/calculator-panouri-fotovoltaice?segment=comercial"
              className="underline hover:text-gray-700"
            >
              calculatorul
            </Link>
            .
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Ce pregătiți pentru dosar</h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            Cam asta cere oricare dintre ei, indiferent de variantă. Cu toate pregătite, un răspuns
            vine în zile, nu în săptămâni.
          </p>
          <ul className="rounded-lg border border-border divide-y divide-border/60 bg-white">
            {CHECKS.map(([label, note]) => (
              <li key={label} className="flex gap-3 px-4 py-3">
                <svg
                  className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.8 3.8 6.8-6.8a1 1 0 0 1 1.4 0Z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm text-gray-600 leading-relaxed">
                  <span className="font-semibold text-gray-900">{label}.</span> {note}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            Programele care reduc suma de finanțat
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            Nu sunt finanțare, ci scad valoarea pe care o aveți de acoperit. Ferestrele de mai jos
            sunt cele confirmate din actele oficiale, nu din presă. Fiecare are ghidul lui, cu
            condițiile complete.
          </p>

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-surface text-left">
                <tr>
                  <th className="px-4 py-2.5 font-semibold text-gray-900 text-xs uppercase tracking-wide">
                    Program
                  </th>
                  <th className="px-4 py-2.5 font-semibold text-gray-900 text-xs uppercase tracking-wide">
                    Pentru cine
                  </th>
                  <th className="px-4 py-2.5 font-semibold text-gray-900 text-xs uppercase tracking-wide">
                    Fereastră
                  </th>
                </tr>
              </thead>
              <tbody>
                {PROGRAMS.map((p) => (
                  <tr key={p.name} className="hover:bg-surface/50 transition-colors align-top">
                    <td className="px-4 py-2.5 border-b border-border/50">
                      <Link href={p.href} className="font-semibold text-gray-900 underline hover:text-primary-dark">
                        {p.name}
                      </Link>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{p.note}</p>
                    </td>
                    <td className="px-4 py-2.5 text-gray-600 border-b border-border/50">{p.who}</td>
                    <td className="px-4 py-2.5 text-gray-600 border-b border-border/50">{p.window}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-3">
            De ce nu găsiți dobânzi și rate pe pagina asta
          </h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            Pentru că nu suntem finanțator și nu vrem să dăm cifre pe care nu le putem onora. La o
            firmă, costul finanțării se stabilește pe dosar: contează bilanțul, vechimea, valoarea
            proiectului, avansul și garanțiile. Orice rată pe care am publica-o aici ar fi o
            ilustrare care nu are cum să semene cu oferta pe care o primiți dumneavoastră. Ce putem
            susține cu date proprii e costul sistemului, și pe acela îl publicăm mai sus.
          </p>
        </section>

        <section id="faq" className="scroll-mt-20 mb-10">
          <FAQ items={faqs} title="Întrebări frecvente despre finanțarea proiectelor pe firmă" />
        </section>

        <InstallerCta
          sursa={SURSA}
          segment="comercial"
          title="Gata să cereți oferte?"
          description="Primiți oferte de la instalatori atestați ANRE care lucrează proiecte comerciale în județul dumneavoastră. La pasul de detalii puteți spune ce variantă de finanțare vă interesează."
          ctaLabel="Cere oferte gratuit"
        />

        <div className="border-t border-border pt-8">
          <h3 className="font-bold text-gray-900 mb-4">Ghiduri legate</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                href: '/ghid/sisteme-fotovoltaice-comerciale-2026-pillar-decident-firma',
                label: 'Sisteme fotovoltaice comerciale: ghidul decidentului',
              },
              {
                href: '/ghid/amortizare-panouri-fotovoltaice-2026',
                label: 'În cât se amortizează un sistem fotovoltaic',
              },
              {
                href: '/ghid/sistem-fotovoltaic-50-100-250-kw-firma-pret-suprafata-productie',
                label: 'Sistem de 50, 100 sau 250 kW: preț și producție',
              },
              {
                href: '/finantare',
                label: 'Panouri fotovoltaice în rate (persoane fizice)',
              },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="p-4 rounded-lg border border-border hover:border-primary/30 hover:shadow-sm transition-all text-sm font-medium text-gray-900"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </article>
    </>
  );
}
