import type { Metadata } from 'next';
import { Suspense } from 'react';
import LoginForm from './LoginForm';

export const metadata: Metadata = {
  title: 'Portal Instalatori - Autentificare',
  description:
    'Intră în Portalul Instalatorilor cu emailul firmei, fără parolă: primești un cod de acces pe email și îți gestionezi cererile revendicate.',
  robots: { index: false },
};

export default function PortalLoginPage() {
  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Portal Instalatori</h1>
        <p className="text-gray-500 mt-2 text-sm">
          Cererile revendicate de firma ta, într-un singur loc: datele clienților, note și
          eliberarea locurilor. Fără parolă, primești un cod pe email.
        </p>
      </div>
      {/* useSearchParams (mesajul de link expirat) cere Suspense la prerender. */}
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
