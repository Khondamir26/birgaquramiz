"use client";

import { useFavorites } from "@/hooks/useFavorites";
import { useTranslations } from "next-intl";
import ProductCard from "@/components/product/ProductCard";
import { Heart, LayoutGrid } from "lucide-react";
import { useRouter } from "next/navigation";

export default function FavoritesPage() {
    const { items, clearFavorites } = useFavorites();
    const t = useTranslations("Favorites");
    const router = useRouter();

    // Empty state
    if (items.length === 0) {
        return (
            <div className="flex min-h-[70vh] flex-col items-center justify-center px-8 text-center">
                {/* Animated icon */}
                <div className="relative mb-8">
                    <div className="flex size-28 items-center justify-center rounded-full bg-[#1B4D91]/5">
                        <Heart className="size-14 text-[#1B4D91]/15" />
                    </div>
                    <div className="absolute bottom-0 right-0 flex size-10 items-center justify-center rounded-full bg-[#E31E24]/10">
                        <Heart className="size-5 text-[#E31E24]/40" />
                    </div>
                </div>

                <h1 className="text-2xl font-black text-[#1B4D91]">
                    {t("emptyTitle") || "Избранное пусто"}
                </h1>
                <p className="mt-2 text-[13px] font-medium text-slate-400 max-w-[220px]">
                    {t("emptyText") || "Нажмите ♡ на любом товаре, чтобы добавить его сюда"}
                </p>

                <button
                    onClick={() => router.push("/catalog")}
                    className="mt-10 h-13 w-full max-w-xs rounded-2xl bg-[#1B4D91] text-[14px] font-black text-white shadow-lg shadow-[#1B4D91]/20 active:scale-[0.97] transition-transform"
                >
                    {t("goMarketplace") || "Перейти в каталог"}
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-[#f4f6fa] md:bg-transparent pb-40">

            {/* Header */}
            <div className="sticky top-0 z-30 bg-white px-5 pt-6 pb-4 shadow-sm md:static md:shadow-none md:bg-transparent md:pt-0 md:px-0">
                <div className="flex items-end justify-between">
                    <div>
                        <h1 className="text-xl font-black text-[#1B4D91]">
                            {t("title") || "Избранное"}
                        </h1>
                        <p className="text-[12px] font-medium text-slate-400 mt-0.5">
                            {items.length} {items.length === 1 ? "товар" : items.length < 5 ? "товара" : "товаров"}
                        </p>
                    </div>

                    <button
                        onClick={clearFavorites}
                        className="rounded-xl border border-[#E31E24]/20 px-4 py-2 text-[11px] font-black uppercase tracking-wide text-[#E31E24] active:bg-[#E31E24]/5 transition-colors"
                    >
                        Очистить
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="px-4 pt-4 md:px-0 md:pt-0 md:mt-4">
                <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-3 lg:grid-cols-4">
                    {items.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
        </div>
    );
}
