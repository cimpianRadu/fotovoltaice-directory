import casaVerdeData from '@/data/casa-verde-installers.json';

// CUIs (digits only) of all AFM "Casa Verde Fotovoltaice" validated installers
// (2024 snapshot). Used to flag firms that appear on the official list.
const CASA_VERDE_CUIS = new Set(
  casaVerdeData.map((f) => String(f.cui).replace(/\D/g, ''))
);

export function isCasaVerde(cui: string | undefined | null): boolean {
  if (!cui) return false;
  return CASA_VERDE_CUIS.has(String(cui).replace(/\D/g, ''));
}
