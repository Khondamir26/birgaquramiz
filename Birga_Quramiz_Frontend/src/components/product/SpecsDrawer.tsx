"use client";

import type { Product } from "@/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { ChevronRight, Loader2, X } from "lucide-react";

type SpecsDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
  quantity: number;
  increment: (id: string) => void;
  decrement: (id: string) => void;
  handleAddToCart: () => void;
  handleBuyNow: () => void;
  handleGoToCart: () => void;
  isBuying: boolean;
  canBuy: boolean;
  t: (key: string) => string;
};

export default function SpecsDrawer({
  open,
  onOpenChange,
  product,
  quantity,
  increment,
  decrement,
  handleAddToCart,
  handleBuyNow,
  handleGoToCart,
  isBuying,
  canBuy,
  t,
}: SpecsDrawerProps) {
  const price = product.price;

  const specifications = product.specifications
    ? Object.entries(product.specifications).map(([label, value]) => ({ label, value }))
    : [
        { label: t("brand"), value: product.seller?.company || "Birga-Quramiz" },
        { label: t("article"), value: product.sku || product.id.slice(0, 8).toUpperCase() },
        { label: t("specCategory"), value: product.category?.name || "—" },
      ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md md:max-w-lg p-0 flex flex-col bg-white border-l-0 shadow-[-10px_0_40px_rgba(0,0,0,0.1)] gap-0">
        <SheetHeader className="px-6 py-4 border-b border-slate-100 bg-white z-10 sticky top-0 flex flex-row items-center justify-between">
          <SheetTitle className="text-[18px] font-bold text-[#242424] leading-tight">
            {t("specsAndDescription")}
          </SheetTitle>
          <SheetClose asChild>
            <button className="text-slate-300 hover:text-slate-600 transition-colors" aria-label="Close">
              <X className="size-5" strokeWidth={2} />
            </button>
          </SheetClose>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto w-full px-6 py-6 pb-[140px]">
          {/* Description */}
          <div className="mb-10">
            <h3 className="text-[16px] font-bold text-[#242424] mb-4">{t("descriptionLabel")}</h3>
            <p className="text-[14px] leading-relaxed text-slate-600">
              {product.description || t("noDescription")}
            </p>
          </div>

          {/* Specifications */}
          <div className="flex flex-col gap-6">
            <h3 className="text-[16px] font-bold text-[#242424] -mb-2">{t("specificationsLabel")}</h3>
            <div className="flex flex-col gap-4 mt-2">
              {specifications.map((spec, i) => (
                <div key={i} className="flex justify-between items-end gap-2">
                  <span className="text-[13px] font-medium text-slate-400 shrink-0 relative -bottom-[2px]">
                    {spec.label}
                  </span>
                  <div className="flex-1 border-b border-dotted border-slate-200" />
                  <span className="text-[13px] font-semibold text-[#242424] text-right shrink-0">
                    {String(spec.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sticky Bottom Buy Bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-5 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] flex flex-col gap-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[13px] font-medium text-slate-400">{t("total")}:</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[26px] font-black text-[#242424]">
                {(price * (quantity || 1)).toLocaleString("ru-RU")}
              </span>
              <span className="text-[14px] font-bold text-[#242424]">{t("currencyUzs")}</span>
            </div>
          </div>

          {quantity > 0 ? (
            <div className="flex gap-2">
              <div className="flex h-12 items-center bg-slate-50 border border-slate-100 rounded-2xl px-3 flex-1 justify-between">
                <button onClick={() => decrement(product.id)} className="flex items-center justify-center p-2 text-[#275fdb] hover:opacity-70 transition-opacity">
                  <svg width="16" height="2" viewBox="0 0 16 2" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M1.25 1H14.75"/></svg>
                </button>
                <span className="text-[14px] font-bold text-[#242424]">{quantity}</span>
                <button onClick={() => increment(product.id)} className="flex items-center justify-center p-2 text-[#275fdb] hover:opacity-70 transition-opacity">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
              </div>
              <button
                onClick={handleGoToCart}
                disabled={isBuying}
                className="flex h-12 flex-[1.4] items-center justify-center gap-1.5 rounded-2xl bg-[#275fdb] hover:bg-opacity-90 active:scale-[0.98] text-[15px] font-bold text-white transition-all shadow-sm disabled:opacity-70"
              >
                {t("inCart")}
                <ChevronRight className="size-[18px]" strokeWidth={2.5} />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                disabled={product.stock === 0 || !canBuy}
                onClick={handleAddToCart}
                className="flex-1 h-12 flex items-center justify-center gap-2 rounded-2xl bg-white border-2 border-[#275fdb] text-[14px] font-bold text-[#275fdb] hover:bg-slate-50 active:scale-[0.98] transition-all disabled:opacity-40"
              >
                {t("addToCart")}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={product.stock === 0 || !canBuy || isBuying}
                className="flex-1 h-12 flex items-center justify-center gap-2 rounded-2xl bg-[#275fdb] hover:bg-[#1B4D91] text-[14px] font-bold text-white transition-all disabled:opacity-40 disabled:active:scale-100"
              >
                {isBuying ? <Loader2 className="size-5 animate-spin" /> : t("buyNow")}
              </button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
