import './globals.css';
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import Navbar from '@/components/layout/Navbar';
import BottomNavigation from '@/components/layout/BottomNavigation';
import Footer from '@/components/layout/Footer';
import { Toaster } from '@/components/ui/sonner';
import { acrom } from './fonts';

export const metadata: Metadata = {
  title: {
    default: 'Birga Quramiz — Qurilish materiallari marketplace',
    template: '%s | Birga Quramiz'
  },

  description:
    'Birga Quramiz — O‘zbekistondagi zamonaviy qurilish materiallari marketplace. Yetkazib beruvchilar va xaridorlarni birlashtiruvchi platforma. Qulay narxlar, keng assortiment va tez yetkazib berish.',

  keywords: [
    'birga quramiz',
    'qurilish materiallari',
    'qurilish bozori',
    'qurilish marketplace',
    'строительные материалы узбекистан',
    'строительный маркетплейс',
    'construction materials uzbekistan',
    'construction marketplace',
    'building materials tashkent'
  ],

  authors: [{ name: 'Birga Quramiz Team' }],
  creator: 'Birga Quramiz',
  publisher: 'Birga Quramiz',

  metadataBase: new URL('https://birga-quramiz.uz'),

  alternates: {
    canonical: '/'
  },

  openGraph: {
    title: 'Birga Quramiz — Qurilish materiallari marketplace',
    description:
      'Find trusted construction material suppliers in Uzbekistan. Build together, grow together with Birga Quramiz.',
    url: '/',
    siteName: 'Birga Quramiz',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Birga Quramiz Construction Marketplace'
      }
    ]
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Birga Quramiz Marketplace',
    description:
      'Online platform for buying and selling construction materials in Uzbekistan.',
    images: ['/og-image.png']
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  },

  icons: {
    icon: [
      { url: '/icon.png', type: 'image/png' }
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png'
  }
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover" />
        <script src="https://telegram.org/js/telegram-web-app.js" async={true}></script>
      </head>
      <body className={`${acrom.className} font-sans antialiased tap-highlight-none text-foreground bg-background`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1 w-full pb-20 md:pb-0">{children}</main>
            <Footer />
            <BottomNavigation />
            <Toaster />
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
