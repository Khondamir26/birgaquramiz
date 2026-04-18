"use client";

import Image from "next/image";
import { ChevronDown, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { locales, type AppLocale } from "@/i18n/routing";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LANGUAGE_META: Record<AppLocale, { flag: string; short: string }> = {
  en: { flag: "/flags/en.png", short: "EN" },
  ru: { flag: "/flags/ru.png", short: "RU" },
  uz: { flag: "/flags/uz.png", short: "UZ" },
};

export default function LanguageSwitcher({ 
  compact = false,
  variant = "light"
}: { 
  compact?: boolean;
  variant?: "light" | "dark";
}) {
  const router = useRouter();
  const locale = useLocale() as AppLocale;
  const t = useTranslations("Languages");

  const onChange = async (nextLocale: AppLocale) => {
    if (nextLocale === locale) return;

    await fetch("/api/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: nextLocale }),
    });

    router.refresh();
  };

  const current = LANGUAGE_META[locale];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild suppressHydrationWarning>
        <button
          type="button"
          className={`inline-flex items-center bg-transparent font-bold transition-all tap-highlight-none outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 active:outline-none ${
            variant === "light" ? "text-white" : "text-slate-700"
          } ${
            compact ? "h-8 gap-1.5 px-1.5 text-[12px]" : "h-10 gap-2 px-1.5 text-[13px]"
          }`}
          aria-label="Language"
        >
          <Image
            src={current.flag}
            alt={t(locale)}
            width={20}
            height={20}
            className={`${compact ? "size-4" : "size-5"} rounded-full object-cover border border-slate-100 shadow-sm`}
          />
          <span className="font-bold">{current.short}</span>
          <ChevronDown className={`${compact ? "size-3.5" : "size-4"} ${variant === "light" ? "text-white/80" : "text-slate-400"}`} />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-40 rounded-xl border border-slate-200/80 bg-white p-1.5 shadow-xl"
      >
        {locales.map((item) => {
          const meta = LANGUAGE_META[item];
          const active = item === locale;

          return (
            <DropdownMenuItem
              key={item}
              onSelect={() => void onChange(item)}
              className="rounded-lg px-2.5 py-2 text-sm font-medium text-slate-700"
            >
              <Image
                src={meta.flag}
                alt={t(item)}
                width={18}
                height={18}
                className="size-[18px] rounded-full object-cover"
              />
              <span>{t(item)}</span>
              {active && <Check className="ml-auto size-4 text-[#0f3154]" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
