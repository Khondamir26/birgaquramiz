"use client";

import { useState, useCallback } from "react";
import { Search, X, SlidersHorizontal } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import CheckRow from "@/components/ui/CheckRow";
import type { CatalogFilters, CategoryOption, BrandOption } from "@/hooks/useCatalogData";

const NAV_TRIGGER_BASE =
  "h-9 min-h-0 px-3 rounded-xl text-[14px] leading-5 font-medium border-0 transition-colors whitespace-nowrap " +
  "bg-[#f1f1f5] text-[#242424] hover:bg-[#e8e8ee] hover:text-[#242424] " +
  "data-[state=open]:bg-[#e0e0ea] data-[state=open]:text-[#242424] " +
  "focus:bg-[#f1f1f5] focus:text-[#242424]";
const ACTIVE_PILL =
  "h-9 min-h-0 px-3 rounded-xl text-[14px] leading-5 font-semibold border-0 transition-colors whitespace-nowrap " +
  "bg-[#e8eefa] text-[#275fdb] hover:bg-[#dce6f8] " +
  "[&>svg:last-child]:hidden";

interface DesktopFilterToolbarProps {
  filters: CatalogFilters;
  onFiltersChange: (f: CatalogFilters) => void;
  availableCategories: CategoryOption[];
  availableBrands: BrandOption[];
  basePriceRange: { min: number; max: number };
  viewMode: "3col" | "4col";
  onViewModeChange: (mode: "3col" | "4col") => void;
  t: (key: string) => string;
  locale: string;
}

function fmtUZS(raw: string): string {
  const n = parseInt(raw.replace(/\D/g, ""), 10);
  return isNaN(n) ? "" : n.toLocaleString("ru-RU");
}

export default function DesktopFilterToolbar({
  filters, onFiltersChange,
  availableCategories, availableBrands,
  basePriceRange, viewMode, onViewModeChange,
  t, locale,
}: DesktopFilterToolbarProps) {
  const [openMenu, setOpenMenu] = useState("");
  const [catSearch, setCatSearch] = useState("");
  const [brandSearch, setBrandSearch] = useState("");
  const [priceMinDraft, setPriceMinDraft] = useState(filters.minPrice ? String(filters.minPrice) : "");
  const [priceMaxDraft, setPriceMaxDraft] = useState(filters.maxPrice ? String(filters.maxPrice) : "");

  const SORT_OPTIONS = [
    { key: "newest",     label: t("sortNewest") },
    { key: "price_asc",  label: t("sortPriceAsc") },
    { key: "price_desc", label: t("sortPriceDesc") },
  ];

  const currentSortLabel = SORT_OPTIONS.find(o => o.key === (filters.sortBy ?? "newest"))?.label ?? t("sortNewest");
  const hasPriceFilter = !!(filters.minPrice || filters.maxPrice);
  const hasActiveFilters = hasPriceFilter || !!filters.categoryId || !!filters.brandId;
  const selectedCategory = availableCategories.find(c => c.id === filters.categoryId) ?? null;
  const selectedBrand = availableBrands.find(b => b.id === filters.brandId) ?? null;

  const filteredCats = availableCategories.filter(c => {
    const name = (locale === "uz" ? c.nameUz : locale === "en" ? c.nameEn : null) || c.name;
    return name.toLowerCase().includes(catSearch.toLowerCase());
  });
  const filteredBrands = availableBrands.filter(b =>
    b.name.toLowerCase().includes(brandSearch.toLowerCase())
  );

  const clampMin = useCallback((rawMin: string, rawMax: string) => {
    const n = parseInt(rawMin, 10);
    if (isNaN(n)) return rawMin;
    const maxN = parseInt(rawMax, 10);
    let v = n;
    if (basePriceRange.min > 0 && v < basePriceRange.min) v = basePriceRange.min;
    if (basePriceRange.max > 0 && v > basePriceRange.max) v = basePriceRange.max;
    if (!isNaN(maxN) && v > maxN) v = maxN;
    return String(v);
  }, [basePriceRange.min, basePriceRange.max]);

  const clampMax = useCallback((rawMax: string, rawMin: string) => {
    const n = parseInt(rawMax, 10);
    if (isNaN(n)) return rawMax;
    const minN = parseInt(rawMin, 10);
    let v = n;
    if (basePriceRange.max > 0 && v > basePriceRange.max) v = basePriceRange.max;
    if (basePriceRange.min > 0 && v < basePriceRange.min) v = basePriceRange.min;
    if (!isNaN(minN) && v < minN) v = minN;
    return String(v);
  }, [basePriceRange.max, basePriceRange.min]);

  const handleFromBlur = useCallback(() => {
    if (!priceMinDraft) return;
    const clamped = clampMin(priceMinDraft, priceMaxDraft);
    setPriceMinDraft(clamped);
    onFiltersChange({ ...filters, minPrice: parseInt(clamped, 10) || undefined });
  }, [priceMinDraft, priceMaxDraft, clampMin, filters, onFiltersChange]);

  const handleToBlur = useCallback(() => {
    if (!priceMaxDraft) return;
    const clamped = clampMax(priceMaxDraft, priceMinDraft);
    setPriceMaxDraft(clamped);
    onFiltersChange({ ...filters, maxPrice: parseInt(clamped, 10) || undefined });
  }, [priceMaxDraft, priceMinDraft, clampMax, filters, onFiltersChange]);

  const applyPrice = useCallback(() => {
    const clampedMin = priceMinDraft ? clampMin(priceMinDraft, priceMaxDraft) : "";
    const clampedMax = priceMaxDraft ? clampMax(priceMaxDraft, priceMinDraft) : "";
    setPriceMinDraft(clampedMin);
    setPriceMaxDraft(clampedMax);
    onFiltersChange({
      ...filters,
      minPrice: clampedMin ? parseInt(clampedMin, 10) : undefined,
      maxPrice: clampedMax ? parseInt(clampedMax, 10) : undefined,
    });
  }, [priceMinDraft, priceMaxDraft, clampMin, clampMax, filters, onFiltersChange]);

  const resetAll = () => {
    onFiltersChange({ sortBy: "newest" });
    setPriceMinDraft(""); setPriceMaxDraft("");
    setCatSearch(""); setBrandSearch("");
  };

  const triggerCls = (active?: boolean) =>
    NAV_TRIGGER_BASE + (active ? " !bg-[#e8eefa] !text-[#275fdb] !font-semibold" : "");

  return (
    <div className="flex items-center gap-0 pb-3">
      <NavigationMenu viewport={false} value={openMenu} onValueChange={setOpenMenu} className="max-w-none justify-start h-9">
        <NavigationMenuList className="gap-2 justify-start flex-nowrap h-9">

          {/* Sort */}
          <NavigationMenuItem value="sort">
            <NavigationMenuTrigger className={triggerCls(filters.sortBy !== "newest" && !!filters.sortBy)}>
              <svg className="size-3.5 mr-1.5 text-[#888] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" d="M3 6h18M7 12h10M11 18h2" /></svg>
              {currentSortLabel}
            </NavigationMenuTrigger>
            <NavigationMenuContent className="z-50">
              <div className="w-[240px] py-2">
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => { onFiltersChange({ ...filters, sortBy: opt.key }); setOpenMenu(""); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-[14px] transition-colors hover:bg-[#f5f5f5] ${(filters.sortBy ?? "newest") === opt.key ? "text-[#275fdb] font-semibold" : "text-[#1c1c1c]"}`}
                  >
                    <span className={`size-4 rounded-full border-2 flex items-center justify-center shrink-0 ${(filters.sortBy ?? "newest") === opt.key ? "border-[#275fdb]" : "border-[#ccc]"}`}>
                      {(filters.sortBy ?? "newest") === opt.key && <span className="size-2 rounded-full bg-[#275fdb]" />}
                    </span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>

          {/* All Filters — Sheet */}
          <NavigationMenuItem>
            <Sheet>
              <SheetTrigger asChild>
                <div className="relative inline-flex">
                  <button className={`${triggerCls(hasActiveFilters)} flex items-center gap-1.5`}>
                    <SlidersHorizontal className="size-3.5 text-[#888]" />
                    {t("filters")}
                  </button>
                  {hasActiveFilters && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-[#FF6900] text-white rounded-full text-[11px] font-bold flex items-center justify-center px-1 leading-none pointer-events-none">
                      {(hasPriceFilter ? 1 : 0) + ((filters.sortBy && filters.sortBy !== "newest") ? 1 : 0)}
                    </span>
                  )}
                </div>
              </SheetTrigger>
              <SheetContent side="right" className="w-full max-w-[400px] p-0 gap-0 flex flex-col bg-[#f2f2f5]" showCloseButton={false}>
                <SheetHeader className="bg-white flex-row items-center justify-between px-5 py-[18px] gap-0 shrink-0 border-b border-[#e8e8e8]">
                  <SheetTitle className="text-[18px] font-bold text-[#1c1c1c]">{t("filters")}</SheetTitle>
                  <SheetTrigger asChild>
                    <button className="min-h-0 size-8 flex items-center justify-center rounded-full hover:bg-[#f5f5f5] transition-colors">
                      <X className="size-[18px] text-[#555]" />
                    </button>
                  </SheetTrigger>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
                  <div className="bg-white rounded-2xl overflow-hidden">
                    <div className="px-4 pt-4 pb-3">
                      <h3 className="text-[15px] font-bold text-[#1c1c1c] mb-3">{t("priceFilter")}</h3>
                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <span className="text-[12px] text-[#999] mb-1.5 block">{t("from")}</span>
                          <input type="text" inputMode="numeric" value={fmtUZS(priceMinDraft)} onChange={e => setPriceMinDraft(e.target.value.replace(/\D/g, ""))} onBlur={handleFromBlur} placeholder={basePriceRange.min > 0 ? fmtUZS(String(basePriceRange.min)) : "0"} className="w-full px-3 py-2.5 bg-[#f2f2f5] rounded-xl text-[15px] font-semibold text-[#1c1c1c] outline-none border-0 placeholder:text-[#bbb] placeholder:font-normal" />
                        </div>
                        <div className="w-4 h-[1.5px] bg-[#ccc] shrink-0 rounded-full mb-[14px]" />
                        <div className="flex-1">
                          <span className="text-[12px] text-[#999] mb-1.5 block">{t("to")}</span>
                          <input type="text" inputMode="numeric" value={fmtUZS(priceMaxDraft)} onChange={e => setPriceMaxDraft(e.target.value.replace(/\D/g, ""))} onBlur={handleToBlur} placeholder={basePriceRange.max > 0 ? fmtUZS(String(basePriceRange.max)) : "∞"} className="w-full px-3 py-2.5 bg-[#f2f2f5] rounded-xl text-[15px] font-semibold text-[#1c1c1c] outline-none border-0 placeholder:text-[#bbb] placeholder:font-normal" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl overflow-hidden">
                    <div className="px-4 pt-4 pb-3">
                      <h3 className="text-[15px] font-bold text-[#1c1c1c] mb-2">{t("sortBy")}</h3>
                      {SORT_OPTIONS.map(opt => (
                        <button key={opt.key} onClick={() => onFiltersChange({ ...filters, sortBy: opt.key })} className={`w-full flex items-center gap-3 py-3 text-[14px] transition-colors border-b border-[#f0f0f0] last:border-0 ${(filters.sortBy ?? "newest") === opt.key ? "text-[#275fdb] font-semibold" : "text-[#1c1c1c]"}`}>
                          <span className={`size-4 rounded-full border-2 flex items-center justify-center shrink-0 ${(filters.sortBy ?? "newest") === opt.key ? "border-[#275fdb]" : "border-[#ccc]"}`}>
                            {(filters.sortBy ?? "newest") === opt.key && <span className="size-2 rounded-full bg-[#275fdb]" />}
                          </span>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="px-4 pt-3 pb-5 bg-white border-t border-[#ebebeb] shrink-0">
                  <div className="flex gap-2.5">
                    <button onClick={resetAll} className="flex-1 py-3 rounded-2xl border-[1.5px] border-[#e0e0e0] bg-white text-[14px] font-semibold text-[#444] transition-colors hover:bg-[#f5f5f5]">{t("reset")}</button>
                    <SheetTrigger asChild>
                      <button onClick={applyPrice} className="flex-1 py-3 rounded-2xl bg-[#275fdb] text-white text-[14px] font-semibold transition-colors hover:bg-[#1a4fc4]">{t("show")}</button>
                    </SheetTrigger>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </NavigationMenuItem>

          {/* Category */}
          <NavigationMenuItem value="category">
            <NavigationMenuTrigger className={filters.categoryId ? ACTIVE_PILL : triggerCls(false)}>
              {filters.categoryId ? (
                <>
                  {selectedCategory ? ((locale === "uz" ? selectedCategory.nameUz : locale === "en" ? selectedCategory.nameEn : null) || selectedCategory.name) : t("category")}
                  <span onClick={e => { e.preventDefault(); e.stopPropagation(); onFiltersChange({ ...filters, categoryId: undefined }); setCatSearch(""); }} className="ml-1.5 inline-flex items-center opacity-70 hover:opacity-100"><X className="size-3" /></span>
                </>
              ) : t("category")}
            </NavigationMenuTrigger>
            <NavigationMenuContent className="z-50">
              <div className="w-[280px] flex flex-col">
                <div className="p-3 pb-0">
                  <div className="relative mb-2">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[#aaa]" />
                    <input value={catSearch} onChange={e => setCatSearch(e.target.value)} placeholder={t("searchPlaceholder")} className="w-full pl-8 pr-3 py-2 border border-[#e0e0e0] rounded-2xl text-[13px] outline-none focus:border-[#275fdb]" />
                  </div>
                  <div className="max-h-[240px] overflow-y-auto">
                    {filteredCats.map(cat => (
                      <CheckRow
                        key={cat.id}
                        label={(locale === "uz" ? cat.nameUz : locale === "en" ? cat.nameEn : null) || cat.name}
                        checked={filters.categoryId === cat.id}
                        onChange={() => { onFiltersChange({ ...filters, categoryId: filters.categoryId === cat.id ? undefined : cat.id }); setOpenMenu(""); }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2.5 px-3 py-3 border-t border-[#f0f0f0] mt-2">
                  <button onClick={() => { onFiltersChange({ ...filters, categoryId: undefined }); setCatSearch(""); }} className="flex-1 py-2.5 rounded-2xl border-[1.5px] border-[#e0e0e0] bg-white text-[13px] font-semibold text-[#444] transition-colors hover:bg-[#f5f5f5]">{t("reset")}</button>
                  <button onClick={() => setOpenMenu("")} className="flex-1 py-2.5 rounded-2xl bg-[#275fdb] border-[1.5px] border-[#275fdb] text-white text-[13px] font-semibold transition-colors hover:bg-[#1a4fc4]">{t("done")}</button>
                </div>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>

          {/* Price */}
          <NavigationMenuItem value="price">
            <NavigationMenuTrigger className={hasPriceFilter ? ACTIVE_PILL : triggerCls(false)}>
              {hasPriceFilter ? (
                <>
                  {t("priceFilter")}
                  <span onClick={e => { e.preventDefault(); e.stopPropagation(); onFiltersChange({ ...filters, minPrice: undefined, maxPrice: undefined }); setPriceMinDraft(""); setPriceMaxDraft(""); }} className="ml-1.5 inline-flex items-center opacity-70 hover:opacity-100"><X className="size-3" /></span>
                </>
              ) : t("priceFilter")}
            </NavigationMenuTrigger>
            <NavigationMenuContent className="z-50">
              <div className="w-[280px] flex flex-col">
                <div className="p-4 pb-3">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-[11px] text-[#888] mb-1 block">{t("from")}</label>
                      <input type="text" inputMode="numeric" value={fmtUZS(priceMinDraft)} onChange={e => setPriceMinDraft(e.target.value.replace(/\D/g, ""))} onBlur={handleFromBlur} onClick={e => e.stopPropagation()} placeholder={basePriceRange.min > 0 ? fmtUZS(String(basePriceRange.min)) : "0"} className="w-full px-2.5 py-2.5 border border-[#e0e0e0] rounded-2xl text-[13px] outline-none focus:border-[#275fdb] bg-[#fafafa]" />
                    </div>
                    <div className="flex-1">
                      <label className="text-[11px] text-[#888] mb-1 block">{t("to")}</label>
                      <input type="text" inputMode="numeric" value={fmtUZS(priceMaxDraft)} onChange={e => setPriceMaxDraft(e.target.value.replace(/\D/g, ""))} onBlur={handleToBlur} onClick={e => e.stopPropagation()} placeholder={basePriceRange.max > 0 ? fmtUZS(String(basePriceRange.max)) : "∞"} className="w-full px-2.5 py-2.5 border border-[#e0e0e0] rounded-2xl text-[13px] outline-none focus:border-[#275fdb] bg-[#fafafa]" />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2.5 px-4 pb-4 pt-3 border-t border-[#f0f0f0]">
                  <button onClick={() => { applyPrice(); setOpenMenu(""); }} className="flex-1 py-2.5 rounded-2xl bg-[#275fdb] border-[1.5px] border-[#275fdb] text-white text-[13px] font-semibold transition-colors hover:bg-[#1a4fc4]">{t("done")}</button>
                </div>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>

          {/* Brand */}
          <NavigationMenuItem value="brand">
            <NavigationMenuTrigger className={filters.brandId ? ACTIVE_PILL : triggerCls(false)}>
              {filters.brandId ? (
                <>
                  {selectedBrand?.name ?? t("brand")}
                  <span onClick={e => { e.preventDefault(); e.stopPropagation(); onFiltersChange({ ...filters, brandId: undefined }); setBrandSearch(""); }} className="ml-1.5 inline-flex items-center opacity-70 hover:opacity-100"><X className="size-3" /></span>
                </>
              ) : t("brand")}
            </NavigationMenuTrigger>
            <NavigationMenuContent className="z-50">
              <div className="w-[280px] flex flex-col">
                <div className="p-3 pb-0">
                  <div className="relative mb-2">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[#aaa]" />
                    <input value={brandSearch} onChange={e => setBrandSearch(e.target.value)} placeholder={t("searchPlaceholder")} className="w-full pl-8 pr-3 py-2 border border-[#e0e0e0] rounded-2xl text-[13px] outline-none focus:border-[#275fdb]" />
                  </div>
                  <div className="max-h-[240px] overflow-y-auto">
                    {filteredBrands.map(brand => (
                      <CheckRow
                        key={brand.id}
                        label={brand.name}
                        checked={filters.brandId === brand.id}
                        onChange={() => { onFiltersChange({ ...filters, brandId: filters.brandId === brand.id ? undefined : brand.id }); setOpenMenu(""); }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2.5 px-3 py-3 border-t border-[#f0f0f0] mt-2">
                  <button onClick={() => { onFiltersChange({ ...filters, brandId: undefined }); setBrandSearch(""); }} className="flex-1 py-2.5 rounded-2xl border-[1.5px] border-[#e0e0e0] bg-white text-[13px] font-semibold text-[#444] transition-colors hover:bg-[#f5f5f5]">{t("reset")}</button>
                  <button onClick={() => setOpenMenu("")} className="flex-1 py-2.5 rounded-2xl bg-[#275fdb] border-[1.5px] border-[#275fdb] text-white text-[13px] font-semibold transition-colors hover:bg-[#1a4fc4]">{t("done")}</button>
                </div>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>

          {/* Reset all */}
          {hasActiveFilters && (
            <NavigationMenuItem>
              <button
                onClick={resetAll}
                className="h-9 min-h-0 px-3 rounded-xl text-[14px] leading-5 font-medium whitespace-nowrap text-[#888] hover:text-[#E31E24] transition-colors"
              >
                {t("resetFilters")}
              </button>
            </NavigationMenuItem>
          )}

        </NavigationMenuList>
      </NavigationMenu>

      {/* Grid toggle */}
      <div className="flex items-center gap-1 ml-auto shrink-0">
        <button onClick={() => onViewModeChange("3col")} className={`p-1.5 min-h-0 rounded-md transition-colors cursor-pointer ${viewMode === "3col" ? "text-[#1B4D91]" : "text-[#bbb] hover:text-[#555]"}`}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M0 12.727c0-1.004.814-1.818 1.818-1.818h5.455c1.004 0 1.818.814 1.818 1.818v5.455A1.818 1.818 0 0 1 7.273 20H1.818A1.818 1.818 0 0 1 0 18.182v-5.455Zm6.364 0a.91.91 0 0 1 .909.91v3.636a.91.91 0 0 1-.91.909H2.728a.91.91 0 0 1-.909-.91v-3.636a.91.91 0 0 1 .91-.909h3.636ZM0 1.818C0 .814.814 0 1.818 0h5.455C8.277 0 9.09.814 9.09 1.818v5.455A1.818 1.818 0 0 1 7.273 9.09H1.818A1.818 1.818 0 0 1 0 7.273V1.818Zm6.364 0a.91.91 0 0 1 .909.91v3.636a.91.91 0 0 1-.91.909H2.728a.91.91 0 0 1-.909-.91V2.728a.91.91 0 0 1 .91-.909h3.636ZM12.727 0a1.818 1.818 0 0 0-1.818 1.818v5.455c0 1.004.814 1.818 1.818 1.818h5.455A1.818 1.818 0 0 0 20 7.273V1.818A1.818 1.818 0 0 0 18.182 0h-5.455Zm5.455 2.727a.91.91 0 0 0-.91-.909h-3.636a.91.91 0 0 0-.909.91v3.636c0 .502.407.909.91.909h3.636a.91.91 0 0 0 .909-.91V2.728ZM10.91 12.727c0-1.004.813-1.818 1.817-1.818h5.455c1.004 0 1.818.814 1.818 1.818v5.455A1.818 1.818 0 0 1 18.182 20h-5.455a1.818 1.818 0 0 1-1.818-1.818v-5.455Zm6.363 0a.91.91 0 0 1 .909.91v3.636a.91.91 0 0 1-.91.909h-3.636a.91.91 0 0 1-.909-.91v-3.636a.91.91 0 0 1 .91-.909h3.636Z" fill="currentColor" /></svg>
        </button>
        <button onClick={() => onViewModeChange("4col")} className={`p-1.5 min-h-0 rounded-md transition-colors cursor-pointer ${viewMode === "4col" ? "text-[#1B4D91]" : "text-[#bbb] hover:text-[#555]"}`}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M15.9 1.5a.4.4 0 0 0-.4.4v2.2c0 .22.18.4.4.4h2.2a.4.4 0 0 0 .4-.4V1.9a.4.4 0 0 0-.4-.4h-2.2ZM15 0a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V1a1 1 0 0 0-1-1h-4ZM15.9 8.5a.4.4 0 0 0-.4.4v2.2c0 .22.18.4.4.4h2.2a.4.4 0 0 0 .4-.4V8.9a.4.4 0 0 0-.4-.4h-2.2ZM15 7a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-4ZM15.9 15.5a.4.4 0 0 0-.4.4v2.2c0 .22.18.4.4.4h2.2a.4.4 0 0 0 .4-.4v-2.2a.4.4 0 0 0-.4-.4h-2.2ZM15 14a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1h-4ZM8.9 15.5a.4.4 0 0 0-.4.4v2.2c0 .22.18.4.4.4h2.2a.4.4 0 0 0 .4-.4v-2.2a.4.4 0 0 0-.4-.4H8.9ZM8 14a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1H8ZM1.9 15.5a.4.4 0 0 0-.4.4v2.2c0 .22.18.4.4.4h2.2a.4.4 0 0 0 .4-.4v-2.2a.4.4 0 0 0-.4-.4H1.9ZM1 14a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1H1ZM1.9 8.5a.4.4 0 0 0-.4.4v2.2c0 .22.18.4.4.4h2.2a.4.4 0 0 0 .4-.4V8.9a.4.4 0 0 0-.4-.4H1.9ZM1 7a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1H1ZM8.9 8.5a.4.4 0 0 0-.4.4v2.2c0 .22.18.4.4.4h2.2a.4.4 0 0 0 .4-.4V8.9a.4.4 0 0 0-.4-.4H8.9ZM8 7a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1H8ZM8.9 1.5a.4.4 0 0 0-.4.4v2.2c0 .22.18.4.4.4h2.2a.4.4 0 0 0 .4-.4V1.9a.4.4 0 0 0-.4-.4H8.9ZM8 0a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V1a1 1 0 0 0-1-1H8ZM1.9 1.5a.4.4 0 0 0-.4.4v2.2c0 .22.18.4.4.4h2.2a.4.4 0 0 0 .4-.4V1.9a.4.4 0 0 0-.4-.4H1.9ZM1 0a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V1a1 1 0 0 0-1-1H1Z" fill="currentColor" /></svg>
        </button>
      </div>
    </div>
  );
}
