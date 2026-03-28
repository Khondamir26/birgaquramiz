"use client";

import { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import Image from "next/image";
import { useTranslations } from "next-intl";



// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";

export default function HomeSwiper() {
  const t = useTranslations("Home");
  const [activeIndex, setActiveIndex] = useState(0);

  const banners = [
    {
      id: 1,
      image: "/images/banners/bq.avif",
      title: t("bannerTitle"),
      subtitle: t("bannerSubtitle"),
    },
    {
      id: 2,
      image: "/images/banners/banner_1.avif",
      title: t("banner2Title"),
      subtitle: t("banner2Subtitle"),
    },
    {
      id: 3,
      image: "/images/banners/banner_3.avif",
      title: t("banner3Title"),
      subtitle: t("banner3Subtitle"),
    },
  ];

  const currentBanner = banners[activeIndex] || banners[0];

  return (
    <div className="relative mx-auto w-full max-w-[1440px] overflow-hidden rounded-3xl shadow-xl shadow-[#1B4D91]/5 bg-white">

      {/* Left gradient so text is readable without covering image */}
      <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-r from-black/50 via-black/20 to-transparent" />

      {/* Fixed Content Overlay */}
      <div className="absolute inset-0 z-20 pointer-events-none flex h-full items-center px-6 sm:px-12 md:px-20">
        <div
          key={currentBanner.id}
          className="w-[42%] sm:w-[38%] md:w-[34%] animate-in fade-in duration-700"
        >
          <h2 className="text-[15px] sm:text-[20px] md:text-[26px] font-black text-white leading-[1.2] tracking-tight">
            {currentBanner.title}
          </h2>

          <p className="mt-1 sm:mt-2 text-[11px] sm:text-[12px] md:text-[13px] font-medium text-white/80 leading-relaxed line-clamp-2 md:line-clamp-3">
            {currentBanner.subtitle}
          </p>
        </div>
      </div>

      <Swiper
        modules={[Autoplay, Pagination]}
        spaceBetween={0}
        slidesPerView={1}
        loop={true}
        autoplay={{
          delay: 3000,
          disableOnInteraction: false,
        }}
        pagination={{
          clickable: true,
        }}
        onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
        className="home-swiper h-[200px] sm:h-[260px] md:h-[340px] w-full"
      >
        {banners.map((banner, index) => (
          <SwiperSlide key={banner.id} className="relative w-full h-full">
            <div className="absolute inset-0 z-0 h-full w-full bg-[#0B2141]">
              <Image
                src={banner.image.replace(".png", ".avif")}
                alt="banner background"
                fill
                priority={index === 0}
                loading={index === 0 ? "eager" : "lazy"}
                sizes="100vw"
                className="object-cover transition-opacity duration-1000"
              />
              <div className="absolute inset-0" />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

    </div>
  );
}
