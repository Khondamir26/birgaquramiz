import {NextRequest, NextResponse} from 'next/server';
import {defaultLocale, locales, type AppLocale} from '@/i18n/routing';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const locale = body?.locale as string | undefined;

  const safeLocale: AppLocale = locales.includes(locale as AppLocale)
    ? (locale as AppLocale)
    : defaultLocale;

  const response = NextResponse.json({ok: true});
  response.cookies.set('NEXT_LOCALE', safeLocale, {
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365
  });

  return response;
}