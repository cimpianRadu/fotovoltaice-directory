import type { Metadata } from 'next';
import Script from 'next/script';
import { Geist } from 'next/font/google';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import PartnerCarousel from '@/components/promo/PartnerCarousel';
import { SegmentProvider } from '@/components/segment/SegmentProvider';
import FloatingSegmentToggle from '@/components/segment/FloatingSegmentToggle';
import CtaPopup from '@/components/CtaPopup';
import BatteryFab from '@/components/BatteryFab';
import AttributionCapture from '@/components/AttributionCapture';
import PublicChrome from '@/components/layout/PublicChrome';
import { getCompanies, getCoveredCounties } from '@/lib/utils';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const COMPANY_COUNT = getCompanies().length;
const COUNTY_COUNT = getCoveredCounties().length;

export const metadata: Metadata = {
  title: {
    default: `Oferte Panouri Fotovoltaice 2026 | ${COMPANY_COUNT} Instalatori ANRE`,
    template: '%s | Instalatori Fotovoltaice România',
  },
  description: `Descrie proiectul o dată și primești oferte de la instalatori verificați de panouri fotovoltaice, cu atestat ANRE și date financiare reale, din ${COUNTY_COUNT} județe. Gratuit.`,
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
        alt: 'Instalatori Fotovoltaice România - Lista Completă de Firme Panouri Solare',
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
        <AttributionCapture />
        <SegmentProvider>
          <PublicChrome>
            <Header />
            {/* Imediat sub header: banda de pe mobil e `sticky`, deci trebuie să
                stea în flux ca să ocupe spațiu real și să nu acopere textul.
                Pastila de pe desktop e `fixed`, poziția ei în DOM nu contează. */}
            <BatteryFab />
          </PublicChrome>
          <main className="min-h-screen">{children}</main>
          <PublicChrome>
            <Footer />
            <PartnerCarousel />
            <FloatingSegmentToggle />
            <CtaPopup />
          </PublicChrome>
        </SegmentProvider>
      </body>
    </html>
  );
}
