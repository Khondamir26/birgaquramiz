"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { getProducts, getCategories } from "@/lib/api/products";
import { expandSearchQuery } from "@/lib/search";
import ProductCard from "@/components/product/ProductCard";
import CategoryCard from "@/components/catalog/CategoryCard";
import type { PaginatedResponse, Product, Category } from "@/types";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";
import SidebarFilter from "@/components/catalog/SidebarFilter";
import { getCategoryImage } from "@/lib/constants/categories";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export default function CatalogPage() {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [data, setData] = useState<PaginatedResponse<Product> | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isMobileSearchActive, setIsMobileSearchActive] = useState(false);
  const [filters, setFilters] = useState<{ minPrice?: number; maxPrice?: number; sortBy?: string }>({ sortBy: "newest" });
  
  const t = useTranslations("Catalog");
  const tNav = useTranslations("Navbar");
  const inputRef = useRef<HTMLInputElement>(null);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get("q");

  useEffect(() => {
    if (q) {
      setQuery(q);
      setSearch(q);
      setPage(1);
    }
  }, [q]);

  useEffect(() => {
    getCategories().then(setCategories).catch(console.error);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const expandedSearch = expandSearchQuery(search);
    getProducts(page, 12, expandedSearch, undefined, filters.minPrice, filters.maxPrice, filters.sortBy)
      .then((res) => {
        if (!cancelled) {
          setError("");
          setData(res);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : t("loadFailed"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [page, search, filters.minPrice, filters.maxPrice, filters.sortBy, t]);

  const products = useMemo(() => data?.data ?? [], [data]);
  
  const breadcrumbItems = useMemo(() => [
    { label: tNav("home"), href: "/" },
    { label: tNav("catalog") },
  ], [tNav]);

  const meta = data?.meta;



  const handleClear = useCallback(() => {
    setError("");
    setLoading(true);
    setQuery("");
    setSearch("");
    setPage(1);
    inputRef.current?.focus();
  }, []);

  const handleCategoryClick = useCallback(() => {
    setIsMobileSearchActive(true);
  }, []);

  const handleBackToCategories = useCallback(() => {
    setIsMobileSearchActive(false);
    setSearch("");
    setQuery("");
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f6fa] md:pb-12">
      <div className="mx-auto w-full md:max-w-7xl">
        <div className="hidden md:block px-4 md:px-6 pt-3 md:pt-5">
          <Breadcrumbs items={breadcrumbItems} />
        </div>
        <div className="mx-auto flex flex-col gap-6 px-4 md:px-6 max-w-md md:max-w-none pb-24 md:pb-0 pt-6 md:pt-6">

          {/* -- Results Title -- */}
          <div className="mb-2">
            {!loading && data && (
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-semibold text-slate-500">
                  {search ? `Results for "${search}"` : "All products"}
                  {meta ? ` · ${meta.total ?? products.length} products` : ""}
                </p>
                {search && (
                  <button onClick={handleClear} className="text-[12px] font-bold text-[#E31E24] hover:underline">
                    Clear search
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-6 items-start">
            <SidebarFilter
              isOpen={isFilterOpen}
              onClose={() => setIsFilterOpen(false)}
              currentMinPrice={filters.minPrice}
              currentMaxPrice={filters.maxPrice}
              currentSortBy={filters.sortBy}
              onApplyFilters={(f) => {
                setFilters(f);
                setPage(1);
              }}
            />

            <div className="flex-1 w-full min-w-0 pb-20 md:pb-0">
              {loading && (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="rounded-2xl bg-white animate-pulse"
                      style={{ height: "280px" }}
                    />
                  ))}
                </div>
              )}

              {!loading && error && (
                <div className="rounded-2xl bg-red-50 border border-red-100 p-6 text-center">
                  <p className="text-sm font-bold text-red-500">{t("loadFailed")}</p>
                  <p className="mt-1 text-xs text-red-400">{error}</p>
                  <button
                    className="mt-4 rounded-xl bg-[#E31E24] px-6 py-2.5 text-[12px] font-black text-white active:scale-95 transition-transform"
                    onClick={() => { setError(""); setPage(1); setSearch(""); setQuery(""); }}
                  >
                    Retry
                  </button>
                </div>
              )}

              {!loading && !error && products.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="mb-5 flex size-20 items-center justify-center rounded-full bg-[#1B4D91]/5">
                    <Search className="size-9 text-[#1B4D91]/20" />
                  </div>
                  <p className="text-base font-black text-[#1B4D91]">{t("empty")}</p>
                  <p className="mt-1 text-[13px] text-slate-400">Try another search query</p>
                </div>
              )}

              {!loading && !error && (
                <>
                  <div className={cn("grid grid-cols-2 gap-4", isDesktop ? "hidden" : !isMobileSearchActive ? "grid" : "hidden")}>
                    <CategoryCard
                      id="all"
                      name="Все товары"
                      image="/images/categories/tools.png"
                      onClick={handleCategoryClick}
                    />
                    {categories.map((cat) => (
                      <CategoryCard
                        key={cat.id}
                        id={cat.id}
                        name={cat.name}
                        image={getCategoryImage(cat.code)}
                        href={`/catalog/category/${cat.id}`}
                      />
                    ))}
                    <CategoryCard
                      id="new"
                      name="Новинки"
                      isHighlight
                    />
                  </div>

                  {isMobileSearchActive && !isDesktop && (
                    <div className="mb-6">
                      <button 
                        onClick={handleBackToCategories}
                        className="flex items-center gap-2 text-[13px] font-black text-[#1B4D91] active:opacity-60 transition-opacity"
                      >
                        <ChevronLeft className="size-4" />
                        Назад к категориям
                      </button>
                    </div>
                  )}

                  {(isMobileSearchActive || isDesktop) && products.length > 0 && (
                    <div className="grid grid-cols-2 gap-4 md:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  )}
                </>
              )}

              {meta && meta.totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => { setPage((p) => p - 1); window.scrollTo(0, 0); }}
                    className={cn(
                      "flex size-10 items-center justify-center rounded-xl border-2 font-bold transition-all",
                      page <= 1
                        ? "border-slate-100 text-slate-300 cursor-not-allowed"
                        : "border-[#1B4D91]/20 text-[#1B4D91] hover:bg-[#1B4D91]/5 active:bg-[#1B4D91]/10"
                    )}
                  >
                    <ChevronLeft className="size-5" />
                  </button>

                  <div className="hidden md:flex items-center gap-1">
                    {Array.from({ length: Math.min(meta.totalPages, 7) }, (_, i) => {
                      const p = i + 1;
                      return (
                        <button
                          key={p}
                          onClick={() => { setPage(p); window.scrollTo(0, 0); }}
                          className={cn(
                            "flex size-10 items-center justify-center rounded-xl text-[13px] font-bold transition-all",
                            p === page
                              ? "bg-[#1B4D91] text-white shadow-sm"
                              : "text-slate-500 hover:bg-slate-100"
                          )}
                        >
                          {p}
                        </button>
                      );
                    })}
                    {meta.totalPages > 7 && <span className="px-2 text-slate-400">...</span>}
                  </div>

                  <span className="md:hidden rounded-xl border-2 border-[#1B4D91]/20 bg-white px-5 py-2 text-[13px] font-black text-[#1B4D91]">
                    {page} / {meta.totalPages}
                  </span>

                  <button
                    disabled={page >= meta.totalPages}
                    onClick={() => { setPage((p) => p + 1); window.scrollTo(0, 0); }}
                    className={cn(
                      "flex size-10 items-center justify-center rounded-xl border-2 font-bold transition-all",
                      page >= meta.totalPages
                        ? "border-slate-100 text-slate-300 cursor-not-allowed"
                        : "border-[#1B4D91]/20 text-[#1B4D91] hover:bg-[#1B4D91]/5 active:bg-[#1B4D91]/10"
                    )}
                  >
                    <ChevronRight className="size-5" />
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
