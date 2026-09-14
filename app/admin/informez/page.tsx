import { getLeadsSince, getWatches, isLeadClosed, isLeadHidden, isLeadInformez, type NewLead } from '@/lib/sheets';
import { CHECKIN_MAX, checkinDue, isInformezClient, programAnnouncementRecipients } from '@/lib/informez';
import { informezMotiv } from '@/lib/lead-alerts';
import { formatShortDate, getFinancingShort, getProgramName, getProjectTypeLabel } from '@/lib/utils-shared';
import ProgramAnnounce from './ProgramAnnounce';

export const dynamic = 'force-dynamic';

// Cererile pe care clientul se informează, într-un singur loc: unde e fiecare
// în flux (întâmpinare, check-in-uri, urmăritori), plus butonul de anunț la
// deschiderea unui program. Emailurile zilnice pleacă din cronul claim-nudge,
// aici doar se vede ce a plecat și ce urmează.

function stateOf(lead: NewLead, now: number): string {
  if (lead.reactivataLa) return `reactivată ${formatShortDate(lead.reactivataLa)}`;
  if (isLeadClosed(lead.crmStatus)) return `închisă (${lead.crmStatus})`;
  if (!isInformezClient(lead)) return 'fără email valid';
  const parts: string[] = [];
  parts.push(lead.emailClientLa ? `întâmpinare ${formatShortDate(lead.emailClientLa)}` : 'fără întâmpinare');
  if (lead.checkinTrimise) parts.push(`check-in ${lead.checkinTrimise}/${CHECKIN_MAX} (${formatShortDate(lead.checkinLa)})`);
  const due = checkinDue(lead, now);
  if (due) parts.push(`check-in ${due} scadent`);
  if (lead.raspunsClient) parts.push(`răspuns: ${lead.raspunsClient.split(' ')[0]}`);
  return parts.join(' · ');
}

export default async function InformezAdminPage() {
  const [leads, watches] = await Promise.all([getLeadsSince(new Date(0)), getWatches()]);
  // După citire, nu la începutul randării: pagina e dinamică, „acum" e momentul cererii.
  const now = new Date().getTime();
  const rows = leads
    .filter((l) => (isLeadInformez(l) || l.reactivataLa) && !isLeadHidden(l))
    .reverse();
  const watchCount = (id: string) => watches.filter((w) => w.leadId === id).length;

  const programs = (['afm-baterii', 'casa-verde'] as const).map((p) => ({
    value: p,
    label: getProgramName(p),
    pending: programAnnouncementRecipients(leads, p).length,
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Se informează</h1>
        <p className="mt-1 text-sm text-gray-500">
          {rows.length} cereri cu „deocamdată mă informez”, inclusiv cele reactivate. Întâmpinarea și
          check-in-urile pleacă singure, din cronul zilnic (
          <code className="text-xs">/api/cron/claim-nudge?dry=1</code> arată ce ar pleca mâine).
        </p>
      </div>

      <ProgramAnnounce programs={programs} />

      <div className="overflow-x-auto rounded-xl border border-border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-surface text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-3 py-2">Cerere</th>
              <th className="px-3 py-2">Finanțare</th>
              <th className="px-3 py-2">Motiv</th>
              <th className="px-3 py-2">Stare</th>
              <th className="px-3 py-2">Urmăresc</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((l) => (
              <tr key={l.timestamp} className="align-top">
                <td className="px-3 py-2 whitespace-nowrap">
                  <a href={`/admin/crm?filtru=toate#${encodeURIComponent(l.timestamp)}`} className="font-medium text-gray-900 hover:underline">
                    {l.judet} · {getProjectTypeLabel(l.tipProiect)}
                  </a>
                  <div className="text-xs text-gray-400">
                    {formatShortDate(l.timestamp)}
                    {l.putere ? ` · ${l.putere} kW` : ''}
                  </div>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">{l.finantare ? getFinancingShort(l.finantare) : '–'}</td>
                <td className="px-3 py-2">
                  {informezMotiv(l) || <span className="text-gray-400">fără răspuns</span>}
                  {l.blocajDetalii && <div className="text-xs text-gray-500 italic">„{l.blocajDetalii}”</div>}
                </td>
                <td className="px-3 py-2 text-xs text-gray-600">{stateOf(l, now)}</td>
                <td className="px-3 py-2 text-center">{watchCount(l.timestamp) || '–'}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                  Nicio cerere cu „mă informez”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
