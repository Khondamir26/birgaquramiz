"use client";

import { useEffect, useState, useRef } from "react";
import { Search, X, SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { getProducts } from "@/lib/api/products";
import ProductCard from "@/components/product/ProductCard";
import type { PaginatedResponse, Product } from "@/types";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export default function CatalogPage() {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [data, setData] = useState<PaginatedResponse<Product> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const t = useTranslations("Catalog");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    setError("");

    getProducts(page, 12, search)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : t("loadFailed"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [page, search, t]);

  const products = data?.data ?? [];
  const meta = data?.meta;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPage(1);
    setSearch(query.trim());
    inputRef.current?.blur();
  };

  const handleClear = () => {
    setLoading(true);
    setQuery("");
    setSearch("");
    setPage(1);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f6fa] md:pb-12">

      {/* ── Mobile Search Bar ── */}
      <section className="sticky top-0 z-30 bg-[#1B4D91] px-4 pt-3 pb-4 shadow-md md:hidden rounded-b-3xl">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[16px] font-black text-white">{t("title")}</p>
        </div>
        <form className="relative flex items-center gap-2" onSubmit={handleSubmit}>
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-[18px] text-slate-400 pointer-events-none" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="h-12 w-full rounded-2xl border-none bg-white pl-11 pr-10 text-[14px] font-semibold text-[#1B4D91] placeholder:text-slate-400 focus:ring-2 focus:ring-white/50 focus:outline-none transition-all duration-200 shadow-inner"
            />
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 flex size-6 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors active:bg-slate-200"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
          <button
            type="button"
            className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur-sm active:bg-white/20 transition-colors"
          >
            <SlidersHorizontal className="size-5" />
          </button>
        </form>
      </section>

      <div className="mx-auto w-full md:max-w-7xl">
        <div className="mx-auto flex flex-col gap-5 px-4 md:px-6 max-w-md md:max-w-none pb-36 md:pb-0 pt-4 md:pt-6">

          {/* ── Desktop Hero + Search ── */}
          <section className="hidden md:block">
            {/* Hero bar */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1B4D91] to-[#123666] px-10 py-10 shadow-lg shadow-[#1B4D91]/20 mb-6">
              {/* Decorative background elements */}
              <div className="absolute right-0 top-0 h-64 w-64 -translate-y-1/4 translate-x-1/4 rounded-full bg-white/5 blur-3xl" />
              <div className="absolute bottom-0 left-0 h-48 w-48 -translate-x-1/4 translate-y-1/4 rounded-full bg-[#E31E24]/10 blur-2xl" />

              <div className="relative z-10 w-full max-w-2xl">
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#E31E24] mb-2">{t("title")}</p>
                <h1 className="text-3xl font-black leading-tight text-white mb-3">Construction Materials Marketplace</h1>
                <p className="text-[15px] font-medium text-white/70 leading-relaxed mb-8">{t("subtitle")}</p>

                {/* Desktop search bar */}
                <form className="flex gap-3" onSubmit={handleSubmit}>
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400 pointer-events-none" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={t("searchPlaceholder")}
                      className="h-14 w-full rounded-2xl border-none bg-white pl-12 pr-12 text-[15px] font-semibold text-[#1B4D91] placeholder:text-slate-400 focus:ring-4 focus:ring-white/20 focus:outline-none transition-all shadow-inner"
                    />
                    {query && (
                      <button type="button" onClick={handleClear} className="absolute right-4 top-1/2 -translate-y-1/2 flex size-6 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
                        <X className="size-3.5" />
                      </button>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="h-14 rounded-2xl bg-[#E31E24] px-10 text-[14px] font-black text-white hover:bg-[#C91A20] hover:shadow-lg hover:shadow-[#E31E24]/30 transition-all active:scale-95"
                  >
                    {t("search")}
                  </button>
                </form>
              </div>
            </div>

            {/* Results meta */}
            {!loading && data && (
              <div className="flex items-center justify-between mb-4">
                <p className="text-[13px] font-semibold text-slate-500">
                  {search ? `Результаты для «${search}»` : "Все товары"}
                  {meta ? ` · ${meta.total ?? products.length} товаров` : ""}
                </p>
                {search && (
                  <button onClick={handleClear} className="text-[12px] font-bold text-[#E31E24] hover:underline">
                    Сбросить поиск
                  </button>
                )}
              </div>
            )}
          </section>

          {/* ── Products Area ── */}
          <div className="px-4 pt-3 pb-36 md:px-0 md:pb-0">

            {/* Loading skeleton */}
            {loading && (
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl bg-white animate-pulse"
                    style={{ height: "280px" }}
                  />
                ))}
              </div>
            )}

            {/* Error */}
            {!loading && error && (
              <div className="rounded-2xl bg-red-50 border border-red-100 p-6 text-center">
                <p className="text-sm font-bold text-red-500">{t("loadFailed")}</p>
                <p className="mt-1 text-xs text-red-400">{error}</p>
                <button
                  className="mt-4 rounded-xl bg-[#E31E24] px-6 py-2.5 text-[12px] font-black text-white active:scale-95 transition-transform"
                  onClick={() => { setPage(1); setSearch(""); setQuery(""); }}
                >
                  Повторить
                </button>
              </div>
            )}

            {/* Empty */}
            {!loading && !error && products.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="mb-5 flex size-20 items-center justify-center rounded-full bg-[#1B4D91]/5">
                  <Search className="size-9 text-[#1B4D91]/20" />
                </div>
                <p className="text-base font-black text-[#1B4D91]">{t("empty")}</p>
                <p className="mt-1 text-[13px] text-slate-400">Попробуйте другой запрос</p>
              </div>
            )}

            {/* Products grid */}
            {!loading && !error && products.length > 0 && (
              <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-3 lg:grid-cols-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* Pagination */}
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

                {/* Numbered pages (desktop) */}
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

                {/* Mobile page indicator */}
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

          {/* ── Floating filter (mobile only) ── */}
          <button
            className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#1B4D91] text-white shadow-xl shadow-[#1B4D91]/30 active:scale-90 transition-transform duration-150 md:hidden"
            aria-label="Фильтры"
          >
            <SlidersHorizontal className="size-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
