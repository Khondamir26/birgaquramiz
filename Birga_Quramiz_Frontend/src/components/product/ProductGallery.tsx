"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Package } from "lucide-react";

type ProductGalleryProps = {
  images: string[];
  productName: string;
};

export default function ProductGallery({ images, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [showTopFade, setShowTopFade] = useState(false);
  const [showBottomFade, setShowBottomFade] = useState(false);

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
  }, []);

  const scrollThumbnails = (dir: "up" | "down") => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ top: dir === "up" ? -150 : 150, behavior: "smooth" });
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 lg:gap-5 lg:contents md:contents relative">
      
      {/* Desktop Vertical Thumbnails */}
      <div className="hidden md:flex flex-col relative w-[84px] h-fit max-h-[600px] shrink-0 lg:col-start-1">
        
        {images.length > 5 && (
          <button
            onClick={() => scrollThumbnails("up")}
            className={cn(
              "absolute top-0 left-0 right-0 h-6 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-all rounded-t-lg",
               showTopFade ? "opacity-100 cursor-pointer" : "opacity-0 cursor-default"
            )}
          >
            <ChevronUp className="size-4" />
          </button>
        )}
        
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto w-full no-scrollbar flex flex-col gap-3 pb-2 scroll-smooth"
        >
          {images.map((img, i) => (
            <button
              key={i}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => setActiveIndex(i)}
              className={cn(
                "relative shrink-0 w-full aspect-[84/112] rounded-xl overflow-hidden border-2 transition-all bg-white",
                i === activeIndex
                  ? "border-[#275fdb]"
                  : "border-transparent"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img}
                alt={`${productName} thumbnail ${i + 1}`}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
        
        {images.length > 5 && (
          <button
            onClick={() => scrollThumbnails("down")}
            className={cn(
               "absolute bottom-0 left-0 right-0 h-8 bg-white/90 backdrop-blur-md z-10 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-all rounded-b-xl",
               showBottomFade ? "opacity-100 cursor-pointer" : "opacity-0 cursor-default"
            )}
          >
            <ChevronDown className="size-5" />
          </button>
        )}
      </div>

      {/* Main Image */}
      <div className="relative w-full lg:col-start-2 place-self-start z-10">
        
        {images.length > 0 ? (
          <div
            className="relative w-full aspect-[4/5] md:aspect-[3/4] lg:aspect-[4/5] overflow-hidden bg-slate-50 rounded-2xl md:rounded-3xl border border-slate-100"
          >
            <div className="absolute top-4 left-4 z-10 hidden md:flex gap-1">
                 {/* Reserved for real discount badges or tags if implemented */}
            </div>
          
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[activeIndex]}
              alt={productName}
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-100"
            />
          </div>
        ) : (
          <div className="flex w-full aspect-[4/5] md:aspect-[3/4] items-center justify-center text-slate-200 bg-white md:rounded-3xl border border-slate-100">
            <Package className="size-20 opacity-30" />
          </div>
        )}

        {/* Mobile Horizontal Thumbnails */}
        {images.length > 1 && (
          <div className="md:hidden absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 px-4 z-10">
            {images.map((img, i) => (
              <button
                key={`${img}-${i}`}
                onClick={() => setActiveIndex(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300 shadow-sm",
                  i === activeIndex ? "w-6 bg-[#275fdb]" : "w-1.5 bg-white drop-shadow flex-shrink-0"
                )}
              />
            ))}
          </div>
        )}
      </div>
      
    </div>
  );
}
