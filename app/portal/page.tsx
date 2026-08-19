import type { Metadata } from 'next';
import Link from 'next/link';
import { getPortalEmail } from '@/lib/portal-session';
import {
  findSubscriptionForCounty,
  getClaims,
  getCountyAlertPref,
  getLeadSubscriptions,
  getLeadsSince,
  isLeadClosed,
  isPriorityHeld,
  sanitizeMesajPublic,
  type NewLead,
} from '@/lib/sheets';
import {
  getCounties,
  getConnectionShort,
  getProjectTypeLabel,
  getRoofTypeLabel,
  getPhaseLabel,
  getFinancingLabel,
  getYesNoLabel,
  getTimelineLabel,
} from '@/lib/utils-shared';
import SponsorBanner from '@/components/sponsor/SponsorBanner';
import { type PortalClaim } from './PortalClaimCard';
import PortalClaimList from './PortalClaimList';
import PortalCountyAlerts from './PortalCountyAlerts';
import PortalLanding from './PortalLanding';
import PortalReservedLeads, { type ReservedLead } from './PortalReservedLeads';
import LogoutButton from './LogoutButton';

// Datele firmei logate nu au voie în cache-ul static — mereu proaspete, per sesiune.
export const dynamic = 'force-dynamic';

// Metadata descrie pagina publică, nu tabloul de bord: Google vede mereu
// varianta delogată, iar firma logată se uită la conținut, nu la titlul din tab.
export const metadata: Metadata = {
  title: 'Portal Instalatori: alerte pe județ și cererile firmei tale',
  description:
    'Bifezi județele în care lucrezi și primești pe email fiecare cerere nouă de panouri fotovoltaice de acolo. Plus cererile revendicate, într-un singur loc. Gratuit, fără parolă.',
  alternates: { canonical: 'https://instalatori-fotovoltaice.ro/portal' },
};

function specsFor(lead: NewLead | undefined): { label: string; value: string }[] {
  if (!lead) return [];
  return [
    lead.putere ? { label: 'Putere', value: `${lead.putere} kW` } : null,
    lead.suprafata ? { label: 'Suprafață', value: `${lead.suprafata} mp` } : null,
    lead.tipAcoperis ? { label: 'Acoperiș', value: getRoofTypeLabel(lead.tipAcoperis) } : null,
    lead.fazare ? { label: 'Alimentare', value: getPhaseLabel(lead.fazare) } : null,
    lead.bransament ? { label: 'Branșament', value: getConnectionShort(lead.bransament) } : null,
    lead.consumLunar ? { label: 'Consum', value: lead.consumLunar } : null,
    lead.finantare ? { label: 'Finanțare', value: getFinancingLabel(lead.finantare) } : null,
    lead.stocare ? { label: 'Baterie', value: getYesNoLabel(lead.stocare) } : null,
    lead.wallbox ? { label: 'Stație auto', value: getYesNoLabel(lead.wallbox) } : null,
    lead.termen ? { label: 'Termen', value: getTimelineLabel(lead.termen) } : null,
  ].filter(Boolean) as { label: string; value: string }[];
}

export default async function PortalPage() {
  // Fără sesiune ruta nu mai redirectează spre login, ci își arată fața
  // publică: /portal e adresa pe care o aud firmele în afara site-ului.
  const email = await getPortalEmail();
  if (!email) return <PortalLanding />;

  let mine: PortalClaim[] = [];
  let loadError = false;
  // Preferințele de alerte se citesc separat de revendicări: dacă tabul lor
  // lipsește sau pică, portalul trebuie să-și arate cererile mai departe.
  let alertCounties: string[] = [];

  try {
    alertCounties = (await getCountyAlertPref(email))?.counties ?? [];
  } catch (err) {
    console.error('[portal] failed to load county alerts:', err);
  }

  let reserved: ReservedLead[] = [];

  try {
    const [claims, leads] = await Promise.all([getClaims(), getLeadsSince(new Date(0))]);
    const leadById = new Map(leads.map((l) => [l.timestamp, l]));

    // Cererile ținute pentru abonamentul firmei: încă în fereastră, încă
    // deschise și nepreluate de ea. Feedul public nu le arată nimănui, deci
    // ăsta e singurul loc din care abonatul le poate lua.
    const subs = await getLeadSubscriptions();
    const claimedByMe = new Set(claims.filter((c) => c.email === email).map((c) => c.leadId));
    reserved = leads
      .filter(
        (l) =>
          isPriorityHeld(l) &&
          !isLeadClosed(l.crmStatus) &&
          l.status !== 'Ascuns' &&
          !claimedByMe.has(l.timestamp) &&
          findSubscriptionForCounty(subs, l.judet)?.email === email,
      )
      .map((l) => ({
        id: l.timestamp,
        tipLabel: getProjectTypeLabel(l.tipProiect),
        judet: l.judet,
        segment: l.segment,
        specs: specsFor(l),
        mesaj: l.mesajAscuns ? '' : sanitizeMesajPublic(l.mesaj),
        until: l.prioritarPanaLa,
      }))
      .reverse();

    mine = claims
      .filter((c) => c.email === email)
      .map((c) => {
        const lead = leadById.get(c.leadId);
        const approved = Boolean(c.approvedAt);
        return {
          claimTimestamp: c.timestamp,
          leadId: c.leadId,
          numeFirma: c.numeFirma,
          claimedAt: c.timestamp,
          releasedAt: c.releasedAt,
          releaseReason: c.releaseReason,
          contactedAt: c.contactedAt,
          approved,
          // Data deblocării, nu doar faptul ei: din ea se calculează de câte
          // zile stă cererea neatinsă, pentru bannerul de pe card.
          approvedAt: c.approvedAt,
          offeredAt: c.offeredAt,
          firmStatus: c.firmStatus,
          notes: c.firmNotes,
          tipLabel: lead ? getProjectTypeLabel(lead.tipProiect) : 'Cerere',
          judet: lead?.judet || '',
          segment: lead?.segment || 'comercial',
          specs: specsFor(lead),
          mesaj: lead && !lead.mesajAscuns ? lead.mesaj : '',
          // Datele de contact ale clientului pleacă spre client DOAR pe
          // revendicările aprobate — gate-ul telefonic din /admin/crm.
          client: approved && lead
            ? {
                nume: lead.numeContact,
                companie: lead.numeCompanie,
                telefon: lead.telefon,
                email: lead.email,
                localitate: [lead.localitate, lead.judet].filter(Boolean).join(', '),
                poze: lead.poze.trim(),
              }
            : null,
        };
      })
      .reverse(); // cele mai noi primele
  } catch (err) {
    console.error('[portal] failed to load claims:', err);
    loadError = true;
  }

  // `pb-24` pe telefon: butonul plutitor de filtre e poziționat fix, iar fără
  // rezerva asta ar acoperi ultimul lucru de pe pagină când ajungi la capăt.
  return (
    <div className="max-w-3xl mx-auto px-4 pt-8 pb-24 sm:pb-8">
      <div className="flex items-start justify-between gap-4 mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Cererile firmei tale</h1>
        <LogoutButton />
      </div>
      <p className="text-sm text-gray-500 mb-8">
        Conectat ca <strong>{email}</strong>. Aici vezi cererile revendicate cu acest email,
        lași note și eliberezi locurile la care renunți.
      </p>

      {reserved.length > 0 && <PortalReservedLeads leads={reserved} />}

      <PortalCountyAlerts counties={getCounties()} initial={alertCounties} />

      {loadError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 mb-6">
          Nu am putut încărca cererile. Reîmprospătează pagina.
        </div>
      )}

      {!loadError && mine.length === 0 && (
        <div className="bg-surface rounded-xl border border-border p-10 text-center">
          <p className="text-gray-600 font-medium">Nicio cerere revendicată cu acest email.</p>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            Revendică cereri din{' '}
            <Link href="/cereri" className="text-primary-dark underline hover:no-underline">
              feedul de cereri active
            </Link>{' '}
            folosind emailul <strong>{email}</strong>. Dacă ai revendicat înainte de lansarea
            portalului, scrie-ne la{' '}
            <a
              href="mailto:contact@instalatori-fotovoltaice.ro"
              className="text-primary-dark underline hover:no-underline"
            >
              contact@instalatori-fotovoltaice.ro
            </a>{' '}
            și îți legăm revendicările vechi de cont.
          </p>
        </div>
      )}

      {mine.length > 0 && <PortalClaimList claims={mine} />}

      {mine.length > 0 && (
        <p className="mt-8 text-xs text-gray-400 leading-relaxed">
          Datele clienților se deblochează după apelul nostru de confirmare. Statusul pe care îl
          setezi tu ne spune unde ești cu clientul, ca să nu te mai sunăm degeaba. Locul unei firme
          se eliberează când clientul confirmă că a fost sunat, sau când renunți tu, cu un motiv,
          de aici.
        </p>
      )}

      {/* Cea mai bună plasare de instalatori de pe site, și singura unde firma
          e prinsă exact în momentul potrivit: tocmai a luat o lucrare nouă.
          Volumul e mic, intenția e maximă, deci se vinde ca moment, nu ca
          impresii. Ține slotul jos, sub cereri: portalul e unealtă de lucru. */}
      <div className="mt-10">
        <SponsorBanner position="portal" title="Servicii pentru firma ta" />
      </div>
    </div>
  );
}
