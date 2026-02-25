"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, ChevronDown, ShoppingCart, User2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Role } from "@/types";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";

const navLinks = [
  { href: "/catalog", key: "marketplace" },
  { href: "/builders", key: "builders" },
  { href: "/equipment", key: "equipment" },
  { href: "/ai-chat", key: "aiConsultant" },
] as const;

type MenuItem = { href: string; label: string };

function getNotificationsHref(role: Role): string {
  if (role === "ADMIN") return "/admin/orders";
  if (role === "SELLER") return "/seller/orders";
  return "/orders";
}

function getRoleMenuItems(role: Role, tCommon: ReturnType<typeof useTranslations>): MenuItem[] {
  if (role === "ADMIN") {
    return [
      { href: "/profile", label: tCommon("profile") },
      { href: "/admin", label: tCommon("adminDashboard") },
    ];
  }

  if (role === "SELLER") {
    return [
      { href: "/profile", label: tCommon("profile") },
      { href: "/seller/dashboard", label: tCommon("sellerDashboard") },
      { href: "/seller/products", label: tCommon("myProducts") },
      { href: "/seller/orders", label: tCommon("orders") },
    ];
  }

  return [
    { href: "/profile", label: tCommon("profile") },
    { href: "/orders", label: tCommon("myOrders") },
    { href: "/profile", label: tCommon("settings") },
  ];
}

export default function Navbar() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { uniqueCount } = useCart();
  const logout = useAuthStore((s) => s.logout);

  const tCommon = useTranslations("Common");
  const tNav = useTranslations("Navbar");

  const canAccessCart = !isAuthenticated || user?.role === "USER";

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const roleMenuItems = user ? getRoleMenuItems(user.role, tCommon) : [];
  const logoSrc = user?.role === "SELLER" ? "/sellers-panel-logo.png" : "/logo.png";

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-white/95 backdrop-blur">
      <div className="border-b border-border/60 bg-[#0f3154] text-white">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-2 text-xs md:px-6">
          <p>{tNav("topDelivery")}</p>
          <div className="flex items-center gap-3">
            <a href="tel:+998900000000" className="hover:text-orange-200">+998 90 000 00 00</a>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="inline-flex items-center">
            <Image
              src={logoSrc}
              alt="Birga Quramiz"
              width={240}
              height={56}
              className="h-10 w-auto md:h-11"
              priority
            />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-[#0f3154]"
              >
                {tNav(link.key)}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {canAccessCart && (
            <Link
              href="/cart"
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-[#0f3154]"
              aria-label={tCommon("cart")}
            >
              <ShoppingCart className="size-5" />
              {uniqueCount > 0 && (
                <span className="absolute -right-1 -top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-[#ec7a10] px-1 text-[10px] font-semibold leading-4 text-white">
                  {uniqueCount}
                </span>
              )}
            </Link>
          )}

          {isAuthenticated && user ? (
            <>
              <Link
                href={getNotificationsHref(user.role)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-[#0f3154]"
                aria-label={tCommon("notifications")}
              >
                <Bell className="size-5" />
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                      <User2 className="size-4" />
                    </span>
                    <span className="hidden max-w-28 truncate sm:inline">{user.name}</span>
                    <ChevronDown className="size-4 text-slate-500" />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-64 rounded-xl border border-slate-200/80 bg-white p-1.5 shadow-xl">
                  <DropdownMenuLabel className="px-3 py-2 text-sm font-semibold text-slate-900">{user.name}</DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  {roleMenuItems.map((item) => (
                    <DropdownMenuItem asChild key={`${user.role}-${item.href}-${item.label}`} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700">
                      <Link href={item.href}>{item.label}</Link>
                    </DropdownMenuItem>
                  ))}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={handleLogout} className="rounded-lg px-3 py-2 text-sm font-medium">
                    {tCommon("logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild size="sm" className="bg-[#0f3154] hover:bg-[#184a7d]">
                <Link href="/login">{tCommon("signIn")}</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/signup">{tCommon("signUp")}</Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-7xl items-center gap-1 overflow-x-auto px-4 pb-3 lg:hidden md:px-6">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="inline-flex shrink-0 items-center rounded-lg border border-border/70 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-[#0f3154]"
          >
            {tNav(link.key)}
          </Link>
        ))}
      </div>
    </header>
  );
}



