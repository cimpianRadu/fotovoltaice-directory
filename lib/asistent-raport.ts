// Raportul de luni despre Watt AI (pilot 12 nov 2026), pentru Radu: câte
// conversații, ce s-a lămurit, ce au văzut și notat firmele, cât a costat.
// Detaliile întregi (transcriptul fiecărei conversații) stau în /admin/asistent;
// emailul are doar cât să se vadă dacă merge și unde să te uiți.

import 'server-only';
import { escapeHtml, PORTAL_BASE_URL, sendEmail } from './email';
import type { RaportAsistent, RaportConversatie } from './asistent';
import { getWorkTypeShort } from './utils-shared';

const fmtData = (iso: string) =>
  new Date(iso).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short', timeZone: 'Europe/Bucharest' });

const usd = (n: number) => `${n.toFixed(2).replace('.', ',')} $`;

function titluConversatie(c: RaportConversatie): string {
  const x = c.cerere;
  return [
    getWorkTypeShort(x.tipLucrare) || x.tipLucrare,
    x.judet,
    x.putere ? `are ${x.putere} kW` : '',
    x.capacitateBaterie ? `cere ${x.capacitateBaterie} kWh` : '',
  ]
    .filter(Boolean)
    .join(' · ');
}

export function renderRaportAsistent(r: RaportAsistent): { subject: string; html: string } {
  const perioada = `${fmtData(r.de)} – ${fmtData(new Date(new Date(r.pana).getTime() - 1).toISOString())}`;
  const subject = `Watt AI, săptămâna ${perioada}: ${r.incepute} conversații, ${r.noteUtil} 👍 / ${r.noteNuPrea} 👎`;

  const cifra = (eticheta: string, valoare: string | number) =>
    `<td style="padding:10px 12px;border:1px solid #e5e7eb;text-align:center"><div style="font-size:20px;font-weight:700;color:#111827">${valoare}</div><div style="font-size:12px;color:#6b7280">${eticheta}</div></td>`;

  const completate = Object.entries(r.completate)
    .map(([k, v]) => `${escapeHtml(k)} ${v}`)
    .join(' · ');

  const incepute = r.conversatii.filter((c) => c.replici > 0);
  const conversatii = incepute.length
    ? incepute
        .map((c) => {
          const note = c.note
            .map(
              (n) =>
                `<div style="margin-top:4px;font-size:13px;color:${n.nota === 'util' ? '#047857' : '#b45309'}">${n.nota === 'util' ? '👍' : '👎'} ${escapeHtml(n.firma)}${n.motiv ? `: „${escapeHtml(n.motiv)}”` : ''}</div>`,
            )
            .join('');
          const notaClient = c.notaClient
            ? `<div style="margin-top:4px;font-size:13px;color:${c.notaClient === 'util' ? '#047857' : '#b45309'}">${c.notaClient === 'util' ? '👍' : '👎'} clientul${c.motivClient ? `: „${escapeHtml(c.motivClient)}”` : ''}</div>`
            : '';
          const intrebari = (c.date.intrebariPentruFirma || [])
            .map((q) => `<li>${escapeHtml(q)}</li>`)
            .join('');
          return `<div style="padding:12px 0;border-top:1px solid #e5e7eb">
  <div style="font-weight:600;color:#111827">${escapeHtml(titluConversatie(c))}</div>
  <div style="font-size:12px;color:#6b7280">${fmtData(c.createdAt)} · ${c.replici} mesaje · ${c.incheiata ? 'terminată' : 'neterminată'} · văzut de ${c.vizualizari.length} firme · ${usd(c.costUsd)}${c.rescrieri ? ` · ${c.rescrieri} rescrieri` : ''}</div>
  ${c.date.rezumat ? `<p style="margin:6px 0 0;font-size:14px;color:#1f2937">${escapeHtml(c.date.rezumat)}</p>` : '<p style="margin:6px 0 0;font-size:13px;color:#9ca3af">Fără rezumat salvat.</p>'}
  ${intrebari ? `<ul style="margin:6px 0 0;padding-left:18px;font-size:13px;color:#374151">${intrebari}</ul>` : ''}
  ${notaClient}${note}
  <a href="${PORTAL_BASE_URL}/admin/asistent?lead=${encodeURIComponent(c.leadId)}" style="font-size:12px;color:#2563eb">Citește conversația</a>
</div>`;
        })
        .join('')
    : '<p style="color:#6b7280;font-size:14px">Nicio conversație începută săptămâna asta.</p>';

  const html = `<!DOCTYPE html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f3f4f6;margin:0;padding:24px">
<div style="max-width:620px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
  <div style="padding:18px 24px;background:#1e3a5f;color:#fff">
    <div style="font-size:12px;letter-spacing:.05em;text-transform:uppercase;opacity:.75">Watt AI · raportul săptămânii</div>
    <div style="font-size:18px;font-weight:700;margin-top:4px">${escapeHtml(perioada)}</div>
  </div>
  <div style="padding:20px 24px">
    <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#374151">Clienții</p>
    <table style="border-collapse:collapse;width:100%"><tr>
      ${cifra('au văzut bula', r.afisate)}${cifra('au început', r.incepute)}${cifra('au terminat', r.terminate)}${cifra('mesaje', r.mesajeClient)}${cifra('👍 / 👎 clienți', `${r.clientiUtil} / ${r.clientiNuPrea}`)}
    </tr></table>
    <p style="margin:8px 0 0;font-size:13px;color:#4b5563">Lămurite în conversații: ${completate || 'nimic'}.</p>

    <p style="margin:20px 0 8px;font-size:13px;font-weight:600;color:#374151">Firmele</p>
    <table style="border-collapse:collapse;width:100%"><tr>
      ${cifra('firme care au văzut', r.firmeCareAuVazut)}${cifra('rezumate văzute', r.rezumateVazute)}${cifra('👍 util', r.noteUtil)}${cifra('👎 nu prea', r.noteNuPrea)}
    </tr></table>

    <p style="margin:20px 0 4px;font-size:13px;font-weight:600;color:#374151">Costul și siguranța</p>
    <p style="margin:0;font-size:13px;color:#4b5563">${usd(r.costUsd)} în total. ${r.rescrieri ? `${r.rescrieri} replici rescrise de verificarea automată (compatibilitate, promisiuni sau linie lungă): merită citite.` : 'Nicio replică rescrisă de verificarea automată.'}</p>

    <p style="margin:20px 0 0;font-size:13px;font-weight:600;color:#374151">Ce s-a discutat</p>
    ${conversatii}

    <p style="margin:20px 0 0;font-size:13px"><a href="${PORTAL_BASE_URL}/admin/asistent" style="color:#2563eb">Toate conversațiile în /admin/asistent</a></p>
  </div>
</div>
</body></html>`;

  return { subject, html };
}

export async function sendRaportAsistent(r: RaportAsistent): Promise<{ ok: boolean; reason?: string }> {
  const { subject, html } = renderRaportAsistent(r);
  const to = process.env.LISTING_NOTIFICATION_EMAIL || 'radu.cimpian94@gmail.com';
  return sendEmail({ to, subject, html });
}
