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
    default: 'Birga Quramiz — Qurilish materiallari onlayn bozori',
    template: '%s | Birga Quramiz'
  },

  description:
    'Birga Quramiz — O‘zbekistondagi zamonaviy qurilish materiallari marketplace. Yetkazib beruvchilar va xaridorlarni birlashtiruvchi platforma. Qulay narxlar va tez yetkazib berish.',

  keywords: [
    'birga quramiz',
    'qurilish materiallari',
    'qurilish bozori',
    'строительные материалы узбекистан',
    'construction materials uzbekistan',
    'building materials tashkent'
  ],

  metadataBase: new URL('https://birga-quramiz.uz'),

  alternates: {
    canonical: '/'
  },

  openGraph: {
    title: 'Birga Quramiz — Qurilish materiallari marketplace',
    description:
      'Construction materials marketplace connecting suppliers and buyers in Uzbekistan.',
    url: '/',
    siteName: 'Birga Quramiz',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Birga Quramiz Marketplace'
      }
    ]
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Birga Quramiz Marketplace',
    description:
      'Online platform for buying and selling construction materials.',
    images: ['/og-image.png']
  },

  robots: {
    index: true,
    follow: true
  },

  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.png', sizes: '192x192', type: 'image/png' }
    ],
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
