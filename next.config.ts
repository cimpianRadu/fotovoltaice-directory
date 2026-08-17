import type { NextConfig } from "next";

/**
 * Cât timp ține browserul o imagine înainte să o mai ceară o dată.
 *
 * Înainte, `/_next/image` răspundea cu `max-age=0, must-revalidate`, pentru că
 * optimizatorul propagă headerul fișierului sursă din `/public`, iar acolo
 * Next pune implicit `max-age=0`. Rezultatul: fiecare vizită re-cerea fiecare
 * hero image, un drum dus-întors în plus per imagine, care pe mobil se simte.
 *
 * ATENȚIE la regenerarea hero-urilor: `/guide-image` scrie peste același nume
 * de fișier (`<slug>.png`). Un vizitator care are imaginea în cache vede
 * varianta veche până expiră. Când schimbi hero-ul unui ghid deja publicat,
 * schimbă și numele fișierului (ex. `<slug>-v2.png`) și actualizează ghidul.
 */
const IMAGE_CACHE_SECONDS = 60 * 60 * 24 * 30;

const nextConfig: NextConfig = {
  trailingSlash: false,
  images: {
    // AVIF înaintea WebP: aceeași calitate la mai puțini bytes pe hero-urile de
    // ghid, care sunt cel mai greu element din pagină. Browserele fără suport
    // AVIF primesc automat WebP.
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: IMAGE_CACHE_SECONDS,
  },
  async headers() {
    return [
      {
        /**
         * HSTS pe tot domeniul. Fără el, o adresă tastată fără `https://` (sau
         * un bookmark vechi) face întâi un hop în text clar: acolo apare
         * „Your connection to this site is not secure" și tot acolo se blochează
         * cererea când rețeaua e proastă. Cu HSTS, browserul sare direct pe
         * HTTPS și hop-ul dispare.
         *
         * `preload` e doar declarativ: intră în efect numai după ce domeniul e
         * trimis manual la hstspreload.org. Trimiterea e greu reversibilă
         * (scoaterea din listă durează luni), deci rămâne o decizie separată.
         */
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
      {
        /**
         * Sursa hero-urilor. Headerul de aici e cel pe care îl moștenește
         * răspunsul optimizat de `/_next/image`, deci el e cel care scoate
         * `must-revalidate`. Vezi nota de la IMAGE_CACHE_SECONDS despre
         * regenerarea imaginilor peste același nume.
         */
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: `public, max-age=${IMAGE_CACHE_SECONDS}, stale-while-revalidate=86400`,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
