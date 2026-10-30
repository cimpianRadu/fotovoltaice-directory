import Link from 'next/link';
import type { ClientCard, ClientCardEvent } from '@/lib/client-account';
import { FIRM_REPORT_OPTIONS, REFUZ_REASON_OPTIONS } from '@/lib/client-account-shared';
import InviteButton from './InviteButton';

// Câte un card pe client (24 oct 2026). Radu: „nu prea mă ajută pagina asta să
// înțeleg ce văd beneficiarii, cine a intrat pe cont, când ultima dată și ce a
// făcut”. Deci: cine e, dacă și-a deschis pagina, ce a făcut pe rând, în
// propoziții, și un buton care arată exact pagina clientului.

const when = (iso: string) =>
  new Date(iso).toLocaleString('ro-RO', { timeZone: 'Europe/Bucharest', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const dayKey = (iso: string) => new Date(iso).toLocaleDateString('sv-SE', { timeZone: 'Europe/Bucharest' });

const EMAIL_KINDS: Record<string, string> = {
  confirmare: 'I-am trimis emailul de confirmare, cu linkul spre pagină',
  preluare: 'I-am trimis emailul „firma X a preluat cererea”',
  oferta: 'I-am trimis emailul cu oferta unei firme',
  deschis: 'Firmei i-am trimis „clientul a deschis oferta”',
  invitatie: 'I-am trimis invitația în cont, cu linkul spre pagină',
};

function sentence(e: ClientCardEvent): string {
  const p = e.props ?? {};
  switch (e.event) {
    case 'cta_vazut':
      return 'A văzut blocul „Urmăriți cererea” după formular';
    case 'cta_click':
      return 'A apăsat „Urmăriți cererea”';
    case 'pagina_cerere':
      return p.via === 'cont' ? 'A deschis pagina cererii, intrat cu link sau cod' : 'A deschis pagina cererii';
    case 'intrare_link':
      return 'A intrat din linkul din email';
    case 'raspuns_firma': {
      const label = FIRM_REPORT_OPTIONS.find((o) => o.value === p.status)?.label ?? String(p.status);
      const motiv = p.motiv ? REFUZ_REASON_OPTIONS.find((o) => o.value === p.motiv)?.label.toLowerCase() : '';
      return `A spus despre ${String(p.firma ?? 'o firmă')}: „${label}”${motiv ? ` (${motiv})` : ''}`;
    }
    case 'notita_firma':
      return `A scris o notiță despre ${String(p.firma ?? 'o firmă')}: „${String(p.nota ?? '')}”`;
    case 'retrimitere':
      return `A cerut retrimiterea; a plecat la ${Number(p.firms ?? 0)} firme`;
    case 'inchisa':
      return p.kind === 'aleasa' ? 'A închis cererea: a ales o firmă' : 'A închis cererea: nu mai face lucrarea';
    case 'stergere':
      return 'A cerut ștergerea datelor';
    case 'oferta_deschisa':
      return 'A deschis o ofertă';
    case 'email_trimis':
      return EMAIL_KINDS[String(p.kind)] ?? 'I-am trimis un email';
    default:
      return e.event;
  }
}

/** Evenimentele la rând, cu repetările din aceeași zi strânse într-unul („de 3 ori”). */
function grouped(events: ClientCardEvent[]): { at: string; text: string; times: number }[] {
  const out: { at: string; text: string; times: number; key: string }[] = [];
  for (const e of events) {
    const text = sentence(e);
    const key = `${dayKey(e.at)}|${text}`;
    const last = out.at(-1);
    if (last && last.key === key) {
      last.times++;
      last.at = e.at;
    } else out.push({ at: e.at, text, times: 1, key });
  }
  return out.reverse();
}

function Status({ c }: { c: ClientCard }) {
  if (c.views > 0) {
    return (
      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
        A deschis pagina de {c.views} {c.views === 1 ? 'dată' : 'ori'} · ultima dată {when(c.lastView as string)}
      </span>
    );
  }
  if (c.beforeTracking && !c.events.length) {
    return (
      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
        Nu știm dacă a deschis-o: cererea e de dinainte să notăm vizitele
      </span>
    );
  }
  return (
    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
      N-a deschis încă pagina cererii
    </span>
  );
}

export default function ClientCards({ cards, windowOpen }: { cards: ClientCard[]; windowOpen: boolean }) {
  if (!cards.length) {
    return (
      <p className="mt-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
        Nicio cerere nouă în ultimele 30 de zile.
      </p>
    );
  }
  return (
    <ul className="mt-3 space-y-3">
      {cards.map((c) => {
        const lines = grouped(c.events);
        return (
          <li key={c.leadId} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-slate-900">
                  {c.name || c.email}
                  <span className="font-normal text-slate-500">
                    {' '}
                    · {c.localitate ? `${c.localitate}, ` : ''}
                    {c.judet}
                  </span>
                </p>
                <p className="mt-0.5 text-sm text-slate-600">
                  {c.descriere[0].toUpperCase() + c.descriere.slice(1)} · cerere trimisă {when(c.leadId)} · {c.email}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {/* Invitația are sens doar cât omul n-a primit niciun link și n-a intrat. */}
                {!c.verifiedAt && c.open && (
                  <InviteButton
                    leadId={c.leadId}
                    windowOpen={windowOpen}
                    sentAt={
                      c.events.find((e) => e.event === 'email_trimis' && (e.props?.kind === 'invitatie' || e.props?.kind === 'confirmare'))
                        ?.at ?? null
                    }
                  />
                )}
                <Link
                  href={`/admin/cont-client/cerere/${encodeURIComponent(c.leadId)}`}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-800 hover:border-slate-400"
                >
                  Vezi ce vede clientul →
                </Link>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Status c={c} />
              <span className="text-xs text-slate-500">
                trimisă la {c.sentTo} {c.sentTo === 1 ? 'firmă' : 'firme'} · preluată de {c.claimed}{' '}
                {c.claimed === 1 ? 'firmă' : 'firme'} · {c.open ? 'activă' : c.closedLabel?.toLowerCase()}
                {c.verifiedAt ? ` · a intrat cu link/cod pe ${when(c.verifiedAt)}` : ''}
              </span>
            </div>
            {lines.length > 0 ? (
              <ol className="mt-3 space-y-1 border-l-2 border-slate-100 pl-3 text-sm">
                {lines.map((l, i) => (
                  <li key={i} className="text-slate-700">
                    <span className="mr-2 text-xs tabular-nums text-slate-400">{when(l.at)}</span>
                    {l.text}
                    {l.times > 1 ? <span className="text-slate-400"> · de {l.times} ori</span> : null}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 text-xs text-slate-400">
                {c.beforeTracking ? 'Nimic notat: cererea e de dinainte de 24 oct, 13:00.' : 'Nimic făcut încă.'}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
