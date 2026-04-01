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
      image: "/images/banners/banner_1.svg",
      title: t("bannerTitle"),
      subtitle: t("bannerSubtitle"),
    },

  ];

  const currentBanner = banners[activeIndex] || banners[0];

  return (
    <div className="relative mx-auto w-full max-w-[1488px] overflow-hidden rounded-3xl shadow-xl shadow-[#1B4D91]/5 bg-white">

      {/* Fixed Content Overlay */}
      <div className="absolute inset-0 z-20 pointer-events-none flex h-full items-center justify-center md:justify-start px-[9%]">

        {/* Left text — desktop only */}
        <div key={currentBanner.id} className="hidden md:block max-w-[230px] lg:max-w-[310px] animate-in fade-in duration-700">
          <h2 className="text-[22px] lg:text-[26px] xl:text-[28px] font-black text-white leading-[1.2] tracking-tight">
            {currentBanner.title}
          </h2>
          <p className="w-max tracking-wider mt-1 text-[12px] lg:text-[13px] xl:text-[14px] font-regular text-white/80 leading-relaxed" style={{ fontFamily: "var(--font-manrope)" }}>
            {currentBanner.subtitle}
          </p>
        </div>

        {/* bq — centered on mobile, right-pushed on desktop */}
        <div className="flex items-center shrink-0 text-white font-black leading-none tracking-tighter text-[45px] sm:text-[65px] md:ml-auto md:text-[80px] lg:text-[110px] xl:text-[135px]">
          bq
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
        className="home-swiper w-full aspect-[24/5] min-h-[80px]"
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
