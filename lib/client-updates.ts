// Sursele pentru „Update de la client” din /portal (lib/portal-client-updates):
// răspunsurile clientului pe fiecare firmă, din cont și din emailuri. O eroare
// de bază se aruncă: cine cheamă decide.

import 'server-only';
import { db } from './db';
import type { ClientEmailAnswer, ClientFirmReportRow } from './portal-client-updates';

export async function getClientUpdateSources(leadIds: string[]): Promise<{
  reports: Map<string, ClientFirmReportRow[]>;
  emailAnswers: Map<string, ClientEmailAnswer[]>;
  /** Firmele numite de client pe WhatsApp după „altundeva” (de verificat), pe cerere. */
  maybeChosen: Map<string, Set<string>>;
}> {
  const ids = [...new Set(leadIds.filter(Boolean))];
  const reports = new Map<string, ClientFirmReportRow[]>();
  const emailAnswers = new Map<string, ClientEmailAnswer[]>();
  const maybeChosen = new Map<string, Set<string>>();
  if (!ids.length) return { reports, emailAnswers, maybeChosen };

  const [rawReports, rawEvents, rawChosen] = await Promise.all([
    db()`
      SELECT lead_id, claim_ts, status, motiv, created_at FROM client_firm_reports
      WHERE lead_id = ANY(${ids}) ORDER BY created_at
    `,
    db()`
      SELECT lead_id, props, at FROM client_events
      WHERE event = 'raspuns_email_firme' AND lead_id = ANY(${ids}) ORDER BY at
    `,
    db()`
      SELECT lead_id, props->>'claimTs' AS claim_ts FROM client_events
      WHERE event = 'firma_aleasa_raspuns' AND lead_id = ANY(${ids}) AND props ? 'claimTs'
    `,
  ]);
  const reportRows = rawReports as { lead_id: string; claim_ts: string; status: string; motiv: string | null; created_at: Date | string }[];
  const eventRows = rawEvents as {
    lead_id: string;
    props: { firme?: Record<string, string>; niciuna?: boolean } | null;
    at: Date | string;
  }[];

  for (const r of reportRows) {
    const list = reports.get(r.lead_id) ?? [];
    list.push({ claimTs: r.claim_ts, status: r.status, motiv: r.motiv, at: new Date(r.created_at).toISOString() });
    reports.set(r.lead_id, list);
  }
  for (const e of eventRows) {
    const list = emailAnswers.get(e.lead_id) ?? [];
    list.push({
      at: new Date(e.at).toISOString(),
      ...(e.props?.firme ? { firme: e.props.firme } : {}),
      ...(e.props?.niciuna ? { niciuna: true } : {}),
    });
    emailAnswers.set(e.lead_id, list);
  }
  for (const r of rawChosen as { lead_id: string; claim_ts: string }[]) {
    const set = maybeChosen.get(r.lead_id) ?? new Set<string>();
    set.add(r.claim_ts);
    maybeChosen.set(r.lead_id, set);
  }
  return { reports, emailAnswers, maybeChosen };
}
