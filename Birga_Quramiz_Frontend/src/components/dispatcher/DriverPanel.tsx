"use client";

import { useState, useMemo, useRef } from "react";
import {
  Search, X, User, Users, Wifi, WifiOff, CircleOff, Truck,
  AlertTriangle, Clock, Radio, Shield, MessageCircleWarning,
  Navigation, Crosshair,
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
type OpState   = "delivering" | "moving" | "idle" | "poor_gps" | "no_signal" | "offline";

function getOpState(driver: ExtendedDriver, loc: DriverLocation | undefined): OpState {
  if (driver.status === DriverStatus.OFFLINE) return "offline";
  if (driver.signalLost)                      return "no_signal";
  if (driver.status === DriverStatus.ON_DELIVERY) return "delivering";
  if (loc?.speed !== undefined && loc.speed > 1.5)     return "moving";
  if (loc?.accuracy !== undefined && loc.accuracy > 50) return "poor_gps";
  return "idle";
}

// ─── Filter Pill ──────────────────────────────────────────────────────────────

function FilterPill({
  icon, label, count, isActive, isAlert, isFull, onClick,
}: {
  icon:     React.ReactNode;
  label:    string;
  count:    number;
  isActive: boolean;
  isAlert?: boolean;
  isFull?:  boolean;
  onClick:  () => void;
}) {
  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B4D91]/40",
        isFull && "col-span-2",
        isActive
          ? isAlert
            ? "border-red-200 bg-red-500 text-white shadow-lg shadow-red-500/20"
            : "border-[#1B4D91]/20 bg-[#1B4D91] text-white shadow-lg shadow-[#1B4D91]/25"
          : isAlert && count > 0
          ? "border-red-100 bg-red-50/60 hover:bg-red-50"
          : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"
      )}
    >
      {/* Icon box */}
      <div className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-lg transition-colors",
        isActive
          ? "bg-white/20 text-white"
          : isAlert && count > 0
          ? "bg-red-100 text-red-500"
          : "bg-slate-100 text-slate-500"
      )}>
        {icon}
      </div>

      {/* Label + count */}
      <div className="min-w-0 flex-1">
        <p className={cn(
          "text-[9px] font-black uppercase tracking-widest leading-none",
          isActive ? "text-white/60" : "text-slate-400"
        )}>
          {label}
        </p>
        <p className={cn(
          "mt-0.5 text-[22px] font-black leading-none tabular-nums",
          isActive
            ? "text-white"
            : isAlert && count > 0
            ? "text-red-500"
            : "text-slate-700"
        )}>
          {count}
        </p>
      </div>

      {/* Live pulse for alerts */}
      {isAlert && count > 0 && !isActive && (
        <span className="absolute right-2.5 top-2.5 flex size-2 items-center justify-center">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-400 opacity-60" />
          <span className="relative size-1.5 rounded-full bg-red-500" />
        </span>
      )}
    </button>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ label, count, urgent }: { label: string; count: number; urgent?: boolean }) {
  return (
    <div className={cn(
      "sticky top-0 z-10 flex items-center justify-between border-b px-4 py-1.5 backdrop-blur-sm",
      urgent
        ? "border-red-100 bg-red-50/95 text-red-500"
        : "border-slate-100 bg-white/95 text-slate-400"
    )}>
      <span className="text-[9px] font-black uppercase tracking-[0.14em]">{label}</span>
      <span className={cn(
        "rounded-full px-1.5 py-0.5 text-[8px] font-black",
        urgent ? "bg-red-500 text-white" : "bg-slate-100 text-slate-500"
      )}>
        {count}
      </span>
    </div>
  );
}

// ─── Driver Card ──────────────────────────────────────────────────────────────

const DriverCard = ({
  driver, loc, isSelected, onSelect,
}: {
  driver:     ExtendedDriver;
  loc:        DriverLocation | undefined;
  isSelected: boolean;
  onSelect:   () => void;
}) => {
  const t        = useT();
  const opState  = getOpState(driver, loc);
  const hasAlerts = driver.alerts.length > 0;
  const abbr      = initials(driver.name);

  const OP_CFG: Record<OpState, {
    label: string; dot: string; badge: string;
    badgeBorder: string; pulse: boolean; icon: React.ReactNode;
  }> = {
    delivering: {
      label: t.panel_status_delivering,
      dot: "bg-blue-500", badge: "bg-blue-50 text-blue-700", badgeBorder: "border-blue-100",
      pulse: true, icon: <Truck className="size-2.5" />,
    },
    moving: {
      label: "Moving",
      dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700", badgeBorder: "border-emerald-100",
      pulse: true, icon: <Navigation className="size-2.5" />,
    },
    idle: {
      label: t.panel_status_free,
      dot: "bg-emerald-400", badge: "bg-emerald-50/70 text-emerald-600", badgeBorder: "border-emerald-100/60",
      pulse: false, icon: <Wifi className="size-2.5" />,
    },
    poor_gps: {
      label: "Poor GPS",
      dot: "bg-amber-400", badge: "bg-amber-50 text-amber-700", badgeBorder: "border-amber-100",
      pulse: false, icon: <Crosshair className="size-2.5" />,
    },
    no_signal: {
      label: "No Signal",
      dot: "bg-orange-400", badge: "bg-orange-50 text-orange-700", badgeBorder: "border-orange-100",
      pulse: false, icon: <WifiOff className="size-2.5" />,
    },
    offline: {
      label: t.panel_status_offline,
      dot: "bg-slate-300", badge: "bg-slate-50 text-slate-400", badgeBorder: "border-slate-200",
      pulse: false, icon: <CircleOff className="size-2.5" />,
    },
  };

  const ALERT_CFG: Record<AlertType, { label: string; cls: string; icon: React.ReactNode }> = {
    stuck:       { label: t.panel_alert_stuck,   cls: "bg-red-50 text-red-600 border-red-100",          icon: <AlertTriangle        className="size-2.5" /> },
    signal_lost: { label: t.panel_alert_signal,  cls: "bg-amber-50 text-amber-600 border-amber-100",    icon: <Radio                className="size-2.5" /> },
    delayed:     { label: t.panel_alert_delayed, cls: "bg-orange-50 text-orange-600 border-orange-100", icon: <Clock                className="size-2.5" /> },
    issue:       { label: t.panel_alert_issue,   cls: "bg-purple-50 text-purple-700 border-purple-100", icon: <MessageCircleWarning className="size-2.5" /> },
  };

  const op = OP_CFG[opState];

  const avatarRing =
    opState === "delivering" || opState === "moving" ? "bg-blue-100 text-blue-700"
    : opState === "idle"                             ? "bg-emerald-100 text-emerald-700"
    :                                                  "bg-slate-100 text-slate-400";

  const lastSeen = loc
    ? formatDistanceToNow(loc.timestamp, { addSuffix: true })
    : driver.lastLocation
    ? formatDistanceToNow(driver.lastLocation.timestamp, { addSuffix: true })
    : null;

  const speedKmh = loc?.speed != null ? Math.round(loc.speed * 3.6) : null;

  return (
    <button
      onClick={onSelect}
      className={cn(
        "group flex w-full flex-col gap-2 border-l-[3px] px-4 py-3 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1B4D91]",
        isSelected
          ? "border-[#1B4D91] bg-[#1B4D91]/[0.07] shadow-[inset_3px_0_0_#1B4D91]"
          : hasAlerts
          ? "border-red-400/70 bg-red-50/25 hover:bg-red-50/50"
          : "border-transparent hover:bg-slate-50/80"
      )}
    >
      <div className="flex items-center gap-3">
        {/* Avatar with live pulse */}
        <div className="relative shrink-0">
          {op.pulse && (
            <span className={cn(
              "absolute inset-[-3px] rounded-full animate-ping opacity-25",
              opState === "delivering" ? "bg-blue-400" : "bg-emerald-400"
            )} />
          )}
          <div className={cn(
            "relative flex size-9 items-center justify-center rounded-full text-[12px] font-black",
            avatarRing
          )}>
            {abbr}
          </div>
          <span className={cn(
            "absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-white",
            op.dot,
            op.pulse && "shadow-[0_0_0_2px_rgba(255,255,255,0.8)]"
          )} />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-1.5">
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="truncate text-[13px] font-semibold text-slate-800">{driver.name}</span>
              {hasAlerts && (
                <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[8px] font-black text-white">
                  <AlertTriangle className="size-2" />
                  {driver.alerts.length}
                </span>
              )}
            </div>
            <span className={cn(
              "flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-bold",
              op.badge, op.badgeBorder
            )}>
              {op.icon}
              {op.label}
            </span>
          </div>
          <p className="mt-0.5 text-[10px] text-slate-400">{driver.phone}</p>
        </div>
      </div>

      {/* Metrics row */}
      <div className="ml-12 flex flex-wrap items-center gap-1.5">
        {driver.etaMinutes != null && opState === "delivering" && (
          <span className="flex items-center gap-1 rounded-full bg-[#1B4D91]/[0.08] px-2 py-0.5 text-[10px] font-bold text-[#1B4D91]">
            <Clock className="size-2.5" />
            ETA {driver.etaMinutes} {t.panel_eta_suffix}
          </span>
        )}
        {speedKmh !== null && speedKmh > 3 && (
          <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-semibold text-slate-500">
            <Navigation className="size-2.5" />
            {speedKmh} km/h
          </span>
        )}
        {driver.assignmentsToday > 0 && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-semibold text-slate-400">
            {driver.assignmentsToday} {t.panel_today}
          </span>
        )}
        {lastSeen && (
          <span className="text-[9px] text-slate-300">{lastSeen}</span>
        )}
      </div>

      {/* Alert tags */}
      {hasAlerts && (
        <div className="ml-12 flex flex-col gap-1">
          {driver.alerts.map((alert) => {
            const ac = ALERT_CFG[alert.type];
            return (
              <div key={alert.type} className={cn("flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[10px] font-semibold", ac.cls)}>
                {ac.icon}
                <span>{ac.label}</span>
                <span className="ml-auto text-[9px] font-normal opacity-60">
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

// ─── Main Panel ───────────────────────────────────────────────────────────────

export default function DriverPanel({
  drivers, locations, selectedDriverId, onSelect, isLoading = false,
}: Props) {
  const t = useT();
  const [search,    setSearch]    = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const searchRef = useRef<HTMLInputElement>(null);

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

  const PILLS: {
    id: FilterTab; icon: React.ReactNode; label: string; isAlert?: boolean; isFull?: boolean;
  }[] = [
    { id: "all",        icon: <Users         className="size-4" />, label: t.panel_tab_all,        isFull: true },
    { id: "alert",      icon: <AlertTriangle className="size-4" />, label: t.panel_tab_alert,      isAlert: true },
    { id: "delivering", icon: <Truck         className="size-4" />, label: t.panel_tab_delivering },
    { id: "available",  icon: <Wifi          className="size-4" />, label: t.panel_tab_available  },
    { id: "offline",    icon: <CircleOff     className="size-4" />, label: t.panel_tab_offline    },
  ];

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="border-b border-slate-100 px-4 pt-3 pb-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="relative flex size-2 items-center justify-center">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-50" />
              <span className="relative size-1.5 rounded-full bg-emerald-500" />
            </span>
            <h2 className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">{t.panel_drivers_title}</h2>
          </div>
          {withAlerts.length > 0 && (
            <span className="flex items-center gap-0.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-black text-white">
              <Shield className="size-2.5" />
              {t.panel_driver_alerts(withAlerts.length)}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-[13px] font-bold text-slate-700">
          {t.panel_drivers_summary(totalActive, totalOffline)}
        </p>
      </div>

      {/* Search */}
      <div className="border-b border-slate-100 px-3 py-1.5">
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
              <X className="size-3" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Pills — 2-col grid, "All" spans full width */}
      <div
        role="tablist"
        aria-label="Filter drivers"
        className="grid grid-cols-2 gap-1.5 border-b border-slate-100 bg-slate-50/40 px-3 py-2"
      >
        {PILLS.map((pill) => (
          <FilterPill
            key={pill.id}
            icon={pill.icon}
            label={pill.label}
            count={tabCounts[pill.id]}
            isActive={activeTab === pill.id}
            isAlert={pill.isAlert}
            isFull={pill.isFull}
            onClick={() => setActiveTab(pill.id)}
          />
        ))}
      </div>

      {/* Driver List */}
      {isLoading && (
        <div>
          <DriverRowSkeleton />
          <DriverRowSkeleton />
          <DriverRowSkeleton />
        </div>
      )}

      {!isLoading && activeTab === "all" && (
        <div role="tabpanel">
          {withAlerts.length > 0 && (
            <>
              <SectionHeader label={`⚠ ${t.panel_section_attention}`} count={withAlerts.length} urgent />
              {withAlerts.map((d) => (
                <DriverCard key={d.id} driver={d} loc={locations[d.id]} isSelected={d.id === selectedDriverId} onSelect={() => handleSelect(d.id)} />
              ))}
            </>
          )}
          {delivering.length > 0 && (
            <>
              <SectionHeader label={t.panel_section_delivery} count={delivering.length} />
              {delivering.map((d) => (
                <DriverCard key={d.id} driver={d} loc={locations[d.id]} isSelected={d.id === selectedDriverId} onSelect={() => handleSelect(d.id)} />
              ))}
            </>
          )}
          {available.length > 0 && (
            <>
              <SectionHeader label={t.panel_section_available} count={available.length} />
              {available.map((d) => (
                <DriverCard key={d.id} driver={d} loc={locations[d.id]} isSelected={d.id === selectedDriverId} onSelect={() => handleSelect(d.id)} />
              ))}
            </>
          )}
          {offline.length > 0 && (
            <>
              <SectionHeader label={t.panel_section_offline} count={offline.length} />
              {offline.map((d) => (
                <DriverCard key={d.id} driver={d} loc={locations[d.id]} isSelected={d.id === selectedDriverId} onSelect={() => handleSelect(d.id)} />
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
        <div role="tabpanel">
          {flatFiltered.length > 0
            ? flatFiltered.map((d) => (
                <DriverCard key={d.id} driver={d} loc={locations[d.id]} isSelected={d.id === selectedDriverId} onSelect={() => handleSelect(d.id)} />
              ))
            : (
              <EmptyState
                icon={<User className="size-6 text-slate-400" />}
                title={search ? t.panel_empty_no_q_title : t.panel_empty_no_drivers}
                description={search ? t.panel_empty_no_results(search) : undefined}
              />
            )
          }
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
