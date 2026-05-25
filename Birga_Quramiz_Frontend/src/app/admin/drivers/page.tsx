"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTrackingStore } from "@/store/trackingStore";
import { trackingApi } from "@/services/trackingApi";
import { DriverStatus } from "@/types/tracking";
import { cn } from "@/lib/utils";
import {
  Truck, Wifi, WifiOff, Package, AlertTriangle,
  Search, RefreshCw, Clock,
} from "lucide-react";

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "—";
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)  return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const STATUS_CONFIG = {
  [DriverStatus.ONLINE]:      { label: "Online",      dot: "bg-emerald-400", badge: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  [DriverStatus.ON_DELIVERY]: { label: "Delivering",  dot: "bg-blue-400 animate-pulse", badge: "bg-blue-50 text-blue-700 border-blue-200" },
  [DriverStatus.OFFLINE]:     { label: "Offline",     dot: "bg-slate-300", badge: "bg-slate-100 text-slate-500 border-slate-200" },
};

export default function AdminDriversPage() {
  const { drivers, isConnected, lastSyncAt } = useTrackingStore();
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    try {
      const list = await trackingApi.getDrivers();
      useTrackingStore.getState().setDrivers(list);
    } finally {
      setRefreshing(false);
    }
  };

  // Initial load if store is empty (WebSocket not yet connected)
  useEffect(() => {
    if (Object.keys(drivers).length === 0) {
      void refresh();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const list = Object.values(drivers).filter((d) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return d.name.toLowerCase().includes(q) || d.phone?.toLowerCase().includes(q);
  });

  const online      = list.filter((d) => d.status === DriverStatus.ONLINE).length;
  const onDelivery  = list.filter((d) => d.status === DriverStatus.ON_DELIVERY).length;
  const offline     = list.filter((d) => d.status === DriverStatus.OFFLINE).length;
  const stuck       = list.filter((d) => d.minutesStuck && d.minutesStuck > 0).length;

  return (
    <div className="flex flex-col flex-1 pb-12">
      <div className="mx-auto w-full max-w-[1440px] px-4 pt-4 md:px-7 md:pt-7 flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#1B4D91]/10">
              <Truck className="size-5 text-[#1B4D91]" />
            </div>
            <div>
              <h1 className="text-xl font-black text-[#1B4D91]">Drivers</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={cn("size-1.5 rounded-full", isConnected ? "bg-emerald-400" : "bg-red-400")} />
                <span className="text-[11px] font-medium text-slate-400">
                  {isConnected ? "Live" : "Disconnected"}
                  {lastSyncAt && ` · synced ${timeAgo(new Date(lastSyncAt).toISOString())}`}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => void refresh()}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-[12px] font-bold text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} />
            Refresh
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Online",     value: online,     icon: Wifi,          color: "text-emerald-600 bg-emerald-50" },
            { label: "Delivering", value: onDelivery, icon: Package,       color: "text-blue-600 bg-blue-50" },
            { label: "Offline",    value: offline,    icon: WifiOff,       color: "text-slate-500 bg-slate-100" },
            { label: "Stuck",      value: stuck,      icon: AlertTriangle, color: stuck > 0 ? "text-red-600 bg-red-50" : "text-slate-400 bg-slate-50" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-slate-100 shadow-sm px-4 py-3 flex items-center gap-3">
              <div className={cn("flex size-8 items-center justify-center rounded-xl", color)}>
                <Icon className="size-4" />
              </div>
              <div>
                <p className="text-[18px] font-black text-slate-800 leading-none">{value}</p>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-300" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or phone…"
            className="w-full h-11 pl-10 pr-4 rounded-2xl border border-slate-200 bg-white text-[13px] font-medium text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-[#1B4D91] focus:ring-2 focus:ring-[#1B4D91]/10 transition-all"
          />
        </div>

        {/* Driver list */}
        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm text-center">
            <Truck className="size-10 text-slate-200 mb-3" />
            <p className="text-[14px] font-bold text-slate-500">No drivers found</p>
            <p className="text-[12px] text-slate-400 mt-1">Drivers appear here when online or assigned</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {list.map((driver, idx) => {
              const cfg = STATUS_CONFIG[driver.status] ?? STATUS_CONFIG[DriverStatus.OFFLINE];
              const hasAlerts = driver.alerts?.length > 0;
              return (
                <Link
                  key={driver.id}
                  href={`/admin/drivers/${driver.id}`}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors",
                    idx !== 0 && "border-t border-slate-50"
                  )}
                >
                  {/* Avatar + status dot */}
                  <div className="relative shrink-0">
                    <div className="flex size-9 items-center justify-center rounded-full bg-[#1B4D91]/10 text-[#1B4D91] font-black text-[13px]">
                      {driver.name.charAt(0).toUpperCase()}
                    </div>
                    <span className={cn("absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-white", cfg.dot)} />
                  </div>

                  {/* Name + phone */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-[13px] font-bold text-slate-800 truncate">{driver.name}</p>
                      <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border", cfg.badge)}>
                        <span className={cn("size-1.5 rounded-full", cfg.dot.replace(" animate-pulse", ""))} />
                        {cfg.label}
                      </span>
                      {hasAlerts && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 border border-red-200 text-red-600">
                          <AlertTriangle className="size-2.5" />
                          {driver.alerts[0].message}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">{driver.phone}</p>
                  </div>

                  {/* Stats */}
                  <div className="hidden md:flex items-center gap-4 shrink-0">
                    {driver.status === DriverStatus.ON_DELIVERY && driver.etaMinutes != null && (
                      <div className="flex items-center gap-1 text-[11px] font-bold text-blue-600">
                        <Clock className="size-3" />
                        {driver.etaMinutes}m ETA
                      </div>
                    )}
                    <div className="text-right">
                      <p className="text-[12px] font-black text-slate-600">{driver.assignmentsToday}</p>
                      <p className="text-[10px] text-slate-400">today</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
