import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import { generateBreadcrumbJsonLd } from '@/lib/seo';
import {
  MAX_CLAIMS_PER_LEAD,
  claimOccupiesLeadSlot,
  getClaims,
  getPublicLeads,
  type PublicLead,
} from '@/lib/sheets';
import {
  calendarAgeDays,
  cerereAgeLabel,
  getProjectTypeLabel,
  getRoofTypeLabel,
  getPhaseLabel,
  getConnectionShort,
  getFinancingShort,
  getFinancingTone,
  getYesNoLabel,
  getCallWindowLabel,
  getTimelineLabel,
  getWorkTypeShort,
  isRetrofit,
} from '@/lib/utils-shared';
import { mountingForRoof, parseConsumLunar, sizeKwp } from '@/lib/pv-estimate';
import { PROGRAM, bracketFor } from '@/lib/battery-sizing';
import { type LeadCardData } from './LeadCard';
import LeadFeed from './LeadFeed';
import HowItWorks from './HowItWorks';
import SponsorBanner from '@/components/sponsor/SponsorBanner';

// Feedul se regenerează la cel mult 5 minute — destul de proaspăt pentru
// revendicări, fără să lovim Google Sheets la fiecare vizită.
export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Cereri de Ofertă Active - Lead-uri pentru Instalatori Fotovoltaice',
  description:
    'Cereri reale de instalare panouri fotovoltaice, primite prin formularul Cere Ofertă. Firmele de instalare pot revendica maxim 3 sloturi per cerere.',
  alternates: { canonical: '/cereri' },
};


// Zecimala are sens doar la sistemele mici, unde 0,5 kW chiar schimbă oferta.
// Peste 10 kW „≈155,2 kW" ar sugera o precizie pe care estimarea nu o are.
function formatKw(kwp: number): string {
  return kwp >= 10 ? String(Math.round(kwp)) : String(kwp).replace('.', ',');
}

export default async function CereriPage() {
  let leads: PublicLead[] = [];
  const claimCounts: Record<string, number> = {};

  try {
    const [publicLeads, claims] = await Promise.all([getPublicLeads(), getClaims()]);
    leads = publicLeads;
    for (const c of claims) {
      // Renunțările și cererile marcate „neconcretizat" nu ocupă locuri —
      // aceeași regulă ca la revendicare (claimsHeldForLead), altfel feedul ar
      // arăta plină o cerere pe care API-ul o acceptă.
      if (!claimOccupiesLeadSlot(c)) continue;
      claimCounts[c.leadId] = (claimCounts[c.leadId] || 0) + 1;
    }
  } catch (err) {
    // Fără credențiale Sheets (build local, preview) pagina rămâne funcțională, cu feed gol.
    console.error('[cereri] failed to load leads:', err);
  }

  const cards: LeadCardData[] = leads.map((l) => {
    const ageDays = calendarAgeDays(l.id);
    // 57% dintre cererile de după 18 aug 2026 vin fără putere: omul bifează „nu
    // știu, aștept recomandarea instalatorului", ceea ce e un răspuns corect,
    // dar lasă cardul fără niciun reper de dimensionare. Consumul îl completează
    // mai des, așa că de acolo scoatem puterea orientativă — aceeași formulă ca
    // în calculator (`sizeKwp`), marcată vizibil ca estimare.
    const consum = parseConsumLunar(l.consumLunar);
    // La retrofit puterea declarată e a sistemului pe care omul îl ARE deja, nu
    // a cererii, deci nu se estimează nimic din consum: ar fi dimensionarea unui
    // sistem pe care nu îl cere. Pentru „doar baterie" reperul util e cu totul
    // altul, capacitatea, și vine din tabelul de dimensionare din ghid.
    const retrofit = isRetrofit(l.tipLucrare);
    const kwpEstimat = !retrofit && !l.putere && consum
      ? sizeKwp(consum.kwhLunar, l.judet, mountingForRoof(l.tipAcoperis))
      : null;
    // Capacitatea de afișat la „doar baterie". Necesarul tehnic decide singur
    // doar pe fonduri proprii. Pe Casa Verde Baterii nu: programul finanțează de
    // la 12 kWh în sus, deci aia e capacitatea pe care omul o va cumpăra, oricât
    // de mic i-ar fi consumul. Prosumatorul din București scrisese „15" în
    // formular exact ca să prindă pragul, iar un card care i-ar fi arătat firmei
    // „5-7 kWh" ar fi ratat singurul număr care contează la el.
    const doarBaterie = l.tipLucrare === 'doar-baterie';
    const baterie = doarBaterie && consum ? bracketFor(consum.kwhLunar) : null;
    const [bMin, bMax] = baterie ? baterie.capacity : [0, 0];
    const subPragAfm = l.finantare === 'afm-baterii' && bMax < PROGRAM.minKwh;
    return {
      id: l.id,
      tipLabel: getProjectTypeLabel(l.tipProiect),
      judet: l.judet,
      putereLabel: l.putere
        ? `${retrofit ? 'are ' : ''}${l.putere} kW`
        : kwpEstimat
          ? `≈${formatKw(kwpEstimat)} kW estimat`
          : '',
      // Cifra clientului bate orice calcul de-al nostru: dacă a spus câți kWh
      // vrea, aia e cererea. Estimarea intră doar când n-a spus, iar la AFM
      // pornește de la pragul programului, nu de la necesarul din consum.
      bateriaLabel: doarBaterie && l.capacitateBaterie
        ? `baterie ${l.capacitateBaterie} kWh`
        : !baterie
          ? ''
          : subPragAfm
            ? `baterie ≈${PROGRAM.minKwh} kWh (pragul AFM)`
            : `baterie ≈${bMin === bMax ? bMin : `${bMin}-${bMax}`} kWh`,
      tipLucrare: l.tipLucrare,
      tipLucrareLabel: l.tipLucrare ? getWorkTypeShort(l.tipLucrare) : '',
      suprafata: l.suprafata,
      segment: l.segment,
      postedLabel: cerereAgeLabel(ageDays),
      ageDays,
      mesaj: l.mesaj,
      acoperisLabel: l.tipAcoperis ? getRoofTypeLabel(l.tipAcoperis) : '',
      fazareLabel: l.fazare ? getPhaseLabel(l.fazare) : '',
      bransamentLabel: l.bransament ? getConnectionShort(l.bransament) : '',
      consumLunar: consum ? consum.label : l.consumLunar,
      finantareLabel: l.finantare ? getFinancingShort(l.finantare) : '',
      finantareTone: getFinancingTone(l.finantare),
      stocareLabel: l.stocare ? getYesNoLabel(l.stocare) : '',
      wallboxLabel: l.wallbox ? getYesNoLabel(l.wallbox) : '',
      termenLabel: l.termen ? getTimelineLabel(l.termen) : '',
      intervalApelLabel: l.intervalApel ? getCallWindowLabel(l.intervalApel) : '',
      arePoze: l.arePoze,
      verificata: l.verificata,
    };
  });

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

        <div className="mt-6 mb-6 sm:mb-8 max-w-3xl">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Cereri de Ofertă Active
          </h1>
          {/* Scurt intenționat: pașii, plafonul de firme și condiția de acces
              sunt în caseta de mai jos, iar pe telefon intro-ul e singurul text
              care se vede până la prima cerere. */}
          <p className="text-gray-500 mt-2">
            Cereri reale din formularul{' '}
            <Link href="/cere-oferta" className="text-primary-dark underline hover:no-underline">
              Cere Ofertă
            </Link>
            . Revendici una, te sunăm, primești contactul.
          </p>
        </div>

        <HowItWorks maxClaims={MAX_CLAIMS_PER_LEAD} />

        {/* Singura pagină cu audiență de instalatori, deci partenerii apar aici
            cu mesajul lor B2B. Sus, imediat după explicație: jos, sub feed, nu
            ajungea nimeni la el. */}
        <div className="mb-6 sm:mb-8">
          <SponsorBanner position="cereri" title="Parteneri pentru instalatori" />
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
          /* Numărătoarea stă în LeadFeed, nu aici: feedul pornește pe o
             fereastră de vechime, iar un total server-side ar contrazice
             numărul de carduri de sub el. */
          <LeadFeed cards={cards} claimCounts={claimCounts} maxClaims={MAX_CLAIMS_PER_LEAD} />
        )}

      </div>
    </>
  );
}
