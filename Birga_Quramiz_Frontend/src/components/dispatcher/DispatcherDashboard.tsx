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
import OrderPanel from "./OrderPanel";
import MapView from "./map/MapView";
import TopBar from "./TopBar";
import {
  AlertTriangle,
  Clock,
  Shield,
  X,
  RefreshCcw,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Users,
  Package,
  Map as MapIcon,
} from "lucide-react";

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

function FraudFlagsSection({ flags }: { flags: FraudFlag[] }) {
  if (flags.length === 0) return null;
  return (
    <section aria-label="Fraud flags" className="border-t border-red-100 bg-red-50/50">
      <div className="border-b border-red-100 px-4 py-2.5">
        <h3 className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-red-600">
          <Shield className="size-3" aria-hidden />
          Fraud Flags
          <span className="ml-auto rounded-full bg-red-500 px-1.5 py-0.5 text-[8px] text-white" aria-label={`${flags.length} fraud flags`}>
            {flags.length}
          </span>
        </h3>
      </div>
      {flags.map((flag) => (
        <div key={flag.id} className="flex items-start gap-2 border-b border-red-100/60 px-4 py-2.5">
          <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="size-3 text-red-500" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold text-red-700">{flag.driver?.name ?? "Unknown driver"}</p>
            <p className="text-[10px] text-red-500 capitalize">{flag.type.toLowerCase().replace(/_/g, " ")}</p>
            {flag.description && (
              <p className="mt-0.5 text-[10px] leading-tight text-red-400">{flag.description}</p>
            )}
            <p className="mt-0.5 text-[9px] text-red-300">
              {new Date(flag.createdAt).toLocaleString("en-US", {
                month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      ))}
    </section>
  );
}

function CollapsedStrip({
  side,
  label,
  count,
  alertCount,
  icon,
  onExpand,
}: {
  side:        "left" | "right";
  label:       string;
  count:       number;
  alertCount?: number;
  icon:        React.ReactNode;
  onExpand:    () => void;
}) {
  return (
    <button
      onClick={onExpand}
      aria-label={`Expand ${label} panel`}
      aria-expanded={false}
      className={cn(
        "group flex w-10 shrink-0 flex-col items-center gap-3 border-slate-200 bg-white py-4 transition hover:bg-slate-50",
        side === "left" ? "border-r" : "border-l"
      )}
    >
      <span className="text-slate-300 transition group-hover:text-[#1B4D91]" aria-hidden>
        {side === "left" ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
      </span>
      <span className="text-slate-400" aria-hidden>{icon}</span>
      <span className="flex size-6 items-center justify-center rounded-full bg-slate-100 text-[11px] font-black text-slate-600">
        {count}
      </span>
      {alertCount != null && alertCount > 0 && (
        <span className="flex size-5 items-center justify-center rounded-full bg-red-50 text-[9px] font-black text-red-600">
          {alertCount}
        </span>
      )}
      <span className="mt-1 rotate-90 whitespace-nowrap text-[8px] font-black uppercase tracking-widest text-slate-300">
        {label}
      </span>
    </button>
  );
}

type MobileTab = "drivers" | "map" | "orders";

function MobileTabBar({ active, onChange }: { active: MobileTab; onChange: (t: MobileTab) => void }) {
  return (
    <nav aria-label="Main navigation" className="flex shrink-0 border-t border-slate-200 bg-white md:hidden">
      {(["drivers", "map", "orders"] as MobileTab[]).map((tab) => {
        const config: Record<MobileTab, { label: string; icon: React.ReactNode }> = {
          drivers: { label: "Drivers", icon: <Users   className="size-5" aria-hidden /> },
          map:     { label: "Map",     icon: <MapIcon className="size-5" aria-hidden /> },
          orders:  { label: "Orders",  icon: <Package className="size-5" aria-hidden /> },
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
  const {
    setDrivers,
    drivers,
    locations,
    selectedDriverId,
    selectDriver,
    isConnected,
    isReconnecting,
  } = useTrackingStore();

  const [toasts,    setToasts]    = useState<AlertToast[]>([]);
  const [leftOpen,  setLeftOpen]  = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [mobileTab, setMobileTab] = useState<MobileTab>("map");

  const toastTimers = useRef<globalThis.Map<string, ReturnType<typeof setTimeout>>>(new globalThis.Map());

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
      addToast({
        kind:  "warning",
        title: "Order delayed",
        body:  `Order ${String(orderId).slice(-6).toUpperCase()} waiting ${minutesWaiting}m for pickup`,
      });
    };

    const handleStatus = (e: Event) => {
      const { status, driverId } = (e as CustomEvent).detail;
      const driver = Object.values(drivers).find((d) => d.id === driverId);
      if (status === "DELIVERED") {
        addToast({
          kind:  "success",
          title: "Order delivered",
          body:  driver ? `${driver.name} completed delivery` : undefined,
        });
      }
    };

    window.addEventListener("birga:order_delayed",     handleDelayed);
    window.addEventListener("birga:assignment_status", handleStatus);
    return () => {
      window.removeEventListener("birga:order_delayed",     handleDelayed);
      window.removeEventListener("birga:assignment_status", handleStatus);
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
      <TopBar user={user} />

      {isReconnecting && (
        <div role="status" className="flex items-center justify-center gap-2 bg-amber-500 py-1.5 text-[12px] font-bold text-white">
          <RefreshCcw className="size-3 animate-spin" aria-hidden />
          Reconnecting to server — data may be stale
        </div>
      )}
      {!isConnected && !isReconnecting && (
        <div role="alert" className="flex items-center justify-center gap-2 bg-red-500 py-1.5 text-[12px] font-bold text-white">
          <AlertTriangle className="size-3" aria-hidden />
          Connection lost — live tracking unavailable
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop collapsed left */}
        {!leftOpen && (
          <div className="hidden md:flex">
            <CollapsedStrip
              side="left"
              label="Drivers"
              count={driversArr.length}
              alertCount={alertCount}
              icon={<Users className="size-4" />}
              onExpand={() => setLeftOpen(true)}
            />
          </div>
        )}

        {/* Desktop driver panel */}
        <aside
          aria-label="Driver panel"
          className={cn(
            "relative hidden shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-white transition-all duration-200 md:flex",
            leftOpen ? "w-[285px]" : "w-0 overflow-hidden border-0",
            hasAlerts && leftOpen && "border-r-red-200"
          )}
        >
          {leftOpen && (
            <button
              onClick={() => setLeftOpen(false)}
              aria-label="Collapse driver panel"
              aria-expanded={true}
              className="absolute right-0 top-1/2 z-10 -translate-y-1/2 translate-x-1/2 flex size-6 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm text-slate-400 transition hover:border-slate-300 hover:text-slate-600"
            >
              <ChevronLeft className="size-3.5" aria-hidden />
            </button>
          )}
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
          {hasAlerts && (
            <div className="pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2" aria-hidden>
              <div className="flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 shadow-md">
                <AlertTriangle className="size-3 text-red-500" />
                <span className="text-[11px] font-bold text-red-600">
                  {alertCount} active alert{alertCount !== 1 ? "s" : ""} — check driver panel
                </span>
              </div>
            </div>
          )}
          <MapView
            drivers={driversArr}
            locations={locations}
            selectedDriverId={selectedDriverId}
            onSelectDriver={selectDriver}
          />
        </main>

        {/* Desktop collapsed right */}
        {!rightOpen && (
          <div className="hidden md:flex">
            <CollapsedStrip
              side="right"
              label="Orders"
              count={0}
              icon={<Package className="size-4" />}
              onExpand={() => setRightOpen(true)}
            />
          </div>
        )}

        {/* Desktop order panel */}
        <aside
          aria-label="Order panel"
          className={cn(
            "relative hidden shrink-0 flex-col overflow-y-auto border-l border-slate-200 bg-white transition-all duration-200 md:flex",
            rightOpen ? "w-[300px]" : "w-0 overflow-hidden border-0"
          )}
        >
          {rightOpen && (
            <button
              onClick={() => setRightOpen(false)}
              aria-label="Collapse order panel"
              aria-expanded={true}
              className="absolute left-0 top-1/2 z-10 -translate-y-1/2 -translate-x-1/2 flex size-6 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm text-slate-400 transition hover:border-slate-300 hover:text-slate-600"
            >
              <ChevronRight className="size-3.5" aria-hidden />
            </button>
          )}

          <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100" aria-label="Fleet summary">
            <div className="flex flex-col items-center py-2.5">
              <span className="text-[18px] font-black text-emerald-600">
                {driversArr.filter((d) => d.status !== "OFFLINE").length}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Active</span>
            </div>
            <div className="flex flex-col items-center py-2.5">
              <span className="text-[18px] font-black text-[#1B4D91]">
                {driversArr.filter((d) => d.status === "ON_DELIVERY").length}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Delivering</span>
            </div>
            <div className="flex flex-col items-center py-2.5">
              <span className={cn("text-[18px] font-black", fraudFlags.length > 0 ? "text-red-500" : "text-slate-300")}>
                {fraudFlags.length}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Fraud</span>
            </div>
          </div>

          <OrderPanel selectedDriverId={selectedDriverId} />
        </aside>

        {/* Mobile order panel */}
        <aside
          aria-label="Order panel"
          className={cn(
            "flex w-full shrink-0 flex-col overflow-y-auto bg-white md:hidden",
            mobileTab !== "orders" && "hidden"
          )}
        >
          <OrderPanel selectedDriverId={selectedDriverId} />
        </aside>
      </div>

      <MobileTabBar active={mobileTab} onChange={setMobileTab} />

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
