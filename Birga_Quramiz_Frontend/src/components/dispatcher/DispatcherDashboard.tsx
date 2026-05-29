"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { useTrackingStore } from "@/store/trackingStore";
import { useTrackingSocket } from "@/hooks/use-tracking-socket";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { queryKeys } from "@/lib/tracking/queryKeys";
import { trackingApi, type FraudFlag } from "@/services/trackingApi";
import DriverPanel from "./DriverPanel";
import DriverDetailModal from "./DriverDetailModal";
import AlertCenter from "./AlertCenter";
import RoutePlayback from "./RoutePlayback";
import OrderPanel from "./OrderPanel";
import OrderDetailPanel from "./OrderDetailPanel";
import MapView from "./map/MapView";
import TopBar from "./TopBar";
import { useT, useDispatcherLocaleStore } from "@/store/dispatcherLocaleStore";
import {
  AlertTriangle,
  Clock,
  Shield,
  X,
  RefreshCcw,
  CheckCircle,
  Users,
  Package,
  Map as MapIcon,
  Trash2,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs));
}

type ToastKind = "warning" | "error" | "info" | "success";

interface AlertToast {
  id:    string;
  kind:  ToastKind;
  title: string;
  body?: string;
  at:    number;
}

const TOAST_TTL = 7_000;

const TOAST_STYLE: Record<ToastKind, string> = {
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  error:   "border-red-200   bg-red-50   text-red-800",
  info:    "border-blue-200  bg-blue-50  text-blue-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

const TOAST_ICON: Record<ToastKind, React.ReactNode> = {
  warning: <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" aria-hidden />,
  error:   <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-500"   aria-hidden />,
  info:    <Clock         className="mt-0.5 size-4 shrink-0 text-blue-500"  aria-hidden />,
  success: <CheckCircle   className="mt-0.5 size-4 shrink-0 text-emerald-500" aria-hidden />,
};

function ToastStack({ toasts, onDismiss }: { toasts: AlertToast[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;
  return (
    <div role="region" aria-label="Notifications" className="pointer-events-none fixed right-4 top-16 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="alert"
          className={cn(
            "pointer-events-auto flex w-80 items-start gap-2.5 rounded-xl border px-4 py-3 shadow-lg animate-toast-in",
            TOAST_STYLE[t.kind]
          )}
        >
          {TOAST_ICON[t.kind]}
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold">{t.title}</p>
            {t.body && <p className="mt-0.5 text-[11px] opacity-80 leading-tight">{t.body}</p>}
          </div>
          <button
            onClick={() => onDismiss(t.id)}
            aria-label="Dismiss notification"
            className="mt-0.5 rounded p-0.5 opacity-50 hover:opacity-80"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </div>
      ))}
    </div>
  );
}

interface GroupedFlag {
  key:          string;
  driverId:     string;
  driver?:      { name: string; phone: string | null };
  reasonType:   string;
  reasonDetail?: string;
  count:        number;
  latestAt:     string;
  ids:          string[];
}

function groupFraudFlags(flags: FraudFlag[]): GroupedFlag[] {
  const map = new Map<string, GroupedFlag>();
  for (const flag of flags) {
    const reasonType   = (flag.reason ?? "").split(":")[0];
    const reasonDetail = flag.reason?.includes(":") ? flag.reason.split(":")[1] : undefined;
    const key          = `${flag.driverId}::${reasonType}`;
    const existing     = map.get(key);
    if (existing) {
      existing.count++;
      existing.ids.push(flag.id);
      if (new Date(flag.createdAt) > new Date(existing.latestAt)) {
        existing.latestAt    = flag.createdAt;
        existing.reasonDetail = reasonDetail;
      }
    } else {
      map.set(key, { key, driverId: flag.driverId, driver: flag.driver, reasonType, reasonDetail, count: 1, latestAt: flag.createdAt, ids: [flag.id] });
    }
  }
  return [...map.values()].sort((a, b) => new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime());
}

function FraudFlagsSection({ flags }: { flags: FraudFlag[] }) {
  const t  = useT();
  const qc = useQueryClient();
  const [collapsed, setCollapsed] = useState(false);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["tracking", "fraud-flags"] });

  const dismissGroup = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => trackingApi.dismissFraudFlag(id))),
    onSuccess:  invalidate,
  });

  const clearAll = useMutation({
    mutationFn: trackingApi.clearAllFraudFlags,
    onSuccess:  invalidate,
  });

  if (flags.length === 0) return null;

  const groups = groupFraudFlags(flags);

  return (
    <section aria-label="Security alerts" className="border-t-2 border-red-200 bg-white">
      {/* Section header */}
      <div className="flex items-center gap-2 bg-red-500 px-4 py-2.5">
        <div className="flex size-5 shrink-0 items-center justify-center rounded bg-white/20">
          <Shield className="size-3 text-white" aria-hidden />
        </div>
        <div className="flex flex-1 items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-white">
            {t.dash_fraud_title}
          </span>
          <span className="rounded-full bg-white/25 px-1.5 py-0.5 text-[9px] font-black text-white">
            {groups.length} {groups.length === 1 ? "driver" : "drivers"} · {flags.length} events
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => clearAll.mutate()}
            disabled={clearAll.isPending}
            aria-label="Clear all"
            className="flex items-center gap-1 rounded-lg bg-white/15 px-2 py-1 text-[9px] font-bold text-white/80 transition hover:bg-white/25 disabled:opacity-40"
          >
            <Trash2 className="size-3" aria-hidden />
            Clear
          </button>
          <button
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand" : "Collapse"}
            className="flex size-6 items-center justify-center rounded-lg bg-white/15 text-white/80 transition hover:bg-white/25"
          >
            <svg className={cn("size-3 transition-transform duration-200", collapsed && "rotate-180")} viewBox="0 0 12 12" fill="none">
              <path d="M2 4.5L6 8.5L10 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Alert cards */}
      {!collapsed && (
        <div className="divide-y divide-slate-100">
          {groups.map((g) => {
            const isCritical = g.count >= 3;
            return (
              <div
                key={g.key}
                className={cn(
                  "flex items-start gap-3 px-4 py-3 transition-colors",
                  isCritical ? "bg-red-50/60" : "bg-white"
                )}
              >
                {/* Severity indicator */}
                <div className={cn(
                  "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg",
                  isCritical ? "bg-red-100" : "bg-amber-50"
                )}>
                  <AlertTriangle className={cn("size-3.5", isCritical ? "text-red-500" : "text-amber-500")} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[12px] font-bold text-slate-800">
                        {g.driver?.name ?? "Unknown driver"}
                      </p>
                      <p className="mt-0.5 text-[10px] capitalize font-medium text-slate-500">
                        {g.reasonType.toLowerCase().replace(/_/g, " ")}
                        {g.reasonDetail && (
                          <span className="ml-1 font-normal text-slate-400">· {g.reasonDetail}</span>
                        )}
                      </p>
                    </div>
                    {g.count > 1 && (
                      <span className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[9px] font-black",
                        isCritical ? "bg-red-500 text-white" : "bg-amber-100 text-amber-700"
                      )}>
                        {g.count}× in 10 min
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[9px] text-slate-400">
                    Last: {new Date(g.latestAt).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>

                <button
                  onClick={() => dismissGroup.mutate(g.ids)}
                  disabled={dismissGroup.isPending}
                  aria-label="Dismiss group"
                  className="mt-0.5 shrink-0 rounded p-1 text-slate-300 transition hover:bg-slate-100 hover:text-slate-500 disabled:opacity-40"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}


type MobileTab = "drivers" | "map" | "orders";

function MobileTabBar({ active, onChange }: { active: MobileTab; onChange: (t: MobileTab) => void }) {
  const t = useT();
  return (
    <nav aria-label="Main navigation" className="flex shrink-0 border-t border-slate-200 bg-white md:hidden">
      {(["drivers", "map", "orders"] as MobileTab[]).map((tab) => {
        const config: Record<MobileTab, { label: string; icon: React.ReactNode }> = {
          drivers: { label: t.dash_tab_drivers, icon: <Users   className="size-5" aria-hidden /> },
          map:     { label: t.dash_tab_map,     icon: <MapIcon className="size-5" aria-hidden /> },
          orders:  { label: t.dash_tab_orders,  icon: <Package className="size-5" aria-hidden /> },
        };
        const isActive = active === tab;
        return (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-bold uppercase tracking-wide transition",
              isActive ? "text-[#1B4D91]" : "text-slate-400 hover:text-slate-600"
            )}
          >
            {config[tab].icon}
            {config[tab].label}
          </button>
        );
      })}
    </nav>
  );
}

export default function DispatcherDashboard() {
  const { user } = useAuthStore();
  const t = useT();
  const {
    setDrivers,
    drivers,
    locations,
    selectedDriverId,
    selectDriver,
    isConnected,
    isReconnecting,
  } = useTrackingStore();

  const [toasts,          setToasts]          = useState<AlertToast[]>([]);
  const [mobileTab,       setMobileTab]       = useState<MobileTab>("map");
  const [alertCenterOpen,  setAlertCenterOpen]  = useState(false);
  const [playbackDriverId, setPlaybackDriverId] = useState<string | null>(null);
  const [selectedOrderId,  setSelectedOrderId]  = useState<string | null>(null);

  const toastTimers = useRef<globalThis.Map<string, ReturnType<typeof setTimeout>>>(new globalThis.Map());
  const qc = useQueryClient();

  useTrackingSocket();

  const { data: driversData } = useQuery({
    queryKey: queryKeys.drivers.list(),
    queryFn:  trackingApi.getDrivers,
    refetchInterval: 30_000,
    enabled:  !!user,
  });

  useEffect(() => {
    if (driversData) setDrivers(driversData);
  }, [driversData, setDrivers]);

  const { data: fraudFlags = [] } = useQuery({
    queryKey: queryKeys.fraudFlags.all(),
    queryFn:  trackingApi.getFraudFlags,
    refetchInterval: 60_000,
    enabled:  !!user,
  });

  const dismissToast = (id: string) => {
    const timer = toastTimers.current.get(id);
    if (timer) { clearTimeout(timer); toastTimers.current.delete(id); }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const addToast = (toast: Omit<AlertToast, "id" | "at">) => {
    const id    = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const entry: AlertToast = { ...toast, id, at: Date.now() };
    setToasts((prev) => [entry, ...prev].slice(0, 5));
    const timer = setTimeout(() => dismissToast(id), TOAST_TTL);
    toastTimers.current.set(id, timer);
  };

  useEffect(() => {
    const handleDelayed = (e: Event) => {
      const { orderId, minutesWaiting } = (e as CustomEvent).detail;
      const tt = useDispatcherLocaleStore.getState().t;
      addToast({
        kind:  "warning",
        title: tt.dash_toast_delayed,
        body:  tt.dash_toast_delayed_b(String(orderId).slice(-6).toUpperCase(), minutesWaiting),
      });
    };

    const handleStatus = (e: Event) => {
      const { status, driverId } = (e as CustomEvent).detail;
      const driver = Object.values(drivers).find((d) => d.id === driverId);
      if (status === "DELIVERED") {
        const tt = useDispatcherLocaleStore.getState().t;
        addToast({
          kind:  "success",
          title: tt.dash_toast_delivered,
          body:  driver ? tt.dash_toast_delivered_b(driver.name) : undefined,
        });
      }
    };

    const handleDriverIssue = (e: Event) => {
      const { driverName, issue } = (e as CustomEvent<{ driverName: string; issue: string }>).detail;
      const tt = useDispatcherLocaleStore.getState().t;
      addToast({
        kind:  "warning",
        title: tt.dash_toast_issue(driverName),
        body:  issue,
      });
    };

    const handleFraudAlert = (e: Event) => {
      const { driverId, reason } = (e as CustomEvent<{ driverId: string; reason: string; at: number }>).detail;
      const driver = Object.values(useTrackingStore.getState().drivers).find((d) => d.id === driverId);
      qc.invalidateQueries({ queryKey: ["tracking", "fraud-flags"] });
      addToast({
        kind:  "error",
        title: "🚨 Fraud Alert",
        body:  driver ? `${driver.name}: ${reason}` : reason,
      });
    };

    window.addEventListener("birga:order_delayed",     handleDelayed);
    window.addEventListener("birga:assignment_status", handleStatus);
    window.addEventListener("birga:driver_issue",      handleDriverIssue);
    window.addEventListener("birga:fraud_alert",       handleFraudAlert);
    return () => {
      window.removeEventListener("birga:order_delayed",     handleDelayed);
      window.removeEventListener("birga:assignment_status", handleStatus);
      window.removeEventListener("birga:driver_issue",      handleDriverIssue);
      window.removeEventListener("birga:fraud_alert",       handleFraudAlert);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drivers]);

  useEffect(() => () => { toastTimers.current.forEach(clearTimeout); }, []);

  if (!user) return null;

  const driversArr = Object.values(drivers);
  const hasAlerts  = driversArr.some((d) => d.alerts.length > 0);
  const alertCount = driversArr.reduce((s, d) => s + d.alerts.length, 0);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <TopBar user={user} onOpenAlertCenter={() => setAlertCenterOpen(true)} />

      {isReconnecting && (
        <div role="status" className="flex items-center justify-center gap-2 bg-amber-500 py-1.5 text-[12px] font-bold text-white">
          <RefreshCcw className="size-3 animate-spin" aria-hidden />
          {t.dash_reconnecting}
        </div>
      )}
      {!isConnected && !isReconnecting && (
        <div role="alert" className="flex items-center justify-center gap-2 bg-red-500 py-1.5 text-[12px] font-bold text-white">
          <AlertTriangle className="size-3" aria-hidden />
          {t.dash_disconnected}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop driver panel */}
        <aside
          aria-label="Driver panel"
          className={cn(
            "relative hidden w-[285px] shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-white md:flex",
            hasAlerts && "border-r-red-200"
          )}
        >
          <DriverPanel
            drivers={driversArr}
            locations={locations}
            selectedDriverId={selectedDriverId}
            onSelect={selectDriver}
          />
          <div className="mt-auto">
            <FraudFlagsSection flags={fraudFlags} />
          </div>
        </aside>

        {/* Mobile driver panel */}
        <aside
          aria-label="Driver panel"
          className={cn(
            "flex w-full shrink-0 flex-col overflow-y-auto bg-white md:hidden",
            mobileTab !== "drivers" && "hidden"
          )}
        >
          <DriverPanel
            drivers={driversArr}
            locations={locations}
            selectedDriverId={selectedDriverId}
            onSelect={(id) => { selectDriver(id); setMobileTab("map"); }}
          />
          <div className="mt-auto">
            <FraudFlagsSection flags={fraudFlags} />
          </div>
        </aside>

        {/* Center map */}
        <main
          aria-label="Map"
          className={cn("relative flex-1 overflow-hidden", mobileTab !== "map" && "hidden md:block")}
        >
          {hasAlerts && !selectedDriverId && (
            <div className="absolute left-1/2 top-3 z-10 -translate-x-1/2">
              <button
                onClick={() => setAlertCenterOpen(true)}
                className="flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 shadow-md transition hover:bg-red-100"
              >
                <AlertTriangle className="size-3 text-red-500" />
                <span className="text-[11px] font-bold text-red-600">
                  {t.dash_alert_bubble(alertCount)}
                </span>
              </button>
            </div>
          )}
          <MapView
            drivers={driversArr}
            locations={locations}
            selectedDriverId={selectedDriverId}
            onSelectDriver={selectDriver}
          />
          {/* Driver detail overlay — slides in from left when driver selected */}
          {selectedDriverId && (
            <div className="animate-slide-from-left absolute left-0 top-0 z-20 h-full w-[280px] overflow-hidden border-r border-slate-200 bg-white shadow-xl">
              <DriverDetailModal
                driverId={selectedDriverId}
                onClose={() => selectDriver(null)}
                onOpenPlayback={(id) => { setPlaybackDriverId(id); selectDriver(null); }}
                onViewOrderDetail={setSelectedOrderId}
              />
            </div>
          )}

          {/* Order detail overlay — slides in from right */}
          {selectedOrderId && (
            <div className="animate-slide-from-right absolute right-0 top-0 z-20 h-full w-[320px] overflow-hidden border-l border-slate-200 bg-white shadow-xl">
              <OrderDetailPanel
                orderId={selectedOrderId}
                onClose={() => setSelectedOrderId(null)}
              />
            </div>
          )}
        </main>

        {/* Desktop order panel */}
        <aside
          aria-label="Order panel"
          className="hidden w-[300px] shrink-0 flex-col overflow-y-auto border-l border-slate-200 bg-white md:flex"
        >
          <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100" aria-label="Fleet summary">
            <div className="flex flex-col items-center py-2.5">
              <span className="text-[18px] font-black text-emerald-600">
                {driversArr.filter((d) => d.status !== "OFFLINE").length}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{t.dash_fleet_active}</span>
            </div>
            <div className="flex flex-col items-center py-2.5">
              <span className="text-[18px] font-black text-[#1B4D91]">
                {driversArr.filter((d) => d.status === "ON_DELIVERY").length}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{t.dash_fleet_deliv}</span>
            </div>
            <div className="flex flex-col items-center py-2.5">
              <span className={cn("text-[18px] font-black", fraudFlags.length > 0 ? "text-red-500" : "text-slate-300")}>
                {fraudFlags.length}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{t.dash_fleet_fraud}</span>
            </div>
          </div>

          <OrderPanel selectedDriverId={selectedDriverId} onViewDetail={setSelectedOrderId} />
        </aside>

        {/* Mobile order panel */}
        <aside
          aria-label="Order panel"
          className={cn(
            "flex w-full shrink-0 flex-col overflow-y-auto bg-white md:hidden",
            mobileTab !== "orders" && "hidden"
          )}
        >
          <OrderPanel selectedDriverId={selectedDriverId} onViewDetail={setSelectedOrderId} />
        </aside>
      </div>

      <MobileTabBar active={mobileTab} onChange={setMobileTab} />

      <ToastStack toasts={toasts} onDismiss={dismissToast} />

      {alertCenterOpen && (
        <AlertCenter
          onClose={() => setAlertCenterOpen(false)}
          onFocusDriver={(id) => {
            selectDriver(id);
            setMobileTab("map");
          }}
        />
      )}

      {playbackDriverId && (
        <RoutePlayback
          driverId={playbackDriverId}
          onClose={() => setPlaybackDriverId(null)}
        />
      )}
    </div>
  );
}
