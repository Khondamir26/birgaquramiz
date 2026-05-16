"use client";

import Image from "next/image";
import { ChevronDown, Check } from "lucide-react";
import { useDispatcherLocaleStore } from "@/store/dispatcherLocaleStore";
import type { DLocale } from "@/lib/i18n/dispatcher-translations";

const LOCALES: { locale: DLocale; flag: string; short: string }[] = [
  { locale: "ru", flag: "/flags/ru.png", short: "RU" },
  { locale: "uz", flag: "/flags/uz.png", short: "UZ" },
  { locale: "en", flag: "/flags/en.png", short: "EN" },
];

export default function DispatcherLocaleSwitcher() {
  const { locale, setLocale } = useDispatcherLocaleStore();
  const current = LOCALES.find((l) => l.locale === locale) ?? LOCALES[0];

  return (
    <div className="relative group">
      <button
        type="button"
        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[12px] font-bold text-white/70 transition hover:bg-white/10 hover:text-white"
        aria-label="Change language"
      >
        <Image
          src={current.flag}
          alt={current.short}
          width={16}
          height={16}
          className="size-4 rounded-full object-cover border border-white/20"
          onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
        <span>{current.short}</span>
        <ChevronDown className="size-3 text-white/50" />
      </button>

      {/* Dropdown — visible on group-hover */}
      <div className="absolute right-0 top-full z-50 mt-1 hidden w-32 rounded-xl border border-slate-200/80 bg-white p-1.5 shadow-xl group-hover:block">
        {LOCALES.map(({ locale: loc, flag, short }) => {
          const labels: Record<DLocale, string> = { ru: "Русский", uz: "O'zbekcha", en: "English" };
          const active = loc === locale;
          return (
            <button
              key={loc}
              onClick={() => setLocale(loc)}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <Image
                src={flag}
                alt={short}
                width={16}
                height={16}
                className="size-4 rounded-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
              <span className="flex-1 text-left">{labels[loc]}</span>
              {active && <Check className="size-3.5 text-[#1B4D91]" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
