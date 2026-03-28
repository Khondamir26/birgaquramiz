"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import type { Product } from "@/types";
import CategoryCard from "./CategoryCard";
import { getCategoryName } from "@/lib/categoryName";

type ProductInfoProps = {
  product: Product;
  onOpenSpecs: () => void;
};

export default function ProductInfo({ product, onOpenSpecs }: ProductInfoProps) {
  const t = useTranslations("ProductDetail");
  const locale = useLocale();
  const [toastVisible, setToastVisible] = useState(false);

  const handleCopyArticle = (value: string) => {
    navigator.clipboard.writeText(value);
    setToastVisible(true);
  };

  useEffect(() => {
    if (!toastVisible) return;
    const timer = setTimeout(() => setToastVisible(false), 2200);
    return () => clearTimeout(timer);
  }, [toastVisible]);

  const tableRows = [
    { label: t("article"), value: product.sku || product.id.slice(0, 8).toUpperCase(), isId: true },
    ...(product.category ? [{ label: t("specCategory"), value: getCategoryName(product.category, locale), isId: false }] : []),
    ...(product.brand ? [{ label: t("brand"), value: product.brand.name, isId: false }] : []),
    ...(product.specifications
      ? Object.entries(product.specifications as Record<string, string>).slice(0, 3).map(([k, v]) => ({ label: k, value: v, isId: false }))
      : []),
  ];

  return (
    <div className="flex flex-col gap-6 mt-2 md:mt-0 relative w-full min-w-0 order-2 md:order-none col-span-1">
      {/* Article copied toast — desktop only */}
      <div
        className={`hidden md:flex fixed top-[150px] left-1/2 -translate-x-1/2 z-[9999] items-center gap-2.5 px-5 py-3 rounded-full bg-[#1a1a1a] text-white text-[13px] font-semibold shadow-2xl pointer-events-none transition-all duration-300 ${
          toastVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
        }`}
      >
        <span className="flex size-4.5 items-center justify-center rounded-full bg-emerald-500 shrink-0">
          <svg width="9" height="9" viewBox="0 0 10 8" fill="none">
            <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
        {t("articleCopied")}
      </div>

      {/* Brand badge & title */}
      <div className="flex flex-col gap-3">
        {(product.brand || product.seller?.company) && (
          <div className="flex items-center">
            {product.brand ? (
              <a
                href={`/brands/${product.brand.slug}`}
                className="px-3 py-1.5 bg-[#F6F6F9] hover:bg-[#EEF0F3] transition-colors rounded-lg text-[13px] font-semibold text-slate-900 border border-slate-100"
              >
                {product.brand.name}
              </a>
            ) : (
              <a
                href={`/catalog?brand=${encodeURIComponent(product.seller!.company)}`}
                className="px-3 py-1.5 bg-[#F6F6F9] hover:bg-[#EEF0F3] transition-colors rounded-lg text-[13px] font-semibold text-slate-900 border border-slate-100"
              >
                {product.seller!.company}
              </a>
            )}
          </div>
        )}

        <h1 className="text-[20px] lg:text-[24px] font-bold text-[#242424] leading-[1.2] mt-1">
          {product.name}
        </h1>

        {/* Stock badge */}
        {product.stock > 0 ? (
          <div className="inline-flex items-center gap-1.5 w-fit">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-emerald-700 text-[13px] font-semibold">
              {t("inStock")} · {product.stock} {t("inStockUnit")}
            </span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 w-fit">
            <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
            <span className="text-red-600 text-[13px] font-semibold">{t("outOfStock")}</span>
          </div>
        )}
      </div>

      {/* Specs table */}
      <div className="w-full">
        <table className="w-full border-collapse">
          <tbody>
            {tableRows.map((row, i) => (
              <tr key={i} className="group">
                <th className="py-2 pr-4 text-left font-normal">
                  <div className="flex items-end gap-1">
                    <span className="text-[#a0a0a0] text-[14px] leading-tight shrink-0">{row.label}</span>
                    <div className="w-full border-b border-dotted border-slate-200 mb-1" />
                  </div>
                </th>
                <td className="py-2 pl-2 text-right md:text-left">
                  <span
                    className={`text-[#242424] text-[14px] font-medium leading-tight inline-flex items-center gap-1.5 ${row.isId ? "cursor-pointer" : ""}`}
                    onClick={row.isId ? () => handleCopyArticle(row.value) : undefined}
                  >
                    {row.value}
                    {row.isId && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCopyArticle(row.value); }}
                        className="text-[#a0a0a0] hover:text-slate-600 p-0.5 cursor-pointer"
                        aria-label="Copy article"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                      </button>
                    )}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Specs & description button */}
      <div className="w-full">
        <button
          onClick={onOpenSpecs}
          className="cursor-pointer inline-flex items-center px-4 py-1.5 bg-[#F6F6F9] hover:bg-[#EEF0F3] rounded-full text-[13px] font-semibold text-[#242424] transition-colors"
        >
          {t("specsAndDescription")}
        </button>
      </div>

      {/* Return policy */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 py-1">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-800">
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
          <span className="text-[#242424] text-[15px] font-bold">{t("returnPolicy")}</span>
        </div>
        <div className="w-full h-px bg-slate-100" />
      </div>

      <CategoryCard product={product} />
    </div>
  );
}
