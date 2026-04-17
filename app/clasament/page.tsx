import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import { generateBreadcrumbJsonLd } from '@/lib/seo';
import { getCompanies, formatCurrency } from '@/lib/utils';
import { getCompanyAnreCerts, getAnreCodeLabel } from '@/lib/anre';
import { rankCompanies, getBadge, METHODOLOGY } from '@/lib/scoring';
import CorrectionForm from '@/components/forms/CorrectionForm';

export const metadata: Metadata = {
  title: 'Top Firme Panouri Fotovoltaice România 2026 - Clasament Verificat',
  description:
    'Clasament obiectiv al firmelor de instalare panouri fotovoltaice din România, bazat pe date publice verificate: cifră de afaceri, angajați, experiență și certificări.',
  alternates: { canonical: '/clasament' },
};

export default function ClasamentPage() {
  const companies = getCompanies();
  const ranked = rankCompanies(companies);
  const companyOptions = ranked.map((c) => ({ slug: c.slug, name: `#${c.rank} ${c.name}` }));

  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: 'Acasă', url: '/' },
          { name: 'Clasament', url: '/clasament' },
        ])}
      />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <Breadcrumbs items={[{ label: 'Clasament' }]} />

        {/* Hero */}
        <div className="mt-6 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Top Firme Panouri Fotovoltaice România 2026
          </h1>
          <p className="text-gray-500 mt-2 max-w-2xl">
            Clasament obiectiv bazat pe date publice din registrele oficiale. Scorul combină cifra de
            afaceri, numărul de angajați, experiența, certificările și capacitatea de execuție.
          </p>
        </div>

        {/* Ranking table */}
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3 w-16">#</th>
                  <th className="px-4 py-3">Firmă</th>
                  <th className="px-4 py-3 text-right">Scor</th>
                  <th className="px-4 py-3 text-right">Cifră afaceri</th>
                  <th className="px-4 py-3 text-right">Angajați</th>
                  <th className="px-4 py-3 text-right">Exp.</th>
                  <th className="px-4 py-3 text-center">Certificări</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ranked.map((company) => {
                  const badge = getBadge(company.rank);
                  const yearsExp = company.founded > 0 ? new Date().getFullYear() - company.founded : 0;
                  return (
                    <tr
                      key={company.slug}
                      className={`hover:bg-surface/50 transition-colors ${
                        company.rank <= 3 ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        {badge ? (
                          <span
                            className={`inline-flex items-center justify-center text-xs font-bold rounded-full w-8 h-8 ${badge.color}`}
                          >
                            {company.rank <= 3 ? company.rank : ''}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm pl-2">{company.rank}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/firme/${company.slug}`}
                          className="font-medium text-secondary-dark hover:text-primary transition-colors"
                        >
                          {company.name}
                        </Link>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {company.location.city}, {company.location.county}
                        </div>
                        {badge && company.rank > 3 && (
                          <span
                            className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.color}`}
                          >
                            {badge.label}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-bold text-gray-900">{company.score}</span>
                        <span className="text-gray-400 text-xs">/100</span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        {company.financials.revenue > 0
                          ? formatCurrency(company.financials.revenue)
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        {company.employees > 0 ? company.employees : '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700 whitespace-nowrap">
                        {yearsExp > 0 ? `${yearsExp} ani` : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {(() => {
                          const anreCerts = getCompanyAnreCerts(company.anreMatch);
                          const isoCerts = (company.certifications || []).filter((c) => !c.startsWith('ANRE-'));
                          if (anreCerts.length + isoCerts.length === 0) {
                            return <span className="text-gray-300">-</span>;
                          }
                          return (
                            <div className="flex flex-wrap justify-center gap-1">
                              {anreCerts.map((cert) => (
                                <span
                                  key={cert.code}
                                  className="inline-block text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded"
                                >
                                  {getAnreCodeLabel(cert.code).replace('ANRE ', '')}
                                </span>
                              ))}
                              {isoCerts.map((cert) => (
                                <span
                                  key={cert}
                                  className="inline-block text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded"
                                >
                                  {cert.replace('ISO-', 'ISO ')}
                                </span>
                              ))}
                            </div>
                          );
                        })()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-border">
            {ranked.map((company) => {
              const badge = getBadge(company.rank);
              const yearsExp = company.founded > 0 ? new Date().getFullYear() - company.founded : 0;
              return (
                <div
                  key={company.slug}
                  className={`p-4 ${company.rank <= 3 ? 'bg-amber-50/30' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {badge ? (
                        <span
                          className={`flex-shrink-0 inline-flex items-center justify-center text-xs font-bold rounded-full w-8 h-8 ${badge.color}`}
                        >
                          {company.rank <= 3 ? company.rank : ''}
                        </span>
                      ) : (
                        <span className="flex-shrink-0 text-gray-400 text-sm w-8 text-center">
                          {company.rank}
                        </span>
                      )}
                      <div className="min-w-0">
                        <Link
                          href={`/firme/${company.slug}`}
                          className="font-medium text-secondary-dark hover:text-primary transition-colors block truncate"
                        >
                          {company.name}
                        </Link>
                        <div className="text-xs text-gray-400">
                          {company.location.city}, {company.location.county}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="font-bold text-gray-900">{company.score}</span>
                      <span className="text-gray-400 text-xs">/100</span>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 pl-11">
                    {company.financials.revenue > 0 && (
                      <span>{formatCurrency(company.financials.revenue)}</span>
                    )}
                    {company.employees > 0 && <span>{company.employees} angajați</span>}
                    {yearsExp > 0 && <span>{yearsExp} ani exp.</span>}
                  </div>
                  {(() => {
                    const anreCerts = getCompanyAnreCerts(company.anreMatch);
                    const isoCerts = (company.certifications || []).filter((c) => !c.startsWith('ANRE-'));
                    if (anreCerts.length + isoCerts.length === 0) return null;
                    return (
                      <div className="mt-2 flex flex-wrap gap-1 pl-11">
                        {anreCerts.map((cert) => (
                          <span
                            key={cert.code}
                            className="inline-block text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded"
                          >
                            {getAnreCodeLabel(cert.code).replace('ANRE ', '')}
                          </span>
                        ))}
                        {isoCerts.map((cert) => (
                          <span
                            key={cert}
                            className="inline-block text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded"
                          >
                            {cert.replace('ISO-', 'ISO ')}
                          </span>
                        ))}
                      </div>
                    );
                  })()}
                  {badge && company.rank > 3 && (
                    <div className="mt-2 pl-11">
                      <span
                        className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.color}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Methodology */}
        <div className="mt-12 bg-surface rounded-xl border border-border p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-3">{METHODOLOGY.title}</h2>
          <p className="text-sm text-gray-600 mb-4">{METHODOLOGY.description}</p>
          <div className="space-y-2">
            {METHODOLOGY.criteria.map((c) => (
              <div key={c.name} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium text-gray-800">{c.name}</span>
                  <span className="text-gray-400 ml-2 text-xs">({c.source})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${c.weight}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-600 w-8 text-right">
                    {c.weight}p
                  </span>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-4">
            Datele provin din surse publice (termene.ro, ANRE, site-uri oficiale). Ultima
            actualizare: martie 2026.
          </p>
        </div>

        {/* Correction CTA + Form */}
        <div className="mt-12 bg-white rounded-xl border-2 border-primary/20 p-6" id="corecție">
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-gray-900">
              Datele nu sunt corecte? Spune-ne!
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Dacă firma ta apare în clasament și datele nu sunt actuale, completează formularul de
              mai jos. Vom verifica și actualiza informațiile.
            </p>
          </div>
          <div className="max-w-lg mx-auto">
            <CorrectionForm companies={companyOptions} />
          </div>
        </div>

        {/* SEO text */}
        <div className="mt-12 prose prose-sm prose-gray max-w-none">
          <h2>Despre clasamentul firmelor de panouri fotovoltaice</h2>
          <p>
            Acest clasament include {ranked.length} de firme de instalare panouri fotovoltaice din
            România, ordonate pe baza unui scor compozit calculat din date publice verificate. Spre
            deosebire de alte directoare, nu acceptăm plăți pentru poziționare — clasamentul reflectă
            exclusiv datele din registrele oficiale.
          </p>
          <p>
            Scorul ia în calcul cifra de afaceri (din bilanțurile publice), numărul de angajați, anii
            de experiență, certificările profesionale (ANRE C2A, ISO) și capacitatea maximă de
            execuție. Firmele sunt încurajate să-și verifice datele și să solicite corecții dacă
            informațiile nu sunt actuale.
          </p>
          <p>
            Cauți o firmă de instalare panouri fotovoltaice? Consultă{' '}
            <Link href="/firme" className="text-primary hover:underline">
              lista completă de firme
            </Link>{' '}
            pentru a filtra după județ, specializare sau capacitate. Sau citește{' '}
            <Link href="/ghid/cum-alegi-instalator-fotovoltaic" className="text-primary hover:underline">
              ghidul nostru
            </Link>{' '}
            despre cum să alegi instalatorul potrivit.
          </p>
        </div>
      </div>
    </>
  );
}
