"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCartStore } from "@/store/cartStore";
import { useFavorites } from "@/hooks/useFavorites";
import {
  User2, Bell, HelpCircle, Store, Heart,
  ChevronRight, LogOut, Package, MapPin, Users,
  Info, Bot, Settings, ShoppingCart, Globe
} from "lucide-react";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const t = useTranslations("Profile");
  const cartCount = useCartStore((s) => s.items.length);
  const { items: favItems } = useFavorites();

  // ── Quick stats (authenticated only) ──
  const quickStats = isAuthenticated ? [
    { label: t("myOrders") || "Заказы", icon: Package, href: "/orders", color: "#1B4D91", count: null },
    { label: t("favoritesLink") || "Избранное", icon: Heart, href: "/favorites", color: "#E31E24", count: favItems.length || null },
    { label: t("cart") || "Корзина", icon: ShoppingCart, href: "/cart", color: "#1B4D91", count: cartCount || null },
  ] : [];

  // ── General settings menu ──
  const menuItems = [
    {
      label: t("login") || "Войти в кабинет",
      icon: User2, href: "/login",
      show: !isAuthenticated,
      accent: "#1B4D91",
    },
    {
      label: t("becomeSeller") || "Стать партнёром",
      icon: Users, href: "/seller-register",
      show: user?.role === "USER",
      accent: "#1B4D91",
    },
    {
      label: t("aiConsultant") || "AI-консультант",
      icon: Bot, href: "/ai-chat",
      show: true,
      accent: "#7c3aed",
      badge: t("beta") || "Beta",
    },
    {
      label: t("notifications") || "Уведомления",
      icon: Bell, href: "/notifications",
      show: true,
      accent: "#1B4D91",
    },
    {
      label: t("pickupPoints") || "Адреса ПВЗ",
      icon: MapPin, href: "/points",
      show: true,
      accent: "#1B4D91",
    },
    {
      label: t("support") || "Служба поддержки",
      icon: HelpCircle, href: "/support",
      show: true,
      accent: "#1B4D91",
    },
    {
      label: t("faq") || "FAQ",
      icon: Info, href: "/faq",
      show: true,
      accent: "#1B4D91",
    },
  ];

  if (!user && isAuthenticated) {
    return (
      <div className="flex flex-col min-h-screen bg-[#f4f6fa] pb-40 md:pb-12">
        <div className="mx-auto w-full md:max-w-7xl">
          <div className="p-4 md:px-6 md:pt-6">
            <div className="h-40 animate-pulse rounded-3xl bg-white" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f6fa] pb-40 md:pb-12">
      <div className="mx-auto w-full md:max-w-7xl">
        <div className="mx-auto flex flex-col gap-0 max-w-md md:max-w-none pb-0 md:px-6 md:pt-6">

          {/* ── Desktop heading ── */}
          <div className="hidden md:flex items-center gap-3 mb-8">
            <h1 className="text-2xl font-black text-[#1B4D91]">{t("title")}</h1>
            {isAuthenticated && user && (
              <span className="rounded-xl bg-[#1B4D91]/8 px-3 py-1 text-[11px] font-black text-[#1B4D91] uppercase tracking-wider">
                {user.role}
              </span>
            )}
          </div>

          {/* ── Two-column desktop layout ── */}
          <div className="md:grid md:grid-cols-[300px,1fr] md:gap-6 md:items-start">

            {/* ════ LEFT COLUMN ════ */}
            <div className="bg-white px-5 pt-8 pb-6 md:rounded-3xl md:shadow-sm md:sticky md:top-24">

              {/* ── Avatar + name ── */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="flex size-[64px] shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1B4D91]/20 to-[#1B4D91]/5 border border-[#1B4D91]/10">
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
                        {user?.name || t("defaultUser") || "Пользователь"}
                      </h2>
                      <p className="text-[12px] font-medium text-slate-400 mt-0.5">
                        {user?.phone || ""}
                      </p>
                    </>
                  ) : (
                    <>
                      <h2 className="text-[17px] font-black text-[#1B4D91]">
                        {t("greetGuest") || "Добро пожаловать!"}
                      </h2>
                      <p className="text-[12px] font-medium text-slate-400 mt-0.5 line-clamp-1">
                        {t("loginPrompt") || "Войдите, чтобы отслеживать заказы"}
                      </p>
                    </>
                  )}
                </div>

                {!isAuthenticated && (
                  <button
                    onClick={() => router.push("/login")}
                    className="shrink-0 h-10 rounded-xl bg-[#E31E24] px-4 text-[12px] font-black text-white shadow-sm active:scale-95 transition-transform"
                  >
                    {t("signIn") || "Войти"}
                  </button>
                )}
              </div>

              {/* ── Quick stats row (auth) ── */}
              {isAuthenticated && (
                <div className="mt-5 grid grid-cols-3 gap-2">
                  {quickStats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                      <button
                        key={stat.href}
                        onClick={() => router.push(stat.href)}
                        className="flex flex-col items-center gap-1.5 rounded-2xl border border-slate-100 bg-[#f4f6fa] py-3 px-2 hover:bg-[#1B4D91]/5 active:scale-95 transition-all relative"
                      >
                        {stat.count !== null && (
                          <span className="absolute -top-1.5 -right-1.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[#E31E24] px-1 text-[9px] font-black text-white ring-2 ring-white">
                            {stat.count}
                          </span>
                        )}
                        <div className="flex size-8 items-center justify-center rounded-xl" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
                          <Icon className="size-4" />
                        </div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-center" style={{ color: stat.color }}>
                          {stat.label}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* ── Desktop edit profile hint ── */}
              {isAuthenticated && (
                <button className="hidden md:flex mt-4 w-full items-center gap-2 rounded-2xl border border-[#1B4D91]/15 bg-[#f4f6fa] px-4 py-3 text-[12px] font-semibold text-[#1B4D91] hover:bg-[#1B4D91]/5 transition-colors">
                  <Settings className="size-4" />
                  {t("editProfile") || "Редактировать профиль"}
                </button>
              )}


              {/* ── Desktop logout ── */}
              {isAuthenticated && (
                <button
                  onClick={() => { localStorage.clear(); window.location.href = "/"; }}
                  className="hidden md:flex mt-4 w-full items-center justify-center gap-2.5 h-11 rounded-2xl border border-[#E31E24]/15 bg-[#E31E24]/5 text-[13px] font-bold text-[#E31E24] hover:bg-[#E31E24]/10 transition-colors"
                >
                  <LogOut className="size-4" />
                  {t("logout") || "Выйти из аккаунта"}
                </button>
              )}
            </div>

            {/* ════ RIGHT COLUMN: Menu ════ */}
            <div className="px-4 mt-5 space-y-4 md:px-0 md:mt-0">

              {/* General settings label */}
              <p className="px-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                {t("generalSettings") || "Общие настройки"}
              </p>

              {/* Menu list */}
              <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white divide-y divide-[#f4f6fa]">
                {menuItems.filter((i) => i.show).map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => router.push(item.href)}
                      className="flex w-full items-center gap-4 px-5 py-[15px] transition-colors hover:bg-[#1B4D91]/3 active:bg-[#1B4D91]/5 group"
                    >
                      <div
                        className="flex size-9 shrink-0 items-center justify-center rounded-xl transition-colors"
                        style={{ backgroundColor: `${item.accent}12`, color: item.accent }}
                      >
                        <Icon className="size-[18px]" />
                      </div>
                      <span className="text-[13.5px] font-semibold text-slate-700 text-left flex-1 group-hover:text-[#1B4D91] transition-colors">
                        {item.label}
                      </span>
                      {item.badge && (
                        <span className="rounded-lg bg-[#7c3aed]/10 px-2 py-0.5 text-[9px] font-black text-[#7c3aed] uppercase tracking-wider">
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight className="size-4 text-slate-300 group-hover:text-[#1B4D91]/40 transition-colors" />
                    </button>
                  );
                })}
              </div>

              {/* Seller panel */}
              {user?.role === "SELLER" && (
                <>
                  <p className="px-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    {t("sellerSection") || "Для продавцов"}
                  </p>
                  <button
                    onClick={() => router.push("/seller/dashboard")}
                    className="flex w-full items-center justify-between rounded-3xl bg-[#1B4D91] p-5 text-white shadow-lg shadow-[#1B4D91]/20 hover:bg-[#163d73] active:scale-[0.98] transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex size-10 items-center justify-center rounded-2xl bg-white/10">
                        <Store className="size-5" />
                      </div>
                      <div className="text-left">
                        <p className="text-[13px] font-black">{t("sellerDashboard") || "Панель управления"}</p>
                        <p className="text-[11px] font-medium opacity-60">{t("sellerDashboardSub") || "Товары и заказы"}</p>
                      </div>
                    </div>
                    <ChevronRight className="size-5 opacity-50" />
                  </button>
                </>
              )}

              {/* ── Mobile: Language switcher ── */}
              <div className="md:hidden rounded-3xl border border-slate-100 bg-white overflow-hidden">
                <div className="flex items-center justify-between px-5 py-[15px]">
                  <div className="flex items-center gap-4">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#1B4D91]/6 text-[#1B4D91]">
                      <Globe className="size-[18px]" />
                    </div>
                    <span className="text-[13.5px] font-semibold text-slate-700">
                      {t("language") || "Язык"}
                    </span>
                  </div>
                  <LanguageSwitcher />
                </div>
              </div>

              {/* Mobile logout */}
              {isAuthenticated && (
                <button
                  onClick={() => { localStorage.clear(); window.location.href = "/"; }}
                  className="md:hidden flex w-full items-center justify-center gap-2.5 h-14 rounded-2xl border border-[#E31E24]/15 bg-[#E31E24]/5 text-[13px] font-bold text-[#E31E24] active:bg-[#E31E24]/10 transition-colors"
                >
                  <LogOut className="size-4" />
                  {t("logout") || "Выйти из аккаунта"}
                </button>
              )}

              <div className="h-2" />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
