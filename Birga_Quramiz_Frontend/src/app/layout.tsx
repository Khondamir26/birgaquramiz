import './globals.css';
import type {Metadata} from 'next';
import {NextIntlClientProvider} from 'next-intl';
import {getLocale, getMessages} from 'next-intl/server';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import {Toaster} from '@/components/ui/sonner';
import {satoshi} from './fonts';

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
      </head>
      <body className={`${satoshi.className} font-sans antialiased`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <div className="min-h-screen">
            <Navbar />
            <main className="w-full">{children}</main>
            <Footer />
            <Toaster />
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
