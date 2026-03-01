"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronDown, Heart, LayoutGrid, ShoppingCart, User2, Home, Cpu, LayoutDashboard, HardHat, Truck, ClipboardList, Package, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
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

// Brand colors: Primary Blue #1B4D91 | Accent Red #E31E24

// navLinks are computed inside the component based on user role

type MenuItem = { href: string; label: string };

function getNotificationsHref(role: Role): string {
  if (role === "ADMIN") return "/admin/orders";
  if (role === "SELLER") return "/seller/orders";
  return "/orders";
}

function getRoleMenuItems(role: Role, tCommon: ReturnType<typeof useTranslations>): MenuItem[] {
  if (role === "ADMIN") return [
    { href: "/profile", label: tCommon("profile") },
    { href: "/admin", label: tCommon("adminDashboard") },
  ];
  if (role === "SELLER") return [
    { href: "/profile", label: tCommon("profile") },
    { href: "/seller/dashboard", label: tCommon("sellerDashboard") },
    { href: "/seller/products", label: tCommon("myProducts") },
    { href: "/seller/orders", label: tCommon("orders") },
  ];
  return [
    { href: "/profile", label: tCommon("profile") },
    { href: "/orders", label: tCommon("myOrders") },
  ];
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { uniqueCount } = useCart();
  const { items: favItems } = useFavorites();
  const logout = useAuthStore((s) => s.logout);

  const tCommon = useTranslations("Common");
  const tNav = useTranslations("Navbar");

  const canAccessCart = !isAuthenticated || user?.role === "USER";
  const handleLogout = () => { logout(); router.push("/"); };
  const roleMenuItems = user ? getRoleMenuItems(user.role, tCommon) : [];

  const isSeller = user?.role === "SELLER";
  const isAdmin = user?.role === "ADMIN";
  const logoHref = isAdmin ? "/admin" : (isSeller ? "/seller/dashboard" : "/");
  const logoSrc = isSeller || isAdmin ? "/sellers-panel-logo.png" : "/logo.png"; // We can reuse the seller logo for admins or keep the main one

  // Dynamic nav links — swap Home for Seller Dashboard or Admin Dashboard
  let navLinks: Array<{ href: string, key: any, icon: React.ElementType }> = [];

  if (isAdmin) {
    navLinks = [
      { href: "/admin", key: "adminDashboard" as const, icon: LayoutDashboard },
      { href: "/admin/products", key: "adminProducts" as const, icon: Package },
      { href: "/admin/users", key: "users" as const, icon: Users },
      { href: "/admin/orders", key: "orders" as const, icon: ClipboardList },
    ];
  } else if (isSeller) {
    navLinks = [
      { href: "/seller/dashboard", key: "sellerDashboard" as const, icon: LayoutDashboard },
      { href: "/seller/products", key: "myProducts" as const, icon: Package },
      { href: "/seller/orders", key: "orders" as const, icon: ClipboardList },
      { href: "/ai-chat", key: "aiConsultant" as const, icon: Cpu },
    ];
  } else {
    navLinks = [
      { href: "/", key: "home" as const, icon: Home },
      { href: "/catalog", key: "marketplace" as const, icon: LayoutGrid },
      { href: "/builders", key: "builders" as const, icon: HardHat },
      { href: "/equipment", key: "equipment" as const, icon: Truck },
      { href: "/ai-chat", key: "aiConsultant" as const, icon: Cpu },
    ];
  }

  return (
    <header className="sticky top-0 z-50 hidden w-full md:block">
      {/* ── Top utility bar ── */}
      <div className="bg-[#1B4D91] text-white">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-2 text-xs">
          <p className="font-medium opacity-80">{tNav("topDelivery")}</p>
          <div className="flex items-center gap-4">
            <a
              href="tel:+998900000000"
              className="font-bold tracking-wide opacity-90 hover:opacity-100 transition-opacity"
            >
              +998 90 000 00 00
            </a>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {/* ── Main navbar ── */}
      <div className="border-b border-slate-100 bg-white/97 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6 px-6 py-3">

          {/* Logo — links to seller dashboard for sellers, home otherwise */}
          <div className="shrink-0 flex items-center gap-3">
            <Link href={logoHref} className="flex items-center">
              <Image
                src={logoSrc}
                alt="Birga Quramiz"
                width={220}
                height={56}
                className="h-11 w-auto"
                priority
              />
            </Link>
            {isAdmin && (
              <div className="hidden lg:flex items-center rounded-lg bg-red-500/10 px-2.5 py-1 mt-1 border border-red-500/20">
                <span className="text-[10px] font-black uppercase tracking-widest text-red-600">Admin Portal</span>
              </div>
            )}
          </div>

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/" ? pathname === "/"
                  : pathname.startsWith(link.href);
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-semibold transition-all duration-200",
                    isActive
                      ? "bg-[#1B4D91]/8 text-[#1B4D91]"
                      : "text-slate-600 hover:bg-slate-50 hover:text-[#1B4D91]"
                  )}
                >
                  {Icon && <Icon className="size-3.5" />}
                  {tNav(link.key)}
                  {isActive && (
                    <span className="absolute bottom-1 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-[#1B4D91]" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Favorites */}
            <Link
              href="/favorites"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-50 hover:text-[#E31E24] transition-colors"
              aria-label="Избранное"
            >
              <Heart className="size-5" />
              {favItems.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#E31E24] px-1 text-[9px] font-black text-white ring-2 ring-white">
                  {favItems.length}
                </span>
              )}
            </Link>

            {/* Cart */}
            {canAccessCart && (
              <Link
                href="/cart"
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-50 hover:text-[#1B4D91] transition-colors"
                aria-label={tCommon("cart")}
              >
                <ShoppingCart className="size-5" />
                {uniqueCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#E31E24] px-1 text-[9px] font-black text-white ring-2 ring-white">
                    {uniqueCount}
                  </span>
                )}
              </Link>
            )}

            {/* Authenticated user */}
            {isAuthenticated && user ? (
              <>
                <Link
                  href={getNotificationsHref(user.role)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-50 hover:text-[#1B4D91] transition-colors"
                  aria-label={tCommon("notifications")}
                >
                  <Bell className="size-5" />
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="inline-flex h-10 items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50 transition-colors">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1B4D91]/10 text-[#1B4D91]">
                        <User2 className="size-3.5" />
                      </span>
                      <span className="max-w-[100px] truncate">{user.name}</span>
                      <ChevronDown className="size-4 text-slate-400" />
                    </button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-56 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl shadow-slate-200/60">
                    <DropdownMenuLabel className="px-2 py-1.5 text-[12px] font-black text-[#1B4D91] uppercase tracking-wider">
                      {user.name}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-slate-100 my-1" />
                    {roleMenuItems.map((item) => (
                      <DropdownMenuItem
                        key={`${user.role}-${item.href}-${item.label}`}
                        asChild
                        className="rounded-xl px-3 py-2 text-[13px] font-semibold text-slate-700 cursor-pointer"
                      >
                        <Link href={item.href}>{item.label}</Link>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator className="bg-slate-100 my-1" />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={handleLogout}
                      className="rounded-xl px-3 py-2 text-[13px] font-semibold cursor-pointer"
                    >
                      {tCommon("logout")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="inline-flex h-10 items-center rounded-xl border border-[#1B4D91]/30 px-5 text-[13px] font-bold text-[#1B4D91] hover:bg-[#1B4D91]/5 transition-colors"
                >
                  {tCommon("signIn")}
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex h-10 items-center rounded-xl bg-[#1B4D91] px-5 text-[13px] font-bold text-white hover:bg-[#163d73] transition-colors shadow-sm"
                >
                  {tCommon("signUp")}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
