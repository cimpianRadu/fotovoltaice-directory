import type { Metadata } from 'next';
import Script from 'next/script';
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
    'Platforma #1 pentru firme de instalare panouri fotovoltaice comerciale și industriale din România. Găsește instalatorul potrivit pentru proiectul tău.',
  metadataBase: new URL('https://instalatori-fotovoltaice.ro'),
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'ro_RO',
    siteName: 'Instalatori Fotovoltaice România',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Instalatori Fotovoltaice România - Director Firme Panouri Solare',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ro">
      <head>
        <Script
          defer
          src="https://cloud.umami.is/script.js"
          data-website-id="49a078c7-23dc-4a96-9c37-73bb15e9b7ba"
        />
      </head>
      <body className={`${geistSans.variable} antialiased`}>
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
