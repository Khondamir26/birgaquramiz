import { useTranslations } from "next-intl";

// Responsive banner sources — largest breakpoint first (browser picks first match)
const bannerSources = [
  { media: "(min-width: 1024px)", srcSet: "/images/banners/desktop.svg" },
  { media: "(min-width: 768px)",  srcSet: "/images/banners/tablet.svg" },
  { media: "(min-width: 430px)",  srcSet: "/images/banners/mobile-large.svg" },
];

export default function HomeBanner() {
  const t = useTranslations("Home");

  return (
    <div className="relative mx-auto w-full max-w-[1488px]">

      {/* Content Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none flex h-full items-center justify-center md:justify-start px-[9%]">

        {/* Left text — desktop only */}
        <div className="hidden md:block max-w-[230px] lg:max-w-[310px]">
          <h2 className="text-[22px] lg:text-[26px] xl:text-[28px] font-black text-white leading-[1.2] tracking-tight">
            {t("bannerTitle")}
          </h2>
          <p className="w-max tracking-wider mt-1 text-[12px] lg:text-[13px] xl:text-[14px] font-regular text-white/80 leading-relaxed" style={{ fontFamily: "var(--font-manrope)" }}>
            {t("bannerSubtitle")}
          </p>
        </div>

        {/* bq — centered on mobile, pushed right on desktop */}
        <div className="flex items-center shrink-0 text-white font-black leading-none tracking-tighter text-[70px] sm:text-[85px] md:ml-auto md:text-[80px] lg:text-[110px] xl:text-[135px]">
          bq
        </div>

      </div>

      {/* Responsive banner image */}
      <picture className="block w-full aspect-[375/160] min-[430px]:aspect-[43/18] md:aspect-[768/220] lg:aspect-[24/5] [filter:drop-shadow(0_8px_24px_rgba(12,36,85,0.18))]">
        {bannerSources.map((source) => (
          <source key={source.media} media={source.media} srcSet={source.srcSet} />
        ))}
        <img
          src="/images/banners/mobilest.svg"
          alt="Birga Quramiz banner"
          className="w-full h-full object-cover"
          fetchPriority="high"
          loading="eager"
        />
      </picture>

    </div>
  );
}
