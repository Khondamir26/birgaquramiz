"use client";

import { useEffect, useState, useMemo, useCallback, useRef, startTransition } from "react";
import { useSearchParams } from "next/navigation";
import { Search, ChevronLeft, ChevronRight, X,
  Hammer, Wrench, Flame, Zap, Droplets, Wind,
  Building2, Package, Settings2, Paintbrush, TreePine,
  Grid3x3, DoorOpen, Layers, FlaskConical, Waves,
  ShieldAlert, Cog, LayoutGrid, ThermometerSun,
  Boxes, Drill, Cable, Warehouse, HardHat,
  SlidersHorizontal,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { getProducts, getCategories } from "@/lib/api/products";
import { expandSearchQuery } from "@/lib/search";
import ProductCard from "@/components/product/ProductCard";
import { resolveImageUrl } from "@/lib/image";
import type { PaginatedResponse, Product, Category } from "@/types";
import { useTranslations, useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { getCategoryName } from "@/lib/categoryName";
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

const NAV_TRIGGER_BASE =
  "h-9 min-h-0 px-3 rounded-xl text-[14px] leading-5 font-medium border-0 transition-colors whitespace-nowrap " +
  "bg-[#f1f1f5] text-[#242424] hover:bg-[#e8e8ee] hover:text-[#242424] " +
  "data-[state=open]:bg-[#e0e0ea] data-[state=open]:text-[#242424] " +
  "focus:bg-[#f1f1f5] focus:text-[#242424]";
const ACTIVE_PILL =
  "h-9 min-h-0 px-3 rounded-xl text-[14px] leading-5 font-semibold border-0 transition-colors whitespace-nowrap " +
  "bg-[#e8eefa] text-[#275fdb] hover:bg-[#dce6f8] " +
  "[&>svg:last-child]:hidden";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  MIX: FlaskConical, ROF: Warehouse, INS: ThermometerSun, DRW: Layers,
  PNT: Paintbrush, MTL: Settings2, FAS: Wrench, TOL: Hammer,
  PLM: Droplets, ELC: Zap, BLK: Building2, FLR: LayoutGrid,
  WOD: TreePine, VNT: Wind, DOR: DoorOpen, RPR: Package,
  MSH: Grid3x3, HTG: Flame, FPR: ShieldAlert, PMP: Waves,
  FIN: Drill, MCH: Cog, DRN: Boxes, GEN: HardHat, DEFAULT: Cable,
};

function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center justify-between py-3 cursor-pointer select-none group border-b border-[#f0f0f0] last:border-0">
      <span className={`text-[14px] leading-5 transition-colors ${checked ? "text-[#275fdb] font-semibold" : "text-[#1c1c1c] font-normal"}`}>{label}</span>
      <span className={`shrink-0 size-[22px] rounded-[5px] border-[1.5px] flex items-center justify-center transition-all ml-4 ${checked ? "bg-[#275fdb] border-[#275fdb]" : "bg-white border-[#c8c8c8] group-hover:border-[#275fdb]"}`}>
        {checked && <svg viewBox="0 0 10 8" fill="none" className="w-[11px] h-[9px]"><path d="M1 3.5l2.8 2.8L9 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>}
      </span>
      <input type="checkbox" checked={checked} onChange={onChange} onClick={e => e.stopPropagation()} className="sr-only" />
    </label>
  );
}

export default function CatalogPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState(""); // immediate — bound to input
  const [search, setSearch] = useState("");            // debounced — triggers API
  const [data, setData] = useState<PaginatedResponse<Product> | null>(null);
  const [desktopProducts, setDesktopProducts] = useState<Product[]>([]); // accumulated for desktop load-more
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false); // subtle re-fetch indicator (no skeleton flash)
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const categoryListRef = useRef<HTMLDivElement>(null);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [availableCategories, setAvailableCategories] = useState<Array<{ id: string; name: string; nameEn?: string | null; nameUz?: string | null }>>([]);
  const [availableBrands, setAvailableBrands] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedParent, setSelectedParent] = useState<Category | null>(null);
  const [isMobileSearchActive, setIsMobileSearchActive] = useState(false);
  const [filters, setFilters] = useState<{ minPrice?: number; maxPrice?: number; sortBy?: string; categoryId?: string; brandId?: string }>({ sortBy: "newest" });
  const [catSearch, setCatSearch] = useState("");
  const [brandSearch, setBrandSearch] = useState("");

  // Desktop filter toolbar state
  const [openMenu, setOpenMenu] = useState("");
  const [viewMode, setViewMode] = useState<"3col" | "4col">("4col");
  const [priceMinDraft, setPriceMinDraft] = useState(filters.minPrice ? String(filters.minPrice) : "");
  const [priceMaxDraft, setPriceMaxDraft] = useState(filters.maxPrice ? String(filters.maxPrice) : "");
  const [basePriceRange, setBasePriceRange] = useState({ min: 0, max: 0 });

  const t = useTranslations("Catalog");
  const tNav = useTranslations("Navbar");
  const locale = useLocale();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const searchParams = useSearchParams();
  const q = searchParams.get("q");

  useEffect(() => {
    if (q) {
      setSearchInput(q);
      startTransition(() => { setSearch(q); setPage(1); });
    }
  }, [q]);

  useEffect(() => {
    getCategories().then(setAllCategories).catch(() => {});
  }, []);

  // Reset category list scroll position instantly when drilling in/out
  useEffect(() => {
    if (categoryListRef.current) categoryListRef.current.scrollTop = 0;
  }, [selectedParent]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // page=1 → fresh load (skeletons); page>1 → load more (spinner on button)
      if (page === 1) { if (!data) setLoading(true); else setIsFetching(true); }
      else setIsLoadingMore(true);

      const expandedSearch = expandSearchQuery(search);
      try {
        const res = await getProducts(page, 20, expandedSearch, filters.categoryId, filters.minPrice, filters.maxPrice, filters.sortBy, filters.brandId);
        if (!cancelled) {
          setError("");
          setData(res);
          // Accumulate for desktop: replace on page=1, append on load-more
          setDesktopProducts(prev => page === 1 ? res.data : [...prev, ...res.data]);
          // Derive available categories/brands and price range from unfiltered results
          if (!filters.categoryId && !filters.brandId && !filters.minPrice && !filters.maxPrice && res.data.length > 0) {
            const prices = res.data.map((p: { price: number }) => p.price);
            setBasePriceRange({ min: Math.min(...prices), max: Math.max(...prices) });

            const catMap = new Map<string, { id: string; name: string; nameEn?: string | null; nameUz?: string | null }>();
            const brandMap = new Map<string, { id: string; name: string }>();
            for (const p of res.data) {
              if (p.category) catMap.set(p.category.id, { id: p.category.id, name: p.category.name, nameEn: p.category.nameEn, nameUz: p.category.nameUz });
              if (p.brand) brandMap.set(p.brand.id, { id: p.brand.id, name: p.brand.name });
            }
            setAvailableCategories(Array.from(catMap.values()));
            setAvailableBrands(Array.from(brandMap.values()));
          }
        }
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : t("loadFailed"));
      } finally {
        if (!cancelled) { setLoading(false); setIsFetching(false); setIsLoadingMore(false); }
      }
    }

    void load();

    return () => { cancelled = true; };
  }, [page, search, filters, t]); // eslint-disable-line react-hooks/exhaustive-deps

  const products = useMemo(() => data?.data ?? [], [data]);


  const breadcrumbItems = useMemo(() => [
    { label: tNav("home"), href: "/" },
    { label: tNav("catalog") },
  ], [tNav]);

  const meta = data?.meta;

  const parentCategories = useMemo(() => allCategories.filter(c => !c.parentId), [allCategories]);
  const subcategories = useMemo(() => allCategories.filter(c => c.parentId === selectedParent?.id), [allCategories, selectedParent]);

  const handleBackToCategories = useCallback(() => {
    setIsMobileSearchActive(false);
    setSearchInput("");
    setSearch("");
    clearTimeout(debounceRef.current);
  }, []);

  // Desktop filter toolbar constants
  const triggerCls = (active?: boolean) =>
    NAV_TRIGGER_BASE + (active ? " !bg-[#e8eefa] !text-[#275fdb] !font-semibold" : "");

  const SORT_OPTIONS = useMemo(() => [
    { key: "newest",     label: t("sortNewest") },
    { key: "price_asc",  label: t("sortPriceAsc") },
    { key: "price_desc", label: t("sortPriceDesc") },
  ], [t]);
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

  const fmtUZS = (raw: string) => {
    const n = parseInt(raw.replace(/\D/g, ""), 10);
    return isNaN(n) ? "" : n.toLocaleString("ru-RU");
  };

  // Full sellers-style clamping: floor + ceiling + cross-check
  const clampMin = useCallback((rawMin: string, rawMax: string) => {
    const n = parseInt(rawMin, 10);
    if (isNaN(n)) return rawMin;
    const maxN = parseInt(rawMax, 10);
    let v = n;
    if (basePriceRange.min > 0 && v < basePriceRange.min) v = basePriceRange.min; // below floor → snap up
    if (basePriceRange.max > 0 && v > basePriceRange.max) v = basePriceRange.max; // above ceiling → snap down
    if (!isNaN(maxN) && v > maxN) v = maxN;                                        // above To → snap down to To
    return String(v);
  }, [basePriceRange.min, basePriceRange.max]);

  const clampMax = useCallback((rawMax: string, rawMin: string) => {
    const n = parseInt(rawMax, 10);
    if (isNaN(n)) return rawMax;
    const minN = parseInt(rawMin, 10);
    let v = n;
    if (basePriceRange.max > 0 && v > basePriceRange.max) v = basePriceRange.max; // above ceiling → snap down
    if (basePriceRange.min > 0 && v < basePriceRange.min) v = basePriceRange.min; // below floor → snap up
    if (!isNaN(minN) && v < minN) v = minN;                                        // below From → snap up to From
    return String(v);
  }, [basePriceRange.max, basePriceRange.min]);

  const handleFromBlur = useCallback(() => {
    if (!priceMinDraft) return;
    const clamped = clampMin(priceMinDraft, priceMaxDraft);
    setPriceMinDraft(clamped);
    setFilters(f => ({ ...f, minPrice: parseInt(clamped, 10) || undefined }));
    setPage(1);
  }, [priceMinDraft, priceMaxDraft, clampMin]);

  const handleToBlur = useCallback(() => {
    if (!priceMaxDraft) return;
    const clamped = clampMax(priceMaxDraft, priceMinDraft);
    setPriceMaxDraft(clamped);
    setFilters(f => ({ ...f, maxPrice: parseInt(clamped, 10) || undefined }));
    setPage(1);
  }, [priceMaxDraft, priceMinDraft, clampMax]);

  const applyPrice = useCallback(() => {
    const clampedMin = priceMinDraft ? clampMin(priceMinDraft, priceMaxDraft) : "";
    const clampedMax = priceMaxDraft ? clampMax(priceMaxDraft, priceMinDraft) : "";
    setPriceMinDraft(clampedMin);
    setPriceMaxDraft(clampedMax);
    const min = clampedMin ? parseInt(clampedMin, 10) : undefined;
    const max = clampedMax ? parseInt(clampedMax, 10) : undefined;
    setFilters(f => ({ ...f, minPrice: min, maxPrice: max }));
    setPage(1);
  }, [priceMinDraft, priceMaxDraft, clampMin, clampMax]);

  return (
    <div className="flex flex-col min-h-screen bg-white lg:bg-[#f4f6fa] lg:pb-12">

      {/* ── MOBILE: WB-style catalog ── */}
      {!isDesktop && (
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
                      setSearch(val);
                      setPage(1);
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

          {/* Scrollable content — owns its own scroll, never bounces the page */}
          <div ref={categoryListRef} className="flex-1 overflow-y-auto pb-20">

          {/* Category navigation — no URL change until final click */}
          {!isMobileSearchActive && (
            <div className="flex flex-col">
              {/* Level 1: subcategories of selected parent */}
              {selectedParent ? (
                <>
                  {/* Back header */}
                  <button
                    onClick={() => setSelectedParent(null)}
                    className="flex items-center gap-2 px-4 py-3.5 border-b border-[#f2f2f2] font-bold text-[15px] text-[#242424]"
                  >
                    <ChevronLeft className="size-5 text-[#242424]" />
                    {getCategoryName(selectedParent, locale)}
                  </button>
                  {/* Subcategory rows — these DO navigate */}
                  {subcategories.map((sub) => (
                    <Link
                      key={sub.id}
                      href={`/catalog/category/${sub.slug ?? sub.id}`}
                      className="flex items-center gap-3 px-4 py-3.5 border-b border-[#f2f2f2] active:bg-[#f9f9fb]"
                    >
                      <span className="flex-1 text-[15px] text-[#242424]">
                        {getCategoryName(sub, locale)}
                      </span>
                      <ChevronRight className="size-4 text-[#ccc] shrink-0" />
                    </Link>
                  ))}
                </>
              ) : (
                /* Level 0: parent categories — no navigation, just drill down */
                parentCategories.map((cat) => {
                  const Icon = CATEGORY_ICONS[cat.code] ?? CATEGORY_ICONS.DEFAULT;
                  const hasChildren = allCategories.some(c => c.parentId === cat.id);
                  return hasChildren ? (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedParent(cat)}
                      className="flex items-center gap-3 px-4 py-3.5 border-b border-[#f2f2f2] active:bg-[#f9f9fb] w-full text-left"
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center text-[#555]">
                        <Icon className="size-5" />
                      </span>
                      <span className="flex-1 text-[15px] text-[#242424]">
                        {getCategoryName(cat, locale)}
                      </span>
                      <ChevronRight className="size-4 text-[#ccc] shrink-0" />
                    </button>
                  ) : (
                    <Link
                      key={cat.id}
                      href={`/catalog/category/${cat.slug ?? cat.id}`}
                      className="flex items-center gap-3 px-4 py-3.5 border-b border-[#f2f2f2] active:bg-[#f9f9fb]"
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center text-[#555]">
                        <Icon className="size-5" />
                      </span>
                      <span className="flex-1 text-[15px] text-[#242424]">
                        {getCategoryName(cat, locale)}
                      </span>
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
                      href={p.slug ? `/product/${p.slug}` : `/catalog/product/${p.id}`}
                      className="flex items-center gap-3 px-4 py-3 border-b border-[#f2f2f2] active:bg-[#f9f9fb]"
                    >
                      <div className="size-12 shrink-0 rounded-xl overflow-hidden bg-[#f4f4f6]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={resolveImageUrl(p.imageUrl)} alt={p.name} className="w-full h-full object-cover" />
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
                  <button disabled={page <= 1} onClick={() => { setPage((p) => p - 1); if (categoryListRef.current) categoryListRef.current.scrollTop = 0; }}
                    className={cn("flex size-10 items-center justify-center rounded-xl border-2 font-bold", page <= 1 ? "border-slate-100 text-slate-300" : "border-[#1B4D91]/20 text-[#1B4D91]")}>
                    <ChevronLeft className="size-5" />
                  </button>
                  <span className="rounded-xl border-2 border-[#1B4D91]/20 bg-white px-5 py-2 text-[13px] font-black text-[#1B4D91]">{page} / {meta.totalPages}</span>
                  <button disabled={page >= meta.totalPages} onClick={() => { setPage((p) => p + 1); if (categoryListRef.current) categoryListRef.current.scrollTop = 0; }}
                    className={cn("flex size-10 items-center justify-center rounded-xl border-2 font-bold", page >= meta.totalPages ? "border-slate-100 text-slate-300" : "border-[#1B4D91]/20 text-[#1B4D91]")}>
                    <ChevronRight className="size-5" />
                  </button>
                </div>
              )}
            </div>
          )}

          </div>{/* end scrollable content */}
        </div>
      )}

      {/* ── DESKTOP: filter toolbar + products ── */}
      {isDesktop && (
        <div className="mx-auto w-full max-w-[1488px]">
          <div className="px-6 pt-5">
            <Breadcrumbs items={breadcrumbItems} />
          </div>

          <div className="px-6 pt-4 pb-12">
            {/* ── Filter toolbar ── */}
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
                            onClick={() => { setFilters(f => ({ ...f, sortBy: opt.key })); setPage(1); setOpenMenu(""); }}
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

                  {/* All Filters — Sheet trigger pill */}
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
                                <button key={opt.key} onClick={() => { setFilters(f => ({ ...f, sortBy: opt.key })); setPage(1); }} className={`w-full flex items-center gap-3 py-3 text-[14px] transition-colors border-b border-[#f0f0f0] last:border-0 ${(filters.sortBy ?? "newest") === opt.key ? "text-[#275fdb] font-semibold" : "text-[#1c1c1c]"}`}>
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
                            <button onClick={() => { setFilters({ sortBy: "newest" }); setPriceMinDraft(""); setPriceMaxDraft(""); setCatSearch(""); setBrandSearch(""); setPage(1); }} className="flex-1 py-3 rounded-2xl border-[1.5px] border-[#e0e0e0] bg-white text-[14px] font-semibold text-[#444] transition-colors hover:bg-[#f5f5f5]">{t("reset")}</button>
                            <SheetTrigger asChild>
                              <button onClick={() => applyPrice()} className="flex-1 py-3 rounded-2xl bg-[#275fdb] text-white text-[14px] font-semibold transition-colors hover:bg-[#1a4fc4]">{t("show")}</button>
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
                        <>{selectedCategory ? ((locale === "uz" ? selectedCategory.nameUz : locale === "en" ? selectedCategory.nameEn : null) || selectedCategory.name) : t("category")}<span onClick={e => { e.preventDefault(); e.stopPropagation(); setFilters(f => ({ ...f, categoryId: undefined })); setCatSearch(""); setPage(1); }} className="ml-1.5 inline-flex items-center opacity-70 hover:opacity-100"><X className="size-3" /></span></>
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
                                onChange={() => { setFilters(f => ({ ...f, categoryId: f.categoryId === cat.id ? undefined : cat.id })); setPage(1); setOpenMenu(""); }}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2.5 px-3 py-3 border-t border-[#f0f0f0] mt-2">
                          <button onClick={() => { setFilters(f => ({ ...f, categoryId: undefined })); setCatSearch(""); setPage(1); }} className="flex-1 py-2.5 rounded-2xl border-[1.5px] border-[#e0e0e0] bg-white text-[13px] font-semibold text-[#444] transition-colors hover:bg-[#f5f5f5]">{t("reset")}</button>
                          <button onClick={() => setOpenMenu("")} className="flex-1 py-2.5 rounded-2xl bg-[#275fdb] border-[1.5px] border-[#275fdb] text-white text-[13px] font-semibold transition-colors hover:bg-[#1a4fc4]">{t("done")}</button>
                        </div>
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>

                  {/* Price */}
                  <NavigationMenuItem value="price">
                    <NavigationMenuTrigger className={hasPriceFilter ? ACTIVE_PILL : triggerCls(false)}>
                      {hasPriceFilter ? (
                        <>{t("priceFilter")}<span onClick={e => { e.preventDefault(); e.stopPropagation(); setFilters(f => ({ ...f, minPrice: undefined, maxPrice: undefined })); setPriceMinDraft(""); setPriceMaxDraft(""); setPage(1); }} className="ml-1.5 inline-flex items-center opacity-70 hover:opacity-100"><X className="size-3" /></span></>
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
                        <>{selectedBrand?.name ?? t("brand")}<span onClick={e => { e.preventDefault(); e.stopPropagation(); setFilters(f => ({ ...f, brandId: undefined })); setBrandSearch(""); setPage(1); }} className="ml-1.5 inline-flex items-center opacity-70 hover:opacity-100"><X className="size-3" /></span></>
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
                                onChange={() => { setFilters(f => ({ ...f, brandId: f.brandId === brand.id ? undefined : brand.id })); setPage(1); setOpenMenu(""); }}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2.5 px-3 py-3 border-t border-[#f0f0f0] mt-2">
                          <button onClick={() => { setFilters(f => ({ ...f, brandId: undefined })); setBrandSearch(""); setPage(1); }} className="flex-1 py-2.5 rounded-2xl border-[1.5px] border-[#e0e0e0] bg-white text-[13px] font-semibold text-[#444] transition-colors hover:bg-[#f5f5f5]">{t("reset")}</button>
                          <button onClick={() => setOpenMenu("")} className="flex-1 py-2.5 rounded-2xl bg-[#275fdb] border-[1.5px] border-[#275fdb] text-white text-[13px] font-semibold transition-colors hover:bg-[#1a4fc4]">{t("done")}</button>
                        </div>
                      </div>
                    </NavigationMenuContent>
                  </NavigationMenuItem>

                  {/* Reset all */}
                  {hasActiveFilters && (
                    <NavigationMenuItem>
                      <button
                        onClick={() => { setFilters({ sortBy: "newest" }); setPriceMinDraft(""); setPriceMaxDraft(""); setCatSearch(""); setBrandSearch(""); setPage(1); }}
                        className="h-9 min-h-0 px-3 rounded-xl text-[14px] leading-5 font-medium whitespace-nowrap text-[#888] hover:text-[#E31E24] transition-colors"
                      >
                        {t("resetFilters")}
                      </button>
                    </NavigationMenuItem>
                  )}

                </NavigationMenuList>
              </NavigationMenu>

              {/* Grid toggle on RIGHT */}
              <div className="flex items-center gap-1 ml-auto shrink-0">
                <button onClick={() => setViewMode("3col")} className={`p-1.5 min-h-0 rounded-md transition-colors cursor-pointer ${viewMode === "3col" ? "text-[#1B4D91]" : "text-[#bbb] hover:text-[#555]"}`}>
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M0 12.727c0-1.004.814-1.818 1.818-1.818h5.455c1.004 0 1.818.814 1.818 1.818v5.455A1.818 1.818 0 0 1 7.273 20H1.818A1.818 1.818 0 0 1 0 18.182v-5.455Zm6.364 0a.91.91 0 0 1 .909.91v3.636a.91.91 0 0 1-.91.909H2.728a.91.91 0 0 1-.909-.91v-3.636a.91.91 0 0 1 .91-.909h3.636ZM0 1.818C0 .814.814 0 1.818 0h5.455C8.277 0 9.09.814 9.09 1.818v5.455A1.818 1.818 0 0 1 7.273 9.09H1.818A1.818 1.818 0 0 1 0 7.273V1.818Zm6.364 0a.91.91 0 0 1 .909.91v3.636a.91.91 0 0 1-.91.909H2.728a.91.91 0 0 1-.909-.91V2.728a.91.91 0 0 1 .91-.909h3.636ZM12.727 0a1.818 1.818 0 0 0-1.818 1.818v5.455c0 1.004.814 1.818 1.818 1.818h5.455A1.818 1.818 0 0 0 20 7.273V1.818A1.818 1.818 0 0 0 18.182 0h-5.455Zm5.455 2.727a.91.91 0 0 0-.91-.909h-3.636a.91.91 0 0 0-.909.91v3.636c0 .502.407.909.91.909h3.636a.91.91 0 0 0 .909-.91V2.728ZM10.91 12.727c0-1.004.813-1.818 1.817-1.818h5.455c1.004 0 1.818.814 1.818 1.818v5.455A1.818 1.818 0 0 1 18.182 20h-5.455a1.818 1.818 0 0 1-1.818-1.818v-5.455Zm6.363 0a.91.91 0 0 1 .909.91v3.636a.91.91 0 0 1-.91.909h-3.636a.91.91 0 0 1-.909-.91v-3.636a.91.91 0 0 1 .91-.909h3.636Z" fill="currentColor" /></svg>
                </button>
                <button onClick={() => setViewMode("4col")} className={`p-1.5 min-h-0 rounded-md transition-colors cursor-pointer ${viewMode === "4col" ? "text-[#1B4D91]" : "text-[#bbb] hover:text-[#555]"}`}>
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M15.9 1.5a.4.4 0 0 0-.4.4v2.2c0 .22.18.4.4.4h2.2a.4.4 0 0 0 .4-.4V1.9a.4.4 0 0 0-.4-.4h-2.2ZM15 0a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V1a1 1 0 0 0-1-1h-4ZM15.9 8.5a.4.4 0 0 0-.4.4v2.2c0 .22.18.4.4.4h2.2a.4.4 0 0 0 .4-.4V8.9a.4.4 0 0 0-.4-.4h-2.2ZM15 7a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-4ZM15.9 15.5a.4.4 0 0 0-.4.4v2.2c0 .22.18.4.4.4h2.2a.4.4 0 0 0 .4-.4v-2.2a.4.4 0 0 0-.4-.4h-2.2ZM15 14a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1h-4ZM8.9 15.5a.4.4 0 0 0-.4.4v2.2c0 .22.18.4.4.4h2.2a.4.4 0 0 0 .4-.4v-2.2a.4.4 0 0 0-.4-.4H8.9ZM8 14a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1H8ZM1.9 15.5a.4.4 0 0 0-.4.4v2.2c0 .22.18.4.4.4h2.2a.4.4 0 0 0 .4-.4v-2.2a.4.4 0 0 0-.4-.4H1.9ZM1 14a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1H1ZM1.9 8.5a.4.4 0 0 0-.4.4v2.2c0 .22.18.4.4.4h2.2a.4.4 0 0 0 .4-.4V8.9a.4.4 0 0 0-.4-.4H1.9ZM1 7a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1H1ZM8.9 8.5a.4.4 0 0 0-.4.4v2.2c0 .22.18.4.4.4h2.2a.4.4 0 0 0 .4-.4V8.9a.4.4 0 0 0-.4-.4H8.9ZM8 7a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1H8ZM8.9 1.5a.4.4 0 0 0-.4.4v2.2c0 .22.18.4.4.4h2.2a.4.4 0 0 0 .4-.4V1.9a.4.4 0 0 0-.4-.4H8.9ZM8 0a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V1a1 1 0 0 0-1-1H8ZM1.9 1.5a.4.4 0 0 0-.4.4v2.2c0 .22.18.4.4.4h2.2a.4.4 0 0 0 .4-.4V1.9a.4.4 0 0 0-.4-.4H1.9ZM1 0a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V1a1 1 0 0 0-1-1H1Z" fill="currentColor" /></svg>
                </button>
              </div>
            </div>

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
                <button className="mt-4 rounded-xl bg-[#E31E24] px-6 py-2.5 text-[12px] font-black text-white" onClick={() => { setError(""); setPage(1); setSearch(""); }}>{t("retry")}</button>
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
