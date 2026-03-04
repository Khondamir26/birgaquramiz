"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/useAuth";
import { Mail, Phone, MapPin, ExternalLink, Linkedin, Instagram, Twitter, Facebook } from "lucide-react";

export default function Footer() {
  const t = useTranslations("Footer");
  const { user } = useAuth();
  const logoSrc = user?.role === "SELLER" ? "/sellers-panel-logo.png" : "/logo.png";
  const socialLabels = {
    linkedin: t.has("linkedin") ? t("linkedin") : "LinkedIn",
    instagram: t.has("instagram") ? t("instagram") : "Instagram",
    twitter: t.has("twitter") ? t("twitter") : "Twitter",
    facebook: t.has("facebook") ? t("facebook") : "Facebook",
  };

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
          <p className="text-[14px] leading-relaxed text-white/70 mb-8">
            {t("description")}
          </p>

          {/* Social Icons Row */}
          <div className="flex items-center gap-6">
            <a
              href="#"
              aria-label={socialLabels.linkedin}
              className="text-white/40 hover:text-white transition-colors"
            >
              <Linkedin className="size-5" />
            </a>
            <a
              href="#"
              aria-label={socialLabels.instagram}
              className="text-white/40 hover:text-white transition-colors"
            >
              <Instagram className="size-5" />
            </a>
            <a
              href="#"
              aria-label={socialLabels.twitter}
              className="text-white/40 hover:text-white transition-colors"
            >
              <Twitter className="size-5" />
            </a>
            <a
              href="#"
              aria-label={socialLabels.facebook}
              className="text-white/40 hover:text-white transition-colors"
            >
              <Facebook className="size-5" />
            </a>
          </div>
        </div>

        {/* Business links */}
        <div>
          <p className="text-[12px] font-black uppercase tracking-[0.18em] text-white/50 mb-6">
            {t("business")}
          </p>
          <ul className="space-y-4">
            {[
              { href: "/seller-register", label: t("becomeSellerLink") },
              { href: "/about", label: t("about") },
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

        {/* Support links */}
        <div>
          <p className="text-[12px] font-black uppercase tracking-[0.18em] text-white/50 mb-6">
            {t("support")}
          </p>
          <ul className="space-y-4">
            {[
              { href: "/help", label: t("payment") },
              { href: "/help/delivery", label: t("delivery") },
              { href: "/help/gauranties", label: t("guarantee") },
              { href: "/help/return", label: t("returns") },
              { href: "/help/credit", label: t("credit") },
              { href: "/help/faq", label: t("faqLink") },
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

        {/* Contacts column */}
        <div>
          <p className="text-[12px] font-black uppercase tracking-[0.18em] text-white/50 mb-6">
            {t("contacts")}
          </p>
          <div className="space-y-3">
            <a
              href="tel:+998900000000"
              className="flex items-center gap-4 rounded-3xl bg-white/5 p-3 pr-6 hover:bg-white/10 transition-all group border border-white/5"
            >
              <div className="flex size-10 items-center justify-center rounded-2xl bg-white/10 text-white/90 group-hover:bg-[#1B4D91] group-hover:text-white transition-all shadow-sm">
                <Phone className="size-[18px]" />
              </div>
              <span className="text-[14px] font-bold tracking-tight text-white/90">+998 90 000 00 00</span>
            </a>

            <a
              href="mailto:info@birgaquramiz.uz"
              className="flex items-center gap-4 rounded-3xl bg-white/5 p-3 pr-6 hover:bg-white/10 transition-all group border border-white/5"
            >
              <div className="flex size-10 items-center justify-center rounded-2xl bg-white/10 text-white/90 group-hover:bg-[#1B4D91] group-hover:text-white transition-all shadow-sm">
                <Mail className="size-[18px]" />
              </div>
              <span className="text-[14px] font-bold tracking-tight text-white/90">info@birgaquramiz.uz</span>
            </a>
          </div>
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
