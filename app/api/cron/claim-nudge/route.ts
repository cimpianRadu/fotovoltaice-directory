import { NextResponse } from 'next/server';
import {
  CLAIM_REMINDER_MAX,
  claimOccupiesLeadSlot,
  filterCountyAlertRecipients,
  findSubscriptionForCounty,
  getClaims,
  getCountyAlertPrefs,
  getFirmEmailLinksForAlerts,
  getDeactivatedEmailsForAlerts,
  getLeadSubscriptions,
  getLeadsSince,
  bucharestDay,
  claimIdleBusinessDays,
  claimIdleCalendarDays,
  claimReminderDue,
  isBusinessDay,
  isLeadClosed,
  isLeadHidden,
  isPriorityHeld,
  markClaimReminded,
  markLeadAlertsSent,
  type LeadClaim,
  type NewLead,
} from '@/lib/sheets';
import {
  sendClaimInactiveEmail,
  sendCountyLeadAlert,
  sendPendingCallsDigest,
} from '@/lib/email';
import { runInformezDaily } from '@/lib/informez';
import {
  getConnectionLabel,
  getFinancingLabel,
  getProjectTypeLabel,
  getRoofTypeLabel,
  getBudgetLabel,
  getScopLabel,
  getCallWindowLabel,
  getTimelineLabel,
  getWorkTypeShort,
  isRetrofit,
} from '@/lib/utils-shared';

/**
 * Zilnic: firmele care au datele unui client de 2 zile LUCRĂTOARE și n-au atins
 * deloc revendicarea primesc emailul „mai ești interesat?", apoi unul la 4 zile
 * lucrătoare, de maxim CLAIM_REMINDER_MAX ori. Cadența și pragurile stau în
 * `claimReminderDue`; aici rămâne doar trimiterea și marcajul (coloanele O + P
 * din „Revendicări").
 *
 * Nu se trimite în weekend sau de sărbătoare legală, oricât ar arăta cadența:
 * un email de duminică dimineața spune că nu ne interesează cum lucrează omul.
 *
 * Fără email în coloana I nu avem unde trimite; alea rămân treaba telefonului.
 */
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** Plasă pentru prima rulare (sau după o pauză): nu trimitem un val într-o dimineață. */
const MAX_PER_RUN = 25;

/** Cereri deblocate anunțate într-o rulare. Restul așteaptă mâine. */
const MAX_UNLOCKED_PER_RUN = 20;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
  } else {
    console.warn('[cron/claim-nudge] CRON_SECRET not set — endpoint is publicly triggerable.');
  }

  // `?dry=1` arată exact cine ar primi emailul, fără să trimită și fără să
  // scrie marcajul. De rulat înainte de orice schimbare de cadență.
  const dry = new URL(request.url).searchParams.get('dry') === '1';

  const now = Date.now();

  try {
    const [claims, leads] = await Promise.all([getClaims(), getLeadsSince(new Date(0))]);
    const leadById = new Map(leads.map((l) => [l.timestamp, l]));

    // Rulează ÎNAINTE de gardul de zi lucrătoare, spre deosebire de remindere:
    // o cerere deblocată sâmbătă e o veste bună, nu o bătaie pe umăr.
    const unlocked = await announceUnlockedLeads(leads, claims, now, dry);

    // Fluxul „mă informez" (lib/informez): alertele de reactivare merg și în
    // weekend, întâmpinările și check-in-urile către clienți doar în zile
    // lucrătoare, ca reminderele. Un eșec aici nu oprește reminderele.
    const businessDay = isBusinessDay(bucharestDay(now));
    const informez = await runInformezDaily(now, { dry, businessDay }).catch((err) => {
      console.error('[cron/claim-nudge] informez:', err);
      return null;
    });

    if (!businessDay && !dry) {
      return NextResponse.json({
        ok: true,
        skipped: 'zi nelucrătoare',
        sent: 0,
        pendingCalls: [],
        unlocked,
        informez,
      });
    }

    // Înaintea reminderelor: primele revendicări care încă așteaptă apelul meu
    // de confirmare. Emailul pleacă spre MINE, nu spre firmă.
    const pendingCalls = await remindMeToCall(claims, leadById, now, dry);

    const due = claims.filter(
      (c) => c.email && claimReminderDue({ ...c, noteCount: c.firmNotes.length }, now),
    );

    const batch = due.slice(0, MAX_PER_RUN);
    if (due.length > batch.length) {
      console.warn(
        `[cron/claim-nudge] ${due.length - batch.length} revendicări peste plafonul de ${MAX_PER_RUN}, rămân pe mâine.`,
      );
    }

    const sent: string[] = [];
    const failed: string[] = [];

    for (const c of batch) {
      const lead = leadById.get(c.leadId);
      const leadSummary = lead
        ? [getProjectTypeLabel(lead.tipProiect), lead.judet, lead.putere ? `${lead.putere} kW` : '']
            .filter(Boolean)
            .join(' · ')
        : c.leadId;
      const days = claimIdleBusinessDays(c.approvedAt, now);
      const attempt = c.reminderCount + 1;
      const label = `${c.email} → ${leadSummary} (${days} zile lucrătoare, reminder ${attempt}/${CLAIM_REMINDER_MAX})`;

      if (dry) {
        sent.push(label);
        continue;
      }

      const res = await sendClaimInactiveEmail({ to: c.email, leadSummary, days, attempt });
      if (!res.ok) {
        // Fără marcaj: cronul de mâine reîncearcă. O tăcere definitivă e mai
        // rea decât un email întârziat cu o zi.
        failed.push(`${c.email}: ${res.reason ?? 'necunoscut'}`);
        continue;
      }
      await markClaimReminded(c.timestamp, c.leadId, new Date(now).toISOString(), attempt);
      sent.push(label);
    }

    return NextResponse.json({
      ok: true,
      dry,
      candidates: due.length,
      sent: sent.length,
      failed: failed.length,
      pendingCalls,
      unlocked,
      informez,
      details: { sent, failed },
    });
  } catch (err) {
    console.error('[cron/claim-nudge] error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Eroare internă' },
      { status: 500 },
    );
  }
}

/**
 * Cererile care au ieșit din fereastra de prioritate a unui abonat și n-au fost
 * încă anunțate firmelor cu județul bifat (coloana AF goală). Rulează zilnic,
 * deci o cerere deblocată la prânz e anunțată a doua zi dimineața — feedul
 * public o arată însă din secunda expirării, fără să aștepte cronul.
 *
 * Marcajul se scrie și când nu pleacă niciun email (cerere închisă, deja
 * preluată, nimeni abonat pe județ): altfel aceleași rânduri s-ar reciti zilnic.
 */
async function announceUnlockedLeads(
  leads: NewLead[],
  claims: LeadClaim[],
  now: number,
  dry: boolean,
): Promise<{ announced: string[]; skipped: string[] }> {
  const announced: string[] = [];
  const skipped: string[] = [];

  const pending = leads.filter(
    (l) => l.prioritarPanaLa && !l.alerteTrimise && !isPriorityHeld(l, now),
  );
  if (!pending.length) return { announced, skipped };

  const [allPrefs, subs, links, deactivated] = await Promise.all([
    getCountyAlertPrefs(),
    getLeadSubscriptions(),
    getFirmEmailLinksForAlerts(),
    getDeactivatedEmailsForAlerts(),
  ]);
  // Conturile dezactivate din /admin/portal nu mai primesc alerte. Toate
  // adresele unui cont dezactivat sunt pe listă, deci grupul rămâne fără listă.
  const prefs = allPrefs.filter((p) => !deactivated.includes(p.email));
  const claimedLeads = new Set(
    claims.filter(claimOccupiesLeadSlot).map((c) => c.leadId),
  );

  for (const lead of pending.slice(0, MAX_UNLOCKED_PER_RUN)) {
    const label = `${lead.judet} · ${lead.timestamp}`;

    // Preluată de abonat, închisă sau ascunsă: nu mai e nimic de anunțat, dar
    // marcăm ca să nu revenim pe ea mâine.
    if (claimedLeads.has(lead.timestamp) || isLeadClosed(lead.crmStatus) || isLeadHidden(lead)) {
      if (!dry) await markLeadAlertsSent(lead.timestamp);
      skipped.push(`${label} (preluată sau închisă)`);
      continue;
    }

    // Abonatul a avut fereastra lui și n-a luat cererea: nu-l mai anunțăm încă
    // o dată, ar suna a reproș.
    const sub = findSubscriptionForCounty(subs, lead.judet);
    const recipients = filterCountyAlertRecipients(prefs, lead.judet, links, [sub?.email ?? '']);

    if (!recipients.length) {
      if (!dry) await markLeadAlertsSent(lead.timestamp);
      skipped.push(`${label} (nimeni abonat pe județ)`);
      continue;
    }

    if (dry) {
      announced.push(`${label} → ${recipients.join(', ')}`);
      continue;
    }

    await Promise.allSettled(
      recipients.map((to) =>
        sendCountyLeadAlert({
          to,
          judet: lead.judet,
          tipProiectLabel: getProjectTypeLabel(lead.tipProiect),
          segment: lead.segment,
          tipLucrareLabel:
            lead.tipLucrare && lead.tipLucrare !== 'sistem-nou'
              ? getWorkTypeShort(lead.tipLucrare)
              : '',
          retrofit: isRetrofit(lead.tipLucrare),
          putere: lead.putere,
          consumLunar: lead.consumLunar,
          acoperisLabel: lead.tipAcoperis ? getRoofTypeLabel(lead.tipAcoperis) : '',
          bransamentLabel: lead.bransament ? getConnectionLabel(lead.bransament) : '',
          finantareSlug: lead.finantare,
          finantareLabel: lead.finantare ? getFinancingLabel(lead.finantare) : '',
          termenLabel: lead.termen ? getTimelineLabel(lead.termen) : '',
          intervalApelLabel: lead.intervalApel ? getCallWindowLabel(lead.intervalApel) : '',
          bugetLabel: getBudgetLabel(lead.buget),
          scopLabel: getScopLabel(lead.scop, lead.scopDetalii),
          unlocked: true,
        }),
      ),
    );
    await markLeadAlertsSent(lead.timestamp);
    announced.push(`${label} → ${recipients.length} firme`);
  }

  return { announced, skipped };
}

/**
 * Primele revendicări care încă așteaptă apelul meu de confirmare, strânse
 * într-un email către MINE, în fiecare dimineață în care există vreuna.
 *
 * De ce așa și nu altfel: prima versiune (18 sept 2026) elibera revendicarea
 * după o zi și anunța firma. Greșit, și userul a spus-o direct: dacă o firmă
 * revendică o cerere, treaba noastră e să o sunăm, nu să i-o luăm. Firma a
 * făcut exact ce trebuia; cel care întârzie sunt eu, deci alarma vine la mine.
 *
 * Nu are marcaj de „trimis deja" și nici plafon de repetare: atâta timp cât o
 * firmă așteaptă un telefon, emailul revine mâine. Asta e tot rostul lui.
 */
async function remindMeToCall(
  claims: LeadClaim[],
  leadById: Map<string, NewLead>,
  now: number,
  dry: boolean,
): Promise<string[]> {
  const waiting = claims
    .filter((c) => {
      // `manual` are datele din discuția la telefon, deci nu așteaptă nimic.
      if (c.approvedAt || c.releasedAt || c.source === 'manual') return false;
      // Fără email n-avem cont de deblocat: rândurile vechi, dinainte de portal.
      if (!c.email) return false;
      const lead = leadById.get(c.leadId);
      return Boolean(lead) && !isLeadClosed(lead!.crmStatus) && !isLeadHidden(lead!);
    })
    .map((c) => {
      const lead = leadById.get(c.leadId)!;
      return {
        numeFirma: c.numeFirma,
        numeContact: c.numeContact,
        telefon: c.telefon,
        email: c.email,
        leadSummary: [
          getProjectTypeLabel(lead.tipProiect),
          lead.judet,
          lead.putere ? `${lead.putere} kW` : '',
        ]
          .filter(Boolean)
          .join(' · '),
        // Două ceasuri, ca în /admin/crm: al firmei (zile lucrătoare) și al
        // clientului, care nu are weekend și așteaptă un telefon.
        businessDays: claimIdleBusinessDays(c.timestamp, now),
        calendarDays: claimIdleCalendarDays(c.timestamp, now),
      };
    })
    // Cel care așteaptă de cel mai mult timp, primul.
    .sort((a, b) => b.calendarDays - a.calendarDays);

  if (!waiting.length) return [];

  const labels = waiting.map(
    (w) => `${w.numeFirma} (${w.telefon}) → ${w.leadSummary}, ${w.calendarDays} zile`,
  );
  if (dry) return labels;

  await sendPendingCallsDigest({ claims: waiting });
  return labels;
}
