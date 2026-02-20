import type { Metadata } from 'next';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import FAQ from '@/components/seo/FAQ';
import Button from '@/components/ui/Button';
import { generateFAQJsonLd, generateBreadcrumbJsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  title: 'Întrebări Frecvente - Instalatori Fotovoltaice',
  description:
    'Răspunsuri la cele mai frecvente întrebări despre instalarea panourilor fotovoltaice comerciale: costuri, certificări, garanții, legislație prosumator.',
};

const faqSections = [
  {
    title: 'Costuri și Investiție',
    items: [
      {
        question: 'Cât costă un sistem fotovoltaic pentru o hală industrială?',
        answer:
          'Costul variază între 600-900 EUR/kWp instalat. Un sistem de 100 kWp costă între 65.000 și 85.000 EUR, iar unul de 500 kWp între 280.000 și 380.000 EUR. Prețul per kWp scade odată cu creșterea dimensiunii proiectului.',
      },
      {
        question: 'În cât timp se amortizează investiția?',
        answer:
          'Perioada de amortizare este de obicei 4-6 ani, în funcție de procentul de autoconsum, tariful de energie și dimensiunea sistemului. ROI-ul la 25 ani poate depăși 400%.',
      },
      {
        question: 'Există fonduri nerambursabile disponibile?',
        answer:
          'Da, prin programele PNRR (Componenta C6), ELECTRIC UP (până la 150.000 EUR) și Fondul pentru Modernizare se pot obține granturi de până la 100% din valoarea investiției.',
      },
      {
        question: 'Ce include prețul unui sistem fotovoltaic?',
        answer:
          'Prețul include de obicei: panouri fotovoltaice, invertoare, structuri de montaj, cablaje și protecții, manoperă de instalare, proiectare, avize și punere în funcțiune. NU include: consolidarea structurii, baterii de stocare și mentenanță post-garanție.',
      },
    ],
  },
  {
    title: 'Certificări și Autorizații',
    items: [
      {
        question: 'Ce certificări trebuie să aibă un instalator?',
        answer:
          'Obligatoriu: atestat ANRE tip C2A pentru sisteme comerciale. Recomandat: ISO 9001 (management calitate), ISO 14001 (management mediu), ISO 45001 (securitate ocupațională).',
      },
      {
        question: 'Cum verific dacă un instalator are autorizare ANRE?',
        answer:
          'Poți verifica pe site-ul oficial ANRE (anre.ro) în secțiunea "Registrul atestatelor". Caută firma după nume sau CUI și verifică tipul atestatului.',
      },
      {
        question: 'Am nevoie de autorizație de construire?',
        answer:
          'Pentru sisteme montate pe acoperiș, de obicei nu este necesară autorizație de construire. Este necesară o notificare la primărie și avize de la operatorul de distribuție.',
      },
    ],
  },
  {
    title: 'Instalare și Proces',
    items: [
      {
        question: 'Cât durează instalarea unui sistem fotovoltaic comercial?',
        answer:
          'Procesul complet durează 4-12 săptămâni: 1-2 săptămâni evaluare/proiectare, 1-2 săptămâni avize, 3-4 săptămâni instalare propriu-zisă, 1-2 săptămâni testare și punere în funcțiune.',
      },
      {
        question: 'Ce garanții primesc?',
        answer:
          'Standard: 25-30 ani pe panouri (garanție de performanță), 10-12 ani pe invertoare, 5-10 ani pe manoperă. Unii instalatori oferă garanții extinse și contracte de mentenanță.',
      },
      {
        question: 'Pot instala panouri pe orice tip de acoperiș?',
        answer:
          'Da, există soluții pentru acoperișuri plate (cu balast), înclinate (cu șine), terase și chiar pe sol. Important este să se verifice capacitatea portantă a structurii existente.',
      },
    ],
  },
  {
    title: 'Legislație și Prosumator',
    items: [
      {
        question: 'Cum funcționează statutul de prosumator pentru firme?',
        answer:
          'Ca prosumator comercial, produceți energie pentru consum propriu și vindeți surplusul la prețul pieței. Capacitatea maximă este de 400 kWp fără licență ANRE. Veniturile din vânzare pot fi scutite de impozit.',
      },
      {
        question: 'Care este capacitatea maximă permisă?',
        answer:
          'Din 2023, capacitatea maximă pentru prosumatori este de 400 kWp. Peste această limită este necesară licență ANRE de producător de energie electrică.',
      },
      {
        question: 'La ce preț vând surplusul de energie?',
        answer:
          'Surplusul se vinde la prețul pieței zilnice (day-ahead). Prețul mediu variază semnificativ, dar se situează de obicei între 80-120 EUR/MWh.',
      },
      {
        question: 'Pot fi prosumator dacă am sediul în chirie?',
        answer:
          'Da, cu acordul proprietarului imobilului. Este necesară o procură notarială sau o clauză în contractul de închiriere care permite instalarea de panouri fotovoltaice.',
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
            Întrebări Frecvente
          </h1>
          <p className="text-gray-500 mt-2">
            Răspunsuri la cele mai comune întrebări despre panouri fotovoltaice comerciale
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
