"use client";

import { useFavorites } from "@/hooks/useFavorites";
import { useTranslations } from "next-intl";
import ProductCard from "@/components/product/ProductCard";
import { Heart } from "lucide-react";

import EmptyState from "@/components/ui/EmptyState";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";

export default function FavoritesPage() {
    const { items, clearFavorites } = useFavorites();
    const t = useTranslations("Favorites");
    const tNav = useTranslations("Navbar");

    const breadcrumbItems = [
        { label: tNav("home"), href: "/" },
        { label: t("title") || "Избранное" },
    ];

    // Empty state
    if (items.length === 0) {
        return (
            <EmptyState
                icon={Heart}
                secondaryIcon={Heart}
                title={t("emptyTitle") || "Избранное пусто"}
                description={t("emptyText") || "Нажмите ♡ на любом товаре, чтобы добавить его сюда"}
                buttonText={t("goMarketplace") || "Перейти в каталог"}
                buttonHref="/catalog"
            />
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-[#f4f6fa] pb-40 relative">
            <div className="mx-auto w-full md:max-w-[1440px] flex flex-col">
                {/* Desktop Breadcrumbs */}
                <div className="hidden md:block px-4 md:px-6 pt-3 md:pt-5">
                    <Breadcrumbs items={breadcrumbItems} />
                </div>

                <div className="flex flex-col md:gap-6 pb-24 md:pb-0 md:pt-6">
                    {/* Header: Full width on mobile, centered/padded on desktop */}
                    <div className="sticky top-0 z-30 bg-white px-4 pt-6 pb-4 md:static md:shadow-none md:bg-transparent md:pt-0 md:px-6">
                        <div className="flex items-center justify-between md:items-start max-w-[1440px] mx-auto w-full">
                            <div className="md:space-y-1">
                                <h1 className="text-xl md:text-4xl font-black text-[#1B4D91] tracking-tight">
                                    {t("title") || "Избранное"}
                                </h1>
                                <p className="text-[12px] md:text-[15px] font-medium text-slate-400 mt-0.5">
                                    {items.length} {items.length === 1 ? "товар" : items.length < 5 ? "товара" : "товаров"}
                                </p>
                            </div>

                            <button
                                onClick={clearFavorites}
                                className="rounded-xl border border-red-100 md:border-slate-200 bg-red-50/50 md:bg-white px-4 md:px-6 py-2 md:py-3 text-[11px] md:text-[13px] font-black uppercase tracking-wider text-[#E31E24] md:text-slate-400 hover:md:text-[#E31E24] hover:md:border-[#E31E24]/30 active:scale-95 transition-all"
                            >
                                Очистить
                            </button>
                        </div>
                    </div>

                    {/* Grid */}
                    <div className="px-4 md:px-6 pt-4 md:pt-0">
                        <div className="grid grid-cols-2 gap-3 md:gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                            {items.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
