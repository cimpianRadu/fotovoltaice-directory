// Manopera de montaj, dedusă din magazinele care publică pentru ACELAȘI kit
// atât prețul cu montaj cât și pe cel fără. Diferența dintre cele două e
// manopera, dintr-o sursă publică, nu o estimare de-a noastră.
//
// Rulează pe server, ca și curba de preț: fișierul de scrape n-are ce căuta în
// bundle-ul clientului.
//
// Se folosesc valorile normalizate la TVA 21% (`manoperaPeKwCuTva21`), nu cele
// brute. `manoperaRon` e diferența a două prețuri AFIȘATE, deci moștenește baza
// de TVA a magazinului: Solar1000 publică fără TVA, VoltGrid cu 9%. Puse una
// lângă alta ca atare, cifrele par comparabile și nu sunt.

import kitPrices from '@/data/kit-prices.json';

export interface LabourPoint {
  store: string;
  kw: number;
  manoperaRon: number;
  manoperaPeKw: number;
}

interface ScrapedProduct {
  marime?: number;
  manoperaCuTva21Ron?: number | null;
  manoperaPeKwCuTva21?: number | null;
}

interface ScrapedSource {
  store: string;
  produse: ScrapedProduct[];
}

/** Observațiile publicate, ordonate descrescător după costul pe kW. */
export function getPublishedLabour(): LabourPoint[] {
  const sources = (kitPrices as { sources?: ScrapedSource[] }).sources ?? [];

  return sources
    .flatMap((s) =>
      s.produse
        .filter(
          (p): p is ScrapedProduct & { marime: number; manoperaCuTva21Ron: number; manoperaPeKwCuTva21: number } =>
            typeof p.marime === 'number' &&
            p.marime > 0 &&
            typeof p.manoperaCuTva21Ron === 'number' &&
            typeof p.manoperaPeKwCuTva21 === 'number',
        )
        .map((p) => ({
          store: s.store,
          kw: p.marime,
          manoperaRon: p.manoperaCuTva21Ron,
          manoperaPeKw: p.manoperaPeKwCuTva21,
        })),
    )
    .sort((a, b) => b.manoperaPeKw - a.manoperaPeKw);
}
