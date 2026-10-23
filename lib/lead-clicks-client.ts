// Partea din browser a numărării click-urilor pe cereri (lib/lead-clicks.ts).
// Pleacă cu sendBeacon, ca un click urmat de navigare să nu se piardă, și nu
// blochează nimic dacă nu ajunge.
//
// Nu scrie nimic în browser (nici cookie, nici stocare locală): vizitatorul îl
// recunoaște serverul, dintr-un hash zilnic (app/api/cereri/click). Politica de
// cookies promite că o vizită obișnuită nu lasă nimic pe dispozitiv.

type LeadClickKind = 'vreau' | 'urmaresc' | 'link';

export function trackLeadClick(leadId: string, kind: LeadClickKind): void {
  try {
    const body = JSON.stringify({ leadId, kind });
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
