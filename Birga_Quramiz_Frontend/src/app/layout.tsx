import './globals.css';
import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import Navbar from '@/components/layout/Navbar';
import MobileTopHeader from '@/components/layout/MobileTopHeader';
import BottomNavigation from '@/components/layout/BottomNavigation';
import Footer from '@/components/layout/Footer';
import { Toaster } from '@/components/ui/sonner';
import { satoshi } from './fonts';

export const metadata: Metadata = {
  title: 'Birga Quramiz',
  description: 'Digital construction ecosystem for materials, builders, equipment and seller operations.'
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
      </head>
      <body className={`${satoshi.className} font-sans antialiased tap-highlight-none text-foreground bg-background`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <MobileTopHeader />
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
