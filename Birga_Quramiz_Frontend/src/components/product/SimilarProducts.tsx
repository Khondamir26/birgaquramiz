"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { getProducts } from "@/lib/api/products";
import type { Product } from "@/types";
import ProductCard from "@/components/product/ProductCard";

type Props = { product: Product; initialItems?: Product[] };

export default function SimilarProducts({ product, initialItems }: Props) {
  const t = useTranslations("ProductDetail");
  const [items, setItems] = useState<Product[]>(initialItems ?? []);
  const [loading, setLoading] = useState(!initialItems);

  useEffect(() => {
    // Skip fetch if parent provided items
    if (initialItems !== undefined) return;
    if (!product.categoryId) {
      setLoading(false);
      return;
    }
    getProducts(1, 16, undefined, product.categoryId)
      .then((res) => {
        setItems(res.data.filter((p) => p.id !== product.id));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id, product.categoryId]);

  if (!loading && items.length === 0) return null;

  return (
    <section className="py-6 md:py-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[18px] md:text-[22px] font-black text-black leading-none">
          {t("similarTitle")}
        </h2>
      </div>

      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-[280px] rounded-2xl bg-[#f0f0f0] animate-pulse" />
          ))}
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}
