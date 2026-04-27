import { type NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const AI_URL = process.env.AI_URL ?? process.env.NEXT_PUBLIC_AI_URL ?? 'https://ai.birga-quramiz.uz';
const UPSTREAM_TIMEOUT_MS = 25_000;

function fallback(locale: string) {
  const lang = locale === 'uz' || locale === 'en' ? locale : 'ru';
  const messages = {
    ru: 'Что-то пошло не так. Попробуйте ещё раз.',
    uz: "Xatolik yuz berdi. Qaytadan urinib ko'ring.",
    en: 'Something went wrong. Please try again.',
  };
  const suggestions = {
    ru: ['Попробовать снова', 'Найти товары', 'Найти строителя'],
    uz: ['Qayta urinish', 'Mahsulot qidirish', 'Quruvchi topish'],
    en: ['Try again', 'Search products', 'Find a builder'],
  };

  return {
    message: messages[lang],
    materials: [],
    products: [],
    actions: [],
    suggestions: suggestions[lang],
    inputRequest: null,
  };
}

export async function POST(req: NextRequest) {
  let locale = 'ru';

  try {
    const body = await req.text();
    try {
      const parsed = JSON.parse(body) as { locale?: string };
      locale = parsed.locale ?? locale;
    } catch {
      // Keep default locale for malformed bodies; upstream validation will handle it.
    }

    const upstreamHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const auth = req.headers.get('authorization');
    if (auth) upstreamHeaders['Authorization'] = auth;

    const cookie = req.headers.get('cookie');
    if (cookie) upstreamHeaders['Cookie'] = cookie;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);
    const res = await fetch(`${AI_URL}/ai/chat`, {
      method: 'POST',
      headers: upstreamHeaders,
      body,
      cache: 'no-store',
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    const data = await res.text();
    if (res.status >= 500) {
      return NextResponse.json(fallback(locale));
    }

    return new NextResponse(data, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[ai/chat proxy]', err);
    return NextResponse.json(fallback(locale));
  }
}
