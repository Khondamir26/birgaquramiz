"use client";


import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/useAuth";
import { Mail, Phone, Linkedin, Instagram, Twitter, Facebook } from "lucide-react";

const footerGradient =
  "linear-gradient(97.26deg, #163b92 0.49%, #1a429e 14.88%, #1f4cac 29.27%, #2559bc 43.14%, #2c66cb 57.02%, #2f6fd5 70.89%, #295fbf 84.76%, #214da8 99.15%), linear-gradient(rgba(0,0,0,0.08), rgba(0,0,0,0.08))";

export default function Footer() {
  const t = useTranslations("Footer");
  const { user } = useAuth();
  const socialLabels = {
    linkedin: t.has("linkedin") ? t("linkedin") : "LinkedIn",
    instagram: t.has("instagram") ? t("instagram") : "Instagram",
    twitter: t.has("twitter") ? t("twitter") : "Twitter",
    facebook: t.has("facebook") ? t("facebook") : "Facebook",
  };

  const year = new Date().getFullYear();

  return (
    <footer 
      className="hidden md:block relative overflow-hidden text-white"
      style={{ background: footerGradient }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),transparent_38%,rgba(0,0,0,0.08))] pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-px bg-white/20 pointer-events-none" />

      {/* Main footer columns */}
      <div className="mx-auto max-w-[1440px] px-6 py-16 grid grid-cols-4 gap-12">

        {/* Brand column */}
        <div className="col-span-1 flex flex-col items-start pr-4">
          <Link 
            href={user?.role === "ADMIN" ? "/admin" : user?.role === "SELLER" ? "/seller/dashboard" : "/"} 
            className="mb-6 hover:opacity-90 transition-opacity"
          >
            <span className="text-[40px] font-black lowercase leading-none tracking-[-0.07em] text-white">
              birga quramiz
            </span>
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
              { href: "/brands", label: t("brands") },
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
              href="tel:+998903212761"
              className="flex items-center gap-4 rounded-3xl bg-white/5 p-3 pr-6 hover:bg-white/10 transition-all group border border-white/5"
            >
              <div className="flex size-10 items-center justify-center rounded-2xl bg-white/10 text-white/90 group-hover:bg-[#1B4D91] group-hover:text-white transition-all shadow-sm">
                <Phone className="size-[18px]" />
              </div>
              <span className="text-[14px] font-bold tracking-tight text-white/90">+998 90 321 27 61 </span>
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
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-6 py-5 text-[12px] text-white/50 font-medium tracking-wide">
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
