"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/useAuth";
import { Mail, Phone, MapPin, ExternalLink } from "lucide-react";

export default function Footer() {
  const t = useTranslations("Footer");
  const { user } = useAuth();
  const logoSrc = user?.role === "SELLER" ? "/sellers-panel-logo.png" : "/logo.png";

  const year = new Date().getFullYear();

  return (
    <footer className="hidden md:block mt-16 bg-[#1B4D91] text-white">
      {/* Main footer columns */}
      <div className="mx-auto max-w-7xl px-6 py-16 grid grid-cols-4 gap-12">

        {/* Brand column */}
        <div className="col-span-1 flex flex-col items-start pr-4">
          <Link href="/" className="inline-flex mb-6 hover:opacity-90 transition-opacity">
            <Image
              src={logoSrc}
              alt="Birga Quramiz"
              width={200}
              height={52}
              className="h-12 w-auto brightness-0 invert"
            />
          </Link>
          <p className="text-[14px] leading-relaxed text-white/70">
            {t("description")}
          </p>
          <div className="mt-8 flex gap-3">
            <a
              href="tel:+998900000000"
              className="flex size-10 items-center justify-center rounded-2xl bg-white/10 text-white/90 hover:bg-white hover:text-[#1B4D91] hover:scale-105 active:scale-95 transition-all"
            >
              <Phone className="size-[18px]" />
            </a>
            <a
              href="mailto:info@birgaquramiz.uz"
              className="flex size-10 items-center justify-center rounded-2xl bg-white/10 text-white/90 hover:bg-white hover:text-[#1B4D91] hover:scale-105 active:scale-95 transition-all"
            >
              <Mail className="size-[18px]" />
            </a>
            <a
              href="#"
              className="flex size-10 items-center justify-center rounded-2xl bg-white/10 text-white/90 hover:bg-white hover:text-[#1B4D91] hover:scale-105 active:scale-95 transition-all"
            >
              <MapPin className="size-[18px]" />
            </a>
          </div>
        </div>

        {/* Marketplace links */}
        <div>
          <p className="text-[12px] font-black uppercase tracking-[0.18em] text-white/50 mb-6">
            {t("marketplace")}
          </p>
          <ul className="space-y-4">
            {[
              { href: "/catalog", label: t("catalogLink") },
              { href: "/builders", label: t("buildersLink") },
              { href: "/equipment", label: t("equipmentLink") },
              { href: "/ai-chat", label: t("aiChatLink") },
            ].map(({ href, label }) => (
              <li key={href}>
                <Link
                  prefetch={false}
                  href={href}
                  className="text-[14px] font-medium text-white/75 hover:text-white transition-colors flex items-center gap-2 group"
                >
                  <span className="w-0 h-px bg-white transition-all group-hover:w-3" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Business links */}
        <div>
          <p className="text-[12px] font-black uppercase tracking-[0.18em] text-white/50 mb-6">
            {t("business")}
          </p>
          <ul className="space-y-4">
            {[
              { href: "/become-seller", label: t("becomeSellerLink") },
              { href: "/seller/dashboard", label: t("sellerPanelLink") },
              { href: "/admin", label: t("adminLink") },
            ].map(({ href, label }) => (
              <li key={href}>
                <Link
                  prefetch={false}
                  href={href}
                  className="text-[14px] font-medium text-white/75 hover:text-white transition-colors flex items-center gap-2 group"
                >
                  <span className="w-0 h-px bg-white transition-all group-hover:w-3" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Support */}
        <div>
          <p className="text-[12px] font-black uppercase tracking-[0.18em] text-white/50 mb-6">
            {t("support")}
          </p>
          <ul className="space-y-4">
            <li>
              <a
                href="tel:+998900000000"
                className="flex items-center gap-3 text-[14px] font-medium text-white/75 hover:text-white transition-colors p-3 rounded-2xl bg-white/5 hover:bg-white/10"
              >
                <div className="flex size-8 items-center justify-center rounded-xl bg-white/10 text-white shrink-0">
                  <Phone className="size-4" />
                </div>
                +998 90 000 00 00
              </a>
            </li>
            <li>
              <a
                href="mailto:info@birgaquramiz.uz"
                className="flex items-center gap-3 text-[14px] font-medium text-white/75 hover:text-white transition-colors p-3 rounded-2xl bg-white/5 hover:bg-white/10"
              >
                <div className="flex size-8 items-center justify-center rounded-xl bg-white/10 text-white shrink-0">
                  <Mail className="size-4" />
                </div>
                info@birgaquramiz.uz
              </a>
            </li>
            <li>
              <Link
                prefetch={false}
                href="/faq"
                className="flex items-center gap-3 text-[14px] font-medium text-white/75 hover:text-white transition-colors ml-1 mt-2 group"
              >
                <ExternalLink className="size-4 shrink-0 text-white/30 group-hover:text-white" />
                {t("faqLink")}
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 bg-black/10">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5 text-[12px] text-white/50 font-medium tracking-wide">
          <p>© {year} Birga Quramiz. {t("rights")}</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-white transition-colors">{t("privacyLink")}</Link>
            <Link href="#" className="hover:text-white transition-colors">{t("termsLink")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
