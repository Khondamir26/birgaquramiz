"use client";

import { useEffect, useState } from "react";
import Link from 'next/link';
import { Search, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { getProducts } from "@/lib/api/products";
import type { Product } from "@/types";
import ProductCard from "@/components/product/ProductCard";

export default function HomePage() {
  const t = useTranslations('Home');
  const tCatalog = useTranslations('Catalog');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await getProducts(1, 40);
        setProducts(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const sections = [
    { title: t('newArrivals'), items: products.slice(0, 8), id: 'new' },
    { title: t('topProducts'), items: products.slice(8, 16), id: 'top' },
    { title: t('mightNeed'), items: products.slice(16, 24), id: 'recommended' },
    { title: t('allProducts'), items: products.slice(24), id: 'all' },
  ];

  return (
    <div className="flex flex-col pb-44 bg-[#f8f9fb]">
      <div className="mx-auto w-full md:max-w-7xl">
        <div className="mx-auto flex flex-col gap-6 px-4 md:px-6 max-w-md md:max-w-none pt-4 md:pt-6">

          {/* Search Bar – brand blue border */}
          <div className="pt-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-[#1B4D91]/40 pointer-events-none" />
              <Link
                href="/catalog"
                className="flex h-12 w-full items-center rounded-2xl border-2 border-[#1B4D91]/20 bg-white pl-11 pr-4 text-[13px] font-semibold text-slate-400 shadow-sm transition-all active:scale-[0.99] active:border-[#1B4D91]/40"
              >
                {tCatalog("searchPlaceholder") || "Поиск по товарам"}
              </Link>
            </div>
          </div>

          {/* Intro Banner Section */}
          <div className="relative overflow-hidden rounded-3xl bg-[#1B4D91] p-6 shadow-xl shadow-[#1B4D91]/20">
            {/* Background design elements to make it richer */}
            <div className="absolute -right-10 -top-24 size-48 rounded-full bg-white/5 blur-2xl" />
            <div className="absolute -left-10 -bottom-24 size-48 rounded-full bg-[#E31E24]/20 blur-2xl" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-5">
              <div className="shrink-0 animate-pulse">
                <div className="flex h-14 items-center justify-center rounded-2xl bg-white px-4 shadow-sm">
                  <Image
                    src="/logo.png"
                    alt="Birga Quramiz Logo"
                    width={100}
                    height={32}
                    className="h-7 w-auto object-contain"
                  />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-black text-white">{t('bannerTitle')}</h3>
                <p className="mt-1 text-[11px] font-bold text-white/80 leading-relaxed md:text-[13px] md:font-semibold">
                  {t('bannerSubtitle')}
                </p>
              </div>
            </div>

            {/* Pagination dots (static style element with brand red dot) */}
            <div className="relative z-10 mt-6 flex justify-center gap-2">
              <div className="h-2 w-5 rounded-full bg-[#E31E24]" />
              <div className="h-2 w-2 rounded-full bg-white/30" />
              <div className="h-2 w-2 rounded-full bg-white/30" />
            </div>
          </div>

          {/* Section Headers and 2-Column Grid */}
          <div className="flex flex-col gap-10">
            {isLoading ? (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4 mt-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="rounded-2xl md:rounded-[32px] bg-white animate-pulse" style={{ height: 320 }} />
                ))}
              </div>
            ) : (
              sections.map((section) => {
                if (section.items.length === 0) return null;

                return (
                  <section key={section.id} className="flex flex-col gap-4">
                    <div className="flex items-center justify-between px-1">
                      <h2 className="text-[18px] font-black text-[#1B4D91]">{section.title}</h2>
                      <Link href="/catalog" className="flex items-center gap-0.5 text-[12px] font-bold text-slate-400 active:text-[#1B4D91] transition-colors">
                        Все
                        <ChevronRight className="size-3.5" />
                      </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                      {section.items.slice(0, 4).map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  </section>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

