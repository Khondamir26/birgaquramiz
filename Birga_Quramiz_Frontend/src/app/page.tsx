"use client";

import { useEffect, useState } from "react";
import { useTranslations } from 'next-intl';
import { getProducts } from "@/lib/api/products";
import type { Product } from "@/types";
import ProductCard from "@/components/product/ProductCard";
import dynamic from "next/dynamic"

const HomeSwiper = dynamic(
  () => import("@/components/home/HomeSwiper"),
  { ssr: false, loading: () => <div className="w-full rounded-2xl bg-slate-100 animate-pulse" style={{ aspectRatio: "16/7", minHeight: 180 }} /> }
);

export default function HomePage() {
  const t = useTranslations('Home');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await getProducts(1, 32);
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
      {/* Preload LCP banner image — HomeSwiper is ssr:false so the browser needs this hint */}
      <link rel="preload" as="image" href="/images/banners/construction_bg.avif" fetchPriority="high" />
      <div className="mx-auto w-full md:max-w-[1440px]">
        <div className="flex flex-col gap-8 px-3 md:px-6 pt-4 md:pt-6">

          {/* Hero Swiper Section */}
          <HomeSwiper />

          {/* Product Sections */}
          <div className="flex flex-col gap-6 md:gap-8">
            {isLoading ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4 mt-2">
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
                  <section
                    key={section.id}
                    className="flex flex-col gap-3 md:gap-5 bg-white rounded-3xl px-3 pt-3 pb-4 md:px-6 md:pt-5 md:pb-6 shadow-sm"
                  >
                    <div className="flex items-center px-0.5">
                      <div className="flex flex-col gap-1">
                        <h2 className="text-[18px] md:text-[24px] font-black text-[#1B4D91] leading-none">{section.title}</h2>
                        <div className="h-1 w-10 bg-navbar-gradient rounded-full" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4">
                      {section.items.map((product) => (
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
