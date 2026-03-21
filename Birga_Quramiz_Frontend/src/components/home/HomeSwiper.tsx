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
      // title: t("bannerTitle") || "Welcome to Birga Quramiz!",
      // subtitle: t("bannerSubtitle") || "Your trusted construction materials marketplace.",
    },
    {
      id: 2,
      image: "/images/banners/helmet.avif",
      title: t("factoryPrices") || "Factory Prices",
      subtitle: t("factoryText") || "Direct offers from verified sellers with transparent stock.",
    },
    {
      id: 3,
      image: "/images/banners/trust.avif",
      title: t("trustedProcess") || "Trusted Process",
      subtitle: t("trustedText") || "Moderated products and role-based workflow for platform quality.",
    },
  ];

  const currentBanner = banners[activeIndex] || banners[0];

  return (
    <div className="relative mx-auto w-full max-w-[1440px] overflow-hidden rounded-[16px] md:rounded-[32px] shadow-xl shadow-[#1B4D91]/5 bg-white">

      {/* Fixed Content Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none flex h-full items-center px-6 sm:px-12 md:px-20">
        <div
          key={currentBanner.id}
          className="max-w-[90%] md:max-w-[640px] animate-in fade-in duration-700 -mt-2 md:-mt-4"
        >

          <h2 className="text-[18px] sm:text-[28px] md:text-[44px] font-black text-white leading-[1.15] md:leading-[1.1] drop-shadow-lg text-balance tracking-tight">
            {currentBanner.title}
          </h2>

          <p className="mt-1.5 sm:mt-3 md:mt-5 text-[12px] sm:text-[14px] md:text-[17px] font-medium text-white/80 md:text-white/90 drop-shadow-md leading-relaxed max-w-[280px] sm:max-w-md md:max-w-xl line-clamp-2 md:line-clamp-none">
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
              <div className="absolute inset-0 bg-gradient-to-r from-[#0B2141]/90 via-[#0B2141]/50 sm:via-[#1B4D91]/40 to-transparent" />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

    </div>
  );
}
