// Locul lucrării pe cerere (BD adresa, BE coordonate), partea care trebuie
// știută și în browser. Fără importuri de server: îl folosesc formularul,
// contul clientului și portalul.

/** Destul pentru „Str. Lungă nr. 12, bl. A, sat X, comuna Y". */
export const LEAD_ADDRESS_MAX = 200;

export interface LatLng {
  lat: number;
  lng: number;
}

/** „lat,lng" cu 5 zecimale, cât e nevoie ca să nimerești casa (~1 m). */
export function formatCoords({ lat, lng }: LatLng): string {
  return `${lat.toFixed(5)},${lng.toFixed(5)}`;
}

/**
 * Coordonatele din BE, doar dacă sunt numere valide. Nu le restrângem la
 * România: un GPS care greșește cu câteva sute de metri lângă graniță e tot
 * mai util decât nimic, iar firma vede oricum adresa și județul.
 */
export function parseCoords(value: string): LatLng | null {
  const m = value.trim().match(/^(-?\d{1,2}(?:\.\d+)?),\s*(-?\d{1,3}(?:\.\d+)?)$/);
  if (!m) return null;
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

/**
 * Linkul de Google Maps pe care îl deschide instalatorul. Cu coordonate, harta
 * pornește direct pe satelit, aproape de acoperiș; cu adresa doar, e o căutare
 * (Google nu lasă alegerea stratului pe căutare, se comută dintr-un click).
 */
export function satelliteMapUrl(lead: {
  adresa: string;
  coordonate: string;
  localitate?: string;
  judet?: string;
}): string | null {
  const coords = parseCoords(lead.coordonate);
  if (coords) {
    return `https://www.google.com/maps/@?api=1&map_action=map&center=${coords.lat},${coords.lng}&zoom=20&basemap=satellite`;
  }
  const adresa = lead.adresa.trim();
  if (!adresa) return null;
  const query = [adresa, lead.localitate, lead.judet].filter(Boolean).join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function hasLeadLocation(lead: { adresa: string; coordonate: string }): boolean {
  return Boolean(lead.adresa.trim() || parseCoords(lead.coordonate));
}
