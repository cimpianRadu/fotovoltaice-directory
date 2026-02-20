// Analytics helper - ready for Plausible/Umami integration
// Replace with actual analytics calls when setting up

type EventName =
  | 'filter_applied'
  | 'search_performed'
  | 'lead_form_opened'
  | 'lead_form_submitted'
  | 'listing_form_submitted'
  | 'waitlist_signup'
  | 'company_contact_clicked'
  | 'external_link_clicked';

type EventProps = Record<string, string | number | boolean>;

export function trackEvent(name: EventName, props?: EventProps) {
  // Plausible integration
  if (typeof window !== 'undefined' && 'plausible' in window) {
    (window as unknown as { plausible: (name: string, opts?: { props: EventProps }) => void }).plausible(name, props ? { props } : undefined);
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
