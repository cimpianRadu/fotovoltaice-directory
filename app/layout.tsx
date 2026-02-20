import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Instalatori Fotovoltaice România | Director Firme Panouri Solare',
    template: '%s | Instalatori Fotovoltaice România',
  },
  description:
    'Director pentru firme de instalare panouri fotovoltaice comerciale și industriale din România. Găsește instalatorul potrivit pentru proiectul tău.',
  metadataBase: new URL('https://instalatori-fotovoltaice.ro'),
  openGraph: {
    type: 'website',
    locale: 'ro_RO',
    siteName: 'Instalatori Fotovoltaice România',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'Instalatori Fotovoltaice România - Director Firme Panouri Solare',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/og-image.svg'],
  },
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/logo.svg',
    apple: '/logo.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ro">
      <body className={`${geistSans.variable} antialiased`}>
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
