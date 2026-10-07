import { getClientFeedbacks, getLeadsSince, type ClientFeedbackRow, type NewLead } from '@/lib/sheets';
import { CLAIM_STATUS_LABELS, LEAD_STATUS_LABELS } from '@/lib/sheets-shared';
import {
  STATUS_CHECK_PER_DAY,
  getStatusCheckOverview,
  responseAfter,
  type NamedFirm,
} from '@/lib/verificare-status';
import { formatShortDate } from '@/lib/utils-shared';

export const dynamic = 'force-dynamic';

// Emailurile automate către clienții cu cereri vechi, într-un singur loc (7 oct
// 2026): „Ați găsit o ofertă bună?" (coloana BB) și „mai căutați oferte?" (AZ).
// Ce a plecat, cine a răspuns și ce, chestionarul completat și ce urmează.
// Doar citire: răspunsurile schimbă cererea singure, corecturile se fac în CRM.

const RESPONSE_LABELS: Record<string, { label: string; tone: string }> = {
  semnat: { label: '✅ A semnat', tone: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  decid: { label: '🤔 Se decide', tone: 'bg-amber-50 text-amber-800 border-amber-200' },
  'altafirma-altundeva': { label: '❌ Altă firmă', tone: 'bg-slate-100 text-slate-700 border-slate-200' },
  'altafirma-renuntat': { label: '❌ Renunță', tone: 'bg-slate-100 text-slate-700 border-slate-200' },
  necontactat: { label: '📵 Necontactat', tone: 'bg-red-50 text-red-800 border-red-200' },
  activa: { label: 'Încă vrea oferte', tone: 'bg-violet-50 text-violet-800 border-violet-200' },
  aleasa: { label: 'A ales o firmă', tone: 'bg-slate-100 text-slate-700 border-slate-200' },
  renunt: { label: 'Nu mai vrea', tone: 'bg-slate-100 text-slate-700 border-slate-200' },
};

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('ro-RO', {
    timeZone: 'Europe/Bucharest',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function LeadCell({ lead }: { lead: NewLead }) {
  return (
    <>
      <a
        href={`/admin/crm?filtru=toate#${encodeURIComponent(lead.timestamp)}`}
        className="font-medium text-gray-900 hover:underline"
      >
        {lead.judet}
        {lead.putere ? ` · ${lead.putere} kW` : ''}
      </a>
      <div className="text-xs text-gray-500">{lead.numeContact || lead.numeCompanie}</div>
      <div className="text-xs text-gray-400">cerere din {formatShortDate(lead.timestamp)}</div>
    </>
  );
}

function ResponseBadge({ response }: { response: { code: string; at: string; firma: string } | null }) {
  if (!response) return <span className="text-xs text-gray-400">fără răspuns</span>;
  const meta = RESPONSE_LABELS[response.code] ?? { label: response.code, tone: 'bg-slate-100 text-slate-700 border-slate-200' };
  return (
    <div>
      <span className={`inline-block rounded-md border px-2 py-0.5 text-xs font-semibold ${meta.tone}`}>{meta.label}</span>
      {response.firma && <div className="mt-1 text-xs text-gray-700">cu {response.firma}</div>}
      <div className="mt-0.5 text-xs text-gray-400">{fmtDateTime(response.at)}</div>
    </div>
  );
}

function FirmList({ firms }: { firms: NamedFirm[] }) {
  if (firms.length === 0) return <span className="text-xs text-gray-400">nicio revendicare activă</span>;
  return (
    <ul className="space-y-0.5">
      {firms.map((f) => (
        <li key={f.claimTs} className="text-xs">
          <span className="text-gray-900">{f.name}</span>{' '}
          <span className="text-gray-400">· {CLAIM_STATUS_LABELS[f.status]}</span>
        </li>
      ))}
    </ul>
  );
}

function FeedbackCell({ feedback }: { feedback: ClientFeedbackRow | undefined }) {
  if (!feedback) return <span className="text-xs text-gray-400">necompletat</span>;
  const publish =
    feedback.testimonial === 'da' ? 'publicare cu nume' : feedback.testimonial === 'da-fara-nume' ? 'publicare fără nume' : 'fără publicare';
  return (
    <div className="max-w-xs">
      <div className="text-sm font-semibold text-gray-900">
        {feedback.satisfactie}/5{' '}
        <span className={`text-xs font-normal ${feedback.testimonial === 'nu' ? 'text-gray-400' : 'text-emerald-700'}`}>
          · {publish}
        </span>
      </div>
      {feedback.experienta && <p className="mt-1 text-xs text-gray-700 italic">„{feedback.experienta}”</p>}
      {feedback.imbunatatiri && (
        <p className="mt-1 text-xs text-gray-500">
          <span className="font-medium">De îmbunătățit:</span> {feedback.imbunatatiri}
        </p>
      )}
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-xl border border-border bg-white px-4 py-3">
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-gray-900">{value}</div>
      {hint && <div className="text-xs text-gray-400">{hint}</div>}
    </div>
  );
}

export default async function EmailuriAdminPage() {
  const [overview, leads, feedbacks] = await Promise.all([
    getStatusCheckOverview(),
    getLeadsSince(new Date(0)),
    getClientFeedbacks(),
  ]);
  const { sent, queue, sentToday } = overview;
  const feedbackFor = (id: string) => feedbacks.find((f) => f.leadId === id);

  const answered = sent.filter((r) => r.response).length;
  const questionnaires = sent.filter((r) => feedbackFor(r.lead.timestamp)).length;
  const signed = sent.filter((r) => r.response?.code === 'semnat').length;
  // Ziua estimată pentru fiecare cerere din coadă: 5 pe zi, de mâine dacă lotul de azi e plin.
  const startOffset = sentToday >= STATUS_CHECK_PER_DAY ? 1 : 0;
  const queueDay = (i: number) => {
    const d = new Date();
    d.setDate(d.getDate() + startOffset + Math.floor(i / STATUS_CHECK_PER_DAY));
    return d.toLocaleDateString('ro-RO', { timeZone: 'Europe/Bucharest', weekday: 'short', day: 'numeric', month: 'short' });
  };

  // AT ține doar ultimul răspuns, la oricare email: fiecare tabel își arată doar codurile lui.
  const ACTIVE_CODES = ['activa', 'aleasa', 'renunt'];
  const activeResponse = (lead: NewLead) => {
    const r = responseAfter(lead, lead.verificareTrimisaLa);
    return r && ACTIVE_CODES.includes(r.code) ? r : null;
  };

  const activeChecks = leads
    .filter((l) => l.verificareTrimisaLa)
    .sort((a, b) => b.verificareTrimisaLa.localeCompare(a.verificareTrimisaLa));

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Emailuri către clienți</h1>
        <p className="mt-1 text-sm text-gray-500">
          Ce a plecat automat către clienții cu cereri vechi și ce au răspuns. Răspunsurile schimbă singure cererea
          („A semnat” → câștigată, „Altă firmă”/„Renunță” → închisă); dacă ceva e greșit, corectezi din CRM.
        </p>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">„Ați găsit o ofertă bună?”</h2>
          <p className="text-sm text-gray-500">
            Cererile cu firme în „În discuții” sau „Ofertă trimisă” de peste 14 zile. Pleacă {STATUS_CHECK_PER_DAY} pe zi, la 09:00.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <Stat label="Trimise" value={sent.length} hint={`${sentToday} azi`} />
          <Stat label="Au răspuns" value={answered} hint={sent.length ? `${Math.round((answered / sent.length) * 100)}% din trimise` : undefined} />
          <Stat label="Au semnat" value={signed} />
          <Stat label="Chestionare" value={questionnaires} />
          <Stat label="În coadă" value={queue.length} hint={queue.length ? `ultimul ~${queueDay(queue.length - 1)}` : 'lista s-a terminat'} />
        </div>

        <div className="overflow-x-auto rounded-xl border border-border bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-surface text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-3 py-2">Cerere</th>
                <th className="px-3 py-2">Firme (status de azi)</th>
                <th className="px-3 py-2">Trimis</th>
                <th className="px-3 py-2">Răspuns</th>
                <th className="px-3 py-2">Chestionar</th>
                <th className="px-3 py-2">Cererea acum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sent.map(({ lead, firms, response }) => (
                <tr key={lead.timestamp} className="align-top">
                  <td className="px-3 py-2 whitespace-nowrap">
                    <LeadCell lead={lead} />
                  </td>
                  <td className="px-3 py-2">
                    <FirmList firms={firms} />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">{fmtDateTime(lead.verificareStatusLa)}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <ResponseBadge response={response} />
                  </td>
                  <td className="px-3 py-2">
                    <FeedbackCell feedback={feedbackFor(lead.timestamp)} />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                    {lead.crmStatus ? LEAD_STATUS_LABELS[lead.crmStatus] : '–'}
                  </td>
                </tr>
              ))}
              {sent.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-gray-500">
                    Nu a plecat încă niciun email.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {queue.length > 0 && (
          <details className="rounded-xl border border-border bg-white">
            <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-gray-900">
              Urmează: {queue.length} cereri (ziua e estimată, câte {STATUS_CHECK_PER_DAY} pe zi)
            </summary>
            <ul className="divide-y divide-border border-t border-border">
              {queue.map(({ lead, firms }, i) => (
                <li key={lead.timestamp} className="flex flex-wrap items-start gap-x-6 gap-y-1 px-4 py-2 text-sm">
                  <span className="w-24 shrink-0 text-xs text-gray-500">{queueDay(i)}</span>
                  <span className="w-48 shrink-0">
                    <LeadCell lead={lead} />
                  </span>
                  <FirmList firms={firms} />
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">„Mai căutați oferte?”</h2>
          <p className="text-sm text-gray-500">Lotul de test din 22 sept. Nu e programat niciun lot nou.</p>
        </div>
        <div className="overflow-x-auto rounded-xl border border-border bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-surface text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-3 py-2">Cerere</th>
                <th className="px-3 py-2">Trimis</th>
                <th className="px-3 py-2">Răspuns</th>
                <th className="px-3 py-2">Cererea acum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {activeChecks.map((lead) => (
                <tr key={lead.timestamp} className="align-top">
                  <td className="px-3 py-2 whitespace-nowrap">
                    <LeadCell lead={lead} />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">{fmtDateTime(lead.verificareTrimisaLa)}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <ResponseBadge response={activeResponse(lead)} />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                    {lead.crmStatus ? LEAD_STATUS_LABELS[lead.crmStatus] : '–'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
