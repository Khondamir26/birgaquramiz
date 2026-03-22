"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useFetch } from "@/hooks/useFetch";
import { getSellerPublicProfile } from "@/lib/api/products";
import type { SellerPublicProfile } from "@/types";
import {
  ArrowLeft, ShieldCheck, Star, Store,
  SlidersHorizontal, X, Search, Package, ChevronUp,
} from "lucide-react";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";
import ProductCard from "@/components/product/ProductCard";
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

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type SortKey = "default" | "price_asc" | "price_desc" | "new" | "rating";


// ─────────────────────────────────────────────────────────────────────────────
// Shared trigger style (pill button matching WB)
// ─────────────────────────────────────────────────────────────────────────────
// Overrides shadcn NavigationMenuTrigger's accent/state styles to match WB look
const NAV_TRIGGER_BASE =
  "h-9 min-h-0 px-3 rounded-xl text-[14px] leading-5 font-medium border-0 transition-colors whitespace-nowrap " +
  "bg-[#f1f1f5] text-[#242424] " +
  "hover:bg-[#e8e8ee] hover:text-[#242424] " +
  "data-[state=open]:bg-[#e0e0ea] data-[state=open]:text-[#242424] " +
  "focus:bg-[#f1f1f5] focus:text-[#242424]";

function triggerCls(active?: boolean) {
  return NAV_TRIGGER_BASE + (active ? " !bg-[#e8eefa] !text-[#275fdb] !font-semibold" : "");
}

// Active state pill — replaces trigger when filter is selected (WB-style)
const ACTIVE_PILL =
  "h-9 min-h-0 px-3 rounded-xl text-[14px] leading-5 font-semibold border-0 transition-colors whitespace-nowrap " +
  "bg-[#e8eefa] text-[#275fdb] hover:bg-[#dce6f8] " +
  "[&>svg:last-child]:hidden"; // hide built-in NavigationMenuTrigger chevron

// ─────────────────────────────────────────────────────────────────────────────
// Filter content wrapper
// ─────────────────────────────────────────────────────────────────────────────
function FilterPanel({
  children,
  footer,
}: {
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="w-[280px] flex flex-col">
      <div className="p-4 pb-3">{children}</div>
      {footer && (
        <div className="flex gap-2.5 px-4 pb-4 pt-3 border-t border-[#f0f0f0] [&>button]:w-full">
          {footer}
        </div>
      )}
    </div>
  );
}

// Shared button variants matching site style
const btnPrimary = "flex-1 py-2.5 rounded-2xl bg-[#275fdb] border-[1.5px] border-[#275fdb] text-white text-[13px] font-semibold transition-colors hover:bg-[#1a4fc4] active:scale-[0.98]";
const btnGhost   = "flex-1 py-2.5 rounded-2xl border-[1.5px] border-[#e0e0e0] bg-white text-[13px] font-semibold text-[#444] transition-colors hover:bg-[#f5f5f5]";
const btnPrimaryLg = "flex-1 py-3 rounded-2xl bg-[#275fdb] border-[1.5px] border-[#275fdb] text-white text-[14px] font-semibold transition-colors hover:bg-[#1a4fc4] active:scale-[0.98]";
const btnGhostLg   = "flex-1 py-3 rounded-2xl border-[1.5px] border-[#e0e0e0] bg-white text-[14px] font-semibold text-[#444] transition-colors hover:bg-[#f5f5f5] active:scale-100";

// ─────────────────────────────────────────────────────────────────────────────
// Checkbox row
// ─────────────────────────────────────────────────────────────────────────────
function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center justify-between py-3 cursor-pointer select-none group border-b border-[#f0f0f0] last:border-0">
      <span className={`text-[14px] leading-5 transition-colors ${checked ? "text-[#275fdb] font-semibold" : "text-[#1c1c1c] font-normal"}`}>{label}</span>
      <span className={`shrink-0 size-[22px] rounded-[5px] border-[1.5px] flex items-center justify-center transition-all ml-4 ${
        checked ? "bg-[#275fdb] border-[#275fdb]" : "bg-white border-[#c8c8c8] group-hover:border-[#275fdb]"
      }`}>
        {checked && (
          <svg viewBox="0 0 10 8" fill="none" className="w-[11px] h-[9px]">
            <path d="M1 3.5l2.8 2.8L9 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <input type="checkbox" checked={checked} onChange={onChange} onClick={e => e.stopPropagation()} className="sr-only" />
    </label>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
export default function SellerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const t = useTranslations("SellerProfile");
  const tNav = useTranslations("Navbar");
  const locale = useLocale();

  const { data: seller, loading, error } = useFetch<SellerPublicProfile>(() =>
    getSellerPublicProfile(String(id ?? ""))
  );

  const [sort, setSort] = useState<SortKey>("default");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  // Draft = what's shown in the inputs (updates on every keystroke)
  const [priceMinDraft, setPriceMinDraft] = useState("");
  const [priceMaxDraft, setPriceMaxDraft] = useState("");
  // Applied = what actually filters products (updates only on blur or Done)
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [catSearch, setCatSearch] = useState("");
  const [highRatingOnly, setHighRatingOnly] = useState(false);
  const [viewMode, setViewMode] = useState<"5col" | "4col">("5col");
  const [openMenu, setOpenMenu] = useState("");
  const [openSections, setOpenSections] = useState({ price: true, category: true, brand: true });
  const toggleSection = (key: keyof typeof openSections) =>
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  const breadcrumbItems = [
    { label: tNav("home"), href: "/" },
    { label: seller?.company ?? "..." },
  ];

  const allCategories = useMemo(() => {
    if (!seller) return [];
    const map = new Map<string, { name: string; nameUz?: string | null; nameEn?: string | null }>();
    for (const p of seller.products)
      if (p.category) map.set(p.category.id, { name: p.category.name, nameUz: p.category.nameUz, nameEn: p.category.nameEn });
    return Array.from(map.entries()).map(([id, v]) => ({
      id,
      name: (locale === "uz" ? v.nameUz : locale === "en" ? v.nameEn : null) || v.name,
    }));
  }, [seller, locale]);

  const allBrands = useMemo(() => {
    if (!seller) return [];
    const map = new Map<string, string>();
    for (const p of seller.products) if (p.brand) map.set(p.brand.id, p.brand.name);
    return Array.from(map.entries()).map(([bId, name]) => ({ id: bId, name }));
  }, [seller]);

  const priceRange = useMemo(() => {
    if (!seller?.products.length) return { min: 0, max: 0 };
    const prices = seller.products.map(p => p.price);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [seller]);

  const filteredCats = useMemo(() =>
    allCategories.filter(c => c.name.toLowerCase().includes(catSearch.toLowerCase())),
    [allCategories, catSearch]
  );

  const filteredProducts = useMemo(() => {
    if (!seller) return [];
    let list = [...seller.products];
    if (selectedCategories.length > 0) list = list.filter(p => p.category && selectedCategories.includes(p.category.id));
    if (selectedBrands.length > 0) list = list.filter(p => p.brand && selectedBrands.includes(p.brand.id));
    if (highRatingOnly) list = list.filter(p => (p.rating ?? 0) >= 4.7);
    const minVal = priceMin ? parseInt(priceMin, 10) : null;
    const maxVal = priceMax ? parseInt(priceMax, 10) : null;
    if (minVal !== null && !isNaN(minVal)) list = list.filter(p => p.price >= minVal);
    if (maxVal !== null && !isNaN(maxVal)) list = list.filter(p => p.price <= maxVal);
    switch (sort) {
      case "price_asc":  list.sort((a, b) => a.price - b.price); break;
      case "price_desc": list.sort((a, b) => b.price - a.price); break;
      case "new":        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
      case "rating":     list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)); break;
    }
    return list;
  }, [seller, selectedCategories, selectedBrands, priceMin, priceMax, sort, highRatingOnly]);

  const hasActiveFilters = selectedCategories.length > 0 || selectedBrands.length > 0 || !!(priceMin || priceMax) || highRatingOnly;

  // UZS formatting: "42000" → "42 000"
  const fmtUZS = (raw: string) => {
    const n = parseInt(raw.replace(/\D/g, ""), 10);
    return isNaN(n) ? "" : n.toLocaleString("ru-RU");
  };

  // Clamp a raw number string to the seller's range, cross-checking the other value
  const clampMin = useCallback((rawMin: string, rawMax: string) => {
    const n = parseInt(rawMin, 10);
    if (isNaN(n)) return rawMin;
    const maxN = parseInt(rawMax, 10);
    let v = n;
    if (v < priceRange.min) v = priceRange.min;   // below seller floor → snap up
    if (v > priceRange.max) v = priceRange.max;   // above seller ceiling → snap down
    if (!isNaN(maxN) && v > maxN) v = maxN;        // above To → snap down to To
    return String(v);
  }, [priceRange.min, priceRange.max]);

  const clampMax = useCallback((rawMax: string, rawMin: string) => {
    const n = parseInt(rawMax, 10);
    if (isNaN(n)) return rawMax;
    const minN = parseInt(rawMin, 10);
    let v = n;
    if (v > priceRange.max) v = priceRange.max;   // above seller ceiling → snap down
    if (v < priceRange.min) v = priceRange.min;   // below seller floor → snap up
    if (!isNaN(minN) && v < minN) v = minN;        // below From → snap up to From
    return String(v);
  }, [priceRange.max, priceRange.min]);

  // Blur "From": clamp draft, show correction, apply to filter
  const handleFromBlur = useCallback(() => {
    if (!priceMinDraft) return;
    const clamped = clampMin(priceMinDraft, priceMaxDraft);
    setPriceMinDraft(clamped);
    setPriceMin(clamped);
  }, [priceMinDraft, priceMaxDraft, clampMin]);

  // Blur "To": clamp draft, show correction, apply to filter
  const handleToBlur = useCallback(() => {
    if (!priceMaxDraft) return;
    const clamped = clampMax(priceMaxDraft, priceMinDraft);
    setPriceMaxDraft(clamped);
    setPriceMax(clamped);
  }, [priceMaxDraft, priceMinDraft, clampMax]);

  // Done: apply both drafts with clamping, then close
  const applyPriceClamp = useCallback(() => {
    const clampedMin = priceMinDraft ? clampMin(priceMinDraft, priceMaxDraft) : "";
    const clampedMax = priceMaxDraft ? clampMax(priceMaxDraft, priceMinDraft) : "";
    setPriceMinDraft(clampedMin);
    setPriceMaxDraft(clampedMax);
    setPriceMin(clampedMin);
    setPriceMax(clampedMax);
  }, [priceMinDraft, priceMaxDraft, clampMin, clampMax]);

  const clearAllFilters = useCallback(() => {
    setSelectedCategories([]);
    setSelectedBrands([]);
    setPriceMinDraft(""); setPriceMin("");
    setPriceMaxDraft(""); setPriceMax("");
    setHighRatingOnly(false);
    try { localStorage.removeItem(`seller-filters-${id}`); } catch {}
  }, [id]);

  // ── Persist filters in localStorage ─────────────────────────────────────
  const storageKey = `seller-filters-${id}`;

  useEffect(() => {
    if (!id) return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return;
      const p = JSON.parse(saved);
      if (p.sort) setSort(p.sort);
      if (p.selectedCategories?.length) setSelectedCategories(p.selectedCategories);
      if (p.selectedBrands?.length) setSelectedBrands(p.selectedBrands);
      if (p.priceMin) { setPriceMin(p.priceMin); setPriceMinDraft(p.priceMin); }
      if (p.priceMax) { setPriceMax(p.priceMax); setPriceMaxDraft(p.priceMax); }
      if (p.highRatingOnly) setHighRatingOnly(p.highRatingOnly);
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!id) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({ sort, selectedCategories, selectedBrands, priceMin, priceMax, highRatingOnly }));
    } catch {}
  }, [id, storageKey, sort, selectedCategories, selectedBrands, priceMin, priceMax, highRatingOnly]); // save applied (not draft) values

  const toggleCat = (catId: string) =>
    setSelectedCategories(prev => prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId]);

  const toggleBrand = (bId: string) =>
    setSelectedBrands(prev => prev.includes(bId) ? prev.filter(b => b !== bId) : [...prev, bId]);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <div className="bg-white border-b border-[#e8e8e8]">
          <div className="mx-auto w-full max-w-[1440px] px-4 md:px-6 py-3">
            <div className="h-4 w-48 rounded bg-[#f0f0f0] animate-pulse" />
          </div>
        </div>
        <div className="mx-auto w-full max-w-[1440px] px-4 md:px-6 py-6 space-y-5">
          <div className="h-[88px] rounded-xl bg-[#f0f0f0] animate-pulse" />
          <div className="h-10 rounded-xl bg-[#f0f0f0] animate-pulse" />
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => <div key={i} className="rounded-2xl bg-[#f0f0f0] h-[320px] animate-pulse" />)}
          </div>
        </div>
      </div>
    );
  }

  if (error || !seller) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-8 text-center">
        <Store className="size-12 text-slate-200" />
        <p className="text-base font-bold text-slate-400">{t("notFound")}</p>
        <button onClick={() => router.back()} className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700">{t("back")}</button>
      </div>
    );
  }

  // ── Member label ──────────────────────────────────────────────────────────
  const memberDate = new Date(seller.memberSince);
  const monthsOnPlatform = Math.max(1,
    (new Date().getFullYear() - memberDate.getFullYear()) * 12 +
    (new Date().getMonth() - memberDate.getMonth())
  );
  const yearsOnPlatform = Math.floor(monthsOnPlatform / 12);
  const remainingMonths = monthsOnPlatform % 12;
  const memberLabel = yearsOnPlatform > 0
    ? `${yearsOnPlatform} ${t("years")}${remainingMonths > 0 ? ` ${remainingMonths} ${t("months")}` : ""}`
    : `${remainingMonths} ${t("months")}`;

  const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: "default",    label: t("sortByPopularity") },
    { key: "rating",     label: t("sortByRating") },
    { key: "price_asc",  label: t("sortByPriceAsc") },
    { key: "price_desc", label: t("sortByPriceDesc") },
    { key: "new",        label: t("sortByNew") },
  ];

  const currentSortLabel = SORT_OPTIONS.find(o => o.key === sort)?.label ?? t("sortByPopularity");
  const activeFilterCount = [selectedCategories.length, selectedBrands.length, priceMin || priceMax ? 1 : 0, highRatingOnly ? 1 : 0].reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col min-h-screen bg-white pb-24 md:pb-0">

      {/* ── Breadcrumb ── */}
      <div className="bg-white border-b border-[#e8e8e8]">
        <div className="mx-auto w-full max-w-[1440px] px-4 md:px-6 py-2.5 flex items-center gap-3">
          <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-800 p-1 -ml-1 shrink-0">
            <ArrowLeft className="size-5" />
          </button>
          <Breadcrumbs items={breadcrumbItems} />
          {/* Heart + Share */}
          <div className="flex items-center gap-1 ml-auto shrink-0">
            <button className="p-2 rounded-full cursor-pointer text-[#888] hover:text-[#E31E24] transition-colors" aria-label="Save seller">
              <svg fill="none" height="20" width="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path fill="white" d="M7 5a4 4 0 0 0-4 4c0 3.552 2.218 6.296 4.621 8.22A21.5 21.5 0 0 0 12 19.91a21.6 21.6 0 0 0 4.377-2.69C18.78 15.294 21 12.551 21 9a4 4 0 0 0-4-4c-1.957 0-3.652 1.396-4.02 3.2a1 1 0 0 1-1.96 0C10.652 6.396 8.957 5 7 5" />
                <path fill="currentColor" d="M12 22c-.316-.02-.56-.147-.848-.278a23.5 23.5 0 0 1-4.781-2.942C3.777 16.705 1 13.449 1 9a6 6 0 0 1 6-6 6.18 6.18 0 0 1 5 2.568A6.18 6.18 0 0 1 17 3a6 6 0 0 1 6 6c0 4.448-2.78 7.705-5.375 9.78a23.6 23.6 0 0 1-4.78 2.942c-.543.249-.732.278-.845.278M7 5a4 4 0 0 0-4 4c0 3.552 2.218 6.296 4.621 8.22A21.5 21.5 0 0 0 12 19.91a21.6 21.6 0 0 0 4.377-2.69C18.78 15.294 21 12.551 21 9a4 4 0 0 0-4-4c-1.957 0-3.652 1.396-4.02 3.2a1 1 0 0 1-1.96 0C10.652 6.396 8.957 5 7 5" />
              </svg>
            </button>
            <button
              onClick={() => navigator.clipboard?.writeText(window.location.href)}
              className="p-2 rounded-full cursor-pointer text-[#888] hover:text-[#1c1c1c] transition-colors"
              aria-label="Copy link"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── Seller header ── */}
      <div className="bg-white">
        <div className="mx-auto w-full max-w-[1440px] px-4 md:px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-0 bg-[#f7f7f7] border border-[#e8e8e8] rounded-xl px-5 py-4">
            {/* Logo + name + rating */}
            <div className="flex items-center gap-4 md:pr-8 md:border-r border-[#e0e0e0] shrink-0">
              <div className="size-[60px] md:size-[72px] rounded-full bg-[#1B4D91]/10 flex items-center justify-center shrink-0 border-2 border-[#1B4D91]/20">
                <Store className="size-7 md:size-8 text-[#1B4D91]" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-[18px] md:text-[20px] font-bold text-[#1c1c1c]">{seller.company}</h1>
                  {seller.verified && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5">
                      <ShieldCheck className="size-3" />{t("verified")}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Star className="size-3.5 fill-[#FFA800] text-[#FFA800]" />
                  <span className="text-[14px] font-bold text-[#1c1c1c]">4.8</span>
                  <span className="text-[13px] text-[#888]">· {t("ratingsOnProducts")}</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-stretch divide-x divide-[#e0e0e0] md:ml-auto">
              {/* Sold */}
              <div className="flex flex-col px-5 md:px-7 py-1 min-w-[120px]">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" className="mb-1.5">
                  <path fill="#C8C8D1" fillRule="evenodd" d="M9.26.834a.5.5 0 0 0-.507.515c.068 2.348-.24 4.317-.882 5.691-.636 1.36-1.57 2.092-2.782 2.125a.502.502 0 0 0-.482.588l1.43 8.173a.5.5 0 0 0 .444.412l8.132.793c.329.032.671-.066.93-.302 2.354-2.152 4.252-6.382 3.354-10.403-.127-.567-.639-.926-1.184-.926h-4.38a.417.417 0 0 1-.416-.417V5c0-1.511-.427-2.565-1.14-3.241-.707-.67-1.634-.91-2.517-.925Z" clipRule="evenodd"/>
                  <path fill="#C8C8D1" d="M3.315 8.953a1.25 1.25 0 0 0-2.463.428l1.666 9.583a1.25 1.25 0 0 0 2.464-.428L3.315 8.953Z"/>
                </svg>
                <span className="text-[18px] md:text-[22px] font-bold text-[#1c1c1c] leading-tight">
                  {seller.totalSold > 0 ? seller.totalSold.toLocaleString("ru-RU") : "—"}
                </span>
                <span className="text-[12px] text-[#888] mt-0.5">{t("totalSold")}</span>
              </div>
              {/* Products */}
              <div className="flex flex-col px-5 md:px-7 py-1 min-w-[120px]">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" className="mb-1.5">
                  <path fill="#C8C8D1" fillRule="evenodd" d="M14.167 5.833V4.167a4.167 4.167 0 0 0-8.334 0v1.666H3.2c-.106 0-.232 0-.342.01-.126.01-.31.037-.5.14a1.25 1.25 0 0 0-.55.593c-.087.198-.1.383-.101.51-.001.11.008.236.017.342l.498 6.475c.048.624.087 1.14.153 1.56.069.437.175.836.39 1.208a3.333 3.333 0 0 0 1.44 1.333c.387.186.793.261 1.234.296.424.033.941.033 1.566.033h5.991c.625 0 1.143 0 1.567-.033.44-.035.847-.11 1.234-.296a3.333 3.333 0 0 0 1.44-1.333c.215-.372.321-.771.39-1.209.066-.42.105-.935.153-1.559l.498-6.475c.008-.106.018-.232.017-.342 0-.127-.014-.312-.101-.51a1.25 1.25 0 0 0-.55-.593 1.259 1.259 0 0 0-.5-.14c-.11-.01-.236-.01-.343-.01h-2.633Zm-6.667 0h5V4.167a2.5 2.5 0 0 0-5 0v1.666Z" clipRule="evenodd"/>
                </svg>
                <span className="text-[18px] md:text-[22px] font-bold text-[#1c1c1c] leading-tight">
                  {seller.totalProducts.toLocaleString("ru-RU")}
                </span>
                <span className="text-[12px] text-[#888] mt-0.5">{t("totalProducts")}</span>
              </div>
              {/* On platform */}
              <div className="flex flex-col px-5 md:px-7 py-1 min-w-[120px]">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" className="mb-1.5">
                  <path fill="#C8C8D1" fillRule="evenodd" d="M14.557 1.667H5.443c-.484 0-.725 0-.92.03a2.5 2.5 0 0 0-2.106 2.386c-.006.168.015.367.058.717L1.117 6.974c-.193.309-.339.542-.445.797-.098.236-.168.481-.21.732-.045.273-.045.548-.045.912v.168c0 .953.778 1.47 1.373 1.71.115.047.235.088.358.126l.637 5.728c.047.42.07.63.167.788.085.139.21.25.357.32.168.078.38.078.801.078h5.057v-3.75a.833.833 0 0 1 1.666 0v3.75h5.057c.422 0 .633 0 .801-.078a.833.833 0 0 0 .358-.32c.096-.159.12-.368.166-.788l.637-5.728c.123-.038.243-.08.358-.126.595-.24 1.373-.757 1.373-1.71v-.167c0-.364 0-.64-.045-.912a3.332 3.332 0 0 0-.21-.733c-.106-.255-.252-.489-.445-.797L17.525 4.8c.043-.351.064-.55.058-.718a2.5 2.5 0 0 0-2.105-2.385c-.195-.031-.437-.031-.92-.031Z" clipRule="evenodd"/>
                </svg>
                <span className="text-[18px] md:text-[22px] font-bold text-[#1c1c1c] leading-tight">{memberLabel}</span>
                <span className="text-[12px] text-[#888] mt-0.5">{t("onPlatform")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main ── */}
      <div className="mx-auto w-full max-w-[1440px] px-4 md:px-6">

        {/* Heading */}
        <div className="py-4 flex items-baseline gap-2">
          <h2 className="text-[18px] md:text-[20px] font-bold text-[#1c1c1c]">{t("allProducts")}</h2>
          <span className="text-[#888] font-normal text-[15px]">
            {filteredProducts.length}{hasActiveFilters && seller.totalProducts !== filteredProducts.length ? ` ${t("ofTotal")} ${seller.totalProducts}` : ""} {t("productsCount")}
          </span>
        </div>

        {/* ── Filter toolbar using NavigationMenu ── */}
        <div className="flex items-center gap-0 pb-3">
          <NavigationMenu viewport={false} value={openMenu} onValueChange={setOpenMenu} className="max-w-none justify-start h-9">
            <NavigationMenuList className="gap-2 justify-start flex-nowrap h-9">

              {/* Sort */}
              <NavigationMenuItem value="sort">
                <NavigationMenuTrigger className={triggerCls(sort !== "default")}>
                  <svg className="size-3.5 mr-1.5 text-[#888] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" d="M3 6h18M7 12h10M11 18h2" /></svg>
                  {currentSortLabel}
                </NavigationMenuTrigger>
                <NavigationMenuContent className="z-50">
                  <div className="w-[250px] py-2">
                    {SORT_OPTIONS.map(opt => (
                      <button
                        key={opt.key}
                        onClick={() => setSort(opt.key)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-[14px] transition-colors hover:bg-[#f5f5f5] ${sort === opt.key ? "text-[#275fdb] font-semibold" : "text-[#1c1c1c]"}`}
                      >
                        <span className={`size-4 rounded-full border-2 flex items-center justify-center shrink-0 ${sort === opt.key ? "border-[#275fdb]" : "border-[#ccc]"}`}>
                          {sort === opt.key && <span className="size-2 rounded-full bg-[#275fdb]" />}
                        </span>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* All filters — uses Sheet */}
              <NavigationMenuItem>
                <Sheet>
                  <SheetTrigger asChild>
                    <div className="relative inline-flex">
                      <button className={`${triggerCls(hasActiveFilters)} flex items-center gap-1.5`}>
                        <SlidersHorizontal className="size-3.5 text-[#888]" />
                        {t("allFilters")}
                      </button>
                      {hasActiveFilters && (
                        <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-[#FF6900] text-white rounded-full text-[11px] font-bold flex items-center justify-center px-1 leading-none pointer-events-none">
                          {activeFilterCount}
                        </span>
                      )}
                    </div>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-full max-w-[400px] p-0 gap-0 flex flex-col bg-[#f2f2f5]" showCloseButton={false}>
                    {/* Header */}
                    <SheetHeader className="bg-white flex-row items-center justify-between px-5 py-[18px] gap-0 shrink-0 border-b border-[#e8e8e8]">
                      <div className="flex items-center gap-2.5">
                        <SheetTitle className="text-[18px] font-bold text-[#1c1c1c]">{t("filters")}</SheetTitle>
                        {hasActiveFilters && (
                          <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] bg-[#275fdb] text-white rounded-full text-[12px] font-bold px-1.5 leading-none">
                            {activeFilterCount}
                          </span>
                        )}
                      </div>
                      <SheetTrigger asChild>
                        <button className="min-h-0 size-8 flex items-center justify-center rounded-full hover:bg-[#f5f5f5] transition-colors">
                          <X className="size-[18px] text-[#555]" />
                        </button>
                      </SheetTrigger>
                    </SheetHeader>

                    {/* Scrollable body */}
                    <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">

                      {/* Price card */}
                      <div className="bg-white rounded-2xl overflow-hidden">
                        <button onClick={() => toggleSection("price")} className="min-h-0 w-full flex items-center justify-between px-4 pt-4 pb-3 active:scale-100">
                          <h3 className="text-[15px] font-bold text-[#1c1c1c]">{t("priceSum")}</h3>
                          <ChevronUp className={`size-[18px] text-[#bbb] transition-transform duration-200 ${!openSections.price ? "rotate-180" : ""}`} />
                        </button>
                        {openSections.price && (
                          <div className="px-4 pb-4 pt-1">
                            <div className="flex items-end gap-2">
                              <div className="flex-1">
                                <span className="text-[12px] text-[#999] mb-1.5 block">{t("from")}</span>
                                <input
                                  type="text" inputMode="numeric"
                                  value={fmtUZS(priceMinDraft)}
                                  onChange={e => setPriceMinDraft(e.target.value.replace(/\D/g, ""))}
                                  onBlur={handleFromBlur}
                                  placeholder={fmtUZS(String(priceRange.min))}
                                  className="w-full px-3 py-2.5 bg-[#f2f2f5] rounded-xl text-[15px] font-semibold text-[#1c1c1c] outline-none border-0 placeholder:text-[#bbb] placeholder:font-normal"
                                />
                              </div>
                              <div className="w-4 h-[1.5px] bg-[#ccc] shrink-0 rounded-full mb-[14px]" />
                              <div className="flex-1">
                                <span className="text-[12px] text-[#999] mb-1.5 block">{t("to")}</span>
                                <input
                                  type="text" inputMode="numeric"
                                  value={fmtUZS(priceMaxDraft)}
                                  onChange={e => setPriceMaxDraft(e.target.value.replace(/\D/g, ""))}
                                  onBlur={handleToBlur}
                                  placeholder={fmtUZS(String(priceRange.max))}
                                  className="w-full px-3 py-2.5 bg-[#f2f2f5] rounded-xl text-[15px] font-semibold text-[#1c1c1c] outline-none border-0 placeholder:text-[#bbb] placeholder:font-normal"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Categories card */}
                      {allCategories.length > 0 && (
                        <div className="bg-white rounded-2xl overflow-hidden">
                          <button onClick={() => toggleSection("category")} className="min-h-0 w-full flex items-center justify-between px-4 pt-4 pb-3 active:scale-100">
                            <h3 className="text-[15px] font-bold text-[#1c1c1c]">{t("category")}</h3>
                            <div className="flex items-center gap-2.5">
                              {selectedCategories.length > 0 && (
                                <span
                                  role="button"
                                  onClick={e => { e.stopPropagation(); setSelectedCategories([]); }}
                                  className="text-[13px] text-[#275fdb] font-semibold"
                                >
                                  {t("reset")}
                                </span>
                              )}
                              <ChevronUp className={`size-[18px] text-[#bbb] transition-transform duration-200 ${!openSections.category ? "rotate-180" : ""}`} />
                            </div>
                          </button>
                          {openSections.category && (
                            <div className="px-4 pb-3 pt-1">
                              <div className="relative mb-3">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-[14px] text-[#bbb]" />
                                <input value={catSearch} onChange={e => setCatSearch(e.target.value)} placeholder={t("searchInList")} className="w-full pl-9 pr-3 py-2.5 bg-[#f2f2f5] rounded-xl text-[13px] outline-none border-0 placeholder:text-[#bbb]" />
                              </div>
                              {filteredCats.map(cat => (
                                <CheckRow key={cat.id} label={cat.name} checked={selectedCategories.includes(cat.id)} onChange={() => toggleCat(cat.id)} />
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Brands card */}
                      {allBrands.length > 0 && (
                        <div className="bg-white rounded-2xl overflow-hidden">
                          <button onClick={() => toggleSection("brand")} className="min-h-0 w-full flex items-center justify-between px-4 pt-4 pb-3 active:scale-100">
                            <h3 className="text-[15px] font-bold text-[#1c1c1c]">{t("brand")}</h3>
                            <div className="flex items-center gap-2.5">
                              {selectedBrands.length > 0 && (
                                <span
                                  role="button"
                                  onClick={e => { e.stopPropagation(); setSelectedBrands([]); }}
                                  className="text-[13px] text-[#275fdb] font-semibold"
                                >
                                  {t("reset")}
                                </span>
                              )}
                              <ChevronUp className={`size-[18px] text-[#bbb] transition-transform duration-200 ${!openSections.brand ? "rotate-180" : ""}`} />
                            </div>
                          </button>
                          {openSections.brand && (
                            <div className="px-4 pb-3 pt-1">
                              {allBrands.map(brand => (
                                <CheckRow key={brand.id} label={brand.name} checked={selectedBrands.includes(brand.id)} onChange={() => toggleBrand(brand.id)} />
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Rating card */}
                      <div className="bg-white rounded-2xl overflow-hidden">
                        <button
                          onClick={() => setHighRatingOnly(v => !v)}
                          className="min-h-0 w-full flex items-center justify-between px-4 py-4 active:scale-100"
                        >
                          <div className="flex items-center gap-2.5">
                            <Star className="size-[18px] fill-[#FFA800] text-[#FFA800] shrink-0" />
                            <span className={`text-[15px] font-medium ${highRatingOnly ? "text-[#275fdb]" : "text-[#1c1c1c]"}`}>{t("withRating")}</span>
                          </div>
                          <div className={`relative shrink-0 h-7 w-12 rounded-full transition-colors duration-500 ease-in-out ${highRatingOnly ? "bg-[#275fdb]" : "bg-[#d0d0d0]"}`}>
                            <span style={{ transition: "transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1)" }} className={`absolute left-[3px] top-[3px] size-[22px] rounded-full bg-white shadow-md ${highRatingOnly ? "translate-x-[20px]" : "translate-x-0"}`} />
                          </div>
                        </button>
                      </div>

                    </div>

                    {/* Footer */}
                    <div className="px-4 pt-3 pb-5 bg-white border-t border-[#ebebeb] shrink-0">
                      <p className="text-[13px] text-[#999] text-center mb-3 font-medium">
                        {filteredProducts.length} {t("productsCount")}
                      </p>
                      <div className="flex gap-2.5">
                        <button onClick={clearAllFilters} className={btnGhostLg}>{t("reset")}</button>
                        <div className="relative flex-1">
                          <SheetTrigger asChild>
                            <button className={`${btnPrimaryLg} w-full`}>{t("show")}</button>
                          </SheetTrigger>
                          {filteredProducts.length > 0 && (
                            <span className="absolute -top-2 -right-2 min-w-[20px] h-[20px] bg-[#FF6900] text-white rounded-full text-[11px] font-bold flex items-center justify-center px-1 leading-none pointer-events-none">
                              {filteredProducts.length}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </NavigationMenuItem>

              {/* Category */}
              {allCategories.length > 0 && (
                <NavigationMenuItem value="category">
                  <NavigationMenuTrigger className={selectedCategories.length > 0 ? ACTIVE_PILL : triggerCls(false)}>
                    {selectedCategories.length > 0 ? (
                      <>
                        {t("category")}{selectedCategories.length > 1 ? `: ${selectedCategories.length}` : ""}
                        <span
                          role="button"
                          onClick={e => { e.preventDefault(); e.stopPropagation(); setSelectedCategories([]); }}
                          className="ml-1.5 inline-flex items-center opacity-70 hover:opacity-100"
                        ><X className="size-3" /></span>
                      </>
                    ) : t("category")}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="z-50">
                    <FilterPanel
                      footer={
                        <>
                          <button onClick={() => setSelectedCategories([])} className={btnGhost}>{t("reset")}</button>
                          <button onClick={() => setOpenMenu("")} className={btnPrimary}>{t("done")}</button>
                        </>
                      }
                    >
                      <div className="relative mb-2">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[#aaa]" />
                        <input value={catSearch} onChange={e => setCatSearch(e.target.value)} placeholder={t("searchInList")} className="w-full pl-8 pr-3 py-2 border border-[#e0e0e0] rounded-2xl text-[13px] outline-none focus:border-[#275fdb]" />
                      </div>
                      <div className="max-h-[260px] overflow-y-auto">
                        {filteredCats.map(cat => (
                          <CheckRow key={cat.id} label={cat.name} checked={selectedCategories.includes(cat.id)} onChange={() => toggleCat(cat.id)} />
                        ))}
                      </div>
                    </FilterPanel>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              )}

              {/* Price */}
              <NavigationMenuItem value="price">
                <NavigationMenuTrigger className={(priceMin || priceMax) ? ACTIVE_PILL : triggerCls(false)}>
                  {(priceMin || priceMax) ? (
                    <>
                      {t("priceSum")}
                      <span
                        role="button"
                        onClick={e => { e.preventDefault(); e.stopPropagation(); setPriceMinDraft(""); setPriceMaxDraft(""); setPriceMin(""); setPriceMax(""); }}
                        className="ml-1.5 inline-flex items-center opacity-70 hover:opacity-100"
                      ><X className="size-3" /></span>
                    </>
                  ) : t("priceSum")}
                </NavigationMenuTrigger>
                <NavigationMenuContent className="z-50">
                  <FilterPanel
                    footer={
                      <button
                        onClick={() => { applyPriceClamp(); setOpenMenu(""); }}
                        className={btnPrimary}
                      >{t("done")}</button>
                    }
                  >
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-[11px] text-[#888] mb-1 block">{t("from")}</label>
                        <input
                          type="text" inputMode="numeric"
                          value={fmtUZS(priceMinDraft)}
                          onChange={e => setPriceMinDraft(e.target.value.replace(/\D/g, ""))}
                          onBlur={handleFromBlur}
                          placeholder={fmtUZS(String(priceRange.min))}
                          onClick={e => e.stopPropagation()}
                          className="w-full px-2.5 py-2.5 border border-[#e0e0e0] rounded-2xl text-[13px] outline-none focus:border-[#275fdb] bg-[#fafafa]"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[11px] text-[#888] mb-1 block">{t("to")}</label>
                        <input
                          type="text" inputMode="numeric"
                          value={fmtUZS(priceMaxDraft)}
                          onChange={e => setPriceMaxDraft(e.target.value.replace(/\D/g, ""))}
                          onBlur={handleToBlur}
                          placeholder={fmtUZS(String(priceRange.max))}
                          onClick={e => e.stopPropagation()}
                          className="w-full px-2.5 py-2.5 border border-[#e0e0e0] rounded-2xl text-[13px] outline-none focus:border-[#275fdb] bg-[#fafafa]"
                        />
                      </div>
                    </div>
                  </FilterPanel>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Rating toggle */}
              <NavigationMenuItem>
                {highRatingOnly ? (
                  <button className={`${ACTIVE_PILL} flex items-center gap-1.5`}>
                    <Star className="size-3.5 fill-[#275fdb] text-[#275fdb]" />
                    {t("withRating")}
                    <span
                      role="button"
                      onClick={e => { e.preventDefault(); e.stopPropagation(); setHighRatingOnly(false); }}
                      className="ml-0.5 inline-flex items-center opacity-70 hover:opacity-100"
                    ><X className="size-3" /></span>
                  </button>
                ) : (
                  <button
                    onClick={() => setHighRatingOnly(true)}
                    className={`${triggerCls(false)} flex items-center gap-1.5`}
                  >
                    <Star className="size-3.5 fill-[#FFA800] text-[#FFA800]" />
                    {t("withRating")}
                  </button>
                )}
              </NavigationMenuItem>

              {/* Brand */}
              {allBrands.length > 0 && (
                <NavigationMenuItem value="brand">
                  <NavigationMenuTrigger className={selectedBrands.length > 0 ? ACTIVE_PILL : triggerCls(false)}>
                    {selectedBrands.length > 0 ? (
                      <>
                        {t("brand")}{selectedBrands.length > 1 ? `: ${selectedBrands.length}` : ""}
                        <span
                          role="button"
                          onClick={e => { e.preventDefault(); e.stopPropagation(); setSelectedBrands([]); }}
                          className="ml-1.5 inline-flex items-center opacity-70 hover:opacity-100"
                        ><X className="size-3" /></span>
                      </>
                    ) : t("brand")}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="z-50">
                    <FilterPanel
                      footer={
                        <>
                          <button onClick={() => setSelectedBrands([])} className={btnGhost}>{t("reset")}</button>
                          <button onClick={() => setOpenMenu("")} className={btnPrimary}>{t("done")}</button>
                        </>
                      }
                    >
                      <div className="max-h-[260px] overflow-y-auto">
                        {allBrands.map(brand => (
                          <CheckRow key={brand.id} label={brand.name} checked={selectedBrands.includes(brand.id)} onChange={() => toggleBrand(brand.id)} />
                        ))}
                      </div>
                    </FilterPanel>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              )}

              {/* Reset all — appears only when filters are active */}
              {hasActiveFilters && (
                <NavigationMenuItem>
                  <button
                    onClick={clearAllFilters}
                    className="h-9 min-h-0 px-3 rounded-xl text-[14px] leading-5 font-medium whitespace-nowrap text-[#888] hover:text-[#E31E24] transition-colors"
                  >
                    {t("resetFilters")}
                  </button>
                </NavigationMenuItem>
              )}

            </NavigationMenuList>
          </NavigationMenu>

          {/* Grid toggle: icon_4=4col, icon_5=5col */}
          <div className="flex items-center gap-1 ml-auto shrink-0">
            <button onClick={() => setViewMode("4col")} className={`p-1.5 min-h-0 rounded-md transition-colors cursor-pointer ${viewMode === "4col" ? "text-[#1B4D91]" : "text-[#bbb] hover:text-[#555]"}`}>
              {/* icon_4: 2×2 = 4 columns */}
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M0 12.727c0-1.004.814-1.818 1.818-1.818h5.455c1.004 0 1.818.814 1.818 1.818v5.455A1.818 1.818 0 0 1 7.273 20H1.818A1.818 1.818 0 0 1 0 18.182v-5.455Zm6.364 0a.91.91 0 0 1 .909.91v3.636a.91.91 0 0 1-.91.909H2.728a.91.91 0 0 1-.909-.91v-3.636a.91.91 0 0 1 .91-.909h3.636ZM0 1.818C0 .814.814 0 1.818 0h5.455C8.277 0 9.09.814 9.09 1.818v5.455A1.818 1.818 0 0 1 7.273 9.09H1.818A1.818 1.818 0 0 1 0 7.273V1.818Zm6.364 0a.91.91 0 0 1 .909.91v3.636a.91.91 0 0 1-.91.909H2.728a.91.91 0 0 1-.909-.91V2.728a.91.91 0 0 1 .91-.909h3.636ZM12.727 0a1.818 1.818 0 0 0-1.818 1.818v5.455c0 1.004.814 1.818 1.818 1.818h5.455A1.818 1.818 0 0 0 20 7.273V1.818A1.818 1.818 0 0 0 18.182 0h-5.455Zm5.455 2.727a.91.91 0 0 0-.91-.909h-3.636a.91.91 0 0 0-.909.91v3.636c0 .502.407.909.91.909h3.636a.91.91 0 0 0 .909-.91V2.728ZM10.91 12.727c0-1.004.813-1.818 1.817-1.818h5.455c1.004 0 1.818.814 1.818 1.818v5.455A1.818 1.818 0 0 1 18.182 20h-5.455a1.818 1.818 0 0 1-1.818-1.818v-5.455Zm6.363 0a.91.91 0 0 1 .909.91v3.636a.91.91 0 0 1-.91.909h-3.636a.91.91 0 0 1-.909-.91v-3.636a.91.91 0 0 1 .91-.909h3.636Z" fill="currentColor" />
              </svg>
            </button>
            <button onClick={() => setViewMode("5col")} className={`p-1.5 min-h-0 rounded-md transition-colors cursor-pointer ${viewMode === "5col" ? "text-[#1B4D91]" : "text-[#bbb] hover:text-[#555]"}`}>
              {/* icon_5: 3×3 = 5 columns (default) */}
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M15.9 1.5a.4.4 0 0 0-.4.4v2.2c0 .22.18.4.4.4h2.2a.4.4 0 0 0 .4-.4V1.9a.4.4 0 0 0-.4-.4h-2.2ZM15 0a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V1a1 1 0 0 0-1-1h-4ZM15.9 8.5a.4.4 0 0 0-.4.4v2.2c0 .22.18.4.4.4h2.2a.4.4 0 0 0 .4-.4V8.9a.4.4 0 0 0-.4-.4h-2.2ZM15 7a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-4ZM15.9 15.5a.4.4 0 0 0-.4.4v2.2c0 .22.18.4.4.4h2.2a.4.4 0 0 0 .4-.4v-2.2a.4.4 0 0 0-.4-.4h-2.2ZM15 14a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1h-4ZM8.9 15.5a.4.4 0 0 0-.4.4v2.2c0 .22.18.4.4.4h2.2a.4.4 0 0 0 .4-.4v-2.2a.4.4 0 0 0-.4-.4H8.9ZM8 14a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1H8ZM1.9 15.5a.4.4 0 0 0-.4.4v2.2c0 .22.18.4.4.4h2.2a.4.4 0 0 0 .4-.4v-2.2a.4.4 0 0 0-.4-.4H1.9ZM1 14a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1H1ZM1.9 8.5a.4.4 0 0 0-.4.4v2.2c0 .22.18.4.4.4h2.2a.4.4 0 0 0 .4-.4V8.9a.4.4 0 0 0-.4-.4H1.9ZM1 7a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1H1ZM8.9 8.5a.4.4 0 0 0-.4.4v2.2c0 .22.18.4.4.4h2.2a.4.4 0 0 0 .4-.4V8.9a.4.4 0 0 0-.4-.4H8.9ZM8 7a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1H8ZM8.9 1.5a.4.4 0 0 0-.4.4v2.2c0 .22.18.4.4.4h2.2a.4.4 0 0 0 .4-.4V1.9a.4.4 0 0 0-.4-.4H8.9ZM8 0a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V1a1 1 0 0 0-1-1H8ZM1.9 1.5a.4.4 0 0 0-.4.4v2.2c0 .22.18.4.4.4h2.2a.4.4 0 0 0 .4-.4V1.9a.4.4 0 0 0-.4-.4H1.9ZM1 0a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V1a1 1 0 0 0-1-1H1Z" fill="currentColor" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Products ── */}
        <div className="py-4">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Package className="size-12 text-[#ddd] mb-4" />
              <p className="text-[15px] font-semibold text-[#888]">{t("noProducts")}</p>
              {hasActiveFilters && <button onClick={clearAllFilters} className="mt-3 text-[14px] font-bold text-[#1B4D91] hover:underline">{t("resetFilters")}</button>}
            </div>
          ) : (
            <div className={`grid gap-3 grid-cols-2 sm:grid-cols-3 ${viewMode === "4col" ? "md:grid-cols-4" : "md:grid-cols-4 xl:grid-cols-5"}`}>
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
