// Partea din browser a numărării click-urilor pe cereri (lib/lead-clicks.ts).
// Pleacă cu sendBeacon, ca un click urmat de navigare să nu se piardă, și nu
// blochează nimic dacă nu ajunge.

type LeadClickKind = 'vreau' | 'urmaresc' | 'link';

const VISITOR_KEY = 'if_vizitator';

function visitorId(): string {
  try {
    const existing = localStorage.getItem(VISITOR_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(VISITOR_KEY, id);
    return id;
  } catch {
    // Fără localStorage (navigare privată strictă): un id pe click, deci se
    // numără ca vizitator nou. Mai bine așa decât deloc.
    return crypto.randomUUID();
  }
}

export function trackLeadClick(leadId: string, kind: LeadClickKind): void {
  try {
    const body = JSON.stringify({ leadId, kind, visitor: visitorId() });
    const blob = new Blob([body], { type: 'application/json' });
    if (navigator.sendBeacon?.('/api/cereri/click', blob)) return;
    void fetch('/api/cereri/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Numărătoarea nu are voie să strice cardul.
  }
}
