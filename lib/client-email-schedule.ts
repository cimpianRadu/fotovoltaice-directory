// Când pleacă emailurile automate către clienții cu cereri vechi („mai căutați
// oferte?" și „Ați găsit o ofertă bună?"). Duminica nu pleacă nimic (decizia
// lui Radu, 7 oct 2026): un email de la o platformă duminică dimineața sună a
// spam și ar strica exact ce vrem, răspunsul. Cronul rulează tot zilnic, doar
// sare ziua.

const TZ = 'Europe/Bucharest';

/** YYYY-MM-DD în ora României. */
export function bucharestDay(at: string | number | Date): string {
  return new Date(at).toLocaleDateString('en-CA', { timeZone: TZ });
}

/** Ziua (YYYY-MM-DD) e una în care pleacă emailuri? */
export function isClientEmailDay(day: string): boolean {
  // Ora 12 UTC ține data pe aceeași zi oriunde ar rula serverul.
  return new Date(`${day}T12:00:00Z`).getUTCDay() !== 0;
}

/**
 * Ziua estimată pentru al `index`-lea element din coadă, câte `perDay` pe zi,
 * sărind duminicile. Azi contează doar dacă e zi de trimitere și lotul de azi
 * nu e plin. Pentru /admin/emailuri, ca etichetă scurtă („mie., 8 oct.").
 */
export function queueDayLabel(index: number, perDay: number, sentToday: number, now = Date.now()): string {
  const d = new Date(`${bucharestDay(now)}T12:00:00Z`);
  const todayOpen = isClientEmailDay(bucharestDay(d)) && sentToday < perDay;
  // Locurile rămase azi se umplu primele.
  let remaining = index - (todayOpen ? perDay - sentToday : 0);
  if (remaining < 0) return fmt(d);
  for (;;) {
    d.setUTCDate(d.getUTCDate() + 1);
    if (!isClientEmailDay(bucharestDay(d))) continue;
    if (remaining < perDay) return fmt(d);
    remaining -= perDay;
  }
}

function fmt(d: Date): string {
  return d.toLocaleDateString('ro-RO', { timeZone: TZ, weekday: 'short', day: 'numeric', month: 'short' });
}
