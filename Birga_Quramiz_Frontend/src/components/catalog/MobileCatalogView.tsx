"use client";

import { useEffect, useRef, useCallback } from "react";
import { useState } from "react";
import { Search, ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { resolveImageUrl } from "@/lib/image";
import type { Product, Category } from "@/types";
import { cn } from "@/lib/utils";
import { getCategoryName } from "@/lib/categoryName";
import { CATEGORY_ICONS } from "@/lib/constants/categoryIcons";

type PageMeta = { total: number; page: number; limit: number; totalPages: number };

interface MobileCatalogViewProps {
  search: string;
  onSearchChange: (q: string) => void;
  products: Product[];
  loading: boolean;
  isFetching: boolean;
  meta: PageMeta | undefined;
  page: number;
  onPageChange: (p: number) => void;
  allCategories: Category[];
  locale: string;
  t: (key: string) => string;
}

export default function MobileCatalogView({
  search, onSearchChange,
  products, loading, isFetching,
  meta, page, onPageChange,
  allCategories, locale, t,
}: MobileCatalogViewProps) {
  const [searchInput, setSearchInput] = useState(search);
  const [isMobileSearchActive, setIsMobileSearchActive] = useState(false);
  const [selectedParent, setSelectedParent] = useState<Category | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const categoryListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (categoryListRef.current) categoryListRef.current.scrollTop = 0;
  }, [selectedParent]);

  const handleBackToCategories = useCallback(() => {
    setIsMobileSearchActive(false);
    setSearchInput("");
    clearTimeout(debounceRef.current);
    onSearchChange("");
  }, [onSearchChange]);

  const parentCategories = allCategories.filter(c => !c.parentId);
  const subcategories = allCategories.filter(c => c.parentId === selectedParent?.id);

  return (
    <div className="flex flex-col h-[100dvh]">
      {/* Sticky search bar */}
      <div className="shrink-0 bg-white px-3 py-2.5 border-b border-[#f0f0f0] z-10">
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#999]" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => {
                const val = e.target.value;
                setSearchInput(val);
                setIsMobileSearchActive(!!val);
                if (val) setSelectedParent(null);
                clearTimeout(debounceRef.current);
                debounceRef.current = setTimeout(() => {
                  onSearchChange(val);
                  onPageChange(1);
                }, 400);
              }}
              placeholder={t("searchPlaceholder")}
              className="w-full h-11 pl-10 pr-9 bg-[#f4f4f6] rounded-xl text-[14px] text-[#242424] placeholder:text-[#999] outline-none"
            />
            {search && (
              <button
                onClick={handleBackToCategories}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="size-4 text-[#999]" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div ref={categoryListRef} className="flex-1 overflow-y-auto pb-20">

        {/* Category navigation */}
        {!isMobileSearchActive && (
          <div className="flex flex-col">
            {selectedParent ? (
              <>
                <button
                  onClick={() => setSelectedParent(null)}
                  className="flex items-center gap-2 px-4 py-3.5 border-b border-[#f2f2f2] font-bold text-[15px] text-[#242424]"
                >
                  <ChevronLeft className="size-5 text-[#242424]" />
                  {getCategoryName(selectedParent, locale)}
                </button>
                {subcategories.map((sub) => (
                  <Link
                    key={sub.id}
                    href={`/catalog/category/${sub.slug ?? sub.id}`}
                    className="flex items-center gap-3 px-4 py-3.5 border-b border-[#f2f2f2] active:bg-[#f9f9fb]"
                  >
                    <span className="flex-1 text-[15px] text-[#242424]">{getCategoryName(sub, locale)}</span>
                    <ChevronRight className="size-4 text-[#ccc] shrink-0" />
                  </Link>
                ))}
              </>
            ) : (
              parentCategories.map((cat) => {
                const Icon = CATEGORY_ICONS[cat.code] ?? CATEGORY_ICONS.DEFAULT;
                const hasChildren = allCategories.some(c => c.parentId === cat.id);
                return hasChildren ? (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedParent(cat)}
                    className="flex items-center gap-3 px-4 py-3.5 border-b border-[#f2f2f2] active:bg-[#f9f9fb] w-full text-left"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center text-[#555]"><Icon className="size-5" /></span>
                    <span className="flex-1 text-[15px] text-[#242424]">{getCategoryName(cat, locale)}</span>
                    <ChevronRight className="size-4 text-[#ccc] shrink-0" />
                  </button>
                ) : (
                  <Link
                    key={cat.id}
                    href={`/catalog/category/${cat.slug ?? cat.id}`}
                    className="flex items-center gap-3 px-4 py-3.5 border-b border-[#f2f2f2] active:bg-[#f9f9fb]"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center text-[#555]"><Icon className="size-5" /></span>
                    <span className="flex-1 text-[15px] text-[#242424]">{getCategoryName(cat, locale)}</span>
                    <ChevronRight className="size-4 text-[#ccc] shrink-0" />
                  </Link>
                );
              })
            )}
          </div>
        )}

        {/* Search results */}
        {isMobileSearchActive && (
          <div className="px-3 pt-4">
            {loading && (
              <div className="flex flex-col -mx-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-[#f2f2f2]">
                    <div className="size-12 shrink-0 rounded-xl bg-[#f0f0f0] animate-pulse" />
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="h-3.5 w-3/4 bg-[#f0f0f0] rounded-lg animate-pulse" />
                      <div className="h-3 w-1/3 bg-[#f0f0f0] rounded-lg animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!loading && products.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Search className="size-12 text-[#1B4D91]/20 mb-4" />
                <p className="font-bold text-[#1B4D91]">{t("empty")}</p>
                <p className="mt-1 text-[13px] text-slate-400">{t("tryAnotherQuery")}</p>
              </div>
            )}
            {!loading && products.length > 0 && (
              <div className={`flex flex-col -mx-3 transition-opacity duration-200 ${isFetching ? "opacity-50" : "opacity-100"}`}>
                {products.map((p) => (
                  <Link
                    key={p.id}
                    href={p.slug ? `/product/${p.slug}` : `/product/${p.id}`}
                    className="flex items-center gap-3 px-4 py-3 border-b border-[#f2f2f2] active:bg-[#f9f9fb]"
                  >
                    <div className="size-12 shrink-0 rounded-xl overflow-hidden bg-[#f4f4f6] relative">
                      <Image src={resolveImageUrl(p.imageUrl)} alt={p.name} fill loading="lazy" className="object-cover" sizes="48px" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] text-[#242424] line-clamp-2 leading-snug">{p.name}</p>
                      <p className="text-[13px] font-bold text-[#242424] mt-0.5">{p.price.toLocaleString("ru-RU")} {"so'm"}</p>
                    </div>
                    <ChevronRight className="size-4 text-[#ccc] shrink-0" />
                  </Link>
                ))}
              </div>
            )}
            {meta && meta.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-3 pb-4">
                <button
                  disabled={page <= 1}
                  onClick={() => { onPageChange(page - 1); if (categoryListRef.current) categoryListRef.current.scrollTop = 0; }}
                  className={cn("flex size-11 items-center justify-center rounded-xl border-2 font-bold", page <= 1 ? "border-slate-100 text-slate-300" : "border-[#1B4D91]/20 text-[#1B4D91]")}
                >
                  <ChevronLeft className="size-5" />
                </button>
                <span className="rounded-xl border-2 border-[#1B4D91]/20 bg-white px-5 py-2 text-[13px] font-black text-[#1B4D91]">{page} / {meta.totalPages}</span>
                <button
                  disabled={page >= meta.totalPages}
                  onClick={() => { onPageChange(page + 1); if (categoryListRef.current) categoryListRef.current.scrollTop = 0; }}
                  className={cn("flex size-11 items-center justify-center rounded-xl border-2 font-bold", page >= meta.totalPages ? "border-slate-100 text-slate-300" : "border-[#1B4D91]/20 text-[#1B4D91]")}
                >
                  <ChevronRight className="size-5" />
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
