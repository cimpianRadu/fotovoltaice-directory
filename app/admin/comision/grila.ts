// Grila de comision, într-un singur loc: fișa de telefon (/admin/comision) și
// documentul trimis firmelor (/admin/comision/document) o citesc de aici, ca să
// nu ajungă la o firmă o cifră diferită de cea spusă la telefon. Sumele sunt
// fără TVA; `cuTva` e scris de mână, fiindcă la procent nu există o sumă.
// Treapta se ia după puterea din contract (2 oct 2026).

export const GRILA = [
  { putere: 'sub 10 kW', suma: '500 lei', cuTva: '605 lei' },
  { putere: '10 – 100 kW', suma: '1.000 lei', cuTva: '1.210 lei' },
  { putere: 'peste 100 kW', suma: '1–2%', cuTva: 'din valoarea contractului fără TVA, plus TVA 21%' },
] as const;
