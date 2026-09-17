import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import LoginForm from './LoginForm';

export const metadata: Metadata = {
  title: 'Portal Instalatori - Autentificare',
  description:
    'Intră în Portalul Instalatorilor cu emailul firmei, fără parolă: primești un cod de acces pe email, îți bifezi județele pentru alerte și îți gestionezi cererile revendicate.',
  robots: { index: false },
};

export default function PortalLoginPage() {
  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary-dark">Acces instalatori</p>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">Portal Instalatori</h1>
        <p className="text-gray-500 mt-2 text-sm">
          Alertele pe județele tale și cererile revendicate de firma ta, într-un singur loc.
          Fără parolă, primești un cod pe email.
        </p>
      </div>
      {/* useSearchParams (mesajul de link expirat) cere Suspense la prerender. */}
      <Suspense>
        <LoginForm />
      </Suspense>

      {/* Clientul care caută instalator ajunge aici din butonul din header: îi
          spunem din prima că nu e locul lui și unde e. */}
      <div className="mt-6 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-gray-600">
        Portalul e doar pentru <strong>firmele de instalare</strong>. Cauți o firmă pentru panouri
        fotovoltaice?{' '}
        <Link href="/cere-oferta?sursa=portal-login" className="font-medium text-primary-dark underline hover:no-underline">
          Cere oferte gratuit
        </Link>
        .
      </div>

      {/* Ieșirea pentru cine a nimerit aici fără să știe ce e portalul. */}
      <p className="text-center text-xs text-gray-500 mt-6">
        <Link href="/portal" className="underline hover:no-underline">
          Ce face Portalul Instalatorilor?
        </Link>
      </p>
    </div>
  );
}
