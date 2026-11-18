import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import BatteryWidget from '@/components/BatteryWidget';
import CvbAlertForm from '@/components/forms/CvbAlertForm';
import InstallerCta from '@/components/InstallerCta';
import PremiumPoolSection from '@/components/promo/PremiumPoolSection';
import SponsorBanner from '@/components/sponsor/SponsorBanner';
import { generateFAQJsonLd, generateBreadcrumbJsonLd } from '@/lib/seo';
import { formatCurrency, formatNumber } from '@/lib/utils-shared';
import {
  PROGRAM,
  REFERENCE_PROFILES,
  OWN_SHARE_FOR_MAX_POINTS,
  scoreFor,
  grantFor,
} from '@/lib/battery-sizing';

// Pagina de unealtă pentru Casa Verde Baterii. Există separat de ghid dintr-un
// motiv măsurat: pe „casa verde baterii punctaj", locul 1 din SERP e un
// simulator pe URL propriu (programulcasaverde.ro/simulator.php), iar kilowat și
// siana-energie au și ele pagini dedicate. Noi aveam motorul de punctaj scris,
// dar montat exclusiv în interiorul ghidurilor, deci fără nimic de indexat pe
// intenția „calculator/simulator".
//
// Nicio formulă nu se rescrie aici: tot ce se calculează vine din
// `lib/battery-sizing.ts`, aceleași funcții pure pe care le folosește widgetul.
// Tabelul de profiluri se randează pe server din `scoreFor` și `grantFor`, ca
// să nu existe cifre bătute în cui care s-ar putea desincroniza de simulator.
//
// Ghidul rămâne pagina care explică programul articol cu articol; aici e
// unealta. Fiecare trimite spre celălalt o singură dată.

const GUIDE_HREF = '/ghid/casa-verde-baterii-2026-program-stocare-afm';

/** Ziua în care ministrul Mediului a semnat ordinul de aprobare. */
const SIGNED_LABEL = '11 septembrie 2026';
/** Numărul ordinului și publicarea în Monitorul Oficial. */
const ORDER_LABEL = 'Ordinul nr. 1.904/2026';
const MO_LABEL = 'Monitorul Oficial nr. 775 din 14 septembrie 2026';
const AFM_HREF = 'https://www.afm.ro/baterii_ghid.php';

/**
 * Capacitatea de la care baza eligibilă atinge plafonul absolut de finanțare.
 * Rotunjită în sus la o zecimală: e pragul „de la care", deci 13,33 kWh nu
 * ajunge, 13,4 da.
 */
const KWH_FOR_MAX_GRANT =
  Math.ceil((PROGRAM.maxGrant / PROGRAM.maxShare / PROGRAM.costStandardPerKwh) * 10) / 10;

/** O zecimală doar când există: 35,0 devine 35, 47,5 rămâne 47,5. */
const dec = (n: number) => n.toLocaleString('ro-RO', { maximumFractionDigits: 1 });

const faqs = [
  {
    question: 'Cum se calculează punctajul la Casa Verde Baterii 2026?',
    answer:
      'Pe trei criterii, maximum 100 de puncte, în forma din Ordinul nr. 2.314 din 13 noiembrie 2026 (Monitorul Oficial nr. 953 din 16 noiembrie 2026). Contribuția proprie: 37,5 × (contribuția proprie împărțită la suma cerută de la AFM) − 2,5, cu minimum 10 și maximum 35 de puncte; maximul se atinge când contribuția e cel puțin egală cu suma cerută. Capacitatea sistemului de stocare: 4 × kWh − 20, deci 20 de puncte la 10 kWh și maximul de 40 de la 15 kWh. Finanțări anterioare: 25 de puncte pentru cine nu a mai primit bani publici pentru un sistem de stocare, 0 pentru cine a primit. Formula veche, cu două criterii de câte 50 de puncte și maximul la 20 kWh, nu mai e în vigoare.',
  },
  {
    question: 'Cât primești, de fapt, pentru o baterie de 10 kWh?',
    answer:
      'La capacitatea minimă de 10 kWh, standardul de cost de 1.500 lei/kWh dă o bază eligibilă de 15.000 lei. Finanțarea e 75% din ea, adică 11.250 lei, iar contribuția ta este de 3.750 lei. Plafonul de 15.000 lei nu se atinge la capacitatea minimă, contrar felului în care a fost titrată suma în presă.',
  },
  {
    question: 'De la ce capacitate primești toți cei 15.000 de lei?',
    answer:
      'Plafonul absolut de 15.000 lei se atinge de la o bază eligibilă de 20.000 lei, adică de la aproximativ 13,4 kWh la standardul de cost de 1.500 lei/kWh. Peste această capacitate finanțarea nu mai crește, dar punctajul pe capacitate continuă să crească până la 15 kWh.',
  },
  {
    question: 'Cât trebuie să pui din buzunar pentru punctaj maxim pe contribuție?',
    answer:
      'Cele 35 de puncte pe criteriul contribuției se ating când contribuția ta e cel puțin egală cu suma cerută de la AFM, adică de la 50% din valoarea totală a proiectului. La contribuția minimă de 25% criteriul dă 10 puncte. Exemplul din comunicatul AFM din 17 noiembrie 2026: 5.000 lei contribuție la 15.000 lei finanțare înseamnă 10 puncte, iar o contribuție de cel puțin 15.000 lei înseamnă 35. În valoarea totală a proiectului intră și cheltuielile neeligibile, de exemplu invertorul hibrid (art. 7 alin. 1 lit. cc).',
  },
  {
    question: 'Pot aplica dacă am mai primit finanțare pentru o baterie?',
    answer:
      'Da, din 16 noiembrie 2026. Ordinul nr. 2.314/2026 a introdus la art. 15 alin. (1^1): cine a beneficiat anterior de finanțare din fonduri publice pentru un sistem de stocare este eligibil, dacă cere bani pentru un sistem nou, distinct de cel finanțat anterior. Nu se finanțează de două ori aceleași cheltuieli. Diferența se vede la punctaj: criteriul finanțărilor anterioare dă 0 puncte în loc de 25.',
  },
  {
    question: 'Când se deschide sesiunea de înscrieri la Casa Verde Baterii?',
    answer:
      'Persoanele fizice se înscriu între 20 noiembrie 2026, ora 10:00, și 25 noiembrie 2026, ora 23:59, prin aplicația AFM. Datele sunt fixate prin Dispoziția președintelui AFM nr. 454 din 6 noiembrie 2026, care alocă sesiunii 400 milioane lei. Instalatorii se validează înainte, între 16 noiembrie, ora 10:00, și 20 noiembrie 2026, ora 23:59. Ghidul e aprobat prin Ordinul ministrului mediului nr. 1.904 din 11 septembrie 2026 (Monitorul Oficial nr. 775 din 14 septembrie 2026) și modificat prin Ordinul nr. 2.314 din 13 noiembrie 2026 (Monitorul Oficial nr. 953 din 16 noiembrie 2026), care a schimbat punctajul. Selecția se face pe punctaj după închiderea sesiunii, deci prima zi nu dă avantaj. Calculatorul folosește cifrele din cele două ordine.',
  },
];

export const metadata: Metadata = {
  title: 'Calculator Casa Verde Baterii 2026: Punctaj și Finanțare AFM',
  description:
    'Calculează punctajul Casa Verde Baterii 2026 pe formula nouă: 40 de puncte capacitate, 35 contribuție, 25 fără finanțare anterioară. Plafon 1.500 lei/kWh.',
  alternates: { canonical: '/calculator-casa-verde-baterii' },
  openGraph: {
    type: 'website',
    url: '/calculator-casa-verde-baterii',
    title: 'Calculator Casa Verde Baterii 2026: Punctaj și Finanțare AFM',
    description:
      'Ce punctaj ai, cât primești de la AFM și cât pui din buzunar, pe formula de punctaj din Ordinul nr. 2.314/2026.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Calculator Casa Verde Baterii 2026',
      },
    ],
  },
};

export default function CalculatorCasaVerdeBateriiPage() {
  // Profilurile sunt definite prin capacitate și contribuție, nu prin cost, așa
  // că suma proiectului o alegem noi. Nu la standardul de cost peste tot: la o
  // baterie de peste ~13,4 kWh, un proiect la standardul de cost ar cere de la
  // AFM peste plafonul de 15.000 lei, deci contribuția de 25% e imposibilă acolo.
  //
  // Luăm deci costul cel mai mare la care contribuția declarată chiar e
  // posibilă: minimul dintre standardul de cost și suma la care finanțarea
  // cerută atinge exact plafonul. Așa punctajele coincid cu `scoreFor`, adică
  // exact cifrele din widget.
  const profiles = REFERENCE_PROFILES.map((p) => {
    const cost = Math.min(
      p.capacity * PROGRAM.costStandardPerKwh,
      PROGRAM.maxGrant / (1 - p.ownShare)
    );
    const own = cost * p.ownShare;
    return {
      label: p.label,
      capacity: p.capacity,
      ownShare: p.ownShare,
      own,
      granted: Math.min(grantFor(p.capacity, cost).maxGrant, cost - own),
      score: scoreFor(p.capacity, p.ownShare),
    };
  });

  return (
    <>
      <JsonLd data={generateFAQJsonLd(faqs)} />
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: 'Acasă', url: '/' },
          { name: 'Calculator Casa Verde Baterii', url: '/calculator-casa-verde-baterii' },
        ])}
      />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: 'Calculator Casa Verde Baterii' }]} />

        <h1 className="text-3xl sm:text-4xl font-bold text-secondary-dark mt-4 mb-3">
          Calculator Casa Verde Baterii 2026: punctaj și finanțare
        </h1>
        <p className="text-gray-600 mb-4 text-lg">
          Pune capacitatea bateriei și cât ești dispus să pui din buzunar, iar calculatorul îți dă
          punctajul din 100, finanțarea pe care o primești de la AFM și suma care rămâne la tine.
          Pe formula de punctaj în vigoare din 16 noiembrie 2026, cu trei criterii, nu pe cea veche.
        </p>

        {/* Statusul programului stă deasupra uneltei, nu sub ea: cine intră aici
            caută și răspunsul la „când se deschide": datele din dispoziția AFM. */}
        <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-gray-800">
          <strong>Unde e programul acum:</strong> {ORDER_LABEL} (semnat pe {SIGNED_LABEL}) a fost
          publicat în {MO_LABEL}, în vigoare din 14 septembrie 2026. Persoanele fizice se înscriu
          între <strong>20 noiembrie, ora 10:00, și 25 noiembrie 2026, ora 23:59</strong>, după
          validarea instalatorilor din 16–20 noiembrie (Dispoziția președintelui AFM nr. 454 din 6
          noiembrie 2026). <strong>Punctajul s-a schimbat</strong> prin Ordinul nr. 2.314 din 13
          noiembrie 2026 (Monitorul Oficial nr. 953 din 16 noiembrie 2026): trei criterii în loc de
          două, cu maximul pe capacitate de la {PROGRAM.capacityForMaxPoints} kWh. Calculatorul
          folosește cifrele din cele două ordine (art. 5, 6, 16, 19). Sursa:{' '}
          <a
            href={AFM_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-dark underline hover:no-underline"
          >
            afm.ro/baterii_ghid.php
          </a>
          .
        </div>

        <BatteryWidget sursa="calculator-casa-verde-baterii" guideHref={GUIDE_HREF} />

        {/* Programul n-are dată, deci cel mai util lucru pe care îl poate face
            omul după ce vede punctajul e să ceară să fie anunțat. */}
        <div className="mt-8">
          <CvbAlertForm sursa="calculator-casa-verde-baterii" />
        </div>

        <section className="my-12 max-w-md mx-auto">
          <SponsorBanner position="calculator" />
        </section>

        <PremiumPoolSection
          title="Instalatori pentru baterii de stocare"
          subtitle="Firme atestate ANRE care montează sisteme de stocare"
        />

        <InstallerCta
          sursa="calculator-casa-verde-baterii"
          segment="rezidential"
          title="Vrei prețul real al bateriei, nu standardul de cost?"
          description="Spuneți-ne ce capacitate vă interesează și ce invertor aveți, iar instalatorii atestați ANRE din zonă vă trimit oferte. Gratuit."
        />

        {/* SEO content */}
        <section className="mt-16 space-y-6 text-gray-700 text-[15px] leading-relaxed">
          <h2 className="text-xl font-semibold text-secondary-dark">
            Cum se calculează punctajul
          </h2>
          <p>
            Selecția nu mai e „primul venit, primul servit”. Aplicația AFM calculează automat un
            punctaj din maximum{' '}
            {formatNumber(
              PROGRAM.maxPoints.contribution + PROGRAM.maxPoints.capacity + PROGRAM.maxPoints.noPriorFunding
            )}{' '}
            de puncte, pe trei criterii (art. 19 alin. 4, în forma din Ordinul nr. 2.314/2026), iar
            dosarele se finanțează în ordinea descrescătoare a punctajului, în limita bugetului:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong>Contribuția proprie, maximum {PROGRAM.maxPoints.contribution} de puncte:</strong>{' '}
              37,5 × (contribuția proprie ÷ suma cerută de la AFM) − 2,5, cu minimum{' '}
              {PROGRAM.minContributionPoints} puncte. Maximul se atinge la o contribuție de{' '}
              {dec(OWN_SHARE_FOR_MAX_POINTS * 100)}% din valoarea totală a proiectului, adică atunci
              când pui cel puțin cât ceri de la AFM.
            </li>
            <li>
              <strong>Capacitatea de stocare, maximum {PROGRAM.maxPoints.capacity} de puncte:</strong>{' '}
              4 × kWh − 20, deci {4 * PROGRAM.minKwh - 20} de puncte la {PROGRAM.minKwh} kWh, iar
              maximul se atinge de la {PROGRAM.capacityForMaxPoints} kWh.
            </li>
            <li>
              <strong>
                Fără finanțare anterioară, {PROGRAM.maxPoints.noPriorFunding} de puncte:
              </strong>{' '}
              le primește cine nu a mai beneficiat de finanțare din fonduri publice, naționale sau
              europene, pentru un sistem de stocare. Cine a beneficiat rămâne eligibil pentru un
              sistem nou, dar ia 0 puncte la acest criteriu.
            </li>
          </ul>
          <p>
            Față de forma din septembrie, maximul pe capacitate a coborât de la 20 la{' '}
            {PROGRAM.capacityForMaxPoints} kWh, iar contribuția cântărește mai puțin: 35 de puncte
            în loc de 50. Puterea sistemului fotovoltaic existent nu punctează. Cine nu a mai avut
            finanțare pentru stocare pornește cu 25 de puncte înainte de orice altă alegere.
          </p>

          <h2 className="text-xl font-semibold text-secondary-dark">
            Cele trei plafoane care se aplică simultan
          </h2>
          <p>
            Suma de {formatCurrency(PROGRAM.maxGrant)} din titlurile de presă e doar unul dintre
            plafoane, și nu cel care se atinge primul:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong>{formatNumber(PROGRAM.maxShare * 100)}%</strong> din valoarea proiectului, deci
              o contribuție proprie de minimum {formatNumber(PROGRAM.minOwnShare * 100)}%.
            </li>
            <li>
              <strong>{formatNumber(PROGRAM.costStandardPerKwh)} lei/kWh</strong> standard de cost, cu
              TVA. Ce depășește standardul intră integral în contribuția ta.
            </li>
            <li>
              <strong>{formatCurrency(PROGRAM.maxGrant)}</strong> plafon absolut per beneficiar.
            </li>
          </ul>
          <p>
            Din ele rezultă cifra pe care presa n-a preluat-o: la capacitatea minimă de{' '}
            {PROGRAM.minKwh} kWh, baza eligibilă e{' '}
            {formatCurrency(PROGRAM.minKwh * PROGRAM.costStandardPerKwh)}, iar finanțarea e{' '}
            {formatCurrency(PROGRAM.minKwh * PROGRAM.costStandardPerKwh * PROGRAM.maxShare)}, nu{' '}
            {formatCurrency(PROGRAM.maxGrant)}. Plafonul de {formatCurrency(PROGRAM.maxGrant)} se
            atinge abia de la aproximativ {dec(KWH_FOR_MAX_GRANT)} kWh.
          </p>

          <h2 className="text-xl font-semibold text-secondary-dark">
            Patru profiluri, calculate cu aceleași formule
          </h2>
          <p>
            Cifrele de mai jos ies din exact funcțiile pe care le folosește calculatorul, cu proiectul
            luat la cel mult standardul de cost de {formatNumber(PROGRAM.costStandardPerKwh)} lei/kWh
            și pentru un solicitant care nu a mai avut finanțare publică pentru stocare:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-surface text-left">
                  <th className="border border-border px-3 py-2 font-semibold">Profil</th>
                  <th className="border border-border px-3 py-2 font-semibold">Capacitate</th>
                  <th className="border border-border px-3 py-2 font-semibold">Contribuție</th>
                  <th className="border border-border px-3 py-2 font-semibold">De la AFM</th>
                  <th className="border border-border px-3 py-2 font-semibold">Punctaj</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((p) => (
                  <tr key={p.label}>
                    <td className="border border-border px-3 py-2">{p.label}</td>
                    <td className="border border-border px-3 py-2">{p.capacity} kWh</td>
                    <td className="border border-border px-3 py-2">
                      {dec(p.ownShare * 100)}% · {formatCurrency(p.own)}
                    </td>
                    <td className="border border-border px-3 py-2">{formatCurrency(p.granted)}</td>
                    <td className="border border-border px-3 py-2 font-semibold text-secondary">
                      {dec(p.score.total)} / 100
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            Profilul rezidențial obișnuit, adică minimul programului cu contribuția minimă, iese pe la{' '}
            {dec(profiles[0].score.total)} de puncte din 100. Distanța până la 100 nu e o
            veste proastă în sine: contează doar unde cade pragul de admitere, iar pragul depinde de
            câți oameni depun și cu ce punctaje.
          </p>

          <h2 className="text-xl font-semibold text-secondary-dark">
            Ce nu poate calcula pagina asta
          </h2>
          <p>
            <strong>Pragul de admitere.</strong> Nu îl știe nimeni înainte de închiderea sesiunii,
            pentru că se formează din dosarele depuse. Orice pagină care îți promite „ai șanse mari”
            sau „nu te califici” inventează. Punctajul tău e o cifră exactă; poziția în clasament, nu.
          </p>
          <p>
            <strong>Prețul real al bateriei.</strong> Standardul de cost e un plafon de decontare, nu
            o cotație de piață. Costul concret depinde de brandul bateriei, de compatibilitatea cu
            invertorul pe care îl ai și de manoperă. De aceea calculatorul pornește de la standardul
            de cost, dar te lasă să introduci costul tău real.
          </p>
          <p>
            <strong>Regulile finale.</strong> Ordinul e publicat: {ORDER_LABEL} (semnat pe{' '}
            {SIGNED_LABEL}) a apărut în {MO_LABEL}, în vigoare din 14 septembrie 2026. Cifrele
            din calculator sunt cele din ordin. Înscrierea persoanelor fizice e între 20 și 25
            noiembrie 2026 (Dispoziția președintelui AFM nr. 454 din 6 noiembrie 2026).
            Explicația articol cu articol, cu eligibilitate, dosar și termene, e în{' '}
            <Link href={GUIDE_HREF} className="text-primary-dark underline hover:no-underline">
              ghidul Casa Verde Baterii 2026
            </Link>
            .
          </p>

          <h2 className="text-xl font-semibold text-secondary-dark">Întrebări frecvente</h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.question}>
                <h3 className="font-semibold text-secondary-dark">{faq.question}</h3>
                <p className="mt-1">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
