"use client";

import { useState, useRef, useMemo } from "react";
import type { Product } from "@/types";
import { ChevronRight, Loader2, Star } from "lucide-react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";

const UZ_MONTHS = ["yanvar","fevral","mart","aprel","may","iyun","iyul","avgust","sentabr","oktabr","noyabr","dekabr"];

type StickyPurchaseCardProps = {
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

export default function StickyPurchaseCard({
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
}: StickyPurchaseCardProps) {
  const price = product.price;
  const locale = useLocale();
  const [sellerPopupOpen, setSellerPopupOpen] = useState(false);

  const formattedDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return locale === "uz"
      ? `${d.getDate()} ${UZ_MONTHS[d.getMonth()]}`
      : new Intl.DateTimeFormat(locale, { day: "numeric", month: "long" }).format(d);
  }, [locale]);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tSeller = useTranslations("SellerProfile");

  const openPopup = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setSellerPopupOpen(true);
  };
  const closePopup = () => {
    closeTimer.current = setTimeout(() => setSellerPopupOpen(false), 120);
  };

  return (
    <div className="hidden lg:flex flex-col w-full shrink-0 order-4 relative z-10">
      <div className="flex flex-col bg-white rounded-3xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-slate-100">

        {/* Price */}
        <div className="flex flex-col mb-4">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-[32px] font-black tracking-tight text-[#11253d] leading-none">
              {(price * (quantity || 1)).toLocaleString(locale === "en" ? "en-US" : "ru-RU")}
              <span className="text-[18px] font-bold ml-1.5 text-slate-400">{t("currencyUzs")}</span>
            </span>
          </div>
          <div className="flex items-center mt-2">
            <span className="flex items-center gap-1.5 rounded-lg bg-[#E31E24]/10 px-2.5 py-1 text-[12px] font-bold text-[#E31E24]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
              {t("bestPrice")}
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 mb-6">
          {quantity > 0 ? (
            <div className="flex gap-2">
              <div className="flex h-[46px] items-center bg-[#f2f2f5] rounded-2xl px-3 flex-1 justify-between">
                <button onClick={() => decrement(product.id)} className="flex items-center justify-center p-2 text-[#275fdb] hover:opacity-70 transition-opacity">
                  <svg width="16" height="2" viewBox="0 0 16 2" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M1.25 1H14.75"/></svg>
                </button>
                <span className="text-[15px] font-bold text-slate-800">{quantity}</span>
                <button onClick={() => increment(product.id)} className="flex items-center justify-center p-2 text-[#275fdb] hover:opacity-70 transition-opacity">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
              </div>
              <button
                onClick={handleGoToCart}
                disabled={isBuying}
                className="flex h-[46px] flex-[1.4] items-center justify-center gap-1.5 rounded-2xl bg-[#275fdb] hover:bg-opacity-90 active:scale-[0.98] text-[15px] font-bold text-white transition-all shadow-sm disabled:opacity-70"
              >
                {t("inCart")}
                <ChevronRight className="size-[18px]" strokeWidth={2.5} />
              </button>
            </div>
          ) : (
            <button
              disabled={product.stock === 0 || !canBuy}
              onClick={handleAddToCart}
              className="flex h-[46px] w-full items-center justify-center rounded-2xl bg-[#275fdb] border-[1.5px] border-[#275fdb] hover:bg-opacity-90 active:scale-[0.98] text-[15px] font-bold text-white transition-all disabled:opacity-40"
            >
              {t("addToCart")}
            </button>
          )}

          <button
            onClick={handleBuyNow}
            disabled={product.stock === 0 || !canBuy || isBuying}
            className="flex h-[46px] w-full items-center justify-center rounded-2xl bg-[#275fdb]/10 hover:bg-[#275fdb]/20 active:scale-[0.98] text-[15px] font-bold text-[#275fdb] transition-all disabled:opacity-40 disabled:active:scale-100"
          >
            {isBuying ? <Loader2 className="size-5 animate-spin" /> : t("buyNow")}
          </button>
        </div>

        {/* Delivery Info */}
        <div className="flex flex-col gap-2 text-[13px] text-slate-500">
          <div className="flex gap-2">
            <span className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-[10px] shrink-0 mt-0.5">📦</span>
            <span>
              <span className="font-semibold text-slate-800">{formattedDate},</span>{" "}
              {t("deliveryFromSeller")}
            </span>
          </div>

          {product.seller && (
            <div className="relative">
              {/* Seller trigger row */}
              <Link
                href={`/sellers/${product.seller.articleNumber ?? product.seller.id}`}
                className="flex gap-2 items-center group"
                onMouseEnter={openPopup}
                onMouseLeave={closePopup}
              >
                <span className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-[10px] shrink-0">🏪</span>
                <span className="font-semibold text-[#1B4D91] group-hover:underline transition-all">
                  {product.seller.company}
                </span>
                <div className="flex items-center gap-1 ml-1">
                  <Star className="size-3 fill-[#f9b41b] text-[#f9b41b]" />
                  <span className="font-semibold text-slate-700 text-[13px]">4,6</span>
                  <svg
                    className={`size-3 text-slate-400 ml-0.5 transition-transform ${sellerPopupOpen ? "rotate-180" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </Link>

              {/* Seller Popup — WB-style structure, opens below */}
              {sellerPopupOpen && (
                <div
                  className="absolute top-full -left-6 mt-2 w-[calc(100%+44px)] bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.18)] border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150"
                  onMouseEnter={openPopup}
                  onMouseLeave={closePopup}
                >
                  {/* Header: name + rating */}
                  <div className="px-5 pt-5 pb-4">
                    <p className="text-[16px] font-black text-slate-900 leading-tight mb-1.5">
                      {product.seller.company}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <Star className="size-3.5 fill-[#f9b41b] text-[#f9b41b]" />
                      <span className="text-[13px] font-bold text-slate-800">4,6</span>
                      <span className="text-[12px] text-slate-400">·</span>
                      <span className="text-[12px] text-slate-400">{tSeller("ratingsOnProducts")}</span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-slate-100" />

                  {/* Stats rows — label left, value right */}
                  <div className="px-5 py-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-slate-400">{tSeller("totalSoldLabel")}</span>
                      <span className="text-[13px] font-bold text-slate-800">{tSeller("comingSoon")}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-slate-400">{tSeller("onPlatformLabel")}</span>
                      <span className="text-[13px] font-bold text-slate-800">{tSeller("comingSoon")}</span>
                    </div>
                  </div>

                  {/* Button */}
                  <div className="px-4 pb-4">
                    <Link
                      href={`/sellers/${product.seller.articleNumber ?? product.seller.id}`}
                      className="flex h-11 w-full items-center justify-center rounded-2xl bg-[#275fdb]/10 text-[#275fdb] text-[14px] font-bold hover:bg-[#275fdb]/20 transition-all"
                    >
                      {tSeller("allSellerProducts")}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
