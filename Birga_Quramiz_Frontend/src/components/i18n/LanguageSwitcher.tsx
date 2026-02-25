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
  en: { flag: "/flags/us.png", short: "EN" },
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
          className="inline-flex h-8 items-center gap-2 rounded-full border border-white/30 bg-white/10 px-2.5 text-xs font-medium text-white transition hover:bg-white/20"
          aria-label="Language"
        >
          <Image
            src={current.flag}
            alt={t(locale)}
            width={16}
            height={16}
            className="size-4 rounded-full object-cover"
          />
          <span className="hidden sm:inline">{t(locale)}</span>
          <span className="sm:hidden">{current.short}</span>
          <ChevronDown className="size-3.5 opacity-80" />
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
