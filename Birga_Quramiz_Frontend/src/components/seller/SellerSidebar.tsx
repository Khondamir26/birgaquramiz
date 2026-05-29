"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Package, ClipboardList,
  LogOut, Store, Menu, X, ChevronRight, User, Bell, CheckCheck, BellRing,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { logout } from "@/lib/api/auth";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { useNotifications } from "@/hooks/useNotifications";
import type { Notification } from "@/lib/api/notifications";

type NavItem = { label: string; href: string; icon: React.ElementType };

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard",      href: "/seller/dashboard",      icon: LayoutDashboard },
  { label: "Products",       href: "/seller/products",       icon: Package },
  { label: "Orders",         href: "/seller/orders",         icon: ClipboardList },
  { label: "Notifications",  href: "/seller/notifications",  icon: BellRing },
  { label: "My Store",       href: "/seller/profile",        icon: Store },
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

// ─── Notification icon label map ────────────────────────────────────────────
const NOTIF_ICON: Record<string, string> = {
  ORDER_NEW: "🛍️",
  ORDER_PAID: "💳",
  ORDER_CANCELLED: "❌",
  ORDER_SHIPPED: "🚚",
  ORDER_DELIVERED: "✅",
  PRODUCT_APPROVED: "✅",
  PRODUCT_REJECTED: "⛔",
  SELLER_APPROVED: "🎉",
  SELLER_REJECTED: "⛔",
};

function NotificationPanel({
  notifications,
  loading,
  unreadCount,
  onOpen,
  onMarkRead,
  onMarkAllRead,
}: {
  notifications: Notification[];
  loading: boolean;
  unreadCount: number;
  onOpen: () => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function handleOpen() {
    if (!open) onOpen();
    setOpen((v) => !v);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        className="relative flex size-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-full top-0 ml-2 z-[1000] w-80 rounded-2xl border border-slate-100 bg-white shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50">
            <p className="text-[13px] font-black text-slate-900">Notifications</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => { onMarkAllRead(); }}
                className="flex items-center gap-1 text-[11px] font-bold text-[#1B4D91] hover:opacity-80 transition-opacity"
              >
                <CheckCheck className="size-3" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-50">
            {loading && (
              <div className="p-4 space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
                ))}
              </div>
            )}
            {!loading && notifications.length === 0 && (
              <div className="px-4 py-8 text-center">
                <Bell className="size-8 text-slate-200 mx-auto mb-2" />
                <p className="text-[12px] text-slate-400 font-medium">No notifications yet</p>
              </div>
            )}
            {!loading && notifications.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => { if (!n.readAt) onMarkRead(n.id); }}
                className={cn(
                  "w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-start gap-3",
                  !n.readAt && "bg-blue-50/60"
                )}
              >
                <span className="text-base shrink-0 mt-0.5">{NOTIF_ICON[n.type] ?? "🔔"}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-black text-slate-800 leading-tight">{n.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug line-clamp-2">{n.body}</p>
                  <p className="text-[10px] text-slate-300 mt-1">
                    {new Date(n.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                {!n.readAt && (
                  <span className="shrink-0 mt-1.5 size-2 rounded-full bg-[#1B4D91]" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

type NotifProps = {
  unreadCount: number;
  notifications: Notification[];
  loading: boolean;
  loadNotifications: () => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
};

function SidebarContent({ onLinkClick, notif }: { onLinkClick?: () => void; notif: NotifProps }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout: storeLogout } = useAuthStore();
  const { unreadCount, notifications, loading, loadNotifications, markRead, markAllRead } = notif;

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
        <div className="flex items-center justify-between px-3 mb-2">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-300">Menu</p>
          <NotificationPanel
            notifications={notifications}
            loading={loading}
            unreadCount={unreadCount}
            onOpen={loadNotifications}
            onMarkRead={markRead}
            onMarkAllRead={markAllRead}
          />
        </div>
        {NAV_ITEMS.map((item) => (
          <div key={item.href} className="relative">
            <SidebarLink
              label={item.label}
              href={item.href}
              icon={item.icon}
              active={isActive(item.href)}
              onClick={onLinkClick}
            />
            {item.href === "/seller/notifications" && unreadCount > 0 && (
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white leading-none">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
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

function SellerMobileHeader({ onOpen, unreadCount }: { onOpen: () => void; unreadCount: number }) {
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
      <div className="flex items-center gap-2 min-w-0 flex-1">
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
      {/* Bell in mobile header */}
      <div className="relative shrink-0">
        <Bell className="size-4 text-slate-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </div>
    </header>
  );
}

export function SellerSidebar() {
  const [open, setOpen] = useState(false);
  const notif = useNotifications(true);

  return (
    <>
      <SellerMobileHeader onOpen={() => setOpen(true)} unreadCount={notif.unreadCount} />

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
        <SidebarContent onLinkClick={() => setOpen(false)} notif={notif} />
      </aside>

      <aside className="hidden md:flex md:w-56 lg:w-60 shrink-0 flex-col h-screen sticky top-0 border-r border-slate-100 bg-white overflow-hidden">
        <SidebarContent notif={notif} />
      </aside>
    </>
  );
}
