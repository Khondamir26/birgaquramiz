export const locales = ['en', 'ru', 'uz'] as const;

export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = 'ru';