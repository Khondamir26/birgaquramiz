"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Product } from "@/types";
import { resolveImageUrl } from "@/lib/image";
import wbLeft from "@/icons/wb_image_1.webp";
import wbRight from "@/icons/wb_image_2.webp";
import { formatUzDate } from "@/lib/date";

function Stars({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-[2px]">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} width={size} height={size} viewBox="0 0 24 24" fill={s <= Math.round(rating) ? "#FFA800" : "#e2e8f0"}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

type ReviewsSectionProps = { product: Product; compact?: boolean };

export default function ReviewsSection({ product, compact }: ReviewsSectionProps) {
  const t = useTranslations("ProductDetail");
  const [activeTab, setActiveTab] = useState<"reviews" | "questions">("reviews");
  const photosRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  const reviews = product.reviews || [];
  const allImages = reviews.flatMap((r) => (r.images || []).map(resolveImageUrl));
  const rating = product.rating || 0;
  const reviewsCount = product.reviewsCount || 0;

  // ── Compact single-row mode (mobile after-price card) ──
  if (compact) {
    return (
      <div className="flex items-center justify-between px-4 py-3 gap-3">
        {/* Left: wings + rating + count */}
        <div className="flex items-center gap-2 min-w-0">
          <Image src={wbLeft} alt="" width={16} height={26} className="object-contain shrink-0" />
          <span className="text-[22px] font-black text-[#1c1c1c] leading-none tabular-nums">
            {rating > 0 ? rating.toFixed(1).replace(".", ",") : "0,0"}
          </span>
          <Image src={wbRight} alt="" width={16} height={26} className="object-contain shrink-0" />
          <span className="text-[12px] text-[#999] font-medium whitespace-nowrap">
            {t("ratingsCount", { count: reviewsCount })}
          </span>
        </div>

        {/* Middle: overlapping photos */}
        {allImages.length > 0 && (
          <div className="flex items-center shrink-0">
            {allImages.slice(0, 3).map((img, i) => (
              <div
                key={i}
                className="relative w-8 h-10 rounded-lg overflow-hidden bg-[#f0f0f0] border-2 border-white"
                style={{ marginLeft: i === 0 ? 0 : -8, zIndex: 3 - i }}
              >
                <Image src={img} alt="" fill className="object-cover" sizes="32px" />
              </div>
            ))}
            {allImages.length > 3 && (
              <span className="ml-1 text-[11px] font-bold text-[#888]">+{allImages.length - 3}</span>
            )}
          </div>
        )}

        {/* Right: questions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <span className="text-[12px] text-[#999] font-medium">
            {t("questionsCount", { count: 0 })}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div id="reviews-section">

      {/* ── Tabs ── */}
      <div className="flex items-center gap-6">
        {(["reviews", "questions"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative py-4 text-[16px] md:text-[18px] font-bold transition-colors ${
              activeTab === tab ? "text-[#1c1c1c]" : "text-[#bbb] hover:text-[#555]"
            }`}
          >
            {tab === "reviews" ? t("reviewsTab") : t("questionsTab")}
            <sup className={`ml-1 text-[11px] font-semibold align-super transition-colors ${activeTab === tab ? "text-[#888]" : "text-[#ccc]"}`}>
              {tab === "reviews" ? reviewsCount : 0}
            </sup>
          </button>
        ))}
      </div>

      {/* ── Reviews tab ── */}
      {activeTab === "reviews" && (
        <div className="py-5">

          {/* Rating summary */}
          <div className="flex items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Image src={wbLeft} alt="" width={28} height={44} className="object-contain" />
                <span className="text-[38px] font-black text-[#1c1c1c] leading-none tabular-nums">
                  {rating > 0 ? rating.toFixed(1).replace(".", ",") : "0,0"}
                </span>
                <Image src={wbRight} alt="" width={28} height={44} className="object-contain" />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[14px] font-semibold text-[#1c1c1c]">{t("buyersChoice")}</span>
                <span className="text-[13px] text-[#999]">{t("ratingsCount", { count: reviewsCount })}</span>
              </div>
            </div>
            {allImages.length > 0 && (
              <button className="hidden md:block text-[13px] text-[#999] hover:text-[#275fdb] transition-colors font-medium shrink-0">
                {t("viewAllPhotos")}
              </button>
            )}
          </div>

          {/* Photo strip */}
          {allImages.length > 0 && (
            <div className="relative mb-5">
              <div ref={photosRef} className="flex gap-2 overflow-x-auto no-scrollbar px-4 md:px-6">
                {allImages.map((img, i) => (
                  <div key={i} className="relative w-[70px] h-[93px] md:w-[82px] md:h-[110px] shrink-0 rounded-xl overflow-hidden cursor-pointer bg-[#f5f5f5]">
                    <Image src={img} alt="" fill className="object-cover" sizes="82px" loading="lazy" />
                  </div>
                ))}
              </div>
              {allImages.length > 7 && (
                <button
                  onClick={() => photosRef.current?.scrollBy({ left: 280, behavior: "smooth" })}
                  className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 size-9 rounded-full bg-white shadow-md items-center justify-center text-[#555] hover:text-[#275fdb] transition-colors border border-[#f0f0f0] z-10"
                >
                  <ChevronRight className="size-4" />
                </button>
              )}
            </div>
          )}

          {/* Review cards or empty state */}
          {reviews.length === 0 ? (
            <div className="px-4 md:px-6 pb-4">
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <p className="text-[14px] text-[#bbb] font-medium">{t("noReviewsYet")}</p>
              </div>
            </div>
          ) : (
            <>
              <div className="relative">
                <div ref={cardsRef} className="flex gap-3 overflow-x-auto no-scrollbar pb-1 px-4 md:px-6 items-stretch">
                  {reviews.map((r, i) => (
                    <div
                      key={r.id || i}
                      className="flex flex-col shrink-0 w-[260px] md:w-[310px] p-4 rounded-2xl bg-[#fafafa] border border-[#f0f0f0]"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3 gap-2">
                        <div className="min-w-0">
                          <p className="text-[14px] font-bold text-[#1c1c1c] truncate">{r.user?.name || "Xaridor"}</p>
                          <p className="text-[12px] text-[#bbb]">{formatUzDate(r.createdAt)}</p>
                        </div>
                        <Stars rating={r.rating} />
                      </div>

                      {/* Pros */}
                      {r.pros && (
                        <div className="mb-2.5">
                          <p className="text-[11px] text-[#aaa] uppercase font-semibold tracking-wide mb-1.5">{t("pros")}</p>
                          <div className="flex flex-wrap gap-1">
                            {r.pros.split(",").map((tag, ti) => (
                              <span key={ti} className="bg-white border border-[#e8e8ec] text-[#444] text-[11px] font-semibold px-2 py-0.5 rounded-lg">
                                {tag.trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Cons */}
                      {r.cons && (
                        <div className="mb-2.5">
                          <p className="text-[11px] text-[#aaa] uppercase font-semibold tracking-wide mb-1.5">{t("cons")}</p>
                          <div className="flex flex-wrap gap-1">
                            {r.cons.split(",").map((tag, ti) => (
                              <span key={ti} className="bg-[#fff5f5] border border-[#ffe0e0] text-[#d03] text-[11px] font-semibold px-2 py-0.5 rounded-lg">
                                {tag.trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Comment */}
                      {r.comment && (
                        <p className="text-[13px] text-[#444] leading-snug line-clamp-4 mt-auto pt-1">{r.comment}</p>
                      )}

                      {/* Review photos */}
                      {r.images && r.images.length > 0 && (
                        <div className="flex gap-1.5 mt-3">
                          {r.images.slice(0, 3).map((img, ii) => (
                            <div key={ii} className="relative w-14 h-[72px] rounded-lg overflow-hidden bg-[#f5f5f5] shrink-0">
                              <Image src={resolveImageUrl(img)} alt="" fill className="object-cover" sizes="56px" loading="lazy" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* "See all" end card */}
                  {reviewsCount > reviews.length && (
                    <div className="flex flex-col shrink-0 w-[180px] p-4 rounded-2xl bg-[#f4f7ff] border border-[#dde8fb] items-center justify-center gap-2 cursor-pointer hover:bg-[#eaf0fd] transition-colors">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#275fdb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                      </svg>
                      <p className="text-[12px] font-semibold text-[#275fdb] text-center leading-snug">
                        {t("viewAllCount", { count: reviewsCount })}
                      </p>
                    </div>
                  )}
                </div>

                {reviews.length > 2 && (
                  <button
                    onClick={() => cardsRef.current?.scrollBy({ left: 320, behavior: "smooth" })}
                    className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 size-9 rounded-full bg-white shadow-md items-center justify-center text-[#555] hover:text-[#275fdb] transition-colors border border-[#f0f0f0] z-10"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                )}
              </div>

              {/* Bottom CTA */}
              <div className="px-4 md:px-6 mt-5">
                <button className="px-5 py-2.5 rounded-2xl bg-[#eef2fd] text-[#275fdb] text-[14px] font-bold hover:bg-[#e0e8fb] transition-colors">
                  {t("viewAllReviews")}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Questions tab ── */}
      {activeTab === "questions" && (
        <div className="px-4 md:px-6 py-5 flex flex-col gap-4">
          <div className="w-full border border-[#f0f0f0] rounded-2xl px-4 py-3.5 text-[14px] text-[#bbb] bg-[#fafafa] cursor-text select-none">
            {t("askQuestion")}
          </div>
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <p className="text-[14px] text-[#bbb] font-medium">{t("noQuestions")}</p>
          </div>
        </div>
      )}

    </div>
  );
}
