"use client";

import { cn } from "@/lib/utils";
import type { Product } from "@/types";
import { Star, ChevronRight, Loader2, Heart } from "lucide-react";
import { useTranslations } from "next-intl";

type ProductStickyBarProps = {
  product: Product;
  images: string[];
  quantity: number;
  liked: boolean;
  canBuy: boolean;
  isBuying: boolean;
  show: boolean;
  onAddToCart: () => void;
  onBuyNow: () => void;
  onGoToCart: () => void;
  onToggleFavorite: () => void;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
};

export default function ProductStickyBar({
  product,
  images,
  quantity,
  liked,
  canBuy,
  isBuying,
  show,
  onAddToCart,
  onBuyNow,
  onGoToCart,
  onToggleFavorite,
  onIncrement,
  onDecrement,
}: ProductStickyBarProps) {
  const t = useTranslations("ProductDetail");

  return (
    <div
      className={cn(
        "fixed left-0 right-0 z-[60] bg-white border-b border-slate-100",
        "shadow-[0_4px_24px_rgba(0,0,0,0.08)]",
        "transition-all duration-300 ease-out",
        "hidden lg:block",
        show ? "top-0 opacity-100" : "-top-[100px] opacity-0 pointer-events-none"
      )}
    >
      {/* Centered container — h-[88px] to match WB proportions */}
      <div className="mx-auto max-w-[1440px] px-6 h-[88px] flex items-center gap-0">

        {/* ── LEFT: thumbnail + product info ── */}
        <div className="flex items-center gap-4 flex-1 min-w-0 pr-8">
          {images[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={images[0]}
              alt={product.name}
              className="w-[48px] h-[64px] rounded-xl object-cover shrink-0 border border-slate-100"
            />
          )}

          <div className="min-w-0">
            {/* Brand / name row */}
            <div className="flex items-center gap-1 min-w-0">
              {product.brand && (
                <>
                  <span className="text-[15px] font-bold text-[#275fdb] shrink-0 whitespace-nowrap">
                    {product.brand.name}
                  </span>
                  <span className="text-[15px] text-slate-300 mx-1 shrink-0">/</span>
                </>
              )}
              <span className="text-[15px] font-semibold text-slate-800 truncate">
                {product.name}
              </span>
            </div>

            {/* Rating + sub-label */}
            <div className="flex items-center gap-2 mt-1">
              {product.rating != null && (
                <div className="flex items-center gap-1">
                  <Star className="size-[14px] fill-[#f9b41b] text-[#f9b41b]" />
                  <span className="text-[13px] font-semibold text-slate-600 leading-none">
                    {product.rating.toFixed(1)}
                  </span>
                </div>
              )}
              {product.brand && (
                <span className="text-[13px] text-slate-400 leading-none">
                  {product.brand.name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="w-px h-12 bg-slate-200 shrink-0 ml-8 mr-3" />

        {/* ── Price block (fixed width, never shifts) ── */}
        <div className="shrink-0 w-[180px] text-right pr-4 w-max">
          <p className="text-[17px] font-black text-[#E31E24] leading-tight">
            {(product.price * (quantity || 1)).toLocaleString("ru-RU")}
            <span className="text-[13px] font-semibold ml-1">so&apos;m</span>
          </p>
        </div>

        {/* ── Cart controls — FIXED total width so layout never shifts ── */}
        <div className="flex items-center gap-3 shrink-0 w-[340px]">
          {quantity > 0 ? (
            <>
              {/* Qty stepper — fixed width pill */}
              <div className="flex items-center h-[46px] w-[116px] bg-[#f2f2f5] rounded-2xl overflow-hidden shrink-0">
                <button
                  onClick={() => onDecrement(product.id)}
                  className="flex items-center justify-center w-10 h-full text-[#275fdb] hover:bg-slate-200/70 transition-colors"
                >
                  <svg width="16" height="2" viewBox="0 0 16 2" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M1.25 1H14.75" />
                  </svg>
                </button>
                <span className="flex-1 text-[15px] font-bold text-slate-800 text-center tabular-nums">
                  {quantity}
                </span>
                <button
                  onClick={() => onIncrement(product.id)}
                  className="flex items-center justify-center w-10 h-full text-[#275fdb] hover:bg-slate-200/70 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
              </div>

              {/* Go to cart — fills remaining space */}
              <button
                onClick={onGoToCart}
                disabled={isBuying}
                className="flex flex-1 items-center justify-center gap-2 h-[46px] rounded-2xl bg-[#275fdb] text-white text-[15px] font-bold hover:bg-[#1e4fc0] transition-colors disabled:opacity-60"
              >
                {t("inCart")} <ChevronRight className="size-4" strokeWidth={2.5} />
              </button>
            </>
          ) : (
            <>
              {/* Buy now — fills remaining space */}
              <button
                onClick={onBuyNow}
                disabled={product.stock === 0 || !canBuy || isBuying}
                className="flex flex-1 items-center justify-center h-[46px] rounded-2xl bg-[#275fdb]/10 text-[#275fdb] text-[15px] font-bold hover:bg-[#275fdb]/20 transition-colors disabled:opacity-40"
              >
                {isBuying ? <Loader2 className="size-4 animate-spin" /> : t("buyNow")}
              </button>

              {/* Add to cart — fixed width */}
              <button
                onClick={onAddToCart}
                disabled={product.stock === 0 || !canBuy}
                className="flex items-center justify-center h-[46px] w-[160px] shrink-0 rounded-2xl bg-[#275fdb] text-white text-[15px] font-bold hover:bg-[#1e4fc0] transition-colors disabled:opacity-40"
              >
                {t("addToCart")}
              </button>
            </>
          )}
        </div>

        {/* ── Heart ── */}
        <button
          onClick={onToggleFavorite}
          className="flex items-center justify-center w-[46px] h-[46px] ml-2 shrink-0 text-slate-400 hover:text-[#275fdb] transition-colors"
          aria-label="Favorite"
        >
          <Heart className={cn("size-[24px]", liked && "fill-[#275fdb] text-[#275fdb]")} />
        </button>

      </div>
    </div>
  );
}
