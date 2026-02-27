"use client";

import { useEffect, useState } from "react";
import Link from 'next/link';
import { Search, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
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

  if (isLoading) {
    return (
      <div className="px-4 pt-6 pb-44 bg-[#f4f6fa]">
        <div className="h-12 w-full rounded-2xl bg-white border-2 border-[#1B4D91]/20 animate-pulse mb-6" />
        <div className="h-32 rounded-3xl bg-white animate-pulse mb-6" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-white animate-pulse" style={{ height: 260 }} />
          ))}
        </div>
      </div>
    );
  }

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

          {/* Update Banner Section (from screenshot) */}
          <div className="relative overflow-hidden rounded-3xl bg-[#2d3a4b] p-6 shadow-xl shadow-slate-900/10">
            <div className="flex items-center gap-5">
              <div className="shrink-0 animate-pulse">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-[#f9b41b]/20 text-[#f9b41b]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-triangle-alert"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-black text-white">Вышло обновление!</h3>
                <p className="mt-1 text-[11px] font-bold text-white/60 leading-relaxed">
                  Во избежания ошибок в работе приложения, просим загрузить последнее обновление!
                </p>
              </div>
            </div>

            {/* Pagination dots (static for now) */}
            <div className="mt-6 flex justify-center gap-2">
              <div className="h-2 w-5 rounded-full bg-[#f9b41b]" />
              <div className="h-2 w-2 rounded-full bg-white/20" />
              <div className="h-2 w-2 rounded-full bg-white/20" />
            </div>
          </div>

          {/* Section Headers and 2-Column Grid */}
          <div className="flex flex-col gap-10">
            {sections.map((section) => {
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
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

