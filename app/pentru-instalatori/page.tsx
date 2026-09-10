import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import Button from '@/components/ui/Button';
import SponsorBanner from '@/components/sponsor/SponsorBanner';
import { generateBreadcrumbJsonLd, generateFAQJsonLd } from '@/lib/seo';
import { getTotalStats } from '@/lib/utils';
import { MAX_CLAIMS_PER_LEAD, claimOccupiesLeadSlot, getClaims, getPublicLeads } from '@/lib/sheets';

/**
 * Pagina de recrutare a instalatorilor.
 *
 * Nu e o pagină de SEO: canalul care aduce firme e Facebook plus telefonul, iar
 * Google n-a produs nicio revendicare în 90 de zile (diagnostic 7 sept 2026).
 * Deci e destinația pentru postările cu cereri și pentru omul pe care tocmai
 * l-am sunat, nu o pagină construită pentru un cuvânt cheie.
 *
 * Argumentul central e singurul pe care un concurent cu ambalaj mai frumos nu-l
 * poate copia: cererile sunt reale, sunt aici, iar unele stau nerevendicate
 * chiar acum. De asta toate cifrele de pe pagină sunt live din Sheets, nu
 * scrise de mână: dacă mâine nu mai sunt cereri libere, pagina spune asta.
 */
export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Pentru Instalatori: Cereri Reale, Gratuit, Fără Comision',
  description:
    'Ești firmă de instalare fotovoltaice? Primești cereri reale de la clienți din județul tău, cu date complete de contact. Fără comision, fără abonament, maxim 3 firme per cerere.',
  alternates: { canonical: '/pentru-instalatori' },
};

const FAQ = [
  {
    question: 'Cât costă să primesc cereri?',
    answer:
      'Nimic. Nu percepem comision la contract, nu vindem lead-uri la bucată și nu există abonament obligatoriu. Listarea firmei, revendicarea cererilor și accesul în portal sunt gratuite. Platforma se susține din publicitate, iar firmele care vor vizibilitate suplimentară pot alege un pachet de promovare, complet separat de cereri.',
  },
  {
    question: 'Ce primesc, concret, când revendic o cerere?',
    answer:
      'Datele complete ale clientului: nume, telefon, email, localitate, plus tot ce a completat în formular (tip de lucrare, acoperiș, consum, fazare, buget și ruta de finanțare, termen, dacă vrea baterie sau stație de încărcare). Nu e un contact anonimizat și nu trebuie să aștepți ca un client să îți accepte oferta ca să afli cu cine vorbești.',
  },
  {
    question: 'La câte firme ajunge aceeași cerere?',
    answer: `Maximum ${MAX_CLAIMS_PER_LEAD}. E o limită de produs, nu o promisiune comercială: o cerere trimisă la zece firme nu mai valorează nimic pentru niciuna dintre ele. Când cele ${MAX_CLAIMS_PER_LEAD} locuri sunt ocupate, cererea apare ca plină în feed. Dacă o firmă renunță, locul se eliberează.`,
  },
  {
    question: 'De ce mă sunați înainte să primesc contactul?',
    answer:
      'Ca să confirmăm că revendicarea vine de la o firmă de instalare reală. Până la apel vezi detaliile de proiect, dar nu și datele clientului. E singurul filtru pe care îl avem ca omul care a lăsat cererea să nu fie sunat de oricine, iar durează un telefon scurt.',
  },
  {
    question: 'Ce fel de cereri primiți, rezidențiale sau comerciale?',
    answer:
      'Ambele, dar în perioada aceasta majoritatea sunt rezidențiale: case, prosumatori care vor baterie, sisteme de 3 până la 10 kW. Cererile comerciale (hale, sedii, ferme) există, dar sunt mai rare. Cifrele de pe această pagină arată exact ce e liber acum, pe județe, ca să vezi înainte să te înscrii dacă merită pentru tine.',
  },
  {
    question: 'Ce trebuie să aibă firma mea?',
    answer:
      'Atestat ANRE valabil, pe care îl verificăm live în registrul oficial, și firmă cu CUI valid. Nu cerem vechime minimă, portofoliu sau poliță de asigurare, dar verificăm atestatul de fiecare dată, iar profilul tău public arată vizitatorilor exact ce am găsit în registru.',
  },
  {
    question: 'Ce se întâmplă dacă nu reușesc să închid cererea?',
    answer:
      'Marchezi în portal ce s-a întâmplat (ai ofertat, clientul a amânat, a ales pe altcineva) și eliberezi locul. Nu ai nimic de plătit și nu ai nicio penalizare. Ne interesează motivul, fiindcă așa aflăm unde se pierd cererile.',
  },
  {
    question: 'Cum îmi apar cererile noi, fără să intru zilnic pe site?',
    answer:
      'Din portal îți bifezi județele care te interesează și primești un email la fiecare cerere nouă de acolo. Intrarea în portal se face cu emailul firmei, fără parolă: primești un link și un cod de șase cifre.',
  },
];

/**
 * Acordul cu „de”: în română, numeralele de la 20 în sus cer prepoziția înainte
 * de substantiv („26 de cereri”, dar „7 cereri”). Cifrele de pe pagină sunt
 * live, deci forma corectă nu poate fi scrisă de mână în text.
 */
function numaral(n: number): string {
  const last2 = n % 100;
  return last2 === 0 || last2 > 19 ? `${n} de` : String(n);
}

/** Cifra mare dintr-un card de statistică. */
function Stat({ value, label, tone = 'default' }: { value: string; label: string; tone?: 'default' | 'accent' }) {
  return (
    <div
      className={`rounded-xl border p-4 sm:p-5 ${
        tone === 'accent' ? 'border-primary/40 bg-primary/5' : 'border-border bg-white'
      }`}
    >
      <p className={`text-2xl sm:text-3xl font-bold ${tone === 'accent' ? 'text-primary-dark' : 'text-gray-900'}`}>
        {value}
      </p>
      <p className="text-sm text-gray-600 mt-1">{label}</p>
    </div>
  );
}

export default async function PentruInstalatoriPage() {
  const stats = getTotalStats();

  // Cifrele live. Dacă Sheets pică, pagina rămâne funcțională și pur și simplu
  // nu afișează secțiunea de cereri libere — mai bine fără cifre decât cu cifre
  // vechi lipite în cod.
  let openLeads: Awaited<ReturnType<typeof getPublicLeads>> = [];
  let occupied: Record<string, number> = {};
  let sheetsOk = true;
  try {
    const [leads, claims] = await Promise.all([getPublicLeads(), getClaims()]);
    openLeads = leads;
    occupied = {};
    for (const c of claims) {
      if (!claimOccupiesLeadSlot(c)) continue;
      occupied[c.leadId] = (occupied[c.leadId] || 0) + 1;
    }
  } catch (err) {
    console.error('[pentru-instalatori] failed to load leads:', err);
    sheetsOk = false;
  }

  const DAY = 86_400_000;
  const isRecent = (id: string, days: number) => Date.now() - Date.parse(id) < days * DAY;

  const newLast30 = openLeads.filter((l) => isRecent(l.id, 30)).length;
  const free = openLeads.filter((l) => !(occupied[l.id] > 0));
  const freeLast30 = free.filter((l) => isRecent(l.id, 30)).length;

  const byCounty = new Map<string, number>();
  for (const l of free) {
    const j = l.judet.trim();
    if (!j) continue;
    byCounty.set(j, (byCounty.get(j) || 0) + 1);
  }
  const countyRows = [...byCounty.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ro'));
  const residential = free.filter((l) => l.segment !== 'comercial').length;

  const hasFree = sheetsOk && free.length > 0;

  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: 'Acasă', url: '/' },
          { name: 'Pentru Instalatori', url: '/pentru-instalatori' },
        ])}
      />
      <JsonLd data={generateFAQJsonLd(FAQ)} />

      <div className="max-w-4xl mx-auto px-4 py-6">
        <Breadcrumbs items={[{ label: 'Pentru Instalatori' }]} />

        {/* ── Hero ─────────────────────────────────────────────── */}
        <div className="mt-6">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary-dark">
            Pentru firmele de instalare
          </p>
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mt-2 leading-tight">
            Cereri reale de la clienți, cu date complete de contact. Gratuit.
          </h1>
          <p className="text-gray-600 mt-4 text-base sm:text-lg">
            Oamenii ne caută pe Google când vor panouri sau baterii, completează un formular și cererea
            ajunge aici. Tu o revendici, primești contactul întreg și vorbești direct cu clientul. Fără
            comision la contract, fără plată per cerere, fără abonament obligatoriu.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button href="/cereri" size="lg">
              Vezi cererile deschise
            </Button>
            <Button href="/listeaza-firma" variant="outline" size="lg">
              Listează-ți firma gratuit
            </Button>
          </div>
        </div>

        {/* ── Cifre live ───────────────────────────────────────── */}
        {sheetsOk && (
          <section className="mt-10">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Cum arată platforma chiar acum</h2>
            <p className="text-sm text-gray-500 mb-4">
              Cifrele se actualizează automat din cererile primite. Nu sunt un exemplu, sunt starea de azi.
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Stat value={String(newLast30)} label="cereri noi în ultimele 30 de zile" />
              <Stat value={String(free.length)} label="cereri pe care nu le-a luat încă nicio firmă" tone="accent" />
              <Stat value={String(countyRows.length)} label="județe cu cereri libere acum" />
              <Stat value="0 lei" label="cât plătești ca să le iei" tone="accent" />
            </div>
            {hasFree && (
              <p className="text-sm text-gray-600 mt-3">
                Din cele {numaral(free.length)} cereri libere, {freeLast30} au intrat în ultimele 30 de zile
                și {residential} sunt rezidențiale. Asta e realitatea de acum: cererea rezidențială e mai
                mare decât numărul firmelor care o lucrează.
              </p>
            )}
          </section>
        )}

        {/* ── Cereri libere pe județ ───────────────────────────── */}
        {hasFree && (
          <section className="mt-10">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Unde stau cererile nerevendicate</h2>
            <p className="text-sm text-gray-500 mb-4">
              Fiecare cerere de mai jos are toate cele {MAX_CLAIMS_PER_LEAD} locuri libere. Dacă lucrezi
              într-unul din județele astea, poți lua una azi.
            </p>
            <div className="rounded-xl border border-border bg-white overflow-hidden">
              <ul className="divide-y divide-border">
                {countyRows.map(([judet, n]) => (
                  <li key={judet} className="flex items-center justify-between gap-4 px-4 py-2.5">
                    <span className="text-sm font-medium text-gray-900">{judet}</span>
                    <span className="text-sm text-gray-600">
                      {n === 1 ? '1 cerere liberă' : `${numaral(n)} cereri libere`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-4">
              <Button href="/cereri">Deschide feedul de cereri</Button>
            </div>
          </section>
        )}

        {/* Partenerii B2B: pagina e citită de instalatori, la fel ca /cereri. */}
        <div className="mt-10">
          <SponsorBanner position="listeaza-firma" title="Parteneri pentru instalatori" />
        </div>

        {/* ── Împărțirea muncii ───────────────────────────────── */}
        <section className="mt-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Cine ce face</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Ce facem noi</h3>
              <ul className="space-y-2.5 text-sm text-gray-700">
                <li>Aducem oamenii din căutări Google, cu ghiduri și calculatoare, nu cu reclame plătite.</li>
                <li>Îi punem să completeze un formular în cinci pași, ca să știi din start ce vrea fiecare.</li>
                <li>Publicăm cererea și trimitem alertă pe email firmelor care au bifat județul.</li>
                <li>Te sunăm pentru confirmare și îți deblocăm datele clientului în portal.</li>
                <li>Îți dăm o pagină publică de firmă, cu datele din registre și atestatul ANRE verificat live.</li>
              </ul>
            </div>
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Ce faci tu</h3>
              <ul className="space-y-2.5 text-sm text-gray-700">
                <li>Alegi cererile care ți se potrivesc, în județele în care lucrezi.</li>
                <li>Suni clientul repede. Viteza e singurul lucru care decide cine ia lucrarea.</li>
                <li>Ofertezi și închizi direct cu el, fără noi la mijloc și fără comision.</li>
                <li>Marchezi în portal ce s-a întâmplat și eliberezi locul dacă nu merge.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ── Diferența ───────────────────────────────────────── */}
        <section className="mt-10">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Cu ce e diferit de o platformă de lead-uri</h2>
          <p className="text-sm text-gray-500 mb-4">
            Nu suntem un intermediar care ține clientul de partea lui. Suntem un director public de firme,
            în care cererile ajung deschis.
          </p>
          <div className="overflow-x-auto rounded-xl border border-border bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface text-left">
                  <th className="px-4 py-3 font-semibold text-gray-700"></th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Platformă de lead-uri</th>
                  <th className="px-4 py-3 font-semibold text-primary-dark">Aici</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-900">Costul</td>
                  {/* Costul care doare nu e prețul pe cerere, e comisionul din
                      lucrarea care chiar s-a făcut: se ia din marja pe care ai
                      muncit-o, nu din bugetul de marketing. */}
                  <td className="px-4 py-3 text-gray-600">
                    Comision din fiecare lucrare concretizată, deseori și preț per cerere
                  </td>
                  <td className="px-4 py-3 text-gray-900 font-medium">Gratuit</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-900">Contactul clientului</td>
                  <td className="px-4 py-3 text-gray-600">Anonim până acceptă clientul oferta ta</td>
                  <td className="px-4 py-3 text-gray-900 font-medium">Complet, imediat după apelul de confirmare</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-900">Unde îți administrezi cererile</td>
                  <td className="px-4 py-3 text-gray-600">Dashboard-ul platformei</td>
                  <td className="px-4 py-3 text-gray-900 font-medium">
                    Portal propriu: status, notițe, alerte pe județ, pozele clientului
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-900">Câte firme pe aceeași cerere</td>
                  <td className="px-4 py-3 text-gray-600">Cinci, zece, uneori nelimitat</td>
                  <td className="px-4 py-3 text-gray-900 font-medium">Maximum {MAX_CLAIMS_PER_LEAD}</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-900">Firma ta, public</td>
                  <td className="px-4 py-3 text-gray-600">Nu apari nicăieri, platforma e brandul</td>
                  <td className="px-4 py-3 text-gray-900 font-medium">
                    Pagină proprie, indexată, cu CUI și atestat ANRE
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-900">Cine ține relația</td>
                  <td className="px-4 py-3 text-gray-600">Platforma, prin chat și notificări</td>
                  <td className="px-4 py-3 text-gray-900 font-medium">Tu, direct la telefon cu omul</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Coloana din stânga descrie tiparul obișnuit al platformelor de intermediere din România, nu o
            firmă anume.
          </p>
        </section>

        {/* ── Ce cerem ────────────────────────────────────────── */}
        <section className="mt-10">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Ce cerem de la o firmă</h2>
          <p className="text-sm text-gray-500 mb-4">
            Puțin, dar verificăm de fiecare dată. Omul care a lăsat cererea are dreptul să fie sunat de
            cineva real.
          </p>
          <div className="grid sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-border bg-white p-4">
              <p className="font-semibold text-gray-900 text-sm mb-1">Atestat ANRE valabil</p>
              <p className="text-sm text-gray-600">
                Îl verificăm live în registrul oficial, nu îl luăm pe declarație. Îl poți verifica și tu pe{' '}
                <Link href="/verificare-anre" className="text-primary-dark underline hover:no-underline">
                  pagina de verificare
                </Link>
                .
              </p>
            </div>
            <div className="rounded-xl border border-border bg-white p-4">
              <p className="font-semibold text-gray-900 text-sm mb-1">Firmă cu CUI valid</p>
              <p className="text-sm text-gray-600">
                Datele de identificare și bilanțul le luăm din registre publice și le afișăm pe profilul tău.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-white p-4">
              <p className="font-semibold text-gray-900 text-sm mb-1">Un telefon de confirmare</p>
              <p className="text-sm text-gray-600">
                La prima revendicare te sunăm scurt. Până atunci vezi proiectul, dar nu și datele clientului.
              </p>
            </div>
          </div>
        </section>

        {/* ── Cum începi ──────────────────────────────────────── */}
        <section className="mt-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Cum începi</h2>
          <ol className="space-y-3">
            {[
              {
                t: 'Listează-ți firma',
                d: 'Un formular scurt. Îți construim profilul public cu datele din registre și te trecem pe județele în care lucrezi.',
                href: '/listeaza-firma',
                cta: 'Completează formularul',
              },
              {
                t: 'Revendică o cerere',
                d: 'Intri pe feedul de cereri, alegi una din județul tău și apeși „Vreau această cerere". Durează treizeci de secunde.',
                href: '/cereri',
                cta: 'Vezi cererile',
              },
              {
                t: 'Lucrează din portal',
                d: `Vezi datele clientului, îți notezi ce ai discutat, bifezi județele pentru alerte pe email și eliberezi locurile la care renunți. Intri cu emailul firmei, fără parolă.`,
                href: '/portal',
                cta: 'Deschide portalul',
              },
            ].map((s, i) => (
              <li key={s.t} className="rounded-xl border border-border bg-white p-5 flex gap-4">
                <span className="shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary-dark font-bold inline-flex items-center justify-center">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">{s.t}</p>
                  <p className="text-sm text-gray-600 mt-1">{s.d}</p>
                  <Link
                    href={s.href}
                    className="inline-block mt-2 text-sm font-semibold text-primary-dark underline hover:no-underline"
                  >
                    {s.cta}
                  </Link>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* ── Contextul directorului ──────────────────────────── */}
        <section className="mt-10 rounded-xl border border-border bg-surface p-5">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Unde intri</h2>
          <p className="text-sm text-gray-700">
            Directorul are {stats.companiesCount} de firme verificate, în {stats.countiesCount} de județe, cu
            date luate din registre publice și atestate ANRE verificate în registrul oficial. Fiecare firmă
            are pagină proprie, apare în filtrele după județ și specializare și intră în{' '}
            <Link href="/clasament" className="text-primary-dark underline hover:no-underline">
              clasamentul după cifre reale
            </Link>
            . Listarea nu costă nimic și nu se plătește niciodată pentru poziție în listă.
          </p>
        </section>

        {/* ── FAQ ─────────────────────────────────────────────── */}
        <section className="mt-10" id="faq">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Întrebări frecvente</h2>
          <div className="space-y-3">
            {FAQ.map((f) => (
              <details key={f.question} className="rounded-xl border border-border bg-white p-4 group">
                <summary className="font-semibold text-gray-900 cursor-pointer list-none flex items-start justify-between gap-3">
                  <span>{f.question}</span>
                  <span className="text-gray-400 shrink-0 transition-transform group-open:rotate-180" aria-hidden>
                    ▾
                  </span>
                </summary>
                <p className="text-sm text-gray-600 mt-3">{f.answer}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ── CTA final ───────────────────────────────────────── */}
        <section className="mt-10 rounded-xl border border-primary/30 bg-primary/5 p-6 text-center">
          <h2 className="text-xl font-bold text-gray-900">
            {hasFree
              ? `Sunt ${numaral(free.length)} cereri libere acum. Ia una.`
              : 'Înscrie-ți firma și prinzi următoarea cerere din județul tău.'}
          </h2>
          <p className="text-sm text-gray-600 mt-2">
            Gratuit, fără contract și fără obligația de a lua o cerere pe care nu o vrei.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 justify-center">
            <Button href="/cereri" size="lg">
              Vezi cererile deschise
            </Button>
            <Button href="/listeaza-firma" variant="outline" size="lg">
              Listează-ți firma
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}
