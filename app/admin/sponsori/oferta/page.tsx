import Link from 'next/link';
import { PRICING, SOV, TVA_PCT } from '@/lib/pricing';
import caseStudies from '@/data/case-studies.json';
import DocumentActions from '../../DocumentActions';
import { H2, Sheet } from '../../DocumentSheet';

// Oferta de publicitate trimisă firmelor după apel (prima dată la IGF Grup,
// 2 oct 2026). Aceleași pachete și condiții ca /publicitate, scrise pentru o
// firmă care citește un PDF, nu o pagină de vânzare. Prețurile vin din
// lib/pricing.ts; studiul de caz rămâne „la cerere", ca pe site.

export const dynamic = 'force-dynamic';

const SITE = 'instalatori-fotovoltaice.ro';

const MESAJ = `Bună ziua, cum am discutat, vă trimit pachetele de promovare de pe ${SITE}: Premium, Slot Popup și studiul de caz, cu prețuri și condiții. Sunt separate de cererile de ofertă, care rămân gratuite. Pentru orice întrebare sau ca să activăm un pachet, mă găsiți la 0751 547 174.`;

type Pachet = {
  nume: string;
  pret: string;
  sub: string;
  pentru: string;
  include: string[];
  accent?: boolean;
};

function PachetCard({ p }: { p: Pachet }) {
  return (
    <div
      className={`break-inside-avoid rounded-lg border p-4 ${
        p.accent ? 'border-2 border-[#1e3a5f]' : 'border-slate-200'
      }`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-bold text-[#1e3a5f]">{p.nume}</h3>
        <div className="text-right">
          <span className="text-xl font-bold text-slate-900">{p.pret}</span>
          <div className="text-xs text-slate-500">{p.sub}</div>
        </div>
      </div>
      <p className="mt-1 text-[0.95em] text-slate-600">{p.pentru}</p>
      <ul className="mt-2 space-y-1">
        {p.include.map((t) => (
          <li key={t}>
            <span className="font-bold text-green-600">✓</span> {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function OfertaPublicitatePage() {
  const { premium, popup } = PRICING;
  const exemplu = caseStudies.caseStudies.find((c) => c.published);

  const pachete: Pachet[] = [
    {
      nume: 'Premium',
      pret: `${premium.monthly} €/lună`,
      sub: `+ TVA ${TVA_PCT}% · anual ${premium.annual} € (2 luni gratis)`,
      pentru: 'Vizibilitate peste tot pe site, plus profilul complet al firmei.',
      accent: true,
      include: [
        'în topul „Promovate” pe pagina județului dumneavoastră',
        'pe homepage, în ghiduri, în calculator și în clasament, prin rotație',
        'pe pagina de verificare ANRE, cu badge „Promovat”',
        'profil complet: logo, descriere lungă, linkuri social media',
        'raport lunar: afișări, clickuri pe profil, clickuri pe telefon și site',
      ],
    },
    {
      nume: 'Studiu de caz',
      pret: 'La cerere',
      sub: 'preț în funcție de proiect',
      pentru: 'Un articol scris împreună despre o lucrare realizată de firma dumneavoastră.',
      include: [
        'articol despre un proiect real, cu cifrele și pozele lucrării',
        'indexat de Google și citabil de asistenții AI (ChatGPT, Gemini, Claude)',
        'link către profilul firmei din articol',
        'rămâne publicat pe site: nu este o reclamă care expiră',
      ],
    },
    {
      nume: 'Slot Popup',
      pret: `${popup.monthly} €/lună`,
      sub: `+ TVA ${TVA_PCT}% · anual ${popup.annual} € (2 luni gratis)`,
      pentru: 'Opțiunea de intrare: un loc în bannerul din colțul din dreapta jos, pe toate paginile.',
      include: [
        `${SOV.popup.rotationSeconds} secunde de afișare, apoi bannerul trece la următorul partener`,
        `maxim ${SOV.popup.cap} parteneri activi în același timp`,
        'linkuri cu tracking și raport lunar: afișări, clickuri, închideri',
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 print:hidden">
        <div>
          <Link href="/admin/sponsori" className="text-xs text-slate-500 hover:text-slate-900">
            ← Control Parteneri
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Oferta de publicitate</h1>
          <p className="mt-1 text-sm text-slate-500">
            Aceleași pachete ca /publicitate, prețurile din lib/pricing.ts. „Printează / PDF” →
            Salvează ca PDF, apoi o trimiți cu mesajul de mai jos.
          </p>
        </div>
        <DocumentActions mesaj={MESAJ} />
      </div>

      <textarea
        id="mesaj-insotire"
        readOnly
        value={MESAJ}
        rows={3}
        className="w-full rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700 print:hidden"
      />

      {/* Foaia care ajunge la firmă. De aici în jos, totul e vizibil și la print. */}
      <Sheet title="Promovare pe instalatori-fotovoltaice.ro">
        <div className="mb-5 rounded-lg border-2 border-[#f59e0b] bg-amber-50 px-4 py-3 text-base font-semibold text-slate-900">
          Listarea firmei rămâne gratuită. Pentru mai multă vizibilitate, aveți trei opțiuni:
          Premium, studiul de caz și Slot Popup.
        </div>

        <section>
          <H2 n={1}>Pachetele</H2>
          <div className="space-y-3">
            {pachete.map((p) => (
              <PachetCard key={p.nume} p={p} />
            ))}
          </div>
          {exemplu && (
            <p className="mt-3 text-[0.9em] text-slate-600">
              Exemplu de studiu de caz publicat: „{exemplu.title}”, {SITE}/studii-de-caz/
              {exemplu.slug}
            </p>
          )}
        </section>

        <section className="break-inside-avoid">
          <H2 n={2}>Condiții</H2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Prețurile sunt în euro, fără TVA. Facturăm în lei, la cursul BNR din ziua emiterii
              facturii, cu TVA {TVA_PCT}% (Cîmpian Radu Gheorghe PFA, CUI 45316713, plătitor de
              TVA).
            </li>
            <li>
              <strong>Anulare gratuită în primele 7 zile</strong> pentru Premium și Slot Popup, la
              prima activare: printr-un simplu email, returnăm integral suma facturată pe luna în
              curs.
            </li>
            <li>Fără contract minim. Puteți opri sau schimba pachetul oricând, cu activare în maxim 48 de ore.</li>
            <li>
              La Premium, rotația are loc la maxim {SOV.premium.cap} firme, în ordine aleatorie la
              fiecare afișare. Dacă locurile sunt ocupate, intrați pe lista de așteptare.
            </li>
            <li>Studiul de caz se contractează separat, după ce stabilim împreună proiectul.</li>
            <li>
              Pachetele de promovare sunt separate de cererile de ofertă: nu influențează cererile
              primite și nu se compensează cu comisionul.
            </li>
          </ul>
        </section>

        <p className="mt-6 text-xs text-slate-500">Detalii și exemple: {SITE}/publicitate</p>
      </Sheet>
    </div>
  );
}
