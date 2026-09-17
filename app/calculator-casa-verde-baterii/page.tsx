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

/** Ziua în care MMAP a publicat forma consolidată a proiectului de ghid. */
const CONSOLIDATED_LABEL = '9 septembrie 2026';
/** Ziua în care ministrul Mediului a anunțat semnarea ordinului. */
const SIGNED_LABEL = '11 septembrie 2026';

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
      'Forma consolidată a proiectului de ghid are două criterii, fiecare cu maximum 50 de puncte. Contribuția proprie: 30 × (contribuția proprie împărțită la finanțarea cerută de la AFM), plafonat la 50 de puncte, maximul fiind atins la o contribuție de 62,5% din valoarea proiectului. Capacitatea sistemului de stocare: 2,5 puncte pentru fiecare kWh, plafonat la 50 de puncte, deci maximul se atinge la 20 kWh. Puterea sistemului fotovoltaic existent, care aducea până la 20 de puncte în proiectul din august, nu mai punctează.',
  },
  {
    question: 'Cât primești, de fapt, pentru o baterie de 10 kWh?',
    answer:
      'La capacitatea minimă de 10 kWh, standardul de cost de 1.500 lei/kWh dă o bază eligibilă de 15.000 lei. Finanțarea e 75% din ea, adică 11.250 lei, iar contribuția ta este de 3.750 lei. Plafonul de 15.000 lei nu se atinge la capacitatea minimă, contrar felului în care a fost titrată suma în presă.',
  },
  {
    question: 'De la ce capacitate primești toți cei 15.000 de lei?',
    answer:
      'Plafonul absolut de 15.000 lei se atinge de la o bază eligibilă de 20.000 lei, adică de la aproximativ 13,4 kWh la standardul de cost de 1.500 lei/kWh. Peste această capacitate finanțarea nu mai crește, dar punctajul pe capacitate continuă să crească până la 20 kWh.',
  },
  {
    question: 'Cât trebuie să pui din buzunar pentru punctaj maxim pe contribuție?',
    answer:
      'Cele 50 de puncte pe criteriul contribuției se ating la 62,5% din valoarea proiectului, adică atunci când ceri de la AFM doar 37,5%. Criteriul îl răsplătește pe cel care cere mai puțini bani publici, nu pe cel care are nevoie de mai mulți.',
  },
  {
    question: 'Când se deschide sesiunea de înscrieri la Casa Verde Baterii?',
    answer:
      'Nu are dată. Ministrul Mediului a anunțat pe 11 septembrie 2026 că a semnat ordinul de aprobare a ghidului, dar ordinul nu are număr public și nu este publicat în Monitorul Oficial, iar afm.ro nu listează încă programul. Lansarea a fost declarată pentru luna octombrie 2026, fără zi anunțată. Calculatorul folosește cifrele din forma consolidată a proiectului, pe care ordinul semnat o confirmă prin cele două criterii de punctaj.',
  },
];

export const metadata: Metadata = {
  title: 'Calculator Casa Verde Baterii 2026: Punctaj și Finanțare AFM',
  description:
    'Calculează punctajul Casa Verde Baterii 2026 și cât primești de la AFM: 50 de puncte pe contribuție, 50 pe capacitate, plafon 1.500 lei/kWh.',
  alternates: { canonical: '/calculator-casa-verde-baterii' },
  openGraph: {
    type: 'website',
    url: '/calculator-casa-verde-baterii',
    title: 'Calculator Casa Verde Baterii 2026: Punctaj și Finanțare AFM',
    description:
      'Ce punctaj ai, cât primești de la AFM și cât pui din buzunar, pe cifrele din forma consolidată a ghidului.',
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
  // că suma proiectului o alegem noi. Nu la standardul de cost peste tot: la 14
  // kWh, un proiect de 21.000 lei ar cere de la AFM 15.750, peste plafonul de
  // 15.000, deci contribuția de 25% e imposibilă acolo și punctajul ar ieși 47,
  // nu 45 cât arată tabelul din widget și din ghid pentru același profil.
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
          Pe cifrele din forma consolidată a ghidului, nu pe cele care circulă în presă.
        </p>

        {/* Statusul programului stă deasupra uneltei, nu sub ea: cine intră aici
            caută și răspunsul la „când se deschide", iar răspunsul onest e că
            nu are dată. */}
        <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-gray-800">
          <strong>Unde e programul acum:</strong> ministrul Mediului a anunțat pe {SIGNED_LABEL} că a
          semnat ordinul de aprobare a ghidului. Ordinul nu are număr public, nu e în Monitorul
          Oficial, iar afm.ro nu listează încă programul. Lansarea e declarată pentru octombrie, fără
          zi anunțată. Calculatorul folosește forma consolidată a proiectului, publicată pe{' '}
          {CONSOLIDATED_LABEL}, pe care ordinul semnat o confirmă prin cele două criterii de punctaj.
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
            punctaj din maximum {formatNumber(PROGRAM.maxPoints.contribution + PROGRAM.maxPoints.capacity)}{' '}
            de puncte, pe două criterii, iar dosarele se finanțează în ordinea descrescătoare a
            punctajului, în limita bugetului:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong>Contribuția proprie, maximum {PROGRAM.maxPoints.contribution} de puncte:</strong>{' '}
              30 × (contribuția proprie ÷ finanțarea cerută de la AFM). Maximul se atinge la o
              contribuție de {dec(OWN_SHARE_FOR_MAX_POINTS * 100)}% din valoarea
              proiectului, adică atunci când ceri de la AFM doar{' '}
              {dec((1 - OWN_SHARE_FOR_MAX_POINTS) * 100)}%.
            </li>
            <li>
              <strong>Capacitatea de stocare, maximum {PROGRAM.maxPoints.capacity} de puncte:</strong>{' '}
              2,5 puncte pentru fiecare kWh instalat, deci maximul se atinge la{' '}
              {PROGRAM.capacityForMaxPoints} kWh.
            </li>
          </ul>
          <p>
            Puterea sistemului fotovoltaic existent, care aducea până la 20 de puncte în proiectul din
            august, a fost eliminată. Rămân două criterii, iar ambele împing în aceeași direcție:
            câștigă cine cere mai puțini bani publici pentru o baterie mai mare.
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
            luat la cel mult standardul de cost de {formatNumber(PROGRAM.costStandardPerKwh)} lei/kWh:
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
            <strong>Regulile finale.</strong> Ordinul e semnat, dar nepublicat. Până apare în
            Monitorul Oficial, orice cifră din calculator rămâne cea din forma consolidată a
            proiectului. Explicația articol cu articol, cu eligibilitate, dosar și termene, e în{' '}
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
