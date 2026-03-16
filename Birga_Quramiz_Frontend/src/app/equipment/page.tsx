"use client";

import { useTranslations } from "next-intl";
import { Gauge, MapPin, ShieldCheck, Truck, CalendarCheck } from "lucide-react";

const fleet = [
  { id: "exc-1", name: "Excavator CAT 320", rate: "340 000 UZS", period: "perHour" as const, status: "available", location: "Tashkent" },
  { id: "pump-1", name: "Concrete Pump 42m", rate: "620 000 UZS", period: "perHour" as const, status: "busy", location: "Chirchiq" },
  { id: "crane-1", name: "Tower Crane KTZ", rate: "1 200 000 UZS", period: "perDay" as const, status: "available", location: "Samarkand" },
];

export default function EquipmentPage() {
  const t = useTranslations("Equipment");

  return (
    <div className="flex flex-col pb-44 bg-[#f4f6fa] md:pb-12">
      <div className="mx-auto w-full md:max-w-[1440px]">
        <div className="mx-auto flex flex-col gap-6 px-4 md:px-6 max-w-md md:max-w-none pt-4 md:pt-6">

          {/* Hero banner */}
          <div className="rounded-3xl bg-[#1B4D91] px-6 py-9 md:px-10">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/50 mb-1">Birga Quramiz</p>
            <h1 className="text-2xl font-black text-white md:text-3xl">{t("title")}</h1>
            <p className="mt-2 max-w-xl text-[13px] text-white/70 md:text-[14px]">{t("subtitle")}</p>
          </div>

          {/* Equipment cards */}
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 md:gap-4">
            {fleet.map((item) => (
              <article
                key={item.id}
                className="surface-card p-5 flex flex-col gap-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[#1B4D91]/8 text-[#1B4D91]">
                    <Truck className="size-6" />
                  </div>
                  <span className={`mt-1 rounded-xl px-2.5 py-1 text-[10px] font-black ${item.status === "available" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                    {item.status === "available" ? t("available") : "Занят до 16:00"}
                  </span>
                </div>

                <h2 className="text-[15px] font-black text-[#1B4D91] leading-snug">{item.name}</h2>

                <div className="space-y-2">
                  <div className="flex items-center gap-2.5 text-[13px] font-semibold text-slate-600">
                    <Gauge className="size-4 text-[#1B4D91]/50 shrink-0" />
                    <span>{item.rate} <span className="text-slate-400 font-normal">{t(item.period)}</span></span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[13px] font-semibold text-slate-600">
                    <MapPin className="size-4 text-[#1B4D91]/50 shrink-0" />
                    <span>{item.location}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-2xl bg-[#1B4D91]/5 border border-[#1B4D91]/10 px-4 py-2.5">
                  <ShieldCheck className="size-4 text-[#1B4D91] shrink-0" />
                  <p className="text-[12px] font-semibold text-[#1B4D91]">{t("gpsVerified")}</p>
                </div>

                <button
                  disabled={item.status !== "available"}
                  className="flex items-center justify-center gap-2 h-11 rounded-2xl bg-[#E31E24] text-[13px] font-black text-white shadow-sm shadow-[#E31E24]/20 active:scale-[0.97] transition-transform disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <CalendarCheck className="size-4" />
                  {t("book")}
                </button>
              </article>
            ))}
          </div>

          {/* Coming soon */}
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 py-5">
            <Truck className="size-4 text-slate-300" />
            <p className="text-[12px] font-semibold text-slate-400">{t("comingSoon")}</p>
          </div>

        </div>
      </div>
    </div>
  );
}
