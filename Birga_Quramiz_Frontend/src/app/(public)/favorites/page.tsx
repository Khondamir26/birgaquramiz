"use client";

import { useFavorites } from "@/hooks/useFavorites";
import { useTranslations } from "next-intl";
import type { Product } from "@/types";
import ProductCard from "@/components/product/ProductCard";
import { Heart, Trash2 } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";

export default function FavoritesPage() {
  const { items, clearFavorites } = useFavorites();
  const t = useTranslations("Favorites");

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title={t("emptyTitle")}
        description={t("emptyText")}
        buttonText={t("goMarketplace")}
        buttonHref="/catalog"
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F2F5] pb-20 pt-6 md:pt-10">
      <div className="max-w-[1488px] mx-auto px-4 md:px-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div>
            <h1 className="text-[24px] md:text-[32px] font-bold text-black leading-tight">
              {t("title")}
            </h1>
            <p className="text-[13px] md:text-[15px] text-slate-400 font-medium mt-0.5">
              {t("itemsCount", { count: items.length })}
            </p>
          </div>

          <button
            onClick={clearFavorites}
            className="flex items-center gap-2 h-10 md:h-11 px-4 md:px-5 rounded-full border border-slate-200 bg-white text-[12px] md:text-[13px] font-bold text-slate-500 hover:text-[#E31E24] hover:border-[#E31E24]/30 hover:bg-red-50/50 active:scale-95 transition-all shadow-sm"
          >
            <Trash2 className="size-3.5" />
            <span className="hidden sm:inline">{t("clearAll")}</span>
          </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-5 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((product) => (
            <ProductCard key={product.id} product={product as Product} />
          ))}
        </div>

      </div>
    </div>
  );
}
