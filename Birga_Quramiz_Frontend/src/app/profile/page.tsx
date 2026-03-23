"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/authStore";
import { logout as apiLogout } from "@/lib/api/auth";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCartStore } from "@/store/cartStore";
import { useFavorites } from "@/hooks/useFavorites";
import {
  User2, HelpCircle, Store, Heart,
  ChevronRight, LogOut, Package,
  Bot, ShoppingCart, Globe,
  Truck, CreditCard, RefreshCw, Phone,
  ShieldCheck, Settings, UserPlus,
} from "lucide-react";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";

type MenuItemType = {
  label: string;
  icon: React.ElementType;
  href: string;
  accent: string;
  badge?: string;
  count?: number | null;
};

function MenuItem({ item }: { item: MenuItemType }) {
  const Icon = item.icon;
  const isExternal = item.href.startsWith("tel:") || item.href.startsWith("http");
  const Comp = isExternal ? "a" : Link;

  return (
    <Comp
      href={item.href}
      className="flex w-full items-center gap-4 px-5 py-[15px] transition-colors hover:bg-[#1B4D91]/3 active:bg-[#1B4D91]/5 group select-none touch-manipulation"
    >
      <div
        className="flex size-9 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${item.accent}15`, color: item.accent }}
      >
        <Icon className="size-[18px]" />
      </div>
      <span className="text-[13.5px] font-semibold text-slate-700 flex-1 group-hover:text-[#1B4D91] transition-colors">
        {item.label}
      </span>
      {item.badge && (
        <span className="rounded-lg bg-[#7c3aed]/10 px-2 py-0.5 text-[9px] font-black text-[#7c3aed] uppercase tracking-wider">
          {item.badge}
        </span>
      )}
      {item.count != null && item.count > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E31E24] px-1 text-[10px] font-black text-white">
          {item.count > 99 ? "99+" : item.count}
        </span>
      )}
      <ChevronRight className="size-4 text-slate-300 group-hover:text-[#1B4D91]/50 transition-colors shrink-0" />
    </Comp>
  );
}

function Section({ title, items }: { title: string; items: MenuItemType[] }) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-2">
      <p className="px-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{title}</p>
      <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white divide-y divide-[#f4f6fa]">
        {items.map((item, i) => <MenuItem key={i} item={item} />)}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuth();
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();
  const t = useTranslations("Profile");
  const cartCount = useCartStore((s) => s.items.reduce((s, i) => s + i.quantity, 0));
  const { items: favItems } = useFavorites();

  const handleLogout = async () => {
    try { await apiLogout(); } catch { /* ignore */ }
    logout();
    router.push("/");
  };

  // ── Section: My Account (logged in only) ──
  const accountItems: MenuItemType[] = isAuthenticated ? [
    { label: t("myOrders"), icon: Package, href: "/orders", accent: "#1B4D91" },
    { label: t("favoritesLink"), icon: Heart, href: "/favorites", accent: "#E31E24", count: favItems.length },
    { label: t("cart"), icon: ShoppingCart, href: "/cart", accent: "#1B4D91", count: cartCount },
  ] : [];

  // ── Section: Services ──
  const serviceItems: MenuItemType[] = [
    { label: t("aiConsultant"), icon: Bot, href: "/ai-chat", accent: "#7c3aed", badge: t("beta") },
    ...(user?.role === "USER" ? [{ label: t("becomeSeller"), icon: UserPlus, href: "/seller-register", accent: "#1B4D91" }] : []),
    ...(user?.role === "ADMIN" ? [{ label: "Admin panel", icon: ShieldCheck, href: "/admin", accent: "#059669" }] : []),
  ];

  // ── Section: Information ──
  const infoItems: MenuItemType[] = [
    { label: t("delivery"), icon: Truck, href: "/help/delivery", accent: "#1B4D91" },
    { label: t("payment"), icon: CreditCard, href: "/help", accent: "#1B4D91" },
    { label: t("returns"), icon: RefreshCw, href: "/help/return", accent: "#1B4D91" },
    { label: t("support"), icon: Phone, href: "tel:+998900000000", accent: "#1B4D91" },
    { label: t("faq"), icon: HelpCircle, href: "/help/faq", accent: "#1B4D91" },
  ];

  if (!user && isAuthenticated) {
    return (
      <div className="flex flex-col min-h-screen bg-[#f4f6fa] pb-40 md:pb-12">
        <div className="mx-auto w-full max-w-lg px-4 pt-6">
          <div className="h-32 animate-pulse rounded-3xl bg-white" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f6fa] pb-40 md:pb-12">
      <div className="mx-auto w-full max-w-[1440px]">
        <div className="flex flex-col gap-0 md:px-6 md:pt-6">

          {/* Desktop page title */}
          <div className="hidden md:flex items-center gap-3 mb-6 px-0">
            <h1 className="text-2xl font-black text-[#1B4D91]">{t("title")}</h1>
            {isAuthenticated && user && (
              <span className="rounded-xl bg-[#1B4D91]/8 px-3 py-1 text-[11px] font-black text-[#1B4D91] uppercase tracking-wider">
                {t(`roles.${user.role}`) || user.role}
              </span>
            )}
          </div>

          <div className="md:grid md:grid-cols-[300px_1fr] md:gap-6 md:items-start px-4 pt-4 md:px-0 md:pt-0">

            {/* ── LEFT: User card (sticky on desktop) ── */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 md:sticky md:top-24 space-y-4">

              {/* Avatar + info */}
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <div className="flex size-[64px] items-center justify-center rounded-2xl bg-gradient-to-br from-[#1B4D91]/20 to-[#1B4D91]/5 border border-[#1B4D91]/10">
                    <User2 className="size-7 text-[#1B4D91]" />
                  </div>
                  {isAuthenticated && (
                    <span className="absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white">
                      <span className="size-2 rounded-full bg-white" />
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  {isAuthenticated ? (
                    <>
                      <h2 className="text-[17px] font-black text-[#1B4D91] truncate">
                        {user?.name || t("defaultUser")}
                      </h2>
                      <p className="text-[12px] font-medium text-slate-400 mt-0.5">{user?.phone}</p>
                    </>
                  ) : (
                    <>
                      <h2 className="text-[17px] font-black text-[#1B4D91]">{t("greetGuest")}</h2>
                      <p className="text-[12px] font-medium text-slate-400 mt-0.5 line-clamp-1">{t("loginPrompt")}</p>
                    </>
                  )}
                </div>

                {!isAuthenticated && (
                  <Link
                    href="/login"
                    className="shrink-0 h-10 px-5 flex items-center justify-center rounded-full bg-navbar-gradient text-[12px] font-black text-white shadow-sm active:scale-95 transition-all"
                  >
                    {t("signIn")}
                  </Link>
                )}
              </div>


              {/* Seller dashboard card */}
              {user?.role === "SELLER" && (
                <Link
                  href="/seller/dashboard"
                  className="flex items-center justify-between rounded-2xl bg-navbar-gradient p-4 text-white shadow-lg shadow-[#1B4D91]/20 hover:shadow-xl active:scale-[0.98] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-white/15">
                      <Store className="size-4" />
                    </div>
                    <div>
                      <p className="text-[13px] font-black">{t("sellerDashboard")}</p>
                      <p className="text-[11px] font-medium opacity-60">{t("sellerDashboardSub")}</p>
                    </div>
                  </div>
                  <ChevronRight className="size-4 opacity-50 shrink-0" />
                </Link>
              )}

              {/* Edit profile — desktop */}
              {isAuthenticated && (
                <button className="hidden md:flex w-full items-center gap-2 rounded-2xl border border-slate-200 bg-[#f4f6fa] px-4 py-3 text-[12px] font-semibold text-slate-600 hover:bg-slate-100 transition-colors">
                  <Settings className="size-4" />
                  {t("editProfile")}
                </button>
              )}

              {/* Logout — desktop */}
              {isAuthenticated && (
                <button
                  onClick={handleLogout}
                  className="hidden md:flex w-full items-center justify-center gap-2.5 h-11 rounded-2xl border border-[#E31E24]/15 bg-[#E31E24]/5 text-[13px] font-bold text-[#E31E24] hover:bg-[#E31E24]/10 transition-colors"
                >
                  <LogOut className="size-4" />
                  {t("logout")}
                </button>
              )}
            </div>

            {/* ── RIGHT: Sections ── */}
            <div className="mt-5 md:mt-0 space-y-5 pb-4">

              {/* My account section (logged-in only) */}
              <Section title={t("myOrders")} items={accountItems} />

              {/* Services */}
              <Section title={t("services")} items={serviceItems} />

              {/* Information */}
              <Section title={t("information")} items={infoItems} />

              {/* Settings (mobile only) */}
              <div className="md:hidden space-y-2">
                <p className="px-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                  {t("generalSettings")}
                </p>
                <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white">
                  {/* Language */}
                  <div className="flex items-center gap-4 px-5 py-[15px]">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#1B4D91]/10 text-[#1B4D91]">
                      <Globe className="size-[18px]" />
                    </div>
                    <span className="flex-1 text-[13.5px] font-semibold text-slate-700">{t("language")}</span>
                    <LanguageSwitcher variant="dark" />
                  </div>
                  {/* Edit profile — mobile */}
                  {isAuthenticated && (
                    <div className="border-t border-[#f4f6fa]">
                      <button className="flex w-full items-center gap-4 px-5 py-[15px] text-left hover:bg-[#1B4D91]/3 active:bg-[#1B4D91]/5 transition-colors group">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#1B4D91]/10 text-[#1B4D91]">
                          <Settings className="size-[18px]" />
                        </div>
                        <span className="flex-1 text-[13.5px] font-semibold text-slate-700 group-hover:text-[#1B4D91] transition-colors">{t("editProfile")}</span>
                        <ChevronRight className="size-4 text-slate-300 shrink-0" />
                      </button>
                    </div>
                  )}
                  {/* Logout — inside settings card, mobile */}
                  {isAuthenticated && (
                    <div className="border-t border-[#f4f6fa]">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-4 px-5 py-[15px] text-left hover:bg-[#E31E24]/3 active:bg-[#E31E24]/5 transition-colors group"
                      >
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#E31E24]/10 text-[#E31E24]">
                          <LogOut className="size-[18px]" />
                        </div>
                        <span className="flex-1 text-[13.5px] font-semibold text-[#E31E24]">{t("logout")}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
