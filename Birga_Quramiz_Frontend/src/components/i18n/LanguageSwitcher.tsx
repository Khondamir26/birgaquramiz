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

export default function LanguageSwitcher() {
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
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-[13px] font-bold text-primary shadow-sm active:bg-slate-50 transition-all tap-highlight-none"
          aria-label="Language"
        >
          <Image
            src={current.flag}
            alt={t(locale)}
            width={20}
            height={20}
            className="size-5 rounded-full object-cover border border-slate-100"
          />
          <span className="font-bold">{current.short}</span>
          <ChevronDown className="size-4 text-primary/60" />
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
