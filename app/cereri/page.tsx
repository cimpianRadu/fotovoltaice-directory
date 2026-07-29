import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import { generateBreadcrumbJsonLd } from '@/lib/seo';
import { MAX_CLAIMS_PER_LEAD, getClaims, getPublicLeads, type PublicLead } from '@/lib/sheets';
import {
  getProjectTypeLabel,
  getRoofTypeLabel,
  getPhaseLabel,
  getFinancingShort,
  getFinancingTone,
} from '@/lib/utils-shared';
import { type LeadCardData } from './LeadCard';
import LeadFeed from './LeadFeed';

// Feedul se regenerează la cel mult 5 minute — destul de proaspăt pentru
// revendicări, fără să lovim Google Sheets la fiecare vizită.
export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Cereri de Ofertă Active - Lead-uri pentru Instalatori Fotovoltaice',
  description:
    'Cereri reale de instalare panouri fotovoltaice, primite prin formularul Cere Ofertă. Firmele de instalare pot revendica maxim 3 sloturi per cerere.',
  alternates: { canonical: '/cereri' },
};

function ageInDays(iso: string): number {
  return Math.floor((Date.now() - Date.parse(iso)) / 86_400_000);
}

function postedLabel(days: number): string {
  if (days <= 0) return 'azi';
  if (days === 1) return 'ieri';
  return `acum ${days} zile`;
}

export default async function CereriPage() {
  let leads: PublicLead[] = [];
  const claimCounts: Record<string, number> = {};

  try {
    const [publicLeads, claims] = await Promise.all([getPublicLeads(), getClaims()]);
    leads = publicLeads;
    for (const c of claims) {
      claimCounts[c.leadId] = (claimCounts[c.leadId] || 0) + 1;
    }
  } catch (err) {
    // Fără credențiale Sheets (build local, preview) pagina rămâne funcțională, cu feed gol.
    console.error('[cereri] failed to load leads:', err);
  }

  const cards: LeadCardData[] = leads.map((l) => {
    const ageDays = ageInDays(l.id);
    return {
      id: l.id,
      tipLabel: getProjectTypeLabel(l.tipProiect),
      judet: l.judet,
      putere: l.putere,
      suprafata: l.suprafata,
      segment: l.segment,
      postedLabel: postedLabel(ageDays),
      ageDays,
      mesaj: l.mesaj,
      acoperisLabel: l.tipAcoperis ? getRoofTypeLabel(l.tipAcoperis) : '',
      fazareLabel: l.fazare ? getPhaseLabel(l.fazare) : '',
      consumLunar: l.consumLunar,
      finantareLabel: l.finantare ? getFinancingShort(l.finantare) : '',
      finantareTone: getFinancingTone(l.finantare),
    };
  });

  const active = cards.filter((c) => (claimCounts[c.id] || 0) < MAX_CLAIMS_PER_LEAD).length;

  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: 'Acasă', url: '/' },
          { name: 'Cereri Clienți', url: '/cereri' },
        ])}
      />

      <div className="max-w-5xl mx-auto px-4 py-6">
        <Breadcrumbs items={[{ label: 'Cereri Clienți' }]} />

        <div className="mt-6 mb-8 max-w-3xl">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Cereri de Ofertă Active
          </h1>
          <p className="text-gray-500 mt-2">
            Cereri reale de instalare panouri fotovoltaice, primite prin formularul{' '}
            <Link href="/cere-oferta" className="text-primary-dark underline hover:no-underline">
              Cere Ofertă
            </Link>
            . Datele de contact ale clientului nu sunt publice: revendici cererea, te sunăm
            pentru confirmare, apoi primești datele complete. Maxim {MAX_CLAIMS_PER_LEAD} firme
            per cerere, iar revendicarea este rezervată firmelor de instalare fotovoltaice.
          </p>
        </div>

        <div className="mb-8 bg-surface rounded-xl p-5 border border-border">
          <h2 className="font-semibold text-gray-900 mb-4">Cum funcționează pentru instalatori?</h2>
          <ol className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-600">
            <li className="flex gap-3">
              <span className="shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary-dark font-bold text-sm inline-flex items-center justify-center">1</span>
              <span>Apeși „Vreau această cerere" și lași datele firmei tale (30 de secunde)</span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary-dark font-bold text-sm inline-flex items-center justify-center">2</span>
              <span>
                Te sunăm pentru confirmare (revendicarea este rezervată firmelor de instalare) și
                îți transmitem datele complete ale clientului
              </span>
            </li>
            <li className="flex gap-3">
              <span className="shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary-dark font-bold text-sm inline-flex items-center justify-center">3</span>
              <span>
                Fiecare cerere merge la maxim {MAX_CLAIMS_PER_LEAD} firme, ca să aibă toată lumea o
                șansă reală de închidere
              </span>
            </li>
          </ol>
          <p className="text-sm text-gray-600 mt-4 pt-4 border-t border-border">
            Vrei să primești cererile direct, înainte să apară aici?{' '}
            <Link href="/listeaza-firma" className="text-primary-dark underline hover:no-underline">
              Listează-ți firma gratuit
            </Link>{' '}
            sau scrie-ne la{' '}
            <a
              href="mailto:contact@instalatori-fotovoltaice.ro"
              className="text-primary-dark underline hover:no-underline"
            >
              contact@instalatori-fotovoltaice.ro
            </a>
            .
          </p>
        </div>

        {cards.length === 0 ? (
          <div className="bg-surface rounded-xl border border-border p-10 text-center">
            <p className="text-gray-600 font-medium">Nicio cerere activă momentan.</p>
            <p className="text-sm text-gray-500 mt-2">
              Cererile noi apar aici imediat ce clienții le trimit.{' '}
              <Link href="/listeaza-firma" className="text-primary-dark underline hover:no-underline">
                Listează-ți firma
              </Link>{' '}
              ca să fii notificat primul.
            </p>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-gray-500">
              {cards.length} {cards.length === 1 ? 'cerere' : 'cereri'} primite
              {active < cards.length ? `, ${active} încă disponibile` : ''}
            </p>
            <LeadFeed cards={cards} claimCounts={claimCounts} maxClaims={MAX_CLAIMS_PER_LEAD} />
          </>
        )}

      </div>
    </>
  );
}
