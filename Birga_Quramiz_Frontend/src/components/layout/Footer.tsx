"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/store/authStore";
import { Mail, Phone, Linkedin, Twitter } from "lucide-react";

const CURRENT_YEAR = new Date().getFullYear();

const footerGradient =
  "linear-gradient(97.26deg, #163b92 0.49%, #1a429e 14.88%, #1f4cac 29.27%, #2559bc 43.14%, #2c66cb 57.02%, #2f6fd5 70.89%, #295fbf 84.76%, #214da8 99.15%), linear-gradient(rgba(0,0,0,0.08), rgba(0,0,0,0.08))";

export default function Footer() {
  const t = useTranslations("Footer");
  const userRole = useAuthStore((state) => state.user?.role);
  const socialLabels = useMemo(() => ({
    linkedin: t.has("linkedin") ? t("linkedin") : "LinkedIn",
    instagram: t.has("instagram") ? t("instagram") : "Instagram",
    twitter: t.has("twitter") ? t("twitter") : "Twitter",
    telegram: t.has("telegram") ? t("telegram") : "Telegram",
  }), [t]);

  return (
    <footer 
      className="hidden lg:block relative overflow-hidden text-white"
      style={{ background: footerGradient }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),transparent_38%,rgba(0,0,0,0.08))] pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-px bg-white/20 pointer-events-none" />

      {/* Main footer columns */}
      <div className="mx-auto max-w-[1488px] px-6 py-16 grid grid-cols-4 gap-12">

        {/* Brand column */}
        <div className="col-span-1 flex flex-col items-start pr-4">
          <Link 
            href={userRole === "ADMIN" ? "/admin" : userRole === "SELLER" ? "/seller/dashboard" : "/"}
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
              href="https://instagram.com/birgaquramiz_uz"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={socialLabels.instagram}
              className="text-white/40 hover:text-white transition-colors"
            >
              <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            <a
              href="#"
              aria-label={socialLabels.twitter}
              className="text-white/40 hover:text-white transition-colors"
            >
              <Twitter className="size-5" />
            </a>
            <a
              href="https://t.me/birga_quramiz_bot"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={socialLabels.telegram}
              className="text-white/40 hover:text-white transition-colors"
            >
              <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
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
          <div className="space-y-4">
            <a
              href="tel:+998903212761"
              className="flex items-center gap-3 group hover:opacity-80 transition-opacity"
            >
              <div className="flex size-8 items-center justify-center rounded-xl bg-white/10 text-white/70 shrink-0">
                <Phone className="size-4" />
              </div>
              <span className="text-[14px] font-medium text-white/75 group-hover:text-white transition-colors">+998 90 321 27 61</span>
            </a>

            <a
              href="https://t.me/bq_help"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 group hover:opacity-80 transition-opacity"
            >
              <div className="flex size-8 items-center justify-center rounded-xl bg-white/10 text-white/70 shrink-0">
                <Mail className="size-4" />
              </div>
              <span className="text-[14px] font-medium text-white/75 group-hover:text-white transition-colors">info@birgaquramiz.uz</span>
            </a>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 bg-black/10">
        <div className="mx-auto flex w-full max-w-[1488px] items-center justify-between px-6 py-5 text-[12px] text-white/50 font-medium tracking-wide">
          <p>© {CURRENT_YEAR} Birga Quramiz. {t("rights")}</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-white transition-colors">{t("privacyLink")}</Link>
            <Link href="#" className="hover:text-white transition-colors">{t("termsLink")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
