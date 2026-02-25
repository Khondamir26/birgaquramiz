"use client";

import Link from 'next/link';
import {ArrowRight, ShieldCheck, Truck, Wallet2} from 'lucide-react';
import {useTranslations} from 'next-intl';

const highlights = [
  {titleKey: 'factoryPrices', textKey: 'factoryText', icon: Wallet2},
  {titleKey: 'flexibleDelivery', textKey: 'deliveryText', icon: Truck},
  {titleKey: 'trustedProcess', textKey: 'trustedText', icon: ShieldCheck}
] as const;

export default function HomePage() {
  const t = useTranslations('Home');

  return (
    <div className="page-shell space-y-8 md:space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-[#d9e3ee] bg-gradient-to-r from-[#0f3154] via-[#154570] to-[#1b588f] px-6 py-10 text-white md:px-10 md:py-14">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-28 -left-24 h-72 w-72 rounded-full bg-[#ec7a10]/20 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[1.2fr,0.8fr] lg:items-center">
          <div>
            <p className="inline-flex rounded-full border border-white/25 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-100">
              {t('badge')}
            </p>
            <h1 className="mt-4 text-4xl font-black leading-tight md:text-5xl">{t('title')}</h1>
            <p className="mt-4 max-w-2xl text-sm text-blue-100 md:text-base">{t('subtitle')}</p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/catalog" className="inline-flex items-center gap-2 rounded-xl bg-[#ec7a10] px-5 py-3 text-sm font-semibold text-white hover:bg-[#d86f0f]">
                {t('goMarketplace')}
                <ArrowRight className="size-4" />
              </Link>
              <Link href="/checkout" className="inline-flex items-center rounded-xl border border-white/35 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">
                {t('checkoutFlow')}
              </Link>
            </div>
          </div>

          <div className="grid gap-3">
            <Link href="/catalog" className="rounded-2xl border border-white/20 bg-white/10 px-4 py-4 text-sm font-semibold text-white hover:bg-white/15">
              {t('openCatalog')}
            </Link>
            <Link href="/cart" className="rounded-2xl border border-white/20 bg-white/10 px-4 py-4 text-sm font-semibold text-white hover:bg-white/15">
              {t('openCart')}
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {highlights.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.titleKey} className="surface-card p-5">
              <div className="inline-flex rounded-xl bg-[#0f3154]/10 p-2 text-[#0f3154]">
                <Icon className="size-5" />
              </div>
              <h2 className="mt-3 text-lg font-bold text-[#0f3154]">{t(item.titleKey)}</h2>
              <p className="mt-2 text-sm text-slate-600">{t(item.textKey)}</p>
            </article>
          );
        })}
      </section>

      <section className="surface-card p-6">
        <h2 className="text-2xl font-black text-[#0f3154]">{t('startCatalog')}</h2>
        <p className="mt-2 text-sm text-slate-600">{t('startCatalogText')}</p>
        <Link href="/catalog" className="mt-4 inline-flex rounded-lg bg-[#0f3154] px-4 py-2 text-sm font-semibold text-white hover:bg-[#184a7d]">
          {t('openProducts')}
        </Link>
      </section>
    </div>
  );
}
