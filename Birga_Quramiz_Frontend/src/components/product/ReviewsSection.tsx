"use client";

import { Star, ArrowRight } from "lucide-react";
import Image from "next/image";
import type { Product } from "@/types";

type ReviewsSectionProps = {
  product: Product;
};

export default function ReviewsSection({ product }: ReviewsSectionProps) {
  const reviews = product.reviews || [];
  const allImages = reviews.flatMap((r) => r.images || []);
  const rating = product.rating || 0;
  const reviewsCount = product.reviewsCount || 0;

  return (
    <div className="mt-8 md:mt-12 flex flex-col w-full" id="reviews-section">
      
      {/* Tabbed Header Matching Screenshot 2 */}
      <div className="flex items-center gap-8 border-b border-slate-100 mb-8">
        <div className="relative pb-3 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:bg-[#1B4D91] after:rounded-full">
          <div className="flex items-center gap-2">
            <h2 className="text-[20px] font-bold text-slate-900">Оценки</h2>
            <span className="text-[14px] text-slate-500 font-bold">{reviewsCount}</span>
          </div>
        </div>
        <div className="relative pb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-[20px] font-bold text-slate-300">Вопросы</h2>
            <span className="text-[14px] text-slate-300 font-bold">0</span>
          </div>
        </div>
      </div>

      {/* Large Rating Summary Block Matching Screenshot 2 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-6">
          <div className="text-[48px] md:text-[56px] font-black text-slate-900 leading-none">
            {rating > 0 ? rating.toFixed(1).replace('.', ',') : "0,0"}
          </div>
          
          <div className="flex flex-col gap-1">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star 
                  key={s} 
                  className={`size-5 ${s <= Math.round(rating) ? 'fill-[#f9b41b] text-[#f9b41b]' : 'fill-slate-200 text-slate-200'}`} 
                />
              ))}
            </div>
            <span className="text-[13px] text-slate-400 font-medium">{reviewsCount} оценок</span>
          </div>
        </div>
        
        {allImages.length > 0 && (
          <button className="text-[14px] text-slate-500 font-bold hover:text-[#1B4D91] transition-colors">
            Смотреть все фото и видео
          </button>
        )}
      </div>

      {/* Review Photos Horizontal Scroll */}
      {allImages.length > 0 && (
        <>
          <div className="relative mb-6">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 pt-2 -mx-4 px-4 md:mx-0 md:px-0">
              {allImages.map((img, i) => (
                <div key={i} className="relative w-[72px] h-[96px] md:w-[90px] md:h-[120px] shrink-0 rounded-2xl overflow-hidden cursor-pointer group border border-slate-100 bg-slate-50">
                  <Image 
                    src={img}
                    alt={`Review photo ${i}`}
                    fill
                    className="object-cover transition-transform group-hover:scale-110"
                  />
                  {/* Visual play button for structural completeness */}
                  {i === 3 && (
                     <div className="absolute inset-0 flex items-center justify-center bg-black/5">
                        <div className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center pl-0.5">
                           <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-slate-900"><path d="M5 3l14 9-14 9V3z"></path></svg>
                        </div>
                     </div>
                  )}
                </div>
              ))}
            </div>
            <button className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white shadow-[0_4px_12px_rgba(0,0,0,0.1)] items-center justify-center text-slate-700 hover:text-slate-900 hover:shadow-lg transition-all z-10 -mr-5 border border-slate-100">
              <ArrowRight className="size-5" />
            </button>
          </div>

          <button className="sm:hidden text-left mb-6 text-[13px] text-[#1B4D91] font-medium">
              Смотреть все фото и видео
          </button>
        </>
      )}

      {/* Review Cards horizontal logic matching screenshot */}
      <div className="relative mb-6 mt-4">
        {reviews.length === 0 ? (
          <div className="text-slate-400 text-[14px] italic mt-2">Пока нет отзывов для этого товара.</div>
        ) : (
          <>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-4 px-4 md:mx-0 md:px-0 items-stretch">
              {reviews.map((r, i) => (
              <div key={r.id || i} className="flex flex-col shrink-0 w-[280px] md:w-[340px] p-5 rounded-3xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-slate-100 text-[13px]">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-[14px]">{r.user?.name || "Покупатель"}</span>
                        <span className="text-slate-400 text-[12px]">{new Date(r.createdAt).toLocaleDateString("ru-RU", { day: 'numeric', month: 'long' })}</span>
                    </div>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`size-3.5 ${s <= r.rating ? 'fill-[#f9b41b] text-[#f9b41b]' : 'fill-slate-200 text-slate-200'}`} />
                      ))}
                    </div>
                </div>

               {r.pros && r.pros.length > 0 && (
                 <div className="mb-2">
                    <span className="text-slate-400 mb-2 block">Плюсы товара</span>
                    <div className="flex flex-wrap gap-1.5">
                       {r.pros.split(',').map((tag, tagIndex) => (
                         <span key={tagIndex} className="bg-[#f0f2f5] text-slate-500 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide">
                            {tag.trim()}
                         </span>
                       ))}
                    </div>
                 </div>
               )}

               {!r.pros && r.comment ? (
                  <p className="text-slate-800 leading-snug break-words">
                    <span className="font-semibold text-slate-900">Достоинства: </span>
                    {r.comment}
                  </p>
               ) : null}
              </div>
            ))}
            </div>
            <button className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white shadow-[0_4px_12px_rgba(0,0,0,0.1)] items-center justify-center text-slate-700 hover:text-slate-900 hover:shadow-lg transition-all z-10 -mr-5 border border-slate-100">
               <ArrowRight className="size-5" />
            </button>
          </>
        )}
      </div>

      <div className="mt-2 text-left">
        <button className="px-6 py-3.5 rounded-2xl bg-[#1B4D91]/10 text-[#1B4D91] font-bold text-[14px] hover:bg-[#1B4D91]/20 transition-colors w-full md:w-auto">
          Смотреть все отзывы
        </button>
      </div>
      
    </div>
  );
}
