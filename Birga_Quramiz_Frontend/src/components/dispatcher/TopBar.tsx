"use client";

import { useEffect, useRef, useState } from "react";
import { LogOut, Truck, Wifi, WifiOff, RefreshCcw, AlertTriangle, Bell, CheckCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { logout as apiLogout } from "@/lib/api/auth";
import { disconnectSocket } from "@/lib/tracking/socket";
import { useTrackingStore } from "@/store/trackingStore";
import { DriverStatus } from "@/types/tracking";
import { useT } from "@/store/dispatcherLocaleStore";
import DispatcherLocaleSwitcher from "./DispatcherLocaleSwitcher";
import { useNotifications } from "@/hooks/useNotifications";
import type { Notification } from "@/lib/api/notifications";

const NOTIF_ICON: Record<string, string> = {
  ORDER_NEW:          "🛍️",
  ORDER_CANCELLED:    "❌",
  ORDER_SHIPPED:      "🚚",
  ORDER_DELIVERED:    "✅",
  PRODUCT_APPROVED:   "✅",
  PRODUCT_REJECTED:   "⛔",
  SELLER_APPROVED:    "🎉",
  SELLER_REJECTED:    "⛔",
  FRAUD_ALERT:        "🚨",
  SELLER_APPLICATION: "📋",
};

function NotificationBell() {
  const { unreadCount, notifications, loading, loadNotifications, markRead, markAllRead } =
    useNotifications(true);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleOpen = () => {
    setOpen((v) => !v);
    if (!open) loadNotifications();
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        aria-label={`Notifications${unreadCount > 0 ? ` — ${unreadCount} unread` : ""}`}
        className="relative flex size-8 items-center justify-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white"
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
            <span className="text-[13px] font-bold text-slate-800">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-[11px] font-semibold text-[#1B4D91] transition hover:opacity-70"
              >
                <CheckCheck className="size-3" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {loading && (
              <div className="space-y-2 p-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />
                ))}
              </div>
            )}
            {!loading && notifications.length === 0 && (
              <p className="py-8 text-center text-[12px] text-slate-400">No notifications</p>
            )}
            {!loading && notifications.map((n: Notification) => (
              <button
                key={n.id}
                onClick={() => markRead(n.id)}
                className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50 ${
                  !n.readAt ? "bg-blue-50/40" : ""
                }`}
              >
                <span className="mt-0.5 text-base leading-none" aria-hidden>
                  {NOTIF_ICON[n.type] ?? "🔔"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-semibold text-slate-800">{n.title}</p>
                  {n.body && (
                    <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-500">{n.body}</p>
                  )}
                  <p className="mt-1 text-[10px] text-slate-400">
                    {new Date(n.createdAt).toLocaleString("ru-RU", {
                      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
                {!n.readAt && (
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-[#1B4D91]" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface TopBarProps {
  user:               { name: string; role: string } | null;
  onOpenAlertCenter?: () => void;
}

function LiveClock() {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })
  );
  useEffect(() => {
    const id = setInterval(() => {
      setTime(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }));
    }, 10_000);
    return () => clearInterval(id);
  }, []);
  return <span className="text-[12px] font-bold tabular-nums text-white/50">{time}</span>;
}

function StatPill({ dot, icon, label }: { dot?: string; icon?: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      {dot  && <span className={`size-2 rounded-full ${dot}`} />}
      {icon && icon}
      <span className="text-[12px] font-semibold text-white/70">{label}</span>
    </div>
  );
}

export default function TopBar({ user, onOpenAlertCenter }: TopBarProps) {
  const router      = useRouter();
  const storeLogout = useAuthStore((s) => s.logout);
  const { drivers, isConnected, isReconnecting, lastSyncAt } = useTrackingStore();
  const t = useT();

  const driversArr    = Object.values(drivers);
  const onlineCount   = driversArr.filter((d) => d.status === DriverStatus.ONLINE).length;
  const deliveryCount = driversArr.filter((d) => d.status === DriverStatus.ON_DELIVERY).length;
  const alertCount    = driversArr.reduce((sum, d) => sum + d.alerts.length, 0);

  const handleLogout = () => {
    disconnectSocket();
    storeLogout();
    router.replace("/login");
    apiLogout().catch(() => {});
  };

  const connState = isReconnecting
    ? { label: t.topbar_reconnecting, icon: <RefreshCcw className="size-3 animate-spin text-amber-300" />, text: "text-amber-200" }
    : isConnected
    ? { label: t.topbar_online,       icon: <Wifi       className="size-3 text-emerald-300" />,           text: "text-emerald-200" }
    : { label: t.topbar_offline,      icon: <WifiOff    className="size-3 text-red-300" />,               text: "text-red-200" };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-[#1B4D91] px-5">
      <div className="flex items-center gap-2.5">
        <div className="flex size-7 items-center justify-center rounded-lg bg-white/15">
          <Truck className="size-4 text-white" />
        </div>
        <span className="text-[15px] font-black lowercase tracking-[-0.03em] text-white">
          birga tracking
        </span>
      </div>

      <div className="hidden items-center gap-4 md:flex">
        <StatPill dot="bg-emerald-400" label={t.topbar_available(onlineCount)} />

        <div className="h-3 w-px bg-white/20" />

        <StatPill icon={<Truck className="size-3 text-white/50" />} label={t.topbar_delivering(deliveryCount)} />

        {alertCount > 0 && (
          <>
            <div className="h-3 w-px bg-white/20" />
            <button
              onClick={onOpenAlertCenter}
              className="flex items-center gap-1.5 rounded-full bg-red-500/25 px-2.5 py-1 transition hover:bg-red-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
              aria-label={`Открыть центр тревог — ${alertCount} активных тревог`}
            >
              <AlertTriangle className="size-3 text-red-300" />
              <span className="text-[12px] font-bold text-red-200">
                {t.topbar_alerts(alertCount)}
              </span>
            </button>
          </>
        )}

        <div className="h-3 w-px bg-white/20" />

        <div className="flex items-center gap-1.5" aria-live="polite" aria-atomic>
          {connState.icon}
          <span className={`text-[11px] font-bold ${connState.text}`}>{connState.label}</span>
        </div>

        {lastSyncAt && isConnected && (
          <>
            <div className="h-3 w-px bg-white/20" />
            <span className="text-[10px] text-white/35">
              {t.topbar_synced} {new Date(lastSyncAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </>
        )}

        <div className="h-3 w-px bg-white/20" />
        <LiveClock />
      </div>

      <div className="flex items-center gap-2">
        <span
          className={`size-2.5 rounded-full md:hidden ${
            isReconnecting ? "animate-pulse bg-amber-400" :
            isConnected    ? "bg-emerald-400"            :
                             "bg-red-400"
          }`}
        />

        {user && (
          <span className="hidden text-[13px] font-medium text-white/60 sm:block">
            {user.name}
          </span>
        )}

        <DispatcherLocaleSwitcher />

        <NotificationBell />

        <button
          onClick={handleLogout}
          aria-label="Sign out"
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold text-white/60 transition hover:bg-white/10 hover:text-white"
        >
          <LogOut className="size-3.5" aria-hidden />
          <span className="hidden sm:inline">{t.topbar_logout}</span>
        </button>
      </div>
    </header>
  );
}
