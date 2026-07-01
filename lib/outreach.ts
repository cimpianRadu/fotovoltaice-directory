// Email templates for the daily outreach routine (/api/cron/outreach).
// Three audiences: the person who asked for a quote (A), the installers we
// forward that quote to (B), and firms that just listed themselves (C reject /
// D confirm). Low-level sending stays in lib/email.ts; this file only builds
// the {subject, html} payloads and derives human copy from the sheet fields.
//
// Copy style: no em dashes (user preference). Use commas, parentheses, colons.

import type { NewLead, NewListing } from './sheets';
import companiesData from '@/data/companies.json';

const SITE = 'https://instalatori-fotovoltaice.ro';
const REPLY_TO = 'contact@instalatori-fotovoltaice.ro';
const LOGO_URL = `${SITE}/logo.png`;
const PHONE_DISPLAY = '0751 547 174';
const PHONE_TEL = '+40751547174';

// Reach stats shown in the listing-confirmation email (D). These are the
// figures the owner provided from Umami/GSC. Confirm/refresh before each
// campaign, never invent. If unsure, drop the stats block entirely.
export const REACH_STATS = {
  vizite: '~2.470',
  vizualizari: '~4.700',
  googlePct: '73%',
  aiVizite: '~65',
  firme: 179,
  judete: 34,
};

// Branded shell shared by every outreach email: navy header with the logo in a
// white badge, an amber accent line, the body, a discreet contact line, and the
// footer with email + phone (same format as the site footer). Table-based for
// email-client compatibility (Outlook does not handle flex).
function wrapEmail(bodyHtml: string): string {
  return `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f3f4f6;margin:0;padding:24px">
<div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#1e3a5f">
    <tr><td style="padding:16px 24px">
      <table role="presentation" cellpadding="0" cellspacing="0"><tr>
        <td valign="middle" style="padding-right:12px">
          <div style="width:44px;height:44px;background:#fff;border-radius:8px;text-align:center;line-height:44px">
            <img src="${LOGO_URL}" width="32" height="32" alt="Instalatori Fotovoltaice" style="vertical-align:middle">
          </div>
        </td>
        <td valign="middle">
          <div style="color:#fff;font-size:16px;font-weight:600;line-height:1.2">Instalatori Fotovoltaice</div>
          <div style="color:#f59e0b;font-size:12px;line-height:1.4">Firme de panouri fotovoltaice din România</div>
        </td>
      </tr></table>
    </td></tr>
  </table>
  <div style="height:3px;background:#f59e0b"></div>
  <div style="padding:22px 24px;font-size:14px;color:#374151;line-height:1.7">${bodyHtml}
    <p style="margin:16px 0 0;color:#6b7280;font-size:13px">Pentru orice întrebare, dați reply la acest email sau ne contactați la <a href="mailto:${REPLY_TO}" style="color:#1e3a5f">${REPLY_TO}</a> ori la telefon <a href="tel:${PHONE_TEL}" style="color:#1e3a5f">${PHONE_DISPLAY}</a>.</p>
  </div>
  <div style="padding:16px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;line-height:1.6">
    <div style="color:#1e3a5f;font-weight:600;font-size:13px;margin-bottom:2px">Instalatori Fotovoltaice România</div>
    <a href="${SITE}" style="color:#1e3a5f">instalatori-fotovoltaice.ro</a><br>
    <a href="mailto:${REPLY_TO}" style="color:#1e3a5f">${REPLY_TO}</a> · tel. <a href="tel:${PHONE_TEL}" style="color:#1e3a5f">${PHONE_DISPLAY}</a>
  </div>
</div>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// A one-line description of the request, built from the structured fields the
// form saves. Used in both the client confirmation and the firm notification.
function describeLead(lead: NewLead): string {
  const parts = [lead.tipProiect];
  if (lead.putere) parts.push(`${lead.putere} kW`);
  const where = lead.judet ? `, județ ${lead.judet}` : '';
  return `${parts.filter(Boolean).join(', ')}${where}`;
}

function clientLabel(segment: string): string {
  return segment === 'rezidential' ? 'client rezidențial (casă)' : 'client comercial (firmă)';
}

export interface OutreachEmail {
  subject: string;
  html: string;
  replyTo: string;
}

// A: confirmation to the person who requested a quote. Only truthful if the
// firm notification (B) actually goes out in the same run.
export function leadClientEmail(lead: NewLead): OutreachEmail {
  const nume = lead.numeContact ? `, ${escapeHtml(lead.numeContact)}` : '';
  const desc = escapeHtml(describeLead(lead));
  return {
    subject: `Am primit cererea ta de ofertă (${escapeHtml(lead.tipProiect)}${lead.judet ? `, ${escapeHtml(lead.judet)}` : ''})`,
    replyTo: REPLY_TO,
    html: wrapEmail(`<p>Bună ziua${nume},</p>
<p>Vă mulțumim pentru cererea trimisă prin instalatori-fotovoltaice.ro. Am înregistrat solicitarea: <strong>${desc}</strong>.</p>
<p>Am transmis cererea către câțiva instalatori atestați ANRE din zona dvs. Cei interesați vă vor contacta în curând cu oferte.</p>
<p>Zi bună,</p>`),
  };
}

// B: notification to an installer. Anonymized (no client name or contact until
// they reply), reply-to points back to the platform inbox.
export function leadFirmEmail(lead: NewLead): OutreachEmail {
  const desc = escapeHtml(describeLead(lead));
  const tip = escapeHtml(clientLabel(lead.segment));
  const extra = lead.mesaj ? `<p style="color:#6b7280">Detalii de la client: „${escapeHtml(lead.mesaj)}"</p>` : '';
  return {
    subject: `Cerere ofertă potrivită: ${escapeHtml(lead.tipProiect)}${lead.judet ? `, ${escapeHtml(lead.judet)}` : ''}`,
    replyTo: REPLY_TO,
    html: wrapEmail(`<p>Bună ziua,</p>
<p>Am primit prin platforma instalatori-fotovoltaice.ro o cerere care se potrivește cu tipul de lucrări pe care le faceți:</p>
<ul style="padding-left:18px">
  <li><strong>Lucrare:</strong> ${desc}</li>
  <li><strong>Tip client:</strong> ${tip}</li>
</ul>
${extra}
<p>Dacă vă interesează, <strong>răspundeți la acest email</strong> și vă punem în legătură directă cu clientul pentru ofertă.</p>
<p>Zi bună,</p>`),
  };
}

// D: confirmation to a firm that listed and is now live in the directory.
// The routine only calls this once the firm's CUI appears in companies.json,
// so `slug` is the real published slug (no guessing, no 404).
export function listingConfirmEmail(listing: NewListing, slug: string): OutreachEmail {
  const nume = listing.numeContact ? `, ${escapeHtml(listing.numeContact)}` : '';
  const firma = escapeHtml(listing.numeFirma);
  return {
    subject: `${firma} este pe instalatori-fotovoltaice.ro`,
    replyTo: REPLY_TO,
    html: wrapEmail(`<p>Bună ziua${nume},</p>
<p>Vă confirmăm că <strong>${firma}</strong> este listată pe instalatori-fotovoltaice.ro. Profilul este public și gratuit:<br>
<a href="${SITE}/firme/${slug}" style="color:#2563eb">instalatori-fotovoltaice.ro/firme/${slug}</a></p>
<p>Câteva cifre despre unde ajunge profilul:</p>
<ul style="padding-left:18px">
  <li><strong>${REACH_STATS.vizite} vizite, ${REACH_STATS.vizualizari} vizualizări</strong> luna aceasta</li>
  <li><strong>${REACH_STATS.googlePct} vin din căutări Google</strong>, oameni care caută activ instalatori</li>
  <li>Suntem citați de asistenți AI (ChatGPT, Claude, Gemini), ~${REACH_STATS.aiVizite} vizite luna aceasta</li>
  <li>${REACH_STATS.firme} firme, ${REACH_STATS.judete} județe acoperite</li>
</ul>
<p>Dacă vreți vizibilitate mai mare, avem trei opțiuni:</p>
<p style="margin:6px 0">
<strong>1. Premium</strong> (79 €/lună): prezență premium pe toată platforma, plus profil complet.<br>
<strong>2. Slot în bannerul promo</strong> (19 €/lună): în colțul din dreapta-jos, pe toate paginile.<br>
<strong>3. Studiu de caz</strong> (preț la cerere): scriem împreună un articol despre un proiect de-al vostru, publicat pe site.</p>
<p>Lucrăm și la o funcție prin care firmele primesc direct cererile de ofertă din zona lor.</p>
<p>Zi bună,</p>`),
  };
}

// C: sent manually by the owner when a listing does not fit (not auto-sent by
// the routine, to avoid rejecting a real PV firm that is simply missing from
// the ANRE registry).
export function listingRejectEmail(listing: NewListing): OutreachEmail {
  const nume = listing.numeContact ? `, ${escapeHtml(listing.numeContact)}` : '';
  return {
    subject: 'Despre cererea de listare a firmei dvs.',
    replyTo: REPLY_TO,
    html: wrapEmail(`<p>Bună ziua${nume},</p>
<p>Vă mulțumim pentru solicitarea de listare trimisă prin instalatori-fotovoltaice.ro.</p>
<p>Platforma este dedicată exclusiv firmelor de instalare panouri fotovoltaice (atestate ANRE), ca să rămână relevantă pentru cei care caută instalatori. Din ce am verificat, activitatea principală a firmei nu se încadrează în acest profil, așa că deocamdată nu o putem lista.</p>
<p>Dacă firma dvs. desfășoară și instalare de sisteme fotovoltaice cu atestat ANRE, spuneți-ne și revenim cu pașii de listare. Altfel, vă mulțumim pentru interes și vă dorim succes în continuare.</p>
<p>Zi bună,</p>`),
  };
}

// ── Firm matching for lead distribution (email B) ──────────────────────────
// Picks installers to forward a lead to: they must cover the lead's county,
// serve its segment, and have a contact email. Among those, the ones contacted
// longest ago come first (fair rotation, never the same 5 big firms every time).

export interface MatchedFirm {
  id: string;
  name: string;
  email: string;
}

interface CompanyLike {
  id: string;
  name: string;
  segment?: string;
  coverage?: string[];
  location?: { county?: string };
  contact?: { email?: string };
}

// Strip diacritics + lowercase so "Argeș" from coverage matches "arges" etc.
function normCounty(s: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

function segmentFits(firmSegment: string | undefined, leadSegment: string): boolean {
  const seg = firmSegment || 'comercial';
  if (seg === 'ambele') return true;
  return leadSegment === 'rezidential' ? seg === 'rezidential' : seg === 'comercial';
}

export function pickFirmsForLead(
  judet: string,
  leadSegment: string,
  lastContacted: Map<string, number>,
  limit = 5
): MatchedFirm[] {
  const target = normCounty(judet);
  if (!target) return [];

  const candidates = (companiesData.companies as CompanyLike[]).filter((c) => {
    const email = c.contact?.email;
    if (!email) return false;
    if (!segmentFits(c.segment, leadSegment)) return false;
    const covers =
      (c.coverage || []).some((cov) => normCounty(cov) === target) ||
      (c.location?.county ? normCounty(c.location.county) === target : false);
    return covers;
  });

  // Least-recently contacted first; never-contacted firms (default 0) lead.
  candidates.sort((a, b) => (lastContacted.get(a.id) || 0) - (lastContacted.get(b.id) || 0));

  return candidates.slice(0, limit).map((c) => ({
    id: c.id,
    name: c.name,
    email: c.contact!.email as string,
  }));
}
