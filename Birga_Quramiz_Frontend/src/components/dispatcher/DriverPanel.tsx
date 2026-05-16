"use client";

import { useState, useMemo, useRef } from "react";
import {
  Search,
  X,
  User,
  Wifi,
  WifiOff,
  Truck,
  AlertTriangle,
  Clock,
  Radio,
  Shield,
  MessageCircleWarning,
} from "lucide-react";
import { DriverStatus } from "@/types/tracking";
import type { DriverLocation } from "@/types/tracking";
import type { ExtendedDriver, AlertType } from "@/store/trackingStore";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow } from "date-fns";
import { DriverRowSkeleton } from "@/components/dispatcher/ui/Skeleton";
import { EmptyState } from "@/components/dispatcher/ui/EmptyState";
import { useT } from "@/store/dispatcherLocaleStore";

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs));
}

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

interface Props {
  drivers:          ExtendedDriver[];
  locations:        Record<string, DriverLocation>;
  selectedDriverId: string | null;
  onSelect:         (id: string | null) => void;
  isLoading?:       boolean;
}

type FilterTab = "all" | "alert" | "delivering" | "available" | "offline";


const DriverRow = ({
  driver,
  loc,
  isSelected,
  onSelect,
}: {
  driver:     ExtendedDriver;
  loc:        DriverLocation | undefined;
  isSelected: boolean;
  onSelect:   () => void;
}) => {
  const t         = useT();
  const STATUS_CFG_LOCAL = {
    [DriverStatus.ONLINE]:      { label: t.panel_status_free,       dot: "bg-emerald-400", badge: "bg-emerald-50 text-emerald-700", icon: <Wifi className="size-3" /> },
    [DriverStatus.ON_DELIVERY]: { label: t.panel_status_delivering, dot: "bg-blue-500",    badge: "bg-blue-50 text-blue-700",       icon: <Truck className="size-3" /> },
    [DriverStatus.OFFLINE]:     { label: t.panel_status_offline,    dot: "bg-slate-300",   badge: "bg-slate-50 text-slate-400",     icon: <WifiOff className="size-3" /> },
  } as const;
  const ALERT_CFG_LOCAL: Record<AlertType, { label: string; cls: string; icon: React.ReactNode }> = {
    stuck:       { label: t.panel_alert_stuck,  cls: "bg-red-50 text-red-600 border border-red-100",       icon: <AlertTriangle className="size-2.5" /> },
    signal_lost: { label: t.panel_alert_signal, cls: "bg-amber-50 text-amber-600 border border-amber-100", icon: <Radio className="size-2.5" /> },
    delayed:     { label: t.panel_alert_delayed,cls: "bg-orange-50 text-orange-600 border border-orange-100", icon: <Clock className="size-2.5" /> },
    issue:       { label: t.panel_alert_issue,  cls: "bg-purple-50 text-purple-700 border border-purple-100", icon: <MessageCircleWarning className="size-2.5" /> },
  };
  const cfg       = STATUS_CFG_LOCAL[driver.status];
  const hasAlerts = driver.alerts.length > 0;
  const abbr      = initials(driver.name);

  const avatarCls =
    driver.status === DriverStatus.ON_DELIVERY
      ? "bg-blue-100 text-blue-700"
      : driver.status === DriverStatus.ONLINE
      ? "bg-emerald-100 text-emerald-700"
      : "bg-slate-100 text-slate-400";

  const lastSeen = loc
    ? formatDistanceToNow(loc.timestamp, { addSuffix: true })
    : driver.lastLocation
    ? formatDistanceToNow(driver.lastLocation.timestamp, { addSuffix: true })
    : null;

  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex w-full flex-col gap-2 border-l-2 px-4 py-3 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1B4D91]",
        isSelected   ? "border-[#1B4D91] bg-[#1B4D91]/[0.03]" : "border-transparent",
        hasAlerts && !isSelected && "bg-red-50/40"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <div className={cn("flex size-9 items-center justify-center rounded-full text-[12px] font-black", avatarCls)}>
            {abbr}
          </div>
          <span className={cn("absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-white", cfg.dot)} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="truncate text-[13px] font-semibold text-slate-800">{driver.name}</span>
              {hasAlerts && (
                <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[8px] font-black text-white">
                  <AlertTriangle className="size-2" />
                  {driver.alerts.length}
                </span>
              )}
            </div>
            <span className={cn("flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold", cfg.badge)}>
              {cfg.icon}
              {cfg.label}
            </span>
          </div>

          <p className="mt-0.5 text-[11px] text-slate-400">{driver.phone}</p>

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {driver.etaMinutes != null && driver.status === DriverStatus.ON_DELIVERY && (
              <span className="flex items-center gap-1 rounded-full bg-[#1B4D91]/[0.08] px-2 py-0.5 text-[10px] font-bold text-[#1B4D91]">
                <Clock className="size-2" />
                {driver.etaMinutes} {t.panel_eta_suffix}
              </span>
            )}
            {driver.assignmentsToday > 0 && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                {driver.assignmentsToday} {t.panel_today}
              </span>
            )}
            {lastSeen && <span className="text-[9px] text-slate-400">{lastSeen}</span>}
          </div>
        </div>
      </div>

      {hasAlerts && (
        <div className="ml-12 flex flex-col gap-1">
          {driver.alerts.map((alert) => {
            const ac = ALERT_CFG_LOCAL[alert.type];
            return (
              <div
                key={alert.type}
                className={cn("flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-semibold", ac.cls)}
              >
                {ac.icon}
                <span>{ac.label}</span>
                <span className="ml-auto text-[9px] font-normal opacity-70">
                  {formatDistanceToNow(alert.since, { addSuffix: true })}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </button>
  );
};

const SectionHeader = ({ label, count, urgent }: { label: string; count: number; urgent?: boolean }) => (
  <div
    className={cn(
      "sticky top-0 z-10 flex items-center justify-between border-b px-4 py-2 text-[9px] font-black uppercase tracking-[0.14em] backdrop-blur-sm",
      urgent
        ? "border-red-100 bg-red-50/90 text-red-600"
        : "border-slate-100 bg-white/90 text-slate-400"
    )}
  >
    <span>{label}</span>
    <span className={cn("rounded-full px-1.5 py-0.5 text-[8px] font-black", urgent ? "bg-red-500 text-white" : "bg-slate-100 text-slate-500")}>
      {count}
    </span>
  </div>
);

export default function DriverPanel({
  drivers,
  locations,
  selectedDriverId,
  onSelect,
  isLoading = false,
}: Props) {
  const t = useT();
  const [search,    setSearch]    = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const searchRef = useRef<HTMLInputElement>(null);

  const TABS: { id: FilterTab; label: string }[] = [
    { id: "all",        label: t.panel_tab_all       },
    { id: "alert",      label: t.panel_tab_alert     },
    { id: "delivering", label: t.panel_tab_delivering },
    { id: "available",  label: t.panel_tab_available  },
    { id: "offline",    label: t.panel_tab_offline    },
  ];

  const { withAlerts, delivering, available, offline } = useMemo(() => {
    const base = search.trim()
      ? drivers.filter((d) => {
          const q = search.toLowerCase();
          return d.name.toLowerCase().includes(q) || d.phone.includes(q);
        })
      : drivers;

    return {
      withAlerts: base.filter((d) => d.alerts.length > 0),
      delivering: base
        .filter((d) => d.status === DriverStatus.ON_DELIVERY && !d.alerts.length)
        .sort((a, b) => (a.etaMinutes ?? 999) - (b.etaMinutes ?? 999)),
      available: base.filter((d) => d.status === DriverStatus.ONLINE && !d.alerts.length),
      offline:   base.filter((d) => d.status === DriverStatus.OFFLINE),
    };
  }, [drivers, search]);

  const totalActive  = withAlerts.length + delivering.length + available.length;
  const totalOffline = offline.length;

  const tabCounts: Record<FilterTab, number> = {
    all:        drivers.length,
    alert:      withAlerts.length,
    delivering: delivering.length + withAlerts.filter((d) => d.status === DriverStatus.ON_DELIVERY).length,
    available:  available.length,
    offline:    totalOffline,
  };

  const flatFiltered = useMemo(() => {
    const base = search.trim()
      ? drivers.filter((d) => {
          const q = search.toLowerCase();
          return d.name.toLowerCase().includes(q) || d.phone.includes(q);
        })
      : drivers;

    switch (activeTab) {
      case "alert":      return base.filter((d) => d.alerts.length > 0);
      case "delivering": return base.filter((d) => d.status === DriverStatus.ON_DELIVERY);
      case "available":  return base.filter((d) => d.status === DriverStatus.ONLINE);
      case "offline":    return base.filter((d) => d.status === DriverStatus.OFFLINE);
      default:           return [];
    }
  }, [drivers, search, activeTab]);

  const handleSelect = (id: string) => onSelect(id === selectedDriverId ? null : id);

  return (
    <div className="flex flex-col">
      <div className="border-b border-slate-100 px-4 pt-3 pb-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">{t.panel_drivers_title}</h2>
          {withAlerts.length > 0 && (
            <span className="flex items-center gap-0.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-black text-white">
              <Shield className="size-2" />
              {t.panel_driver_alerts(withAlerts.length)}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-[12px] font-semibold text-slate-700">
          {t.panel_drivers_summary(totalActive, totalOffline)}
        </p>
      </div>

      <div className="border-b border-slate-100 px-3 py-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.panel_search_ph}
            aria-label={t.panel_search_ph}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-8 text-[12px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#1B4D91] focus:bg-white focus:ring-2 focus:ring-[#1B4D91]/10"
          />
          {search && (
            <button
              onClick={() => { setSearch(""); searchRef.current?.focus(); }}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600"
            >
              <X className="size-3" aria-hidden />
            </button>
          )}
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Filter drivers"
        className="flex gap-0.5 overflow-x-auto border-b border-slate-100 px-3 py-2 scrollbar-none"
      >
        {TABS.map((tab) => {
          const count   = tabCounts[tab.id];
          const isAlert = tab.id === "alert" && count > 0;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-bold transition-colors",
                activeTab === tab.id
                  ? isAlert
                    ? "bg-red-500 text-white"
                    : "bg-[#1B4D91] text-white"
                  : "text-slate-500 hover:bg-slate-100"
              )}
            >
              {tab.label}
              {count > 0 && (
                <span
                  className={cn(
                    "rounded-full px-1 py-0.5 text-[7px] font-black leading-none",
                    activeTab === tab.id
                      ? "bg-white/25 text-white"
                      : isAlert
                      ? "bg-red-100 text-red-600"
                      : "bg-slate-200 text-slate-600"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {isLoading && (
        <div>
          <DriverRowSkeleton />
          <DriverRowSkeleton />
          <DriverRowSkeleton />
        </div>
      )}

      {!isLoading && activeTab === "all" && (
        <div role="tabpanel" id="driver-tab-panel-all" aria-label="All drivers">
          {withAlerts.length > 0 && (
            <>
              <SectionHeader label={`⚠ ${t.panel_section_attention}`} count={withAlerts.length} urgent />
              {withAlerts.map((d) => (
                <DriverRow key={d.id} driver={d} loc={locations[d.id]} isSelected={d.id === selectedDriverId} onSelect={() => handleSelect(d.id)} />
              ))}
            </>
          )}
          {delivering.length > 0 && (
            <>
              <SectionHeader label={t.panel_section_delivery} count={delivering.length} />
              {delivering.map((d) => (
                <DriverRow key={d.id} driver={d} loc={locations[d.id]} isSelected={d.id === selectedDriverId} onSelect={() => handleSelect(d.id)} />
              ))}
            </>
          )}
          {available.length > 0 && (
            <>
              <SectionHeader label={t.panel_section_available} count={available.length} />
              {available.map((d) => (
                <DriverRow key={d.id} driver={d} loc={locations[d.id]} isSelected={d.id === selectedDriverId} onSelect={() => handleSelect(d.id)} />
              ))}
            </>
          )}
          {offline.length > 0 && (
            <>
              <SectionHeader label={t.panel_section_offline} count={offline.length} />
              {offline.map((d) => (
                <DriverRow key={d.id} driver={d} loc={locations[d.id]} isSelected={d.id === selectedDriverId} onSelect={() => handleSelect(d.id)} />
              ))}
            </>
          )}
          {drivers.length === 0 && !search && (
            <EmptyState
              icon={<User className="size-6 text-slate-400" />}
              title={t.panel_empty_no_drivers}
              description={t.panel_empty_login_desc}
            />
          )}
        </div>
      )}

      {!isLoading && activeTab !== "all" && (
        <div role="tabpanel" id={`driver-tab-panel-${activeTab}`} aria-label={`${activeTab} drivers`}>
          {flatFiltered.length > 0
            ? flatFiltered.map((d) => (
                <DriverRow key={d.id} driver={d} loc={locations[d.id]} isSelected={d.id === selectedDriverId} onSelect={() => handleSelect(d.id)} />
              ))
            : (
              <EmptyState
                icon={<User className="size-6 text-slate-400" />}
                title={search ? t.panel_empty_no_q_title : t.panel_empty_no_drivers}
                description={search ? t.panel_empty_no_results(search) : undefined}
              />
            )}
        </div>
      )}

      {!isLoading && search && activeTab === "all" &&
        withAlerts.length === 0 && delivering.length === 0 &&
        available.length === 0 && offline.length === 0 && (
        <EmptyState
          icon={<Search className="size-6 text-slate-400" />}
          title={t.panel_empty_no_q_title}
          description={t.panel_empty_no_results(search)}
          action={
            <button
              onClick={() => setSearch("")}
              className="text-[12px] font-semibold text-[#1B4D91] hover:underline"
            >
              {t.panel_clear_search}
            </button>
          }
        />
      )}
    </div>
  );
}
