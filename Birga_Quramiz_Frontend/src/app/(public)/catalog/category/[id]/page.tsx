"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronRight, ArrowLeft, LayoutGrid, Package,
  Layers, Hammer, Zap, Droplets, Flame, Wind,
  DoorOpen, Wrench, Grid3x3, Thermometer, ShieldAlert,
  Waves, Cog, Paintbrush, Box, TreePine, Blocks,
  ScanLine, Move3d, Bolt
} from "lucide-react";
import { getCategoryName } from "@/lib/categoryName";
import { useFetch } from "@/hooks/useFetch";
import { getCategoryBySlug, getCategoryChildren, getProducts } from "@/lib/api/products";
import { getCategoryImage } from "@/lib/constants/categories";
import type { Category, PaginatedResponse, Product } from "@/types";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";
import ProductCard from "@/components/product/ProductCard";
import { cn } from "@/lib/utils";

const SUBCATEGORY_ICONS: Record<string, React.ElementType> = {
  MIX: Layers,     ROF: Move3d,      INS: Thermometer, DRW: ScanLine,
  PNT: Paintbrush, MTL: Bolt,        FAS: Cog,         TOL: Hammer,
  PLM: Droplets,   ELC: Zap,         BLK: Blocks,      FLR: Grid3x3,
  WOD: TreePine,   VNT: Wind,        DOR: DoorOpen,    RPR: Wrench,
  MSH: LayoutGrid, HTG: Flame,       FPR: ShieldAlert, PMP: Waves,
  FIN: Box,        MCH: Package,     DRN: Droplets,    GEN: Box,
};

const ICON_COLORS: Record<string, string> = {
  MIX: "bg-amber-100 text-amber-600",    ROF: "bg-sky-100 text-sky-600",
  INS: "bg-orange-100 text-orange-600",  DRW: "bg-slate-100 text-slate-600",
  PNT: "bg-pink-100 text-pink-600",      MTL: "bg-zinc-100 text-zinc-600",
  FAS: "bg-gray-100 text-gray-600",      TOL: "bg-yellow-100 text-yellow-700",
  PLM: "bg-blue-100 text-blue-600",      ELC: "bg-yellow-100 text-yellow-600",
  BLK: "bg-red-100 text-red-600",        FLR: "bg-stone-100 text-stone-600",
  WOD: "bg-lime-100 text-lime-700",      VNT: "bg-cyan-100 text-cyan-600",
  DOR: "bg-amber-100 text-amber-800",    RPR: "bg-indigo-100 text-indigo-600",
  MSH: "bg-slate-100 text-slate-500",    HTG: "bg-red-100 text-red-500",
  FPR: "bg-orange-100 text-orange-700",  PMP: "bg-blue-100 text-blue-500",
  FIN: "bg-purple-100 text-purple-600",  MCH: "bg-gray-100 text-gray-700",
  DRN: "bg-teal-100 text-teal-600",      GEN: "bg-slate-100 text-slate-500",
};

export default function CatalogCategoryPage() {
  const { id: slug } = useParams<{ id: string }>();
  const router = useRouter();
  const t = useTranslations("Category");
  const tNav = useTranslations("Navbar");
  const locale = useLocale();

  const categorySlug = String(slug ?? "");

  const { data: category, loading: categoryLoading, error: categoryError } =
    useFetch<Category>(() => getCategoryBySlug(categorySlug));

  const [children, setChildren] = useState<Category[]>([]);
  const [childrenLoading, setChildrenLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [showAllProducts, setShowAllProducts] = useState(false);

  const isParent = category ? !category.parentId : false;
  const parentCode = isParent ? category?.code : (category?.code?.split("-")[0] ?? "");
  const IconComponent = SUBCATEGORY_ICONS[parentCode ?? ""] ?? Package;
  const iconColor = ICON_COLORS[parentCode ?? ""] ?? "bg-slate-100 text-slate-500";
  const heroImage = isParent ? getCategoryImage(category?.code ?? "") : getCategoryImage(parentCode ?? "");

  useEffect(() => {
    if (!category?.id) return;
    if (!category.parentId) {
      async function loadChildren() {
        setChildrenLoading(true);
        try {
          const result = await getCategoryChildren(category!.id);
          setChildren(result);
        } finally {
          setChildrenLoading(false);
        }
      }
      void loadChildren();
    } else {
      async function loadProducts() {
        setProductsLoading(true);
        try {
          const res: PaginatedResponse<Product> = await getProducts(1, 48, undefined, category!.id);
          setProducts(res.data);
          setProductsLoading(false);
        } catch (err) {
          setProductsError((err as Error).message);
          setProductsLoading(false);
        }
      }
      void loadProducts();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category?.id, category?.parentId]);

  const handleShowAllProducts = () => {
    if (!category?.id) return;
    setShowAllProducts(true);
    setProductsLoading(true);
    getProducts(1, 96, undefined, undefined, undefined, undefined, undefined, undefined, category.id)
      .then((res: PaginatedResponse<Product>) => { setProducts(res.data); setProductsLoading(false); })
      .catch((err: Error) => { setProductsError(err.message); setProductsLoading(false); });
  };

  if (categoryLoading) {
    return (
      <div className="min-h-screen bg-[#f4f6fa]">
        <div className="w-full h-[260px] md:h-[340px] bg-slate-200 animate-pulse" />
        <div className="mx-auto max-w-[1488px] px-4 md:px-8 py-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-white animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!category || categoryError) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 text-center">
        <p className="text-base font-bold text-slate-500">
          {categoryError?.toLowerCase().includes("not found") ? t("notFound") : categoryError}
        </p>
        <button onClick={() => router.push("/catalog")}
          className="mt-4 rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700">
          {t("backToCatalog")}
        </button>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: tNav("home"), href: "/" },
    ...(category.parent
      ? [{ label: getCategoryName(category.parent, locale), href: `/catalog/category/${category.parent.slug ?? category.parent.id}` }]
      : []),
    { label: getCategoryName(category, locale) },
  ];
  const categoryName = getCategoryName(category, locale);

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f6fa] pb-24 md:pb-16">

      {/* ── Hero banner ── */}
      <div className="relative w-full h-[160px] md:h-[300px] overflow-hidden bg-[#0B2141]">
        {heroImage && (
          <Image
            src={heroImage}
            alt={categoryName}
            fill
            className="object-cover opacity-80"
            sizes="100vw"
            priority
            quality={90}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B2141]/85 via-[#0B2141]/40 to-[#0B2141]/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B2141]/60 via-transparent to-transparent" />

        {/* All hero content constrained to 1440px container */}
        <div className="absolute inset-0 mx-auto w-full max-w-[1488px] px-4 md:px-8 flex flex-col justify-between py-4 md:py-6">
          {/* Top row: back button */}
          <button
            onClick={() => router.back()}
            aria-label="Back"
            className="flex items-center gap-2.5 text-white/90 hover:text-white transition-colors group w-fit"
          >
            <div className="flex size-9 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm border border-white/25 group-hover:bg-white/25 transition-colors">
              <ArrowLeft className="size-4" />
            </div>
            <span className="hidden md:block text-[13px] font-semibold tracking-wide">
              {category.parent ? getCategoryName(category.parent, locale) : tNav("catalog")}
            </span>
          </button>

          {/* Bottom row: title + CTA */}
          <div className="flex items-end justify-between gap-4">
            <div>
              {category.parent && (
                <p className="text-[12px] md:text-[13px] text-white/60 font-semibold mb-1 uppercase tracking-wider">
                  {getCategoryName(category.parent, locale)}
                </p>
              )}
              <h1 className="text-[24px] md:text-[42px] font-black text-white leading-tight">
                {categoryName}
              </h1>
              {isParent && children.length > 0 && !childrenLoading && (
                <p className="mt-1 text-[13px] text-white/60">
                  {children.length} {t("subcategories")}
                </p>
              )}
            </div>
            {isParent && !showAllProducts && (
              <button
                onClick={handleShowAllProducts}
                className="hidden md:flex items-center gap-2 shrink-0 bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/30 text-white rounded-2xl px-5 py-3 transition-colors"
              >
                <span className="text-[14px] font-bold">{t("allCategoryProducts")}</span>
                <ChevronRight className="size-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="mx-auto w-full max-w-[1488px] px-4 md:px-8 pt-4 md:pt-6">

        {/* Breadcrumb — desktop only */}
        <div className="hidden md:block mb-6">
          <Breadcrumbs items={breadcrumbItems} />
        </div>

        {/* ── PARENT: subcategory grid ── */}
        {isParent && !showAllProducts && (
          <>
            {childrenLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-20 rounded-2xl bg-white animate-pulse" />
                ))}
              </div>
            ) : children.length === 0 ? (
              <div className="rounded-2xl bg-white px-5 py-10 text-center text-sm font-semibold text-slate-400">
                {t("emptyProducts")}
              </div>
            ) : (
              <>
                {/* Subcategory cards — full width grid */}
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-4">
                  {children.map((child) => (
                    <Link
                      key={child.id}
                      href={`/catalog/category/${child.slug ?? child.id}`}
                      className="group flex items-center gap-2.5 md:gap-4 bg-white hover:bg-[#f0f4ff] active:bg-[#e4ebff] rounded-2xl px-3 md:px-5 py-3 md:py-5 shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <div className={cn("shrink-0 flex size-8 md:size-12 items-center justify-center rounded-xl", iconColor)}>
                        <IconComponent className="size-4 md:size-6" />
                      </div>
                      <span className="flex-1 text-[12px] md:text-[15px] font-semibold text-slate-800 leading-snug line-clamp-2">
                        {getCategoryName(child, locale)}
                      </span>
                      <ChevronRight className="size-3.5 md:size-4 text-slate-300 group-hover:text-[#1B4D91] shrink-0 group-hover:translate-x-0.5 transition-all" />
                    </Link>
                  ))}
                </div>

                {/* Mobile: all products button */}
                <button
                  onClick={handleShowAllProducts}
                  className="md:hidden mt-3 w-full flex items-center justify-between bg-[#f0f4ff] hover:bg-[#e4ebff] active:bg-[#d6e1ff] rounded-2xl px-5 py-4 transition-colors"
                >
                  <span className="text-[14px] font-bold text-[#1B4D91]">{t("allCategoryProducts")}</span>
                  <ChevronRight className="size-4 text-[#1B4D91] shrink-0" />
                </button>
              </>
            )}
          </>
        )}

        {/* ── SUBCATEGORY or all-products mode: product grid ── */}
        {(!isParent || showAllProducts) && (
          <>
            {showAllProducts && (
              <button
                onClick={() => setShowAllProducts(false)}
                className="mb-5 flex items-center gap-2 text-[13px] font-bold text-[#1B4D91] hover:opacity-70 transition-opacity"
              >
                <ArrowLeft className="size-4" />
                {t("backToSubcategories")}
              </button>
            )}
            {productsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="h-[260px] rounded-2xl bg-white animate-pulse" />
                ))}
              </div>
            ) : productsError ? (
              <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
                {productsError}
              </div>
            ) : products.length === 0 ? (
              <div className="rounded-2xl bg-white px-5 py-10 text-center">
                <p className="text-sm font-bold text-slate-600">{t("emptyProducts")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
