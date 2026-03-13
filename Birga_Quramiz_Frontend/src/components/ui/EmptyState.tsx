"use client";

import { LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  buttonText: string;
  buttonHref: string;
  secondaryIcon?: LucideIcon;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  buttonText,
  buttonHref,
  secondaryIcon: SecondaryIcon,
}: EmptyStateProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center px-8 text-center min-h-[75dvh] md:min-h-[70vh] -mt-5 md:mt-0">
      <div className="relative mb-8 md:mb-10 w-fit">
        <div className="flex size-28 md:size-40 items-center justify-center rounded-full bg-[#1B4D91]/5">
          <Icon className="size-14 md:size-20 text-[#1B4D91]/15" />
        </div>
        {SecondaryIcon && (
          <div className="absolute -bottom-1 -right-1 md:bottom-1 md:right-1 flex size-10 md:size-14 items-center justify-center rounded-full bg-[#E31E24]/10 shadow-sm border border-white/50 backdrop-blur-sm">
            <SecondaryIcon className="size-5 md:size-7 text-[#E31E24]/40" />
          </div>
        )}
      </div>

      <h1 className="text-2xl md:text-3xl font-black text-[#1B4D91] leading-tight max-w-[280px] md:max-w-md">
        {title}
      </h1>
      <p className="mt-2 md:mt-4 max-w-[240px] md:max-w-sm text-[13.5px] md:text-[16px] font-medium text-slate-400 leading-relaxed translate-y-1">
        {description}
      </p>

      <button
        onClick={() => router.push(buttonHref)}
        className="mt-10 h-13 md:h-[60px] w-full max-w-[280px] md:max-w-[340px] rounded-2xl md:rounded-[24px] bg-navbar-gradient hover:shadow-xl hover:shadow-[#1B4D91]/30 text-[14px] md:text-[16px] font-black text-white shadow-lg shadow-[#1B4D91]/20 active:scale-[0.97] transition-all"
      >
        {buttonText}
      </button>
    </div>
  );
}
