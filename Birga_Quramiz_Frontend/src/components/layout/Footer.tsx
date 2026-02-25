"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/useAuth";

export default function Footer() {
  const t = useTranslations("Footer");
  const { user } = useAuth();
  const logoSrc = user?.role === "SELLER" ? "/sellers-panel-logo.png" : "/logo.png";

  return (
    <footer className="mt-12 border-t border-border/80 bg-[#0f3154] text-white">
      <div className="page-shell grid gap-8 py-10 md:grid-cols-[1.2fr,1fr,1fr]">
        <div>
          <Link href="/" className="inline-flex items-center">
            <Image
              src={logoSrc}
              alt="Birga Quramiz"
              width={240}
              height={56}
              className="h-10 w-auto"
            />
          </Link>
          <p className="mt-3 text-sm text-blue-100">Construction materials marketplace</p>
          <p className="mt-1 text-xs text-blue-200/90">est. 2025</p>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-100">{t("marketplace")}</p>
          <div className="mt-3 space-y-2">
            <Link href="/catalog" className="block text-sm text-white/90 hover:text-[#ec7a10]">{t("marketplace")}</Link>
            <Link href="/builders" className="block text-sm text-white/90 hover:text-[#ec7a10]">Builders</Link>
            <Link href="/equipment" className="block text-sm text-white/90 hover:text-[#ec7a10]">Equipment</Link>
            <Link href="/ai-chat" className="block text-sm text-white/90 hover:text-[#ec7a10]">AI Consultant</Link>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-100">{t("support")}</p>
          <div className="mt-3 space-y-2 text-sm text-white/90">
            <a href="tel:+998900000000" className="block hover:text-[#ec7a10]">+998 90 000 00 00</a>
            <a href="mailto:info@birgaquramiz.uz" className="block hover:text-[#ec7a10]">info@birgaquramiz.uz</a>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-7xl items-center px-4 py-4 text-xs text-blue-100 md:px-6">
          <p>© 2025 Birga Quramiz. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}


