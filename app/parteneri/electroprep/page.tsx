import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import { generateBreadcrumbJsonLd, generateFAQJsonLd } from '@/lib/seo';

// Pagină de PARTENER, schimb de articole cu electroprep.ro (octombrie 2026).
// Ei au scris despre noi pe electroprep.ro/parteneri/instalatori-fotovoltaice,
// cu link urmat (rel="noopener", fără nofollow) și UTM utm_source=electroprep.ro.
//
// PENTRU CINE: firma de montaj. A treia versiune (13 oct 2026), după două
// întoarse de Radu:
//   1. descriere de produs cu cifre și o secțiune pentru clienți: „parcă e SEO";
//   2. recomandare pe probleme („Montajul îl știi", „După ce semnezi cu un
//      client"): vorbea despre noi și despre cititor, nu despre ei.
// Acum e informativă: ce face ElectroPrep, în ordinea în care o firmă de
// montaj ajunge să aibă nevoie. Întâi resursele de învățare pentru autorizare,
// apoi angajații noi, apoi actele și uneltele. Fără fraze despre platforma
// noastră în corpul paginii; linkurile interne stau la „Legate", jos.
//
// Spre deosebire de pagina Helexia, aceasta SE INDEXEAZĂ: un link de pe o
// pagină noindex nu valorează nimic pentru ei, iar schimbul e tocmai linkul.
//
// LINKURI: rel="noopener" și atât, la fel cum au pus ei spre noi.
//   - fără nofollow/sponsored: e schimb editorial între două site-uri din
//     aceeași nișă, nu reclamă plătită;
//   - fără noreferrer: îl lasă pe Google Analytics-ul lor să vadă de unde vine
//     vizita. UTM-ul o atribuie oricum, dar referrerul e plasa de siguranță.
// Fiecare link poartă `utm_content` propriu și evenimentul Umami
// `partener-site-click`, ca să le putem spune câte click-uri a trimis fiecare
// secțiune. Raportul: `node scripts/partener-raport.mjs electroprep`.
//
// NEVER-INVENT: actele, temeiurile, formatul examenului și prețurile sunt de pe
// paginile lor, citite pe 12 octombrie 2026. Prețurile se schimbă: la recheck,
// verifică electroprep.ro/pachete și actualizează data odată cu ele.

const PARTNER_URL = 'https://electroprep.ro';

function epUrl(path: string, content: string): string {
  const params = new URLSearchParams({
    utm_source: 'instalatori-fotovoltaice.ro',
    utm_medium: 'referral',
    utm_campaign: 'parteneriat',
    utm_content: content,
  });
  return `${PARTNER_URL}${path}?${params.toString()}`;
}

function EpLink({ path, content, children }: { path: string; content: string; children: ReactNode }) {
  return (
    <a
      href={epUrl(path, content)}
      target="_blank"
      rel="noopener"
      data-umami-event="partener-site-click"
      data-umami-event-partener="electroprep"
      data-umami-event-link={`electroprep/${content}`}
      className="text-secondary underline decoration-secondary/30 underline-offset-2 hover:text-primary-dark hover:decoration-primary-dark/40 transition-colors"
    >
      {children}
    </a>
  );
}

export const metadata: Metadata = {
  title: 'ElectroPrep: pregătire ANRE, angajări și acte pentru firmele de montaj',
  description:
    'Ce oferă ElectroPrep firmelor de montaj: chestionare și simulări pentru examenul ANRE, legislație căutabilă, locuri de muncă pentru electricieni și actele lucrării completate în PDF.',
  alternates: { canonical: '/parteneri/electroprep' },
};

// Fiecare secțiune: ce e, ce conține (puncte verificabile pe site-ul lor) și
// un link. Cifrele sunt cele afișate de ei pe 12 octombrie 2026.
type Section = {
  title: string;
  intro: string;
  points: ReactNode[];
  link: { path: string; content: string; label: string };
};

const SECTIONS: Section[] = [
  {
    title: 'Pregătirea pentru examenul de autorizare ANRE',
    intro:
      'Partea cea mai mare a platformei. Banca are 2.505 întrebări din seturile publicate oficial de ANRE, împărțite pe grade (I, IIA, IIB, IIIA, IIIB, IVA, IVB), fiecare cu răspunsul corect și o explicație scrisă pe articolul de normativ.',
    points: [
      <>
        <strong>Învățare</strong>: întrebare cu întrebare, cu răspunsul și explicația afișate pe loc.
      </>,
      <>
        <strong>Simulare de examen</strong>: test cronometrat la formatul din Ordinul ANRE 66/2023, adică 25
        de întrebări, prag de promovare 18, o oră.
      </>,
      <>
        <strong>Chestionarul zilei și repetarea greșelilor</strong>: 10 întrebări noi pe zi, iar cele greșite
        revin la repetat.
      </>,
      <>
        <strong>Calendarul sesiunilor ANRE</strong>, cu memento pe e-mail înainte de termenul de înscriere, și
        verificarea dosarului de înscriere față de Ordinul 66/2023.
      </>,
    ],
    link: { path: '/invatare', content: 'invatare', label: 'Întrebările, pe grade' },
  },
  {
    title: 'Legislație, dicționar și cărți tehnice',
    intro:
      'Resursele de consultat în timpul lucrului, nu doar pentru examen. Legislația și dicționarul sunt deschise fără cont.',
    points: [
      <>
        <strong>Legislația</strong>: normativul I7, normele tehnice energetice (NTE) și ordinele ANRE, 4.816
        articole căutabile pe număr sau pe cuvânt.
      </>,
      <>
        <strong>Dicționarul tehnic</strong>: 405 termeni cu definiții.
      </>,
      <>
        <strong>Ghiduri și cărți tehnice</strong>, de citit online, plus o aplicație pentru Android și varianta
        instalabilă pe iPhone.
      </>,
    ],
    link: { path: '/legislatie', content: 'legislatie', label: 'Legislația, căutabilă' },
  },
  {
    title: 'Angajați noi: anunțuri, testare și locuri pentru colegi',
    intro:
      'Pentru firmele care angajează electricieni sau își autorizează oamenii pe care îi au deja.',
    points: [
      <>
        <strong>Locuri de muncă</strong>: anunțuri de la companii verificate la ANAF, cu salariul brut și net.
        Candidații aplică cu autorizația ANRE legată de profil sau, la posturile fără autorizație, cu o
        simulare de calificare trecută.
      </>,
      <>
        <strong>Test grilă pentru candidați</strong>: firma alege întrebările, pragul și timpul și primește
        raportul pe categorii.
      </>,
      <>
        <strong>Pachetul de companie</strong>: locuri de cursant sau de electrician pentru colegi, plătite de
        firmă pe o singură factură.
      </>,
      <>
        <strong>Verificarea autorizației</strong>: căutare în registrul public ANRE după nume, telefon sau
        legitimație, cu gradul și data până la care e valabilă. La 12 octombrie 2026 registrul avea 32.692 de
        autorizații valabile.
      </>,
    ],
    link: { path: '/locuri-de-munca', content: 'locuri-de-munca', label: 'Locuri de muncă pentru electricieni' },
  },
  {
    title: 'Actele lucrării, completate în PDF',
    intro:
      'Un catalog de documente pentru electricieni, fiecare cu temeiul legal citat și un exemplu pe date fictive. Datele firmei și ale semnatarilor se completează o singură dată.',
    points: [
      <>
        <strong>Dosarul de prosumator</strong> (Ord. ANRE 19/2022, art. 19), într-un singur PDF cu opis, plus
        notificarea de racordare și împuternicirea pentru depunerea actelor la operatorul de rețea.
      </>,
      <>
        <strong>Verificări</strong>: buletinul PRAM, buletinul prizei de pământ, raportul de verificare
        periodică.
      </>,
      <>
        <strong>Racordare și recepție</strong>: declarația executantului, dosarul instalației de utilizare,
        procesele-verbale de recepție și de probe la punerea sub tensiune.
      </>,
    ],
    link: { path: '/servicii', content: 'servicii', label: 'Toate documentele' },
  },
  {
    title: 'Unelte de calcul și proiectare',
    intro: 'Pentru dimensionare și pentru proiectul instalației.',
    points: [
      <>
        <strong>Calculatorul de secțiune a cablului</strong>: secțiunea, protecția și căderea de tensiune după
        tabelele din I7, gratuit și fără cont.
      </>,
      <>
        <strong>Editorul de tablouri și proiectarea</strong>: tabloul pe circuite, schema monofilară și planul
        cu trasee, cu verificarea după I7.
      </>,
    ],
    link: { path: '/calculator-sectiune-cablu', content: 'calculator-cablu', label: 'Calculatorul de secțiune a cablului' },
  },
];

const FAQS = [
  {
    question: 'Cât costă?',
    answer:
      'Fără cont se văd primele 20 de întrebări din fiecare categorie, o simulare, legislația, dicționarul și calculatorul de cablu. Contul gratuit urcă la 60 de întrebări pe categorie și 3 simulări. Pachetul Cursant (toată banca și simulări nelimitate) e 49 de lei pentru 30 de zile, pachetul Electrician (în plus documentele și proiectarea) 99 de lei, iar cel de companie 299 de lei. Prețurile sunt cele afișate pe 12 octombrie 2026.',
  },
  {
    question: 'Cine semnează actele?',
    answer:
      'Electricianul autorizat care a executat sau a verificat lucrarea, cu datele firmei tale. ElectroPrep completează actul după model și citează temeiul legal, dar nu certifică lucrarea și nu e afiliată ANRE.',
  },
  {
    question: 'Poate plăti firma pentru colegi?',
    answer:
      'Da. În pachetul de companie titularul are accesul complet, iar colegii primesc locuri de cursant sau de electrician plătite de firmă, cu reducere, pe o singură factură.',
  },
];

export default function ElectroPrepPage() {
  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: 'Acasă', url: '/' },
          { name: 'Parteneri', url: '/parteneri' },
          { name: 'ElectroPrep', url: '/parteneri/electroprep' },
        ])}
      />
      <JsonLd data={generateFAQJsonLd(FAQS)} />

      <article className="max-w-3xl mx-auto px-4 py-6">
        <Breadcrumbs items={[{ label: 'Parteneri', href: '/parteneri' }, { label: 'ElectroPrep' }]} />

        <header className="mt-6 mb-10">
          <span className="inline-block text-[11px] font-semibold uppercase tracking-wide text-primary-dark bg-primary/10 rounded-full px-2.5 py-1 mb-4">
            Partener
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
            ElectroPrep: pregătire pentru autorizarea ANRE, angajări și actele lucrării
          </h1>
          <p className="text-gray-600 mt-4 text-lg leading-relaxed">
            <EpLink path="/" content="intro">ElectroPrep</EpLink> e o platformă pentru electricieni și
            firme de instalații. Pregătește candidații pentru examenul de autorizare ANRE, ține
            legislația și normativele la îndemână, are o secțiune de locuri de muncă și generează
            actele unei lucrări. Mai jos e ce găsește acolo o firmă de montaj.
          </p>
        </header>

        <div className="space-y-10 text-gray-600 leading-relaxed">
          {SECTIONS.map((sec) => (
            <section key={sec.title}>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{sec.title}</h2>
              <p>{sec.intro}</p>
              <ul className="list-disc pl-5 mt-3 space-y-1.5">
                {sec.points.map((pt, i) => (
                  <li key={i}>{pt}</li>
                ))}
              </ul>
              <p className="mt-3 text-sm font-semibold">
                <EpLink path={sec.link.path} content={sec.link.content}>
                  {sec.link.label} →
                </EpLink>
              </p>
            </section>
          ))}

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Întrebări</h2>
            <div className="space-y-3">
              {FAQS.map((f) => (
                <details key={f.question} className="group rounded-xl border border-border bg-white p-4">
                  <summary className="cursor-pointer font-semibold text-gray-900 list-none flex justify-between gap-4">
                    {f.question}
                    <span className="text-gray-400 group-open:rotate-90 transition-transform">›</span>
                  </summary>
                  <p className="mt-2 text-sm">{f.answer}</p>
                </details>
              ))}
            </div>
          </section>
        </div>

        <div className="border-t border-border mt-10 pt-8">
          <h3 className="font-bold text-gray-900 mb-4">Legate</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              {
                href: '/ghid/certificat-de-racordare-prosumator-2026',
                label: 'Certificatul de racordare pentru prosumator: acte, termen, cost',
              },
              { href: '/pentru-instalatori', label: 'Cereri de ofertă pentru firmele de montaj' },
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
