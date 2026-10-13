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
// PENTRU CINE: firma de montaj, nu clientul și nu Google. Prima versiune
// descria produsul (cifrele bazei lor de date, o secțiune pentru clienți
// „înainte să semnați") și Radu a întors-o: instalatorul nu se regăsea în ea.
// Acum e o recomandare: caseta „De ce îl recomandăm", apoi carduri problemă →
// cum o rezolvă → link (cerut de Radu, 12 oct). Persoana a doua singular, ca
// pe /cereri și /pentru-instalatori, unde vorbim cu firmele.
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
  title: 'ElectroPrep: actele lucrării și electricieni autorizați, pentru instalatori',
  description:
    'Pentru firmele de montaj fotovoltaic: dosarul de prosumator, notificarea, buletinul prizei de pământ și procesele-verbale completate în PDF, plus pregătirea electricienilor pentru examenul ANRE.',
  alternates: { canonical: '/parteneri/electroprep' },
};

// Problemele sunt ale instalatorului, spuse cum le-ar spune el; soluțiile sunt
// strict ce scrie pe paginile lor (12 oct 2026), fără promisiuni de timp sau
// de rată de aprobare pe care nu le putem verifica.
type Problem = {
  problem: string;
  solution: ReactNode;
  link: { path: string; content: string; label: string };
};

const PROBLEMS: Problem[] = [
  {
    problem: 'Dosarul de prosumator se întoarce de la distribuitor pentru o piesă lipsă',
    solution: (
      <>
        Dosarul se generează după Ord. ANRE 19/2022, art. 19, într-un singur PDF cu opis:
        procesul-verbal de recepție, buletinul prizei de pământ, notificarea și lista pieselor
        fabricantului. Se emite doar complet, deci afli ce lipsește înainte să-l depui, nu după.
      </>
    ),
    link: { path: '/servicii/dosar-prosumator', content: 'dosar-prosumator', label: 'Vezi dosarul de prosumator, cu exemplu PDF' },
  },
  {
    problem: 'Refaci aceleași acte în Word la fiecare lucrare',
    solution: (
      <>
        Datele firmei și ale semnatarilor (grad ANRE, autorizație, semnătură, ștampilă) le
        completezi o singură dată. Împuternicirea, notificarea, buletinul prizei de pământ, schema
        monofilară și procesele-verbale pleacă apoi din câmpurile lor, cu temeiul legal citat, iar
        din poza plăcuței echipamentului îți propune câmpurile.
      </>
    ),
    link: { path: '/servicii', content: 'servicii', label: 'Vezi toate actele' },
  },
  {
    problem: 'Ai lucrări, dar prea puțini oameni cu autorizație ANRE',
    solution: (
      <>
        Pentru instalații de joasă tensiune de orice putere îți trebuie gradul IIB. Colegul care
        dă examenul se pregătește pe întrebările oficiale ale gradului, cu explicația fiecărui
        răspuns, și dă simulări la formatul real: 25 de întrebări, prag 18, o oră. Locurile
        colegilor le poți plăti din contul firmei, pe o singură factură.
      </>
    ),
    link: { path: '/invatare', content: 'invatare', label: 'Începe cu întrebările gradului' },
  },
  {
    problem: 'Ratezi înscrierea la sesiunea de examen',
    solution: (
      <>Calendarul sesiunilor ANRE îți trimite memento pe e-mail înainte să se închidă înscrierile.</>
    ),
    link: { path: '/sesiuni', content: 'sesiuni', label: 'Vezi sesiunile de examen' },
  },
  {
    problem: 'Nu știi sigur dacă electricianul sau subcontractorul are autorizația la zi',
    solution: (
      <>
        Cauți omul după nume, telefon sau legitimație și vezi gradul și până când e valabilă
        autorizația. „Expirat” înseamnă că a fost autorizat, dar autorizația nu mai e valabilă, deci nu ajunge pentru lucrare.
        Pentru o firmă parteneră vezi atestatul și termenul vizei.
      </>
    ),
    link: { path: '/verifica-electrician-autorizat', content: 'verifica-electrician', label: 'Verifică un electrician' },
  },
  {
    problem: 'Cauți oameni înainte de sezon',
    solution: (
      <>
        Îți publici anunțul la locurile de muncă, unde candidații aplică cu autorizația ANRE legată
        de profil, iar firma e verificată la ANAF.
      </>
    ),
    link: { path: '/locuri-de-munca', content: 'locuri-de-munca', label: 'Vezi locurile de muncă' },
  },
];

const FAQS = [
  {
    question: 'Cât costă?',
    answer:
      'Exemplul fiecărui act, cu date fictive, se vede fără cont, iar calculatorul de cablu și verificarea în registrul ANRE sunt gratuite. Generarea actelor e în pachetul Electrician, 99 de lei pentru 30 de zile, iar pregătirea pentru examen în pachetul Cursant, 49 de lei pentru 30 de zile. Prețurile sunt cele afișate pe 12 octombrie 2026.',
  },
  {
    question: 'Cine semnează actele?',
    answer:
      'Electricianul autorizat care a executat sau a verificat lucrarea, cu datele firmei tale. ElectroPrep completează actul după model și citează temeiul legal, dar nu certifică lucrarea și nu e afiliată ANRE.',
  },
  {
    question: 'Pot plăti eu, ca firmă, pentru colegi?',
    answer:
      'Da. Pachetul de companie îți dă ție accesul complet, iar colegii primesc locuri de cursant sau de electrician plătite de firmă, pe o singură factură.',
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
            Partener pentru instalatori
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
            ElectroPrep: actele pentru distribuitor și electricienii autorizați, dintr-un singur cont
          </h1>
          <p className="text-gray-600 mt-4 text-lg leading-relaxed">
            Montajul îl știi. Pentru ce vine după el, de la dosarul de prosumator la colegul care
            trebuie să-și ia autorizația, recomandăm firmelor de montaj{' '}
            <EpLink path="/" content="intro">ElectroPrep</EpLink>.
          </p>
        </header>

        <aside className="mb-10 rounded-xl border-l-4 border-primary bg-primary/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary-dark">
            De ce îl recomandăm
          </p>
          <p className="mt-2 text-gray-800 leading-relaxed">
            După ce semnezi cu un client, rămân două griji pe care montajul nu le rezolvă: actele
            pentru distribuitor și oamenii autorizați care le semnează. ElectroPrep le acoperă pe
            amândouă din același cont, pe normativele și ordinele ANRE, cu sursa citată la fiecare
            act. Îl poți încerca fără cont și fără card.
          </p>
        </aside>

        <div className="space-y-12 text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-5">Ce îți rezolvă</h2>
            <div className="space-y-4">
              {PROBLEMS.map((p) => (
                <div key={p.problem} className="rounded-xl border border-border bg-white p-5">
                  <h3 className="font-bold text-gray-900 leading-snug">{p.problem}</h3>
                  <p className="mt-2 text-sm leading-relaxed">{p.solution}</p>
                  <p className="mt-3 text-sm font-semibold">
                    <EpLink path={p.link.path} content={p.link.content}>
                      {p.link.label} →
                    </EpLink>
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-5">
              Ce urmează după dosar, până la certificatul de racordare, e în ghidul nostru despre{' '}
              <Link
                href="/ghid/certificat-de-racordare-prosumator-2026"
                className="underline hover:text-gray-800"
              >
                certificatul de racordare pentru prosumator
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Gratuit, pe șantier</h2>
            <p>
              <EpLink path="/calculator-sectiune-cablu" content="calculator-cablu">
                Calculatorul de secțiune a cablului
              </EpLink>{' '}
              îți dă secțiunea, protecția și căderea de tensiune după tabelele din I7, fără cont.
              Pentru oferta către client ai aici{' '}
              <Link href="/calculator-panouri-fotovoltaice" className="underline hover:text-gray-800">
                calculatorul de panouri fotovoltaice
              </Link>{' '}
              (producție, cost, amortizare) și{' '}
              <Link href="/calculator-casa-verde-baterii" className="underline hover:text-gray-800">
                calculatorul Casa Verde Baterii
              </Link>
              , cu punctajul dosarului.
            </p>
          </section>

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

        <Link
          href="/pentru-instalatori"
          data-umami-event="pentru-instalatori-click"
          data-umami-event-source="partener-electroprep"
          className="group mt-12 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-5 rounded-xl border border-primary/40 bg-primary/5 hover:bg-primary/10 px-4 sm:px-5 py-4 transition-colors"
        >
          <span className="text-sm sm:text-base text-gray-800 leading-snug text-center sm:text-left">
            <strong className="font-bold text-gray-900">Ai firmă de montaj?</strong> Preiei cereri de
            la clienți din județul tău, gratuit.
          </span>
          <span className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-primary group-hover:bg-primary-dark text-white font-semibold text-sm px-4 py-2.5 transition-colors">
            Vezi cum funcționează
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </span>
        </Link>

        <p className="mt-8 text-xs text-gray-500 leading-relaxed">
          ElectroPrep e un proiect privat, fără legătură instituțională cu ANRE. Am scris unii
          despre alții: prezentarea lor despre noi e pe{' '}
          <EpLink path="/parteneri/instalatori-fotovoltaice" content="pagina-reciproca">
            electroprep.ro
          </EpLink>
          .
        </p>
      </article>
    </>
  );
}
