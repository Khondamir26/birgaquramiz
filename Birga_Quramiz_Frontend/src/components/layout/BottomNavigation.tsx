"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Home, LayoutGrid, ShoppingCart, User, Heart,
    LayoutDashboard, ClipboardList, Bot, Package, Users
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useAuth";

export default function BottomNavigation() {
    const pathname = usePathname();
    const t = useTranslations("Navbar");
    const { uniqueCount } = useCart();
    const { items: favItems } = useFavorites();
    const { user } = useAuth();
    const favCount = favItems.length;
    const isSeller = user?.role === "SELLER";
    const isAdmin = user?.role === "ADMIN";

    // ── Admin tabs: Dashboard | Users | Products | Orders | Profile
    // ── Seller tabs: Dashboard | Products | Orders | AI | Profile
    // ── User tabs:   Home | Catalog | Cart | Favorites | Profile
    const navItems = useMemo<Array<{ href: string; icon: React.ElementType; label: string; showCartBadge?: boolean; showFavBadge?: boolean }>>(() => {
        if (isAdmin) return [
            { href: "/admin", icon: LayoutDashboard, label: t("adminDashboard") },
            { href: "/admin/products", icon: Package, label: t("adminProducts") },
            { href: "/admin/users", icon: Users, label: t("users") },
            { href: "/admin/orders", icon: ClipboardList, label: t("orders") },
            { href: "/profile", icon: User, label: t("profile") },
        ];
        if (isSeller) return [
            { href: "/seller/dashboard", icon: LayoutDashboard, label: t("sellerDashboard") },
            { href: "/seller/products", icon: Package, label: t("myProducts") },
            { href: "/seller/orders", icon: ClipboardList, label: t("orders") },
            { href: "/ai-chat", icon: Bot, label: t("aiConsultant") },
            { href: "/profile", icon: User, label: t("profile") },
        ];
        return [
            { href: "/", icon: Home, label: t("home"), showCartBadge: false, showFavBadge: false },
            { href: "/catalog", icon: LayoutGrid, label: t("catalog"), showCartBadge: false, showFavBadge: false },
            { href: "/cart", icon: ShoppingCart, label: t("cart"), showCartBadge: true, showFavBadge: false },
            { href: "/favorites", icon: Heart, label: t("favorites"), showCartBadge: false, showFavBadge: true },
            { href: "/profile", icon: User, label: t("profile"), showCartBadge: false, showFavBadge: false },
        ];
    }, [isAdmin, isSeller, t]);

    return (
        <nav
            className={cn(
                "fixed bottom-0 left-0 right-0 z-50 lg:hidden",
                "bg-white/95 backdrop-blur-md",
                "border-t border-slate-100",
                "pb-[calc(env(safe-area-inset-bottom)+6px)] pt-2",
                "shadow-[0_-4px_24px_rgba(27,77,145,0.07)]"
            )}
        >
            <div className="grid grid-cols-5 px-2">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                        item.href === "/" ? pathname === "/"
                            : pathname.startsWith(item.href);

                    const badge = isAdmin || isSeller ? 0 :
                        (item.showCartBadge && uniqueCount > 0 ? uniqueCount : 0) ||
                        ((item as { showFavBadge?: boolean }).showFavBadge && favCount > 0 ? favCount : 0);

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="group relative flex flex-col items-center py-1.5 min-h-[44px] justify-center tap-highlight-none"
                        >
                            {/* Active pill */}
                            <span
                                className={cn(
                                    "flex items-center justify-center rounded-2xl transition-all duration-300",
                                    isActive
                                        ? "bg-navbar-gradient px-5 py-2 shadow-navbar"
                                        : "px-3 py-2 group-active:bg-[#0b3190]/8"
                                )}
                            >
                                <Icon
                                    className={cn(
                                        "transition-all duration-300",
                                        isActive
                                            ? "size-[22px] stroke-[2.5px] text-white"
                                            : "size-[22px] stroke-[1.8px] text-slate-400 group-active:text-[#0b3190]"
                                    )}
                                />
                                {!!badge && !isActive && (
                                    <span className="absolute -right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#E31E24] px-1 text-[9px] font-black text-white ring-[1.5px] ring-white">
                                        {badge > 99 ? "99+" : badge}
                                    </span>
                                )}
                            </span>

                            {/* Label */}
                            <span
                                className={cn(
                                    "mt-0.5 text-[10px] font-semibold transition-colors duration-200 leading-none text-center",
                                    isActive ? "text-[#0b3190]" : "text-slate-400"
                                )}
                            >
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
