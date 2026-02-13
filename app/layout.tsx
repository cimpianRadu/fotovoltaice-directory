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
    default: 'Fotovoltaice Comerciale România | Director Instalatori',
    template: '%s | Fotovoltaice Comerciale România',
  },
  description:
    'Director pentru firme de instalare panouri fotovoltaice comerciale și industriale din România. Găsește instalatorul potrivit pentru proiectul tău.',
  metadataBase: new URL('https://fotovoltaice-comerciale.ro'),
  openGraph: {
    type: 'website',
    locale: 'ro_RO',
    siteName: 'Fotovoltaice Comerciale România',
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
