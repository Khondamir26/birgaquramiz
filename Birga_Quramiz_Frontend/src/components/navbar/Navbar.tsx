"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import type { ActionItem, AccountMenuItem, NavLink } from "@/config/navigation";
import { getAccountMenu, getActionItems, getNavLinks } from "@/config/navigation";
import BurgerSidebar from "@/components/navbar/BurgerSidebar";
import CatalogBurgerMenu from "@/components/navbar/CatalogBurgerMenu";
import NavbarActions from "@/components/navbar/NavbarActions";
import NavbarLinks from "@/components/navbar/NavbarLinks";
import NavbarSearch from "@/components/navbar/NavbarSearch";
import NavbarTopBar from "@/components/navbar/NavbarTopBar";
import type { SearchPanelItem } from "@/components/navbar/SearchPanel";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useFavorites } from "@/hooks/useFavorites";
import { useMarketplaceSearch, type MarketplaceShortcut } from "@/hooks/useMarketplaceSearch";
import { logout as apiLogout } from "@/lib/api/auth";
import { useAuthStore } from "@/store/authStore";

type ResolvedNavLink = {
  id: string;
  href: string;
  label: string;
  iconKey: NavLink["iconKey"];
};

type ResolvedAction = {
  id: string;
  href: string;
  label: string;
  iconKey: ActionItem["iconKey"];
  badge?: number;
};

type ResolvedAccountItem = {
  id: string;
  href: string;
  label: string;
};

const headerShellClass =
  "relative border-b border-[#1e4fc0] text-white shadow-[0_18px_54px_rgba(9,45,136,0.34)]";

const headerGradient =
  "linear-gradient(97.26deg, #163b92 0.49%, #1a429e 14.88%, #1f4cac 29.27%, #2559bc 43.14%, #2c66cb 57.02%, #2f6fd5 70.89%, #295fbf 84.76%, #214da8 99.15%), linear-gradient(rgba(0,0,0,0.08), rgba(0,0,0,0.08))";

function resolveNavLabel(key: NavLink["labelKey"], tNav: ReturnType<typeof useTranslations>) {
  return tNav(key);
}

function resolveActionLabel(key: ActionItem["labelKey"], tCommon: ReturnType<typeof useTranslations>, tNav: ReturnType<typeof useTranslations>) {
  if (key === "cart") return tCommon("cart");
  if (key === "favorites") return tNav("favorites");
  return tCommon("orders");
}

function resolveAccountLabel(
  key: AccountMenuItem["labelKey"],
  tCommon: ReturnType<typeof useTranslations>
) {
  if (key === "profile" || key === "myOrders" || key === "orders") {
    return tCommon(key === "profile" ? "profile" : key === "orders" ? "orders" : "myOrders");
  }

  return tCommon(key);
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { uniqueCount } = useCart();
  const { items: favorites } = useFavorites();
  const clearAuth = useAuthStore((state) => state.logout);

  const tNav = useTranslations("Navbar");
  const tCommon = useTranslations("Common");

  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const navLinks = useMemo(() => getNavLinks(user?.role), [user?.role]);
  const actionItems = useMemo(() => getActionItems(user?.role, uniqueCount, favorites.length), [user?.role, uniqueCount, favorites.length]);
  const accountMenu = useMemo(() => getAccountMenu(user?.role), [user?.role]);

  const resolvedNavLinks = useMemo<ResolvedNavLink[]>(
    () =>
      navLinks.map((item) => ({
        id: item.id,
        href: item.href,
        label: resolveNavLabel(item.labelKey, tNav),
        iconKey: item.iconKey,
      })),
    [navLinks, tNav]
  );

  const resolvedActions = useMemo<ResolvedAction[]>(
    () =>
      actionItems.map((item) => ({
        id: item.id,
        href: item.href,
        label: resolveActionLabel(item.labelKey, tCommon, tNav),
        iconKey: item.iconKey,
        badge: item.badge,
      })),
    [actionItems, tCommon, tNav]
  );

  const resolvedAccountMenu = useMemo<ResolvedAccountItem[]>(
    () =>
      accountMenu.map((item) => ({
        id: item.id,
        href: item.href,
        label: resolveAccountLabel(item.labelKey, tCommon),
      })),
    [accountMenu, tCommon]
  );

  const shortcuts = useMemo<MarketplaceShortcut[]>(
    () => [
      ...resolvedNavLinks.map((item) => ({
        id: `nav-${item.id}`,
        label: item.label,
        href: item.href,
        section: "Navigation",
        iconKey: item.iconKey as MarketplaceShortcut["iconKey"],
      })),
      ...resolvedActions.map((item) => ({
        id: `action-${item.id}`,
        label: item.label,
        href: item.href,
        section: "Shortcuts",
        iconKey: item.iconKey as MarketplaceShortcut["iconKey"],
      })),
      ...resolvedAccountMenu.map((item) => ({
        id: `account-${item.id}`,
        label: item.label,
        href: item.href,
        section: "Account",
        iconKey: "user2" as MarketplaceShortcut["iconKey"],
      })),
    ],
    [resolvedActions, resolvedAccountMenu, resolvedNavLinks]
  );

  const { query, setQuery, isFocused, setFocused, results, showPanel, loading } = useMarketplaceSearch(shortcuts);

  useEffect(() => {
    if (["/", "/ru", "/uz", "/en", "/ru/", "/uz/", "/en/"].includes(pathname)) {
      setQuery("");
    }
  }, [pathname, setQuery]);

  const onLogout = async () => {
    try {
      await apiLogout();
    } catch {
      // ignore
    }

    clearAuth();
    router.push("/");
  };

  const searchResults: SearchPanelItem[] = results.map((item) => ({
    id: item.id,
    label: item.label,
    section: item.section,
    iconKey: item.iconKey,
    image: item.image,
    href: item.href,
  }));

  const handleGlobalSearch = useCallback(() => {
    if (!query.trim()) return;
    router.push(`/catalog?q=${encodeURIComponent(query.trim())}`);
    setQuery("");
  }, [query, router, setQuery]);

  return (
    <>
      <header className="sticky top-0 z-50 w-full">
      {/* Mobile Header - Only visible on Home page */}
      {["/", "/ru", "/uz", "/en", "/ru/", "/uz/", "/en/"].includes(pathname) && (
        <div
          className="flex h-[74px] w-full items-center justify-between border-b border-white/10 px-4 shadow-[0_12px_34px_rgba(11,49,144,0.24)] md:hidden"
          style={{ background: headerGradient }}
        >
          <Link
            href={user?.role === "ADMIN" ? "/admin" : user?.role === "SELLER" ? "/seller/dashboard" : "/"}
            className="min-w-0"
          >
            <span className="block truncate text-[34px] font-black lowercase leading-none tracking-[-0.07em] text-white">
              birga quramiz
            </span>
          </Link>

          <LanguageSwitcher compact />
        </div>
      )}

        <div className={`hidden md:block ${headerShellClass}`} style={{ background: headerGradient }}>
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),transparent_38%,rgba(0,0,0,0.08))]" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-white/20" />

          <NavbarTopBar
            city={tNav("city")}
            linksSlot={<NavbarLinks links={resolvedNavLinks.filter(l => l.id !== "home")} pathname={pathname} className="hidden items-center gap-2 xl:flex" />}
            rightSlot={<LanguageSwitcher compact />}
          />

          <div className="relative mx-auto flex w-full max-w-[1440px] items-center gap-5 px-6 py-2">
            <div className="flex shrink-0 items-center gap-4">
              <Link href={user?.role === "ADMIN" ? "/admin" : user?.role === "SELLER" ? "/seller/dashboard" : "/"} className="group min-w-0">
                <span className="text-[43px] font-black lowercase leading-none tracking-[-0.07em] text-white">birga quramiz</span>
              </Link>
              {!user?.role || user?.role === "USER" ? <CatalogBurgerMenu /> : null}
            </div>

            <NavbarSearch
              query={query}
              setQuery={setQuery}
              isFocused={isFocused}
              setFocused={setFocused}
              results={searchResults}
              showPanel={showPanel}
              onSelectResult={(item) => {
                router.push(item.href);
                setQuery("");
                setFocused(false);
              }}
              onSearch={handleGlobalSearch}
              searchLabel={tNav("search")}
              loading={loading}
            />

            <NavbarActions
              actions={resolvedActions}
              pathname={pathname}
              isAuthenticated={isAuthenticated}
              userName={user?.name}
              accountMenu={resolvedAccountMenu}
              signInLabel={tCommon("signIn")}
              logoutLabel={tCommon("logout")}
              onLogout={onLogout}
            />
          </div>
        </div>
      </header>

      <BurgerSidebar
        isOpen={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navLinks={resolvedNavLinks}
        actions={resolvedActions}
        accountMenu={resolvedAccountMenu}
        isAuthenticated={isAuthenticated}
        userName={user?.name}
        onLogout={onLogout}
        logoutLabel={tCommon("logout")}
      />
    </>
  );
}
