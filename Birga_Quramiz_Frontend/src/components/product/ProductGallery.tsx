"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Package } from "lucide-react";

type ProductGalleryProps = {
  images: string[];
  productName: string;
};

export default function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [prevImages, setPrevImages] = useState(images);
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);

  // Reset to first image when product changes (derived state pattern — no effect needed)
  if (prevImages !== images) {
    setPrevImages(images);
    setActiveIndex(0);
  }

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const checkScroll = () => {
      setShowTopFade(el.scrollTop > 5);
      setShowBottomFade(el.scrollHeight - el.scrollTop - el.clientHeight > 5);
    };
    checkScroll();
    el.addEventListener("scroll", checkScroll);
    return () => el.removeEventListener("scroll", checkScroll);
  }, [images]);

  const prev = useCallback(() => setActiveIndex((i) => (i - 1 + images.length) % images.length), [images.length]);
  const next = useCallback(() => setActiveIndex((i) => (i + 1) % images.length), [images.length]);

  const scrollThumbnails = (dir: "up" | "down") => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ top: dir === "up" ? -150 : 150, behavior: "smooth" });
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      diff > 0 ? next() : prev();
    }
    touchStartX.current = null;
  };

  if (images.length === 0) {
    return (
      <div className="flex w-full aspect-[4/5] md:aspect-[3/4] items-center justify-center text-slate-200 bg-white md:rounded-3xl border border-slate-100 lg:col-span-2">
        <Package className="size-20 opacity-30" />
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 lg:gap-5 lg:contents md:contents relative">

      {/* ── Desktop: Vertical thumbnail strip ── */}
      <div className="hidden md:flex flex-col relative w-[84px] shrink-0 lg:col-start-1" style={{ maxHeight: 560 }}>

        {showTopFade && (
          <button
            onClick={() => scrollThumbnails("up")}
            className="absolute top-0 left-0 right-0 h-7 bg-white/90 backdrop-blur-sm z-10 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-all rounded-t-xl"
          >
            <ChevronUp className="size-4" />
          </button>
        )}

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto w-full flex flex-col gap-2.5 scroll-smooth"
          style={{ scrollbarWidth: "none" }}
        >
          {images.map((img, i) => (
            <button
              key={i}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => setActiveIndex(i)}
              className={cn(
                "relative shrink-0 w-full aspect-[84/100] rounded-xl overflow-hidden border-2 transition-all duration-200 bg-slate-50",
                i === activeIndex
                  ? "border-[#1B4D91] shadow-md shadow-[#1B4D91]/10 scale-[0.97]"
                  : "border-transparent opacity-60 hover:opacity-100 hover:border-slate-200"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img}
                alt={`${productName} ${i + 1}`}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </button>
          ))}
        </div>

        {showBottomFade && (
          <button
            onClick={() => scrollThumbnails("down")}
            className="absolute bottom-0 left-0 right-0 h-8 bg-white/90 backdrop-blur-md z-10 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-all rounded-b-xl"
          >
            <ChevronDown className="size-5" />
          </button>
        )}
      </div>

      {/* ── Main image ── */}
      <div className="relative w-full lg:col-start-2 place-self-start z-10">
        <div
          className="relative w-full aspect-[4/5] md:aspect-[3/4] lg:aspect-[4/5] overflow-hidden bg-slate-50 rounded-2xl md:rounded-3xl border border-slate-100 select-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={activeIndex}
            src={images[activeIndex]}
            alt={productName}
            fetchPriority={activeIndex === 0 ? "high" : undefined}
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-150"
          />

          {/* Desktop prev/next arrows — only when multiple images */}
          {images.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 hidden md:flex w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm items-center justify-center shadow-md hover:bg-white hover:scale-105 transition-all border border-slate-100 z-10"
                aria-label="Previous"
              >
                <ChevronLeft className="size-4 text-slate-700" />
              </button>
              <button
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:flex w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm items-center justify-center shadow-md hover:bg-white hover:scale-105 transition-all border border-slate-100 z-10"
                aria-label="Next"
              >
                <ChevronRight className="size-4 text-slate-700" />
              </button>

              {/* Counter badge */}
              <span className="absolute bottom-3 right-3 hidden md:flex bg-black/40 text-white text-[11px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm z-10">
                {activeIndex + 1} / {images.length}
              </span>
            </>
          )}

          {/* Mobile: dot indicators */}
          {images.length > 1 && (
            <div className="md:hidden absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 px-4 z-10">
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300 shadow-sm",
                    i === activeIndex ? "w-6 bg-[#1B4D91]" : "w-1.5 bg-white/80"
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {/* Mobile: horizontal thumbnail strip below main image */}
        {images.length > 1 && (
          <div className="md:hidden flex gap-2 mt-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={cn(
                  "shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all",
                  i === activeIndex
                    ? "border-[#1B4D91] shadow-md"
                    : "border-transparent opacity-55 hover:opacity-100"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
