"use client";

import { useEffect, useState } from "react";
import { LogOut, Truck, Wifi, WifiOff, RefreshCcw, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { logout as apiLogout } from "@/lib/api/auth";
import { disconnectSocket } from "@/lib/tracking/socket";
import { useTrackingStore } from "@/store/trackingStore";
import { DriverStatus } from "@/types/tracking";

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
    ? { label: "Переподключение…", icon: <RefreshCcw className="size-3 animate-spin text-amber-300" />, text: "text-amber-200" }
    : isConnected
    ? { label: "Онлайн",           icon: <Wifi       className="size-3 text-emerald-300" />,           text: "text-emerald-200" }
    : { label: "Оффлайн",          icon: <WifiOff    className="size-3 text-red-300" />,               text: "text-red-200" };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-[#1B4D91] px-5">
      <div className="flex items-center gap-2.5">
        <div className="flex size-7 items-center justify-center rounded-lg bg-white/15">
          <Truck className="size-4 text-white" />
        </div>
        <span className="text-[15px] font-black lowercase tracking-[-0.03em] text-white">
          birga tracking
        </span>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/60">
          диспетчер
        </span>
      </div>

      <div className="hidden items-center gap-4 md:flex">
        <StatPill dot="bg-emerald-400" label={`${onlineCount} свободно`} />

        <div className="h-3 w-px bg-white/20" />

        <StatPill icon={<Truck className="size-3 text-white/50" />} label={`${deliveryCount} в доставке`} />

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
                {alertCount} {alertCount === 1 ? "тревога" : "тревог"}
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
              синхр. {new Date(lastSyncAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </>
        )}

        <div className="h-3 w-px bg-white/20" />
        <LiveClock />
      </div>

      <div className="flex items-center gap-3">
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

        <button
          onClick={handleLogout}
          aria-label="Sign out"
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold text-white/60 transition hover:bg-white/10 hover:text-white"
        >
          <LogOut className="size-3.5" aria-hidden />
          <span className="hidden sm:inline">Выйти</span>
        </button>
      </div>
    </header>
  );
}
