import Link from 'next/link';
import type { Company } from '@/lib/utils-shared';
import {
  hasActiveAnreCert,
  countRegistryFirmsWithActiveCode,
  ANRE_REGISTRY_SNAPSHOT_DATE,
} from '@/lib/anre';
import { isCasaVerde } from '@/lib/casa-verde';

/** „județul Iași”, dar „București” (municipiu, nu județ). */
export const countyPlace = (county: string) => (county === 'București' ? 'București' : `județul ${county}`);

/** „1 firmă”, „10 firme”, „40 de firme” (în română, de la 20 în sus se pune „de”). */
export const countNoun = (n: number, singular: string, plural: string) => {
  if (n === 1) return `1 ${singular}`;
  const lastTwo = n % 100;
  return `${n} ${n >= 20 && (lastTwo === 0 || lastTwo >= 20) ? 'de ' : ''}${plural}`;
};

const fmtDate = (d: Date) =>
  d.toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Bucharest' });

/**
 * Blocul „Pe scurt” de pe paginile de județ / oraș: cifrele paginii, fiecare cu
 * sursa ei, într-o formă pe care o poate cita un om sau un asistent AI.
 * Toate cifrele se calculează din date (director, registrul ANRE, lista AFM).
 */
export default function LocalFacts({
  companies,
  place,
  counties,
}: {
  companies: Company[];
  /** „județul Iași” / „zona Iași” */
  place: string;
  /** județele pentru care numărăm firmele din registrul ANRE */
  counties: string[];
}) {
  const n = companies.length;
  if (n === 0) return null;

  const withAnre = companies.filter((c) => hasActiveAnreCert(c.anreMatch)).length;
  const withC2A = companies.filter((c) => hasActiveAnreCert(c.anreMatch, 'C2A')).length;
  const onAfmList = companies.filter((c) => isCasaVerde(c.cui)).length;
  const registryC2A = counties.reduce((s, j) => s + countRegistryFirmsWithActiveCode(j, 'C2A'), 0);
  const maxKw = Math.max(...companies.map((c) => c.capacity.maxProjectKw || 0));
  const snapshot = fmtDate(new Date(`${ANRE_REGISTRY_SNAPSHOT_DATE}T12:00:00`));
  const countyLabel = counties.map(countyPlace).join(', ');

  const facts: string[] = [
    `${countNoun(n, 'firmă', 'firme')} de instalare panouri fotovoltaice cu sediul în ${countyLabel} ${n === 1 ? 'este listată' : 'sunt listate'} aici, fiecare verificată după CUI în registrele publice.`,
    `${withAnre} din ${n} au atestat ANRE valabil pentru instalații electrice (C2A, C1A sau B), iar ${withC2A} au C2A (execuție de instalații electrice 0,4–20 kV).`,
  ];
  if (onAfmList > 0) {
    facts.push(
      `${onAfmList} din ${n} ${onAfmList === 1 ? 'apare' : 'apar'} pe lista instalatorilor validați de AFM în Casa Verde Fotovoltaice (lista din 2024).`,
    );
  }
  if (registryC2A > 0) {
    facts.push(
      `În registrul ANRE sunt ${countNoun(registryC2A, 'firmă', 'firme')} cu sediul în ${countyLabel} care au atestat C2A valabil (nu toate montează panouri fotovoltaice).`,
    );
  }
  if (maxKw >= 100) {
    const size =
      maxKw >= 1000
        ? `${(maxKw / 1000).toLocaleString('ro-RO', { maximumFractionDigits: 1 })} MWp`
        : `${maxKw.toLocaleString('ro-RO')} kWp`;
    facts.push(`Cea mai mare lucrare documentată a unei firme de aici: ${size}.`);
  }

  return (
    <section aria-labelledby="pe-scurt" className="mb-8 rounded-xl border border-border bg-white p-5 sm:p-6">
      <h2 id="pe-scurt" className="text-base font-semibold text-gray-900">
        Pe scurt: instalatori fotovoltaici în {place}
      </h2>
      <ul className="mt-3 space-y-2 text-sm text-gray-700 list-disc pl-5">
        {facts.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-gray-500">
        Surse: registrul ANRE (extras din {snapshot}), lista AFM Casa Verde Fotovoltaice, ONRC și bilanțurile
        de la Ministerul Finanțelor. Lista de firme actualizată la {fmtDate(new Date())}. Poți verifica orice firmă pe{' '}
        <Link href="/verificare-anre" className="text-primary-dark underline">
          verificare ANRE
        </Link>
        .
      </p>
    </section>
  );
}
