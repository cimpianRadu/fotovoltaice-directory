// Analytics helper - ready for Plausible/Umami integration
// Replace with actual analytics calls when setting up

type EventName =
  | 'filter_applied'
  | 'search_performed'
  | 'lead_form_opened'
  | 'lead_form_started'
  // Pașii formularului de cerere. `lead_step_completed` se trimite la trecerea
  // ÎNAINTE, o singură dată per pas per sesiune de completare: raportul dintre
  // pași arată unde pică omul, ceea ce `lead_form_submitted` singur nu spunea.
  | 'lead_step_completed'
  | 'lead_step_back'
  | 'lead_form_submitted'
  // Îmbogățirea de după trimitere — cererea e deja salvată, evenimentul măsoară
  // doar cât din detaliile opționale acceptă omul să completeze (`fields`).
  | 'lead_enrich_submitted'
  | 'lead_claim_opened'
  | 'lead_claim_submitted'
  | 'listing_form_submitted'
  | 'waitlist_signup'
  | 'company_contact_clicked'
  | 'external_link_clicked'
  | 'case_study_installer_clicked'
  | 'segment_selected'
  | 'hero_search_select'
  | 'hero_pill_click'
  | 'cere_oferta_click'
  | 'portal_login_requested'
  | 'portal_login_completed'
  | 'portal_note_added'
  | 'portal_status_set'
  | 'portal_filter_applied'
  | 'portal_claim_released'
  | 'portal_alerts_saved'
  | 'portal_reserved_taken'
  // Butonul flotant care duce la calculatorul de baterii. `source` separă
  // varianta de desktop de cea de mobil, ca să se vadă care dintre ele produce.
  | 'battery_fab_click';

type EventProps = Record<string, string | number | boolean>;

export function trackEvent(name: EventName, props?: EventProps) {
  if (typeof window !== 'undefined') {
    const w = window as unknown as {
      umami?: { track?: (name: string, data?: EventProps) => void };
      plausible?: (name: string, opts?: { props: EventProps }) => void;
    };
    // Umami (the analytics the site actually loads — see app/layout.tsx)
    w.umami?.track?.(name, props);
    // Plausible (kept in case it's ever added)
    if (typeof w.plausible === 'function') {
      w.plausible(name, props ? { props } : undefined);
    }
  }

  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Analytics] ${name}`, props);
  }
}

export function trackPageView(url: string) {
  if (typeof window !== 'undefined' && 'plausible' in window) {
    (window as unknown as { plausible: (name: string, opts?: { u: string }) => void }).plausible('pageview', { u: url });
  }
}
