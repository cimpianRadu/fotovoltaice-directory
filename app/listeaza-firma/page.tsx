import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
import JsonLd from '@/components/seo/JsonLd';
import Button from '@/components/ui/Button';
import ListingForm from '@/components/forms/ListingForm';
import SponsorBanner from '@/components/sponsor/SponsorBanner';
import { generateBreadcrumbJsonLd } from '@/lib/seo';
import { PRICING } from '@/lib/pricing';
import { PROMO_CAPS } from '@/lib/utils-shared';

export const metadata: Metadata = {
  title: 'Listează-ți Firma - Instalatori Fotovoltaice România',
  description:
    'Ești instalator de panouri fotovoltaice? Listează-ți firma gratuit pe platforma noastră și fii vizibil pentru clienții care caută instalatori în zona ta.',
  alternates: { canonical: '/listeaza-firma' },
};

export default function ListeazaFirmaPage() {
  return (
    <>
      <JsonLd
        data={generateBreadcrumbJsonLd([
          { name: 'Acasă', url: '/' },
          { name: 'Listează-ți Firma', url: '/listeaza-firma' },
        ])}
      />

      <div className="max-w-3xl mx-auto px-4 py-6">
        <Breadcrumbs items={[{ label: 'Listează-ți Firma' }]} />

        <div className="mt-6 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Listează-ți Firma pe Platformă
          </h1>
          <p className="text-gray-500 mt-2">
            Completează formularul de mai jos pentru a adăuga firma ta pe platforma de instalatori fotovoltaice. Listarea este gratuită.
          </p>
        </div>

        {/* Premium sus, nu doar sub formular: cine derulează un formular lung nu
            mai vede nimic după el, iar asta e singura ofertă plătită de pe pagină. */}
        <Link
          href="/publicitate/premium"
          className="group flex items-start gap-3 mb-6 rounded-xl border-2 border-secondary/40 bg-linear-to-r from-secondary/5 via-white to-primary/5 p-4 hover:border-secondary/60 transition-colors"
        >
          <span className="shrink-0 mt-0.5 text-lg" aria-hidden="true">★</span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-gray-900">
              Vrei mai mult decât o listare? Devino Partener Premium
            </span>
            <span className="block text-sm text-gray-600 mt-0.5 leading-relaxed">
              Sus pe pagina județului tău, în rotația de pe homepage, ghiduri și calculator, profil
              complet cu logo și raport lunar cu vizualizări și click-uri. {PRICING.premium.monthly}€/lună,
              maximum {PROMO_CAPS.premiumPool} firme.
            </span>
            <span className="inline-block text-sm font-semibold text-secondary-dark mt-1.5 group-hover:underline">
              Vezi ce înseamnă Premium →
            </span>
          </span>
        </Link>

        {/* Pagină citită de instalatori, deci partenerii apar cu mesajul B2B.
            Deasupra formularului: cine derulează un formular lung nu mai vede
            nimic după el. */}
        <div className="mb-6">
          <SponsorBanner position="listeaza-firma" title="Parteneri pentru instalatori" />
        </div>

        <div className="bg-white rounded-xl border border-border p-6">
          <ListingForm />
        </div>

        <div className="mt-6 bg-surface rounded-xl p-5 border border-border">
          <h2 className="font-semibold text-gray-900 mb-3">De ce să te listezi?</h2>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5">1.</span>
              <span><strong>Vizibilitate</strong> — Profilul tău apare în căutările clienților din zona ta</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5">2.</span>
              <span><strong>Credibilitate</strong> — Certificările și proiectele tale sunt prezentate profesional</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5">3.</span>
              <span><strong>Contact direct</strong> — Clienții te pot contacta direct prin telefon, email sau site</span>
            </li>
          </ul>
        </div>

        {/* Repetat sub formular: cine a completat tot formularul e cel mai
            aproape de a plăti, dar a derulat deja peste banda de sus. */}
        <div className="mt-6 rounded-xl border-2 border-secondary/40 bg-linear-to-br from-secondary/5 via-white to-primary/5 p-5 sm:p-6">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h2 className="font-bold text-gray-900 text-lg">Partener Premium</h2>
            <span className="text-xs bg-secondary/10 text-secondary-dark px-2 py-0.5 rounded-full font-medium">
              {PRICING.premium.monthly}€/lună
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            Listarea te pune pe hartă. Premium te pune în față, acolo unde clientul alege firma pe care
            o sună.
          </p>
          <ul className="grid gap-2.5 sm:grid-cols-2 text-sm text-gray-700 mb-5">
            <li className="flex gap-2">
              <span className="text-secondary-dark font-bold shrink-0">★</span>
              <span>Sus pe pagina județului tău, înaintea listei</span>
            </li>
            <li className="flex gap-2">
              <span className="text-secondary-dark font-bold shrink-0">★</span>
              <span>În rotația de pe homepage, ghiduri, calculator și clasament</span>
            </li>
            <li className="flex gap-2">
              <span className="text-secondary-dark font-bold shrink-0">★</span>
              <span>Profil complet: logo, descriere lungă, linkuri social</span>
            </li>
            <li className="flex gap-2">
              <span className="text-secondary-dark font-bold shrink-0">★</span>
              <span>Raport lunar: vizualizări profil și click-uri pe telefon</span>
            </li>
          </ul>
          <div className="flex flex-wrap gap-3 items-center">
            <Button href="/publicitate/premium" variant="secondary" size="md">
              Vezi ce înseamnă Premium
            </Button>
            <span className="text-xs text-gray-500">
              Maximum {PROMO_CAPS.premiumPool} firme în pool, fără contract minim.
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
