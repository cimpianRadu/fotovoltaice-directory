import type { Metadata } from 'next';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import FAQ from '@/components/seo/FAQ';
import Button from '@/components/ui/Button';
import { generateFAQJsonLd, generateBreadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Întrebări Frecvente - Panouri Fotovoltaice Comerciale și Industriale',
  description:
    'Răspunsuri la cele mai frecvente întrebări despre panouri fotovoltaice comerciale: costuri pe kWp, subvenții 2026, legislație prosumator, Electric UP, alegerea instalatorului ANRE.',
  alternates: { canonical: '/intrebari-frecvente' },
};

const faqSections = [
  {
    title: 'Costuri și Prețuri',
    items: [
      {
        question: 'Cât costă un sistem fotovoltaic pentru o hală industrială în 2026?',
        answer:
          'Prețul variază între 450-900 EUR/kWp instalat, în funcție de dimensiunea sistemului. Un sistem de 50 kWp costă 25.000-40.000 EUR, unul de 100 kWp între 50.000-85.000 EUR, iar unul de 500 kWp între 250.000-380.000 EUR. Prețul per kWp scade semnificativ la proiecte mai mari datorită economiilor de scară. Prețurile au scăzut cu ~30% față de 2022.',
      },
      {
        question: 'În cât timp se amortizează investiția în panouri fotovoltaice pentru o firmă?',
        answer:
          'Pentru segmentul comercial, perioada de amortizare este de 3-5 ani, semnificativ mai mică decât la rezidențial (8-10 ani). Motivul: 80% din consumul unei firme este în timpul zilei, exact când panourile produc maxim. Cu fonduri nerambursabile (Electric UP, Fondul de Modernizare), amortizarea poate scădea la 2-3 ani. ROI-ul la 25 ani depășește 400%.',
      },
      {
        question: 'Ce economii realizează o firmă cu panouri fotovoltaice?',
        answer:
          'O firmă poate reduce factura de energie cu 30-70%, în funcție de dimensiunea sistemului și rata de autoconsum. Un sistem de 100 kWp produce aproximativ 120.000-140.000 kWh/an în România. La un preț mediu al energiei de 0,15 EUR/kWh, economia anuală poate ajunge la 18.000-21.000 EUR. Suplimentar, surplusul de energie poate fi vândut în rețea la prețul pieței.',
      },
      {
        question: 'Ce costuri ascunse are un sistem fotovoltaic comercial?',
        answer:
          'Costurile care nu sunt incluse de obicei în oferta de bază: evaluarea și eventuala consolidare a structurii acoperișului, taxa ATR (Aviz Tehnic de Racordare) de la operatorul de distribuție, asigurarea sistemului (obligatorie în unele programe de finanțare), mentenanța anuală (1-2% din valoarea investiției/an) și înlocuirea invertoarelor după 10-12 ani.',
      },
    ],
  },
  {
    title: 'Subvenții și Finanțare 2026',
    items: [
      {
        question: 'Ce fonduri nerambursabile sunt disponibile pentru panouri fotovoltaice în 2026?',
        answer:
          'În 2026 sunt disponibile peste 1,5 miliarde EUR: Electric UP (până la 150.000 EUR, 75% grant pentru IMM-uri), Fondul pentru Modernizare (815 milioane EUR buget 2024-2026, până la 450.000 EUR/MW), PNRR Componenta C6 (granturi pentru energie verde) și REPowerEU (nouă fereastră de finanțare). Există și 150 milioane EUR dedicați fermelor și companiilor agro-alimentare.',
      },
      {
        question: 'Cum funcționează programul Electric UP pentru firme?',
        answer:
          'Electric UP oferă finanțare nerambursabilă de până la 150.000 EUR per beneficiar (75% grant + 25% cofinanțare proprie). Sunt eligibile IMM-urile din orice domeniu de minimis și toți operatorii HoReCa. Programul acoperă: sisteme fotovoltaice de 27-100 kWp, stocare energie, stații de încărcare vehicule electrice (minim 22 kW, 2 puncte de încărcare). Instalarea trebuie făcută exclusiv de firme acreditate ANRE.',
      },
      {
        question: 'Pot combina mai multe surse de finanțare pentru un proiect fotovoltaic?',
        answer:
          'Da, cu anumite restricții. Electric UP necesită 25% cofinanțare proprie (poate fi din credit bancar). Nu puteți combina două programe de grant pentru aceeași instalație. Se aplică regulile de minimis: maximum 300.000 EUR în 3 ani. BCR, Raiffeisen și BRD oferă linii de credit verzi dedicate. E.ON și PPC Energy oferă și pachete de finanțare integrată cu instalarea.',
      },
    ],
  },
  {
    title: 'Legislație și Prosumator',
    items: [
      {
        question: 'Cum funcționează statutul de prosumator comercial în România?',
        answer:
          'Persoanele juridice pot deveni prosumatori cu instalații de până la 400 kWp fără licență ANRE. Sub 200 kWp beneficiați de compensare cantitativă 1:1 (net metering) - surplusul se creditează pe facturi viitoare. Între 200-400 kWp, surplusul este cumpărat de furnizor la prețul mediu lunar al pieței. Compensarea cantitativă este garantată până la 31 decembrie 2030.',
      },
      {
        question: 'Ce se schimbă în legea prosumatorilor în 2026?',
        answer:
          'Legea se rescrie conform noilor directive UE. Prosumatorii devin „clienți activi": pot produce, consuma, stoca și gestiona energie. Apare obligația de responsabilitate financiară pentru dezechilibrele aduse în Sistemul Energetic Național. ANRE va monitoriza dezvoltarea rețelelor inteligente cu rapoarte bienale. Net metering-ul 1:1 pentru sub 200 kWp rămâne valid până la sfârșitul lui 2030.',
      },
      {
        question: 'Ce autorizații sunt necesare pentru instalarea panourilor fotovoltaice pe o hală?',
        answer:
          'Nu este necesară autorizație de construire pentru sisteme montate pe acoperiș. Trebuie: notificare la primărie pentru lucrări minore, ATR (Aviz Tehnic de Racordare) de la operatorul de distribuție (Rețele Electrice/Distribuție Energie), memoriu tehnic de la un proiectant autorizat ANRE și schema electrică monofilară. Racordarea fără avizul operatorului atrage amenzi și neplata energiei injectate.',
      },
      {
        question: 'Ce TVA se aplică la achiziția panourilor fotovoltaice pentru firme?',
        answer:
          'Legea 39/2023 a redus TVA la 5% pentru panouri fotovoltaice, dar cota redusă NU se aplică firmelor care folosesc instalațiile comercial. Companiile plătesc TVA standard de 19%, dar îl pot deduce integral (TVA deductibil). Investiția este deductibilă fiscal cu amortizare accelerată pe 4 ani. Unele primării oferă reduceri de 50% la impozitul pe clădiri cu panouri fotovoltaice.',
      },
    ],
  },
  {
    title: 'Tehnic și Instalare',
    items: [
      {
        question: 'Cât produce un sistem fotovoltaic de 100 kWp în România?',
        answer:
          'Un sistem de 100 kWp produce aproximativ 120.000-140.000 kWh/an, cu o medie zilnică de ~330 kWh. Producția variază pe regiuni: sudul României (Muntenia, Dobrogea) poate ajunge la 1.400 kWh/kWp/an, pe când nordul produce 1.100-1.200 kWh/kWp/an. Iarna se produce 25-35% din totalul anual. Folosiți PVGIS (instrument European Commission) pentru calcule precise pe locația exactă.',
      },
      {
        question: 'Ce tip de panouri fotovoltaice sunt cele mai bune pentru aplicații comerciale?',
        answer:
          'Panourile monocristaline N-Type TOPCon sunt standardul în 2026, cu eficiență de 22-24%. Panourile bifaciale captează lumina pe ambele fețe, producând cu 10-15% mai multă energie. Mărci Tier-1 recomandate: Jinko Solar (Tiger Neo), LONGi (Hi-MO 7), Trina Solar, JA Solar. Pentru invertoare: Huawei (SUN2000), Fronius (Tauro), SMA (Sunny Tripower). Invertoarele string sunt cele mai eficiente ca raport preț-performanță pentru proiecte comerciale.',
      },
      {
        question: 'Se pot instala panouri fotovoltaice pe acoperișul plat al unei hale industriale?',
        answer:
          'Da, este cea mai frecventă configurație pentru clădiri comerciale/industriale. Se folosesc sisteme de montaj cu balast (greutăți de beton), fără perforarea acoperișului. Unghiul optim: 35 grade orientare sud, sau 10 grade est-vest pentru maximizarea numărului de panouri. Este critică evaluarea capacității portante a acoperișului, mai ales la clădiri mai vechi. Se recomandă structuri din aluminiu anodizat sau oțel galvanizat.',
      },
      {
        question: 'Cât de eficiente sunt panourile fotovoltaice iarna în România?',
        answer:
          'Iarna (octombrie-martie), sistemul produce 25-35% din producția anuală totală. Temperaturile scăzute îmbunătățesc de fapt eficiența semiconductorilor. Zăpada poate bloca temporar producția, dar un unghi de 40-45 grade permite alunecarea naturală. Un sistem bine pozițonat atinge 60-80% din producția nominală chiar și iarna. Lumina reflectată de zăpadă poate crește captarea de energie.',
      },
    ],
  },
  {
    title: 'Mentenanță și Garanții',
    items: [
      {
        question: 'Cât durează panourile fotovoltaice și ce garanții primesc?',
        answer:
          'Panourile au o durată de viață de aproximativ 40 de ani cu instalare și mentenanță corespunzătoare. Garanție de performanță: 25-30 ani (80-88% din puterea inițială după 25 ani). Garanție produs: 10-25 ani (în funcție de producător). Invertoare: 5-12 ani (extensibilă la 15-20 ani). Manoperă: 5-10 ani. Degradarea medie: 0,8%/an (1-2% în primul an).',
      },
      {
        question: 'Ce mentenanță necesită un sistem fotovoltaic comercial și cât costă?',
        answer:
          'Mentenanța include: curățarea panourilor de 2-4 ori/an, inspecție vizuală a cablurilor și panourilor, verificare profesională anuală. Costul anual: 1-2% din valoarea investiției. Monitorizarea în timp real detectează anomalii automat (Huawei FusionSolar, Fronius Solar.web, SMA Sunny Portal). Majoritatea instalatorilor profesioniști oferă contracte O&M. Mentenanța este esențială pentru menținerea validității garanției.',
      },
      {
        question: 'Am nevoie de asigurare pentru panourile fotovoltaice de pe hala firmei?',
        answer:
          'Este puternic recomandată și obligatorie în unele programe de finanțare. Asigurarea acoperă: incendiu, furt, vandalism, vânt, grindină, obiecte căzute și daune accidentale. Furnizori în România: Allianz-Țiriac, Groupama, Generali, UNIQA, Omniasig. Pentru persoane juridice: valoare maximă 150.000 lei inclusiv TVA, durată 1-6 ani. Unii instalatori includ asigurarea primului an în pachet.',
      },
    ],
  },
  {
    title: 'Alegerea Instalatorului',
    items: [
      {
        question: 'Cum aleg o firmă de instalare panouri fotovoltaice pentru firma mea?',
        answer:
          'Criterii esențiale: autorizare ANRE tip C2A (obligatorie pentru comercial), portofoliu cu proiecte comerciale/industriale similare, certificări ISO 9001/14001/45001, stabilitate financiară verificabilă, garanții clare în scris, echipamente Tier-1 (Jinko, LONGi, Trina + Huawei, Fronius, SMA), servicii post-vânzare și contract de mentenanță, proximitate geografică pentru intervenții rapide.',
      },
      {
        question: 'De ce este importantă autorizarea ANRE a instalatorului?',
        answer:
          'Autorizarea ANRE (atestat C2A) este obligatorie legal pentru instalarea sistemelor comerciale. Fără ea: instalația nu poate fi racordată legal la rețea, nu puteți deveni prosumator, nu puteți accesa niciun program de finanțare (Electric UP, Fondul de Modernizare). AFM impune instalarea exclusiv de firme acreditate. Verificați pe anre.ro în „Registrul atestatelor" după numele firmei sau CUI.',
      },
      {
        question: 'Ce întrebări ar trebui să pun unui instalator înainte de a semna contractul?',
        answer:
          'Întrebări esențiale: Ce atestări ANRE dețineți? (cereți dovada), Câte proiecte comerciale ați finalizat? (cereți portofoliu și referințe), Ce mărci de panouri și invertoare folosiți și de ce?, Care este producția anuală estimată pentru locația mea?, Cine se ocupă de documentația de racordare?, Ce sistem de monitorizare este inclus?, Ce garanții oferiți pe echipamente și manoperă?, Oferiți contract de mentenanță?, Puteți ajuta cu aplicația la Electric UP sau Fondul de Modernizare?',
      },
    ],
  },
];

const allFaqs = faqSections.flatMap((s) => s.items);

export default function FAQPage() {
  return (
    <>
      <JsonLd data={generateFAQJsonLd(allFaqs)} />
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: 'Acasă', url: '/' },
          { name: 'Întrebări Frecvente', url: '/intrebari-frecvente' },
        ])}
      />

      <div className="max-w-3xl mx-auto px-4 py-6">
        <Breadcrumbs items={[{ label: 'Întrebări Frecvente' }]} />

        <div className="mt-6 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Întrebări Frecvente despre Panouri Fotovoltaice Comerciale
          </h1>
          <p className="text-gray-500 mt-2">
            Răspunsuri la cele mai căutate întrebări despre instalarea panourilor fotovoltaice pe hale industriale, clădiri de birouri și spații comerciale din România
          </p>
        </div>

        <div className="space-y-10">
          {faqSections.map((section) => (
            <FAQ key={section.title} items={section.items} title={section.title} />
          ))}
        </div>

        <div className="mt-12 bg-primary/5 rounded-xl border border-primary/10 p-6 text-center">
          <h2 className="font-bold text-gray-900 mb-2">Nu ai găsit răspunsul?</h2>
          <p className="text-sm text-gray-600 mb-4">
            Contactează-ne și te ajutăm cu informațiile de care ai nevoie.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Button href="/despre" variant="primary">Contactează-ne</Button>
            <Button href="/cere-oferta" variant="outline">Cere Ofertă</Button>
          </div>
        </div>
      </div>
    </>
  );
}
