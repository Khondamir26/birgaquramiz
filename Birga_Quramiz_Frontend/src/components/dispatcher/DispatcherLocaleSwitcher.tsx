"use client";

import Image from "next/image";
import { ChevronDown, Check } from "lucide-react";
import { useDispatcherLocaleStore } from "@/store/dispatcherLocaleStore";
import type { DLocale } from "@/lib/i18n/dispatcher-translations";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LOCALES: { locale: DLocale; flag: string; short: string; label: string }[] = [
  { locale: "ru", flag: "/flags/ru.png", short: "RU", label: "Русский" },
  { locale: "uz", flag: "/flags/uz.png", short: "UZ", label: "O'zbekcha" },
  { locale: "en", flag: "/flags/en.png", short: "EN", label: "English" },
];

export default function DispatcherLocaleSwitcher() {
  const { locale, setLocale } = useDispatcherLocaleStore();
  const current = LOCALES.find((l) => l.locale === locale) ?? LOCALES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild suppressHydrationWarning>
        <button
          type="button"
          className="inline-flex h-10 items-center gap-2 bg-transparent px-1.5 text-[13px] font-bold text-white outline-none transition-all focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 tap-highlight-none"
          aria-label="Language"
        >
          <Image
            src={current.flag}
            alt={current.short}
            width={20}
            height={20}
            className="size-5 rounded-full object-cover border border-slate-100 shadow-sm"
          />
          <span className="font-bold">{current.short}</span>
          <ChevronDown className="size-4 text-white/80" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-40 rounded-xl border border-slate-200/80 bg-white p-1.5 shadow-xl"
      >
        {LOCALES.map(({ locale: loc, flag, label }) => {
          const active = loc === locale;
          return (
            <DropdownMenuItem
              key={loc}
              onSelect={() => setLocale(loc)}
              className="rounded-lg px-2.5 py-2 text-sm font-medium text-slate-700"
            >
              <Image
                src={flag}
                alt={label}
                width={18}
                height={18}
                className="size-[18px] rounded-full object-cover"
              />
              <span>{label}</span>
              {active && <Check className="ml-auto size-4 text-[#1B4D91]" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
