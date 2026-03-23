import { getTranslations } from 'next-intl/server';
import { getProducts } from "@/lib/api/products";
import type { Product } from "@/types";
import ProductCard from "@/components/product/ProductCard";
import HomeSwiperClient from "@/components/home/HomeSwiperClient";

export default async function HomePage() {
  const t = await getTranslations('Home');

  let products: Product[] = [];
  try {
    const res = await getProducts(1, 32);
    products = res.data;
  } catch {
    // API unavailable — render page without products
  }

  const sections = [
    { title: t('newArrivals'),  items: products.slice(0, 8),  id: 'new' },
    { title: t('topProducts'),  items: products.slice(8, 16), id: 'top' },
    { title: t('mightNeed'),    items: products.slice(16, 24),id: 'recommended' },
    { title: t('allProducts'),  items: products.slice(24),    id: 'all' },
  ];

  return (
    <div className="flex flex-col pb-44 bg-[#f8f9fb]">
      {/* Preload LCP banner image — HomeSwiper is ssr:false so the browser needs this hint */}
      <link rel="preload" as="image" href="/images/banners/construction_bg.avif" fetchPriority="high" />
      <div className="mx-auto w-full md:max-w-[1440px]">
        <div className="flex flex-col gap-8 px-3 md:px-6 pt-4 md:pt-6">

          <HomeSwiperClient />

          <div className="flex flex-col gap-6 md:gap-8">
            {sections.map((section) => {
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
            })}
          </div>

        </div>
      </div>
    </div>
  );
}
