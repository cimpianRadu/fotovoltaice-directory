import type { Metadata } from 'next';
import Link from 'next/link';
import { getPortalEmail } from '@/lib/portal-session';
import {
  findSubscriptionForCounty,
  getClaims,
  getCountyAlertPref,
  getFirmEmailGroup,
  getLeadPhotos,
  getLeadSubscriptions,
  getLeadsSince,
  isLeadClosed,
  isLeadHidden,
  isPubliclyClaimable,
  getFirmProfiles,
  latestClaimIdentity,
  resolveGroupProfile,
  MAX_CLAIMS_PER_LEAD,
  isPriorityHeld,
  sanitizeMesajPublic,
  type NewLead,
  isLeadInformez,
} from '@/lib/sheets';
import { informezMotiv } from '@/lib/lead-alerts';
import {
  MAX_ACTIVE_CLAIMS_PER_FIRM,
  claimOccupiesLeadSlot,
  countActiveClaimsForFirm,
  isPozeLink,
} from '@/lib/sheets-shared';
import {
  getCounties,
  getConnectionShort,
  getProjectTypeLabel,
  getRoofTypeLabel,
  getPhaseLabel,
  getFinancingLabel,
  getYesNoLabel,
  getBudgetLabel,
  getCallWindowLabel,
  getTimelineLabel,
  formatShortDate,
  calendarAgeDays,
  slugifyCity,
} from '@/lib/utils-shared';
import SponsorBanner from '@/components/sponsor/SponsorBanner';
import { type PortalClaim } from './PortalClaimCard';
import PortalClaimList from './PortalClaimList';
import PortalCountyAlerts from './PortalCountyAlerts';
import PortalFirmEmails from './PortalFirmEmails';
import { MAX_FIRM_EMAILS } from '@/lib/portal-firm-emails';
import PortalLanding from './PortalLanding';
import PortalReservedLeads, { type ReservedLead } from './PortalReservedLeads';
import LogoutButton from './LogoutButton';
import PortalTabs from './PortalTabs';
import PortalFirmProfile from './PortalFirmProfile';

/** Fereastra „cereri noi" din cardul contului: cât de proaspătă e o cerere care merită sunată azi. */
const NEW_LEADS_DAYS = 7;

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
    getBudgetLabel(lead.buget) ? { label: 'Buget', value: getBudgetLabel(lead.buget) } : null,
    lead.stocare ? { label: 'Baterie', value: getYesNoLabel(lead.stocare) } : null,
    lead.wallbox ? { label: 'Stație auto', value: getYesNoLabel(lead.wallbox) } : null,
    lead.termen ? { label: 'Termen', value: getTimelineLabel(lead.termen) } : null,
    // De ce se informează, în cuvintele noastre: firma vede pe ce e blocat omul
    // (preț, buget, un program de finanțare) și decide singură cum îl abordează.
    isLeadInformez(lead) ? { label: 'Se informează', value: informezMotiv(lead) || 'nu a spus de ce' } : null,
    lead.reactivataLa ? { label: 'Reactivată', value: formatShortDate(lead.reactivataLa) } : null,
  ].filter(Boolean) as { label: string; value: string }[];
}

export default async function PortalPage() {
  // Fără sesiune ruta nu mai redirectează spre login, ci își arată fața
  // publică: /portal e adresa pe care o aud firmele în afara site-ului.
  const email = await getPortalEmail();
  if (!email) return <PortalLanding />;

  // Adresele aceleiași firme: firmele revendică de pe adresa personală a
  // omului de vânzări și intră apoi cu cea de contact, iar cererea revendicată
  // trebuie să se vadă din oricare dintre ele. Fără legături, lista are un
  // singur element și portalul se poartă exact ca înainte.
  const emails = await getFirmEmailGroup(email);
  const mineEmails = new Set(emails);
  const linked = emails.filter((e) => e !== email);

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
  let firmName = '';
  let profile = { numeFirma: '', numeContact: '', telefon: '' };
  let profileSaved = false;
  let slotsUsed = 0;
  // Cereri revendicabile acum, din județele bifate, din ultima săptămână, pe
  // care firma nu le are deja: motivul de a deschide /cereri azi.
  let newInCounties = 0;

  try {
    const [claims, leads, photos, profiles] = await Promise.all([
      getClaims(),
      getLeadsSince(new Date(0)),
      // Tabul „Poze" ține doar căile din Blob; fișierele ies numai prin
      // /api/portal/poza, care verifică din nou cine întreabă.
      getLeadPhotos(),
      getFirmProfiles(),
    ]);
    const leadById = new Map(leads.map((l) => [l.timestamp, l]));
    const photosByLead = new Map<string, { pathname: string; fileName: string }[]>();
    for (const p of photos) {
      const list = photosByLead.get(p.leadId) || [];
      list.push({ pathname: p.pathname, fileName: p.fileName });
      photosByLead.set(p.leadId, list);
    }

    // Cererile ținute pentru abonamentul firmei: încă în fereastră, încă
    // deschise și nepreluate de ea. Feedul public nu le arată nimănui, deci
    // ăsta e singurul loc din care abonatul le poate lua.
    const subs = await getLeadSubscriptions();
    const claimedByMe = new Set(
      claims.filter((c) => mineEmails.has(c.email)).map((c) => c.leadId),
    );
    reserved = leads
      .filter(
        (l) =>
          isPriorityHeld(l) &&
          !isLeadClosed(l.crmStatus) &&
          !isLeadHidden(l) &&
          !claimedByMe.has(l.timestamp) &&
          mineEmails.has(findSubscriptionForCounty(subs, l.judet)?.email || ''),
      )
      .map((l) => ({
        id: l.timestamp,
        tipLabel: getProjectTypeLabel(l.tipProiect),
        judet: l.judet,
        segment: l.segment,
        specs: specsFor(l),
        intervalApel: l.intervalApel ? getCallWindowLabel(l.intervalApel) : '',
        mesaj: l.mesajAscuns ? '' : sanitizeMesajPublic(l.mesaj, l),
        until: l.prioritarPanaLa,
      }))
      .reverse();

    mine = claims
      .filter((c) => mineEmails.has(c.email))
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
          // Separat de `specs`: nu e o caracteristică a proiectului, ci
          // instrucțiunea de apel. Se randează lângă butonul de sunat.
          intervalApel: lead?.intervalApel ? getCallWindowLabel(lead.intervalApel) : '',
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
                // Trei surse, în ordinea încrederii: pozele urcate de client
                // din formular, un link pus de noi în coloana AD, sau doar
                // marcajul că există poze pe email. Ultimele două sunt
                // moștenirea de dinainte de încărcarea din pagină.
                pozeUrcate: photosByLead.get(c.leadId) || [],
                poze: isPozeLink(lead.poze) ? lead.poze.trim() : '',
                // Badge-ul „Cu poze" de pe /cereri se aprinde pe orice marcaj,
                // nu doar pe link. Fără rândul ăsta, firma care a revendicat
                // tocmai pentru poze n-ar găsi în portal nicio urmă de ele.
                pozePeEmail:
                  Boolean(lead.poze.trim()) &&
                  !isPozeLink(lead.poze) &&
                  !(photosByLead.get(c.leadId) || []).length,
              }
            : null,
        };
      })
      .reverse(); // cele mai noi primele

    // Profilul salvat în portal are întâietate; altfel precompletăm formularul
    // din ultima revendicare, ca firma veche doar să confirme datele.
    const saved = resolveGroupProfile(profiles, emails);
    const identity = saved ?? latestClaimIdentity(claims, emails);
    profileSaved = Boolean(saved);
    profile = {
      numeFirma: identity?.numeFirma || '',
      numeContact: identity?.numeContact || '',
      telefon: identity?.telefon || '',
    };
    firmName = identity?.numeFirma || '';
    slotsUsed = identity ? countActiveClaimsForFirm(claims, identity) : 0;

    const wanted = new Set(alertCounties);
    const heldByLead = new Map<string, number>();
    for (const c of claims) {
      if (claimOccupiesLeadSlot(c)) heldByLead.set(c.leadId, (heldByLead.get(c.leadId) || 0) + 1);
    }
    newInCounties = leads.filter(
      (l) =>
        wanted.has(l.judet) &&
        isPubliclyClaimable(l) &&
        calendarAgeDays(l.reactivataLa || l.timestamp) <= NEW_LEADS_DAYS &&
        !claimedByMe.has(l.timestamp) &&
        (heldByLead.get(l.timestamp) || 0) < MAX_CLAIMS_PER_LEAD,
    ).length;
  } catch (err) {
    console.error('[portal] failed to load claims:', err);
    loadError = true;
  }

  const cereriHref = alertCounties.length
    ? `/cereri?judet=${alertCounties.map(slugifyCity).join(',')}`
    : '/cereri';

  return (
    <div className="max-w-3xl mx-auto px-4 pt-6 pb-10 sm:pt-8">
      {/* Contul: cine ești, ce ai în lucru, cât loc mai ai. Pe telefon e tot ce
          încape în primul ecran, deci doar cifrele și acțiunea următoare. */}
      <section className="rounded-2xl border border-border bg-white p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">
              Contul firmei
            </p>
            <h1 className="mt-0.5 line-clamp-2 text-xl font-bold leading-tight text-gray-900 sm:text-2xl">
              {firmName || 'Cererile firmei tale'}
            </h1>
            <p className="mt-0.5 truncate text-xs text-gray-500">
              {email}
              {linked.length > 0 && ` + ${linked.length} ${linked.length === 1 ? 'coleg' : 'colegi'}`}
            </p>
          </div>
          <LogoutButton />
        </div>

        {!loadError && <PortalFirmProfile initial={profile} saved={profileSaved} />}

        {firmName && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Locuri ocupate pentru revendicări noi</span>
              <span className="font-semibold text-gray-700 tabular-nums">
                {slotsUsed} din {MAX_ACTIVE_CLAIMS_PER_FIRM}
              </span>
            </div>
            <div className="mt-1.5 flex gap-1" aria-hidden>
              {Array.from({ length: MAX_ACTIVE_CLAIMS_PER_FIRM }, (_, i) => (
                <span
                  key={i}
                  className={`h-1.5 flex-1 rounded-full ${i < slotsUsed ? 'bg-primary' : 'bg-gray-200'}`}
                />
              ))}
            </div>
            {slotsUsed >= MAX_ACTIVE_CLAIMS_PER_FIRM && (
              <p className="mt-1.5 text-xs text-amber-700">
                Mută statusul cererilor la care ai sunat și se eliberează locuri.
              </p>
            )}
          </div>
        )}

        <Link
          href={cereriHref}
          className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-primary px-4 py-3 text-white transition-colors hover:bg-primary-dark"
        >
          <span className="text-sm font-semibold leading-snug">
            {alertCounties.length === 0
              ? 'Vezi cererile noi de pe site'
              : newInCounties > 0
                ? `${newInCounties} ${newInCounties === 1 ? 'cerere nouă' : 'cereri noi'} în județele tale`
                : 'Vezi cererile din județele tale'}
            {alertCounties.length > 0 && (
              <span className="block text-xs font-normal opacity-90">
                {newInCounties > 0 ? `din ultimele ${NEW_LEADS_DAYS} zile, revendici dintr-un click` : 'nimic nou în ultimele 7 zile'}
              </span>
            )}
          </span>
          <span aria-hidden className="text-lg">→</span>
        </Link>
      </section>

      {reserved.length > 0 && (
        <div className="mt-5">
          <PortalReservedLeads leads={reserved} />
        </div>
      )}

      <div className="mt-5">
        <PortalTabs
          claimsCount={mine.length}
          settingsBadge={alertCounties.length === 0}
          claims={
            <>
              {loadError && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 mb-6">
                  Nu am putut încărca cererile. Reîmprospătează pagina.
                </div>
              )}

              {!loadError && mine.length === 0 && (
                <div className="bg-surface rounded-xl border border-border p-6 text-center sm:p-10">
                  <p className="text-gray-600 font-medium">Nicio cerere revendicată încă.</p>
                  <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                    Revendică din{' '}
                    <Link href={cereriHref} className="text-primary-dark underline hover:no-underline">
                      cererile active
                    </Link>
                    : cât ești conectat, revendicarea e dintr-un click. Dacă ai revendicat înainte cu
                    alt email, scrie-ne la{' '}
                    <a
                      href="mailto:contact@instalatori-fotovoltaice.ro"
                      className="text-primary-dark underline hover:no-underline"
                    >
                      contact@instalatori-fotovoltaice.ro
                    </a>
                    .
                  </p>
                </div>
              )}

              {mine.length > 0 && <PortalClaimList claims={mine} />}

              {mine.length > 0 && (
                <p className="mt-8 text-xs text-gray-400 leading-relaxed">
                  Datele clienților se deblochează imediat ce aprobăm revendicarea. Statusul pe care
                  îl setezi tu ne spune unde ești cu clientul. Locul se eliberează când renunți, cu un
                  motiv, sau când marchezi că ai pierdut clientul.
                </p>
              )}
            </>
          }
          settings={
            <>
              <PortalCountyAlerts counties={getCounties()} initial={alertCounties} />
              <PortalFirmEmails current={email} addresses={emails} max={MAX_FIRM_EMAILS} />
            </>
          }
        />
      </div>

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
