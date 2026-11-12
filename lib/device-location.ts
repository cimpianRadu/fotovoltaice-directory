// Locația dispozitivului pentru adresa lucrării. Folosită de formularul de cerere
// (pasul „Zonă") și de câmpul de adresă din contul clientului.

import { formatCoords } from './lead-location-shared';

/** Peste atât (raza raportată de browser), locația nu arată acoperișul potrivit. */
const MAX_ACCURACY_M = 100;

export type DeviceLocationResult = { coords: string } | { error: string };

export function getDeviceLocation(): Promise<DeviceLocationResult> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return Promise.resolve({ error: 'Browserul nu poate da locația. Scrieți adresa.' });
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // Pe laptop locația vine din wifi sau, mai rău, din IP: poate fi la
        // kilometri. Peste ~100 m firma s-ar uita din satelit la altă casă.
        if (pos.coords.accuracy > MAX_ACCURACY_M) {
          resolve({
            error: `Locația primită e prea aproximativă (±${Math.round(pos.coords.accuracy)} m). Scrieți adresa.`,
          });
          return;
        }
        resolve({ coords: formatCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }) });
      },
      () => resolve({ error: 'Nu am primit locația (poate e blocată din setări). Scrieți adresa.' }),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  });
}
