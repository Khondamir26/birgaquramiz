"use client";

import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useFetch } from "@/hooks/useFetch";
import { getSellerPublicProfile } from "@/lib/api/products";
import type { SellerPublicProfile } from "@/types";
import ProductCard from "@/components/product/ProductCard";
import { ArrowLeft, ShieldCheck, Star, Store } from "lucide-react";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";

export default function SellerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const t = useTranslations("SellerProfile");
  const tNav = useTranslations("Navbar");

  const { data: seller, loading, error } = useFetch<SellerPublicProfile>(() =>
    getSellerPublicProfile(String(id ?? ""))
  );

  const breadcrumbItems = [
    { label: tNav("home"), href: "/" },
    { label: seller?.company ?? "..." },
  ];

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#f4f6fa]">
        <div className="bg-white border-b border-slate-100">
          <div className="mx-auto w-full max-w-[1440px] px-4 md:px-6 py-3 md:py-4">
            <div className="h-4 w-48 rounded bg-slate-100 animate-pulse" />
          </div>
        </div>
        <div className="mx-auto w-full max-w-[1440px] px-4 md:px-6 py-8 space-y-6">
          <div className="h-28 rounded-3xl bg-white animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-[260px] rounded-2xl bg-white animate-pulse" />
            ))}
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
        <button
          onClick={() => router.back()}
          className="rounded-2xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700"
        >
          {t("back")}
        </button>
      </div>
    );
  }

  const memberDate = new Date(seller.memberSince);
  const memberYear = memberDate.getFullYear();
  const monthsOnPlatform = Math.max(
    1,
    (new Date().getFullYear() - memberYear) * 12 +
      (new Date().getMonth() - memberDate.getMonth())
  );
  const yearsOnPlatform = Math.floor(monthsOnPlatform / 12);
  const remainingMonths = monthsOnPlatform % 12;
  const memberLabel =
    yearsOnPlatform > 0
      ? `${yearsOnPlatform} ${t("years")}${remainingMonths > 0 ? ` ${remainingMonths} ${t("months")}` : ""}`
      : `${remainingMonths} ${t("months")}`;

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f6fa] md:pb-12">
      {/* Breadcrumb row */}
      <div className="bg-white border-b border-slate-100">
        <div className="mx-auto w-full max-w-[1440px] px-4 md:px-6 py-3 md:py-4 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-slate-600 hover:text-slate-900 transition-colors p-1 -ml-1 cursor-pointer shrink-0"
            aria-label="Back"
          >
            <ArrowLeft className="size-5 md:size-6" />
          </button>
          <Breadcrumbs items={breadcrumbItems} />
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1440px] px-4 md:px-6 pt-5 md:pt-7 pb-10 space-y-6">

        {/* Seller Header — WB-style horizontal stripe */}
        <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Top section: avatar + name/rating left | stats right */}
          <div className="flex flex-col md:flex-row md:items-center gap-0">

            {/* Left: avatar + name + rating */}
            <div className="flex items-center gap-4 px-5 md:px-8 py-5 md:py-6 md:border-r border-slate-100 md:min-w-[280px] lg:min-w-[320px]">
              <div className="size-14 md:size-16 rounded-2xl bg-[#1B4D91]/10 flex items-center justify-center shrink-0">
                <Store className="size-7 md:size-8 text-[#1B4D91]" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-lg md:text-xl font-black text-[#11253d] truncate leading-tight">
                    {seller.company}
                  </h1>
                  {seller.verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-600 shrink-0">
                      <ShieldCheck className="size-3" />
                      {t("verified")}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className="size-3.5 fill-[#f9b41b] text-[#f9b41b]" />
                  ))}
                  <span className="text-[13px] font-bold text-slate-600 ml-1">4.6</span>
                  <span className="text-[12px] text-slate-400 ml-1">· {t("ratingsOnProducts")}</span>
                </div>
              </div>
            </div>

            {/* Right: stats in a horizontal row */}
            <div className="flex flex-1 divide-x divide-slate-100 border-t md:border-t-0 border-slate-100">
              {/* Stat: items sold */}
              <div className="flex-1 flex flex-col items-center justify-center py-4 md:py-5 px-3 text-center">
                <p className="text-[18px] md:text-[22px] font-black text-[#11253d] leading-none mb-1">
                  {seller.totalSold > 0 ? seller.totalSold.toLocaleString("ru-RU") : "—"}
                </p>
                <p className="text-[11px] md:text-[12px] font-medium text-slate-400">{t("totalSold")}</p>
              </div>

              {/* Stat: total products */}
              <div className="flex-1 flex flex-col items-center justify-center py-4 md:py-5 px-3 text-center">
                <p className="text-[18px] md:text-[22px] font-black text-[#11253d] leading-none mb-1">
                  {seller.totalProducts.toLocaleString("ru-RU")}
                </p>
                <p className="text-[11px] md:text-[12px] font-medium text-slate-400">{t("totalProducts")}</p>
              </div>

              {/* Stat: time on platform */}
              <div className="flex-1 flex flex-col items-center justify-center py-4 md:py-5 px-3 text-center">
                <p className="text-[18px] md:text-[22px] font-black text-[#11253d] leading-none mb-1">
                  {memberLabel}
                </p>
                <p className="text-[11px] md:text-[12px] font-medium text-slate-400">{t("onPlatform")}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Products section */}
        <div>
          <h2 className="text-lg md:text-xl font-black text-slate-800 mb-4">
            {t("allProducts")}{" "}
            <span className="text-slate-400 font-bold text-base">({seller.totalProducts})</span>
          </h2>

          {seller.products.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-12 text-center">
              <p className="text-sm font-bold text-slate-500">{t("noProducts")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {seller.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
