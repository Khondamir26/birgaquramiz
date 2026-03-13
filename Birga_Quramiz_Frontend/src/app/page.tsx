"use client";

import { useEffect, useState } from "react";
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { getProducts } from "@/lib/api/products";
import type { Product } from "@/types";
import ProductCard from "@/components/product/ProductCard";
import HomeSwiper from "@/components/home/HomeSwiper";

export default function HomePage() {
  const t = useTranslations('Home');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await getProducts(1, 40);
        setProducts(res.data);
      } catch {
        setLoadFailed(true);
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
        <div className="mx-auto flex flex-col gap-8 px-4 md:px-6 max-w-md md:max-w-none pt-4 md:pt-6">
          
          {/* Hero Swiper Section */}
          <HomeSwiper />

          {/* Product Sections */}
          <div className="flex flex-col gap-12">
            {isLoading ? (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4 mt-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="rounded-2xl md:rounded-[32px] bg-white animate-pulse" style={{ height: 320 }} />
                ))}
              </div>
            ) : loadFailed ? (
              <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-[12px] font-semibold text-red-600">
                Products are temporarily unavailable. Please try again shortly.
              </div>
            ) : (
              sections.map((section) => {
                if (section.items.length === 0) return null;

                return (
                  <section key={section.id} className="flex flex-col gap-5">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex flex-col gap-1">
                        <h2 className="text-[20px] md:text-[24px] font-black text-[#1B4D91] leading-none">{section.title}</h2>
                        <div className="h-1 w-10 bg-navbar-gradient rounded-full" />
                      </div>
                      <Link href="/catalog" className="group flex items-center gap-1 text-[13px] font-bold text-slate-400 hover:text-[#1B4D91] transition-all">
                        {t('allProducts') || 'Все'}
                        <div className="flex size-6 items-center justify-center rounded-full bg-slate-100 group-hover:bg-[#1B4D91]/10 transition-colors">
                          <ChevronRight className="size-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
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
