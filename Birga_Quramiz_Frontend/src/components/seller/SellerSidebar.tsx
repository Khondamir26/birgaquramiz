"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Package, ClipboardList,
  LogOut, Store, Menu, X, ChevronRight, User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { logout } from "@/lib/api/auth";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";

type NavItem = { label: string; href: string; icon: React.ElementType };

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard",  href: "/seller/dashboard", icon: LayoutDashboard },
  { label: "Products",   href: "/seller/products",  icon: Package },
  { label: "Orders",     href: "/seller/orders",    icon: ClipboardList },
  { label: "My Store",   href: "/seller/profile",   icon: Store },
];

function SidebarLink({ label, href, icon: Icon, active, onClick }: {
  label: string;
  href: string;
  icon: React.ElementType;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-bold transition-all group min-h-[40px]",
        active
          ? "bg-[#1B4D91] text-white shadow-sm"
          : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
      )}
    >
      <Icon className={cn("size-4 shrink-0", active ? "text-white" : "text-slate-400 group-hover:text-slate-600")} />
      <span className="flex-1 truncate">{label}</span>
    </Link>
  );
}

function SidebarContent({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout: storeLogout } = useAuthStore();

  function isActive(href: string) {
    if (href === "/seller/dashboard") return pathname === "/seller/dashboard";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  async function handleLogout() {
    try { await logout() } finally {
      storeLogout();
      router.push("/login");
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Branding */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-slate-100">
        <Image src="/icons/favicon-32x32.png" alt="BQ" width={32} height={32} className="size-8 shrink-0" />
        <div className="min-w-0">
          <p className="text-[13px] font-black text-[#1B4D91] leading-none">BIRGA QURAMIZ</p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Seller Panel</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        <p className="px-3 mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-300">Menu</p>
        {NAV_ITEMS.map((item) => (
          <SidebarLink
            key={item.href}
            label={item.label}
            href={item.href}
            icon={item.icon}
            active={isActive(item.href)}
            onClick={onLinkClick}
          />
        ))}
      </nav>

      {/* Language */}
      <div className="border-t border-slate-100 px-4 py-2.5 flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-300">Language</p>
        <LanguageSwitcher compact variant="dark" />
      </div>

      {/* User + logout */}
      <div className="border-t border-slate-100 px-3 py-3">
        {user && (
          <div className="flex items-center gap-2.5 px-3 py-2 mb-1 rounded-xl bg-slate-50">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#1B4D91]/10">
              <User className="size-3.5 text-[#1B4D91]" />
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-black text-slate-700 truncate leading-none">{user.name}</p>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Seller</p>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-[13px] font-bold text-red-500 hover:bg-red-50 transition-colors min-h-[40px]"
        >
          <LogOut className="size-4 shrink-0" />
          Logout
        </button>
      </div>
    </div>
  );
}

function SellerMobileHeader({ onOpen }: { onOpen: () => void }) {
  const pathname = usePathname();
  const current = NAV_ITEMS.find((i) =>
    i.href === "/seller/dashboard"
      ? pathname === "/seller/dashboard"
      : pathname === i.href || pathname.startsWith(`${i.href}/`)
  );

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-slate-100 bg-white px-4 md:hidden shadow-sm">
      <button
        type="button"
        onClick={onOpen}
        aria-label="Open sidebar"
        className="flex size-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
      >
        <Menu className="size-4" />
      </button>
      <div className="flex items-center gap-2 min-w-0">
        <Image src="/icons/favicon-32x32.png" alt="BQ" width={24} height={24} className="size-6 shrink-0" />
        <span className="text-[13px] font-black text-[#1B4D91] truncate">
          {current?.label ?? "Seller Panel"}
        </span>
        {current && current.href !== "/seller/dashboard" && (
          <>
            <ChevronRight className="size-3 text-slate-300 shrink-0" />
            <span className="text-[13px] font-bold text-slate-400 truncate">Birga Quramiz</span>
          </>
        )}
      </div>
    </header>
  );
}

export function SellerSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <SellerMobileHeader onOpen={() => setOpen(true)} />

      {open && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[998] bg-black/40 md:hidden"
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-[999] h-screen w-64 bg-white shadow-2xl transition-transform duration-300 ease-in-out md:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="absolute top-3 right-3">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex size-8 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
          >
            <X className="size-3.5" />
          </button>
        </div>
        <SidebarContent onLinkClick={() => setOpen(false)} />
      </aside>

      <aside className="hidden md:flex md:w-56 lg:w-60 shrink-0 flex-col h-screen sticky top-0 border-r border-slate-100 bg-white overflow-hidden">
        <SidebarContent />
      </aside>
    </>
  );
}
