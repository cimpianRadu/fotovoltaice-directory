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
 * Stratul de satelit în linkurile Google Maps (`data=!3m1!1e3`). Nu e în
 * API-ul documentat (acolo `basemap=satellite` merge doar fără pin și fără
 * căutare), dar e formatul pe care îl scrie Google Maps în bara de adrese.
 * Verificat 12 nov 2026: desktop și browserul de pe telefon.
 */
const SATELLITE_LAYER = 'data=!3m1!1e3';

/**
 * Linkul de Google Maps pe care îl deschide instalatorul: mereu pe satelit și
 * cu pin. Cu coordonate, pinul stă pe punctul din GPS, la ~80 m de cadru, ca
 * să se vadă care casă e; cu adresa doar, e o căutare, iar pinul e unde
 * găsește Google adresa.
 */
export function satelliteMapUrl(lead: {
  adresa: string;
  coordonate: string;
  localitate?: string;
  judet?: string;
}): string | null {
  const coords = parseCoords(lead.coordonate);
  if (coords) {
    const point = formatCoords(coords);
    return `https://www.google.com/maps/place/${point}/@${point},80m/${SATELLITE_LAYER}`;
  }
  const adresa = lead.adresa.trim();
  if (!adresa) return null;
  const query = [adresa, lead.localitate, lead.judet].filter(Boolean).join(', ');
  return `https://www.google.com/maps/search/${encodeURIComponent(query)}/${SATELLITE_LAYER}`;
}

export function hasLeadLocation(lead: { adresa: string; coordonate: string }): boolean {
  return Boolean(lead.adresa.trim() || parseCoords(lead.coordonate));
}
