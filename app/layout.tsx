import type { Metadata } from 'next';
import Script from 'next/script';
import { Geist } from 'next/font/google';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import PartnerCarousel from '@/components/promo/PartnerCarousel';
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
    default: `Instalatori Panouri Fotovoltaice Autorizați ANRE | ${COMPANY_COUNT} Firme România 2026`,
    template: '%s | Instalatori Fotovoltaice România',
  },
  description: `Găsește instalatori autorizați de panouri fotovoltaice în România. ${COMPANY_COUNT} firme verificate cu atestat ANRE, date financiare reale și acoperire în ${COUNTY_COUNT} județe. Compară și cere ofertă gratuită.`,
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
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <PartnerCarousel />
      </body>
    </html>
  );
}
