"use client";

import type { Product } from "@/types";
import { Star, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
  t
}: StickyPurchaseCardProps) {
  const router = useRouter();
  const price = product.price;

  return (
    <div className="hidden lg:flex flex-col w-full shrink-0 order-4 relative z-10">
      <div className="sticky top-[100px] flex flex-col bg-white rounded-3xl p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-slate-100">
        
        {/* Price Block */}
        <div className="flex flex-col mb-4">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-[32px] font-black tracking-tight text-[#11253d] leading-none">
              {(price * (quantity || 1)).toLocaleString("ru-RU")}
              <span className="text-[18px] font-bold ml-1.5 text-slate-400">сум</span>
            </span>
          </div>
          <div className="flex items-center mt-2">
            <span className="flex items-center gap-1.5 rounded-lg bg-[#E31E24]/10 px-2.5 py-1 text-[12px] font-bold text-[#E31E24]">
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>
               Лучшая цена
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 mb-6">
          {quantity > 0 ? (
            <div className="flex gap-2">
               {/* Quantity Selector */}
               <div className="flex h-[46px] items-center bg-[#f2f2f5] rounded-2xl px-3 flex-1 justify-between">
                  <button 
                    onClick={() => decrement(product.id)}
                    className="flex items-center justify-center p-2 text-[#275fdb] hover:opacity-70 transition-opacity"
                  >
                    <svg width="16" height="2" viewBox="0 0 16 2" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M1.25 1H14.75"/></svg>
                  </button>
                  <span className="text-[15px] font-bold text-slate-800">{quantity}</span>
                  <button 
                    onClick={() => increment(product.id)}
                    className="flex items-center justify-center p-2 text-[#275fdb] hover:opacity-70 transition-opacity"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  </button>
               </div>
               
               {/* "In Cart" Button */}
               <button 
                  onClick={handleGoToCart}
                  disabled={isBuying}
                  className="flex h-[46px] flex-[1.4] items-center justify-center gap-1.5 rounded-2xl bg-[#275fdb] hover:bg-opacity-90 active:scale-[0.98] text-[15px] font-bold text-white transition-all shadow-sm disabled:opacity-70"
               >
                  В корзине
                  <ChevronRight className="size-[18px]" strokeWidth={2.5} />
               </button>
            </div>
          ) : (
            <button
              disabled={product.stock === 0 || !canBuy}
              onClick={handleAddToCart}
              className="flex h-[46px] w-full items-center justify-center rounded-2xl bg-[#275fdb] border-[1.5px] border-[#275fdb] hover:bg-opacity-90 active:scale-[0.98] text-[15px] font-bold text-white transition-all disabled:opacity-40"
            >
              Добавить в корзину
            </button>
          )}
          
          <button
            onClick={handleBuyNow}
            disabled={product.stock === 0 || !canBuy || isBuying}
            className="flex h-[46px] w-full items-center justify-center rounded-2xl bg-[#275fdb]/10 hover:bg-[#275fdb]/20 active:scale-[0.98] text-[15px] font-bold text-[#275fdb] transition-all disabled:opacity-40 disabled:active:scale-100"
          >
            {isBuying ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              "Купить сейчас"
            )}
          </button>
        </div>

        {/* Delivery Info */}
        <div className="flex flex-col gap-2 mb-4 text-[13px] text-slate-500">
           <div className="flex gap-2">
              <span className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-[10px] shrink-0 mt-0.5">📦</span>
              <span><span className="font-semibold text-slate-800">30 марта,</span> склад продавца</span>
           </div>
           {product.seller && (
             <div className="flex gap-2 items-center">
                 <span className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-[10px] shrink-0 text-slate-500">🏪</span>
                 <span className="cursor-pointer hover:text-[#1B4D91] font-medium">{product.seller.company}</span>
                 <div className="flex items-center gap-0.5 ml-1">
                    <Star className="size-3 fill-[#f9b41b] text-[#f9b41b]" />
                    <span className="font-semibold">4,6</span>
                    <span className="text-slate-300 ml-0.5 group-hover:block ml-0.5"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg></span>
                 </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
