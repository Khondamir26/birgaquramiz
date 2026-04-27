"use client";

import { useEffect, useState, useMemo, startTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { getCategories } from "@/lib/api/products";
import ProductCard from "@/components/product/ProductCard";
import type { Category } from "@/types";
import { useTranslations, useLocale } from "next-intl";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useCatalogData } from "@/hooks/useCatalogData";
import type { CatalogFilters } from "@/hooks/useCatalogData";
import MobileCatalogView from "@/components/catalog/MobileCatalogView";
import DesktopFilterToolbar from "@/components/catalog/DesktopFilterToolbar";

export default function CatalogPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<CatalogFilters>({ sortBy: "newest" });
  const [viewMode, setViewMode] = useState<"3col" | "4col">("4col");
  const [allCategories, setAllCategories] = useState<Category[]>([]);

  const { data, loading, isFetching, isLoadingMore, error, desktopProducts, availableCategories, availableBrands, basePriceRange } =
    useCatalogData(page, search, filters);

  const t = useTranslations("Catalog");
  const tNav = useTranslations("Navbar");
  const locale = useLocale();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const searchParams = useSearchParams();
  const q = searchParams.get("q");

  useEffect(() => {
    if (q) {
      startTransition(() => { setSearch(q); setPage(1); });
    }
  }, [q]);

  useEffect(() => {
    getCategories().then(setAllCategories).catch(() => {});
  }, []);

  const meta = data?.meta;

  const breadcrumbItems = useMemo(() => [
    { label: tNav("home"), href: "/" },
    { label: tNav("catalog") },
  ], [tNav]);

  const handleFiltersChange = (f: CatalogFilters) => { setFilters(f); setPage(1); };

  return (
    <div className="flex flex-col min-h-screen bg-white lg:bg-[#f4f6fa] lg:pb-12">

      {/* ── MOBILE ── */}
      {!isDesktop && (
        <MobileCatalogView
          search={search}
          onSearchChange={(q) => { setSearch(q); setPage(1); }}
          products={data?.data ?? []}
          loading={loading}
          isFetching={isFetching}
          meta={meta}
          page={page}
          onPageChange={setPage}
          allCategories={allCategories}
          locale={locale}
          t={t}
        />
      )}

      {/* ── DESKTOP ── */}
      {isDesktop && (
        <div className="mx-auto w-full max-w-[1488px]">
          <div className="px-6 pt-5">
            <Breadcrumbs items={breadcrumbItems} />
          </div>

          <div className="px-6 pt-4 pb-12">
            <DesktopFilterToolbar
              filters={filters}
              onFiltersChange={handleFiltersChange}
              availableCategories={availableCategories}
              availableBrands={availableBrands}
              basePriceRange={basePriceRange}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              t={t}
              locale={locale}
            />

            {/* Products */}
            {loading && (
              <div className={`grid gap-4 ${viewMode === "3col" ? "grid-cols-3" : "grid-cols-4 xl:grid-cols-5"}`}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="rounded-2xl bg-white animate-pulse" style={{ height: 280 }} />
                ))}
              </div>
            )}
            {!loading && error && (
              <div className="rounded-2xl bg-red-50 border border-red-100 p-6 text-center">
                <p className="text-sm font-bold text-red-500">{t("loadFailed")}</p>
                <button className="mt-4 rounded-xl bg-[#E31E24] px-6 py-2.5 text-[12px] font-black text-white" onClick={() => { setFilters({ sortBy: "newest" }); setPage(1); setSearch(""); }}>{t("retry")}</button>
              </div>
            )}
            {!loading && !error && desktopProducts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <Search className="size-9 text-[#1B4D91]/20 mb-4" />
                <p className="font-black text-[#1B4D91]">{t("empty")}</p>
                <p className="mt-1 text-[13px] text-slate-400">{t("tryAnotherQuery")}</p>
              </div>
            )}
            {!loading && !error && desktopProducts.length > 0 && (
              <>
                <div className={`grid gap-4 ${viewMode === "3col" ? "grid-cols-3" : "grid-cols-4 xl:grid-cols-5"}`}>
                  {desktopProducts.map((p) => <ProductCard key={p.id} product={p} />)}
                </div>
                {meta && meta.page < meta.totalPages && (
                  <div className="mt-6">
                    <button
                      onClick={() => setPage(p => p + 1)}
                      disabled={isLoadingMore}
                      className="w-full py-3.5 rounded-2xl bg-[#f1f1f5] text-[15px] font-semibold text-[#242424] hover:bg-[#e8e8ee] transition-colors disabled:opacity-60"
                    >
                      {isLoadingMore
                        ? "..."
                        : `${t("show")} ${Math.min(20, meta.total - desktopProducts.length)} ${t("more")}`}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
