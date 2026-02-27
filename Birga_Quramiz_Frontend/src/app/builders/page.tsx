"use client";

import { useTranslations } from "next-intl";
import { BadgeCheck, BriefcaseBusiness, MapPin, ShieldCheck, Star, ChevronRight } from "lucide-react";
import Link from "next/link";

const builders = [
  { id: "builder-1", name: "Usta Pro Team", years: 9, rating: 4.9, area: "Tashkent", available: true },
  { id: "builder-2", name: "Master Beton Group", years: 12, rating: 4.8, area: "Samarkand", available: true },
  { id: "builder-3", name: "Archi Build Brigada", years: 7, rating: 4.7, area: "Bukhara", available: false },
];

export default function BuildersPage() {
  const t = useTranslations("Builders");

  return (
    <div className="flex flex-col pb-44 bg-[#f4f6fa] md:pb-12">
      <div className="mx-auto w-full md:max-w-7xl">
        <div className="mx-auto flex flex-col gap-6 px-4 md:px-6 max-w-md md:max-w-none pt-4 md:pt-6">

          {/* Hero banner */}
          <div className="rounded-3xl bg-[#1B4D91] px-6 py-9 md:px-10">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/50 mb-1">Birga Quramiz</p>
            <h1 className="text-2xl font-black text-white md:text-3xl">{t("title")}</h1>
            <p className="mt-2 max-w-xl text-[13px] text-white/70 md:text-[14px]">{t("subtitle")}</p>
          </div>

          {/* Builder cards */}
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 md:gap-4">
            {builders.map((builder) => (
              <article
                key={builder.id}
                className="rounded-3xl bg-white border border-slate-100 p-5 shadow-sm flex flex-col gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[#1B4D91]/8 text-[#1B4D91]">
                    <BriefcaseBusiness className="size-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-[15px] font-black text-[#1B4D91] truncate">{builder.name}</h2>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <MapPin className="size-3 text-slate-400" />
                      <p className="text-[12px] font-medium text-slate-400">{builder.area}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-xl px-2.5 py-1 text-[10px] font-black ${builder.available ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
                    {builder.available ? t("available") : t("busy")}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-2xl bg-[#f4f6fa] px-3 py-2.5">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t("experience")}</p>
                    <p className="text-[15px] font-black text-[#1B4D91] mt-0.5">{builder.years}</p>
                  </div>
                  <div className="rounded-2xl bg-[#f4f6fa] px-3 py-2.5">
                    <div className="flex items-center gap-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t("rating")}</p>
                      <Star className="size-2.5 fill-[#f9b41b] text-[#f9b41b]" />
                    </div>
                    <p className="text-[15px] font-black text-[#1B4D91] mt-0.5">{builder.rating}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-2xl bg-[#1B4D91]/5 border border-[#1B4D91]/10 px-4 py-2.5">
                  <ShieldCheck className="size-4 text-[#1B4D91] shrink-0" />
                  <p className="text-[12px] font-semibold text-[#1B4D91]">{t("verified")}</p>
                </div>

                <Link
                  href={`/builders/${builder.id}`}
                  className="flex items-center justify-center gap-2 h-11 rounded-2xl border-2 border-[#1B4D91]/20 text-[13px] font-black text-[#1B4D91] hover:bg-[#1B4D91]/5 active:bg-[#1B4D91]/10 transition-colors"
                >
                  {t("viewProfile")}
                  <ChevronRight className="size-4" />
                </Link>
              </article>
            ))}
          </div>

          {/* Coming soon */}
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 py-5">
            <BadgeCheck className="size-4 text-slate-300" />
            <p className="text-[12px] font-semibold text-slate-400">{t("comingSoon")}</p>
          </div>

        </div>
      </div>
    </div>
  );
}
