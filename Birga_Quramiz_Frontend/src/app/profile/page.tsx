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
  ChevronRight, LogOut, Package, Users,
  Bot, Settings, ShoppingCart, Globe,
  Truck, CreditCard, RefreshCw, Phone
} from "lucide-react";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MenuItem({ item }: { item: any }) {
  const Icon = item.icon;
  const isExternal = item.href.startsWith("tel:");
  const Component = isExternal ? "a" : Link;

  return (
    <Component
      href={item.href}
      className="flex w-full items-center gap-4 px-5 py-[15px] transition-colors hover:bg-[#1B4D91]/3 active:bg-[#1B4D91]/5 group select-none touch-manipulation"
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
    </Component>
  );
}

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuth();
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();
  const t = useTranslations("Profile");
  const cartCount = useCartStore((s) => s.items.length);
  const { items: favItems } = useFavorites();

  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch {
      // ignore logout errors, clear client state anyway
    }
    logout();
    router.push("/");
  };

  const quickStats = isAuthenticated ? [
    { label: t("myOrders") || "Заказы", icon: Package, href: "/orders", color: "#1B4D91", count: null },
    { label: t("favoritesLink") || "Избранное", icon: Heart, href: "/favorites", color: "#E31E24", count: favItems.length || null },
    { label: t("cart") || "Корзина", icon: ShoppingCart, href: "/cart", color: "#1B4D91", count: cartCount || null },
  ] : [];

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
      label: t("delivery") || "Доставка",
      icon: Truck, href: "/help/delivery",
      show: true,
      accent: "#1B4D91",
    },
    {
      label: t("payment") || "Оплата",
      icon: CreditCard, href: "/help",
      show: true,
      accent: "#1B4D91",
    },
    {
      label: t("returns") || "Возврат",
      icon: RefreshCw, href: "/help/return",
      show: true,
      accent: "#1B4D91",
    },
    {
      label: t("support") || "Служба поддержки",
      icon: Phone, href: "tel:+998900000000",
      show: true,
      accent: "#1B4D91",
    },
    {
      label: t("faq") || "FAQ",
      icon: HelpCircle, href: "/help/faq",
      show: true,
      accent: "#1B4D91",
    },
  ];

  if (!user && isAuthenticated) {
    return (
      <div className="flex flex-col min-h-screen bg-[#f4f6fa] pb-40 md:pb-12">
        <div className="mx-auto w-full md:max-w-[1440px]">
          <div className="p-4 md:px-6 md:pt-6">
            <div className="h-40 animate-pulse rounded-3xl bg-white" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f6fa] pb-40 md:pb-12">
      <div className="mx-auto w-full md:max-w-[1440px]">
        <div className="mx-auto flex flex-col gap-0 max-w-md md:max-w-none pb-0 md:px-6 md:pt-6">
          <div className="hidden md:flex items-center gap-3 mb-8">
            <h1 className="text-2xl font-black text-[#1B4D91]">{t("title")}</h1>
            {isAuthenticated && user && (
              <span className="rounded-xl bg-[#1B4D91]/8 px-3 py-1 text-[11px] font-black text-[#1B4D91] uppercase tracking-wider">
                {user.role}
              </span>
            )}
          </div>

          <div className="md:grid md:grid-cols-[300px,1fr] md:gap-6 md:items-start px-4 pt-4 md:px-6 md:pt-6">
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 md:sticky md:top-24">
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
                  <Link
                    href="/login"
                    className="shrink-0 flex h-10 items-center justify-center rounded-xl bg-navbar-gradient px-4 text-[12px] font-black text-white shadow-sm active:scale-95 transition-transform select-none touch-manipulation"
                  >
                    {t("signIn") || "Войти"}
                  </Link>
                )}
              </div>

              {isAuthenticated && (
                <div className="mt-5 grid grid-cols-3 gap-2">
                  {quickStats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                      <Link
                        key={stat.href}
                        href={stat.href}
                        className="flex flex-col items-center gap-1.5 rounded-2xl border border-slate-100 bg-[#f4f6fa] py-3 px-2 hover:bg-[#1B4D91]/5 active:scale-95 transition-all relative select-none touch-manipulation"
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
                      </Link>
                    );
                  })}
                </div>
              )}

              {isAuthenticated && (
                <button className="hidden md:flex mt-4 w-full items-center gap-2 rounded-2xl border border-[#1B4D91]/15 bg-[#f4f6fa] px-4 py-3 text-[12px] font-semibold text-[#1B4D91] hover:bg-[#1B4D91]/5 transition-colors select-none touch-manipulation">
                  <Settings className="size-4" />
                  {t("editProfile") || "Редактировать профиль"}
                </button>
              )}

              {isAuthenticated && (
                <button
                  onClick={handleLogout}
                  className="hidden md:flex mt-4 w-full items-center justify-center gap-2.5 h-11 rounded-2xl border border-[#E31E24]/15 bg-[#E31E24]/5 text-[13px] font-bold text-[#E31E24] hover:bg-[#E31E24]/10 transition-colors select-none touch-manipulation"
                >
                  <LogOut className="size-4" />
                  {t("logout") || "Выйти из аккаунта"}
                </button>
              )}
            </div>

            <div className="mt-5 space-y-6 md:mt-0 pb-10">
              {/* Services Section */}
              <div className="space-y-3">
                <p className="px-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                  {t("services") || "Сервисы"}
                </p>
                <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white divide-y divide-[#f4f6fa]">
                  {menuItems
                    .filter((item) => item.show && (item.icon === Bot || item.href === "/seller-register"))
                    .map((item, idx) => (
                      <MenuItem key={idx} item={item} />
                    ))}
                </div>
              </div>

              {/* Information Section */}
              <div className="space-y-3">
                <p className="px-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                  {t("information") || "Информация"}
                </p>
                <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white divide-y divide-[#f4f6fa]">
                  {menuItems
                    .filter((item) => 
                      item.show && 
                      item.icon !== Bot && 
                      item.href !== "/seller-register" && 
                      item.href !== "/login"
                    )
                    .map((item, idx) => (
                      <MenuItem key={idx} item={item} />
                    ))}
                </div>
              </div>

              {user?.role === "SELLER" && (
                <div className="space-y-3">
                  <p className="px-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                    {t("sellerSection") || "Для продавцов"}
                  </p>
                  <Link
                    href="/seller/dashboard"
                    className="flex w-full items-center justify-between rounded-3xl bg-navbar-gradient p-5 text-white shadow-lg shadow-[#1B4D91]/20 hover:shadow-xl hover:shadow-[#1B4D91]/30 active:scale-[0.98] transition-all select-none touch-manipulation"
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
                  </Link>
                </div>
              )}

              {/* Settings Section (Mobile Only) */}
              <div className="md:hidden space-y-3">
                <p className="px-1 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
                  {t("generalSettings") || "Общие настройки"}
                </p>
                <div className="rounded-3xl border border-slate-100 bg-white overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-[15px]">
                    <div className="flex items-center gap-4">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#1B4D91]/6 text-[#1B4D91]">
                        <Globe className="size-[18px]" />
                      </div>
                      <span className="text-[13.5px] font-semibold text-slate-700">
                        {t("language") || "Язык"}
                      </span>
                    </div>
                    <LanguageSwitcher variant="dark" />
                  </div>
                </div>
              </div>

              {isAuthenticated && (
                <button
                  onClick={handleLogout}
                  className="md:hidden flex w-full items-center justify-center gap-2.5 h-14 rounded-3xl border border-[#E31E24]/15 bg-[#E31E24]/5 text-[13px] font-bold text-[#E31E24] active:bg-[#E31E24]/10 transition-colors select-none touch-manipulation"
                >
                  <LogOut className="size-4" />
                  {t("logout") || "Выйти из аккаунта"}
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
