"use client";

import { Store, Star, ChevronRight } from "lucide-react";
import type { Product } from "@/types";

export default function SellerCard({ product, t }: { product: Product, t: (key: string) => string }) {
  if (!product.seller) return null;

  return (
    <div className="flex flex-col rounded-3xl bg-white shadow-sm border border-slate-100 p-6 md:p-8 mt-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex size-[60px] shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 text-[#1B4D91] border border-blue-100/50 shadow-inner">
            <Store className="size-8" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h3 className="text-[18px] md:text-[20px] font-black text-slate-900 group-hover:text-[#1B4D91] transition-colors cursor-pointer">
                {product.seller.company}
              </h3>
            </div>
            
            <div className="flex items-center gap-3 mt-1.5">
              <div className="flex items-center gap-1">
                <Star className="size-[14px] fill-[#f9b41b] text-[#f9b41b]" />
                <span className="text-[13px] font-bold text-slate-700">4.6</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-slate-300"></div>
              <span className="text-[13px] text-slate-500 font-medium whitespace-nowrap">
                24 113 {t("reviewsHint")}
              </span>
            </div>
            
          </div>
        </div>
        
        <div className="hidden sm:block text-right">
          <p className="text-[12px] text-slate-400 font-medium mb-1">Товаров продано</p>
          <p className="text-[14px] text-slate-900 font-bold">92 060</p>
        </div>
      </div>
      
      <div className="flex sm:hidden mt-4 pt-4 border-t border-slate-100 justify-between">
          <p className="text-[13px] text-slate-500 font-medium mb-1">Товаров продано</p>
          <p className="text-[14px] text-slate-900 font-bold">92 060</p>
      </div>

      <button className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-50 hover:bg-slate-100/80 text-[14px] font-bold text-slate-900 transition-colors active:scale-[0.98]">
        {t("viewShop")} <ChevronRight className="size-4 text-slate-400" />
      </button>
    </div>
  );
}
