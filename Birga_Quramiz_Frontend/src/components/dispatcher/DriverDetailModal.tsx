"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { trackingApi } from "@/services/trackingApi";
import type { AssignmentEvent, AssignmentHistoryItem } from "@/services/trackingApi";
import { useTrackingStore } from "@/store/trackingStore";
import { DriverStatus } from "@/types/tracking";
import { queryKeys } from "@/lib/tracking/queryKeys";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format } from "date-fns";
import {
  X,
  Phone,
  MapPin,
  Clock,
  Package,
  AlertTriangle,
  Shield,
  Navigation,
  Wifi,
  WifiOff,
  Truck,
  Calendar,
  Radio,
  MessageCircleWarning,
  CheckCircle2,
  KeyRound,
  Camera,
  XCircle,
  ChevronRight,
  ListOrdered,
  History,
  Route,
  BarChart2,
  TrendingUp,
  TrendingDown,
  Timer,
  Activity,
  CircleAlert,
  Star,
} from "lucide-react";
import type { AlertType } from "@/store/trackingStore";

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs));
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

const STATUS_RING: Record<DriverStatus, string> = {
  [DriverStatus.ONLINE]:      "ring-emerald-300 bg-emerald-100 text-emerald-700",
  [DriverStatus.ON_DELIVERY]: "ring-blue-300    bg-blue-100    text-blue-700",
  [DriverStatus.OFFLINE]:     "ring-slate-200   bg-slate-100   text-slate-400",
};

const STATUS_LABEL: Record<DriverStatus, string> = {
  [DriverStatus.ONLINE]:      "Available",
  [DriverStatus.ON_DELIVERY]: "On Delivery",
  [DriverStatus.OFFLINE]:     "Offline",
};

const STATUS_DOT: Record<DriverStatus, string> = {
  [DriverStatus.ONLINE]:      "bg-emerald-400",
  [DriverStatus.ON_DELIVERY]: "bg-blue-500",
  [DriverStatus.OFFLINE]:     "bg-slate-300",
};

const ALERT_CFG: Record<AlertType, { label: string; cls: string; icon: React.ReactNode }> = {
  stuck: {
    label: "Driver stuck",
    cls:   "bg-red-50 text-red-600 ring-red-100",
    icon:  <AlertTriangle className="size-3 shrink-0" />,
  },
  signal_lost: {
    label: "Signal lost",
    cls:   "bg-amber-50 text-amber-600 ring-amber-100",
    icon:  <Radio className="size-3 shrink-0" />,
  },
  delayed: {
    label: "Delivery late",
    cls:   "bg-orange-50 text-orange-600 ring-orange-100",
    icon:  <Clock className="size-3 shrink-0" />,
  },
  issue: {
    label: "Driver issue",
    cls:   "bg-purple-50 text-purple-700 ring-purple-100",
    icon:  <MessageCircleWarning className="size-3 shrink-0" />,
  },
};

type Tab = "overview" | "timeline" | "history" | "stats";

interface Props {
  driverId:       string;
  onClose:        () => void;
  onOpenPlayback: (driverId: string) => void;
}

export default function DriverDetailModal({ driverId, onClose, onOpenPlayback }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const { drivers, locations, clearAlert } = useTrackingStore();
  const driver = drivers[driverId];
  const loc    = locations[driverId];

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.drivers.detail(driverId),
    queryFn:  () => trackingApi.getDriverDetail(driverId),
    refetchInterval: 30_000,
    staleTime: 10_000,
    enabled: !!driverId,
  });

  const status = driver?.status ?? DriverStatus.OFFLINE;
  const alerts = driver?.alerts ?? [];
  const eta    = driver?.etaMinutes;

  const name  = data?.name  ?? driver?.name  ?? "…";
  const phone = data?.phone ?? driver?.phone ?? "";

  const speedKmh = loc?.speed != null ? Math.round(loc.speed * 3.6) : null;

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="flex items-start gap-3 border-b border-slate-100 px-4 pt-4 pb-3">
        <div className="relative shrink-0">
          {data?.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.photo}
              alt=""
              className="size-12 rounded-full object-cover ring-2 ring-slate-100"
            />
          ) : (
            <div
              className={cn(
                "flex size-12 items-center justify-center rounded-full text-[13px] font-black ring-2",
                STATUS_RING[status]
              )}
            >
              {initials(name)}
            </div>
          )}
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-white",
              STATUS_DOT[status]
            )}
          />
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[14px] font-black text-slate-800">{name}</h2>
          <p className="text-[11px] text-slate-400">{phone}</p>
          <span
            className={cn(
              "mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ring-1",
              STATUS_RING[status]
            )}
          >
            {status === DriverStatus.ONLINE      && <Wifi    className="size-2.5" />}
            {status === DriverStatus.ON_DELIVERY && <Truck   className="size-2.5" />}
            {status === DriverStatus.OFFLINE     && <WifiOff className="size-2.5" />}
            {STATUS_LABEL[status]}
          </span>
        </div>

        <button
          onClick={onClose}
          aria-label="Close driver detail"
          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Live stats strip */}
      <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
        <div className="flex flex-col items-center py-3">
          <span className="text-[16px] font-black text-slate-700">
            {eta != null ? `${eta}m` : "—"}
          </span>
          <span className="text-[9px] text-slate-400">ETA</span>
        </div>
        <div className="flex flex-col items-center py-3">
          <span className="text-[16px] font-black text-slate-700">
            {speedKmh != null ? speedKmh : "—"}
          </span>
          <span className="text-[9px] text-slate-400">km/h</span>
        </div>
        <div className="flex flex-col items-center py-3">
          <span
            className={cn(
              "text-[16px] font-black",
              alerts.length > 0 ? "text-red-500" : "text-slate-300"
            )}
          >
            {alerts.length}
          </span>
          <span className="text-[9px] text-slate-400">Alerts</span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-slate-100">
        {([
          { id: "overview" as Tab, label: "Overview", icon: <Truck      className="size-3" /> },
          { id: "timeline" as Tab, label: "Timeline", icon: <ListOrdered className="size-3" /> },
          { id: "history"  as Tab, label: "History",  icon: <History    className="size-3" /> },
          { id: "stats"    as Tab, label: "Stats",    icon: <BarChart2  className="size-3" /> },
        ]).map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1 py-2 text-[10px] font-bold transition-colors",
              activeTab === id
                ? "border-b-2 border-[#1B4D91] text-[#1B4D91]"
                : "text-slate-400 hover:text-slate-600"
            )}
          >
            {icon}{label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === "timeline" && (
          <TimelineTab
            driverId={driverId}
            activeAssignmentId={data?.activeAssignment?.id ?? null}
          />
        )}
        {activeTab === "history" && (
          <HistoryTab driverId={driverId} />
        )}
        {activeTab === "stats" && (
          <StatsTab driverId={driverId} />
        )}
        {activeTab === "overview" && (<>
        {/* Active alerts */}
        {alerts.length > 0 && (
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="mb-2 text-[9px] font-black uppercase tracking-widest text-slate-400">
              Active Alerts
            </p>
            <div className="flex flex-col gap-1.5">
              {alerts.map((alert) => {
                const cfg = ALERT_CFG[alert.type];
                return (
                  <div
                    key={alert.type}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-2.5 py-2 ring-1",
                      cfg.cls
                    )}
                  >
                    {cfg.icon}
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold leading-none">{cfg.label}</p>
                      {alert.message !== cfg.label && (
                        <p className="mt-0.5 truncate text-[9px] opacity-70">{alert.message}</p>
                      )}
                    </div>
                    <span className="shrink-0 text-[9px] opacity-60">
                      {formatDistanceToNow(alert.since, { addSuffix: true })}
                    </span>
                    <button
                      onClick={() => clearAlert(driverId, alert.type)}
                      className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold opacity-60 hover:opacity-100"
                    >
                      dismiss
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Active assignment */}
        {isLoading && (
          <div className="border-b border-slate-100 px-4 py-3">
            <div className="h-4 w-24 animate-pulse rounded bg-slate-100 mb-2" />
            <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
          </div>
        )}

        {!isLoading && data?.activeAssignment && (
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="mb-2 text-[9px] font-black uppercase tracking-widest text-slate-400">
              Current Delivery
            </p>
            <div className="rounded-xl bg-blue-50 p-3 ring-1 ring-blue-100">
              <p className="text-[12px] font-bold text-blue-800">
                {data.activeAssignment.order.customerName}
              </p>
              <p className="mt-0.5 flex items-center gap-1.5 text-[10px] text-blue-600">
                <Phone className="size-2.5 shrink-0" />
                {data.activeAssignment.order.customerPhone}
              </p>
              {data.activeAssignment.order.deliveryAddress && (
                <p className="mt-0.5 flex items-start gap-1.5 text-[10px] text-blue-500">
                  <MapPin className="mt-0.5 size-2.5 shrink-0" />
                  {data.activeAssignment.order.deliveryAddress}
                </p>
              )}
              <div className="mt-2 flex items-center justify-between">
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-bold capitalize text-blue-700">
                  {data.activeAssignment.status.toLowerCase().replace(/_/g, " ")}
                </span>
                <span className="text-[9px] text-blue-400">
                  {formatDistanceToNow(new Date(data.activeAssignment.createdAt), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Shift stats */}
        {isLoading && (
          <div className="border-b border-slate-100 px-4 py-3">
            <div className="h-4 w-20 animate-pulse rounded bg-slate-100 mb-2" />
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          </div>
        )}

        {!isLoading && data && (
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="mb-2 text-[9px] font-black uppercase tracking-widest text-slate-400">
              Shift Stats
            </p>
            <div className="grid grid-cols-3 gap-2">
              <StatCard
                label="Today"
                value={data.stats.assignmentsToday}
                icon={<Calendar className="size-3 text-slate-400" />}
              />
              <StatCard
                label="Delivered"
                value={data.stats.totalDelivered}
                icon={<Package className="size-3 text-emerald-500" />}
                highlight="emerald"
              />
              <StatCard
                label="Fraud"
                value={data.stats.fraudCount}
                icon={
                  <Shield
                    className={cn(
                      "size-3",
                      data.stats.fraudCount > 0 ? "text-red-500" : "text-slate-300"
                    )}
                  />
                }
                highlight={data.stats.fraudCount > 0 ? "red" : undefined}
              />
            </div>
          </div>
        )}

        {/* Last location */}
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="mb-2 text-[9px] font-black uppercase tracking-widest text-slate-400">
            Last Known Location
          </p>
          {loc ? (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-[10px] text-slate-600">
                <MapPin className="size-3 shrink-0 text-slate-400" />
                {loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                <Clock className="size-3 shrink-0 text-slate-400" />
                Updated {formatDistanceToNow(loc.timestamp, { addSuffix: true })}
              </div>
              {loc.heading != null && (
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                  <Navigation className="size-3 shrink-0 text-slate-400" />
                  Heading {Math.round(loc.heading)}°
                </div>
              )}
            </div>
          ) : data?.lastLat != null ? (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                <MapPin className="size-3 shrink-0 text-slate-400" />
                {data.lastLat.toFixed(5)}, {data.lastLng!.toFixed(5)}
              </div>
              {data.lastSeenAt && (
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <Clock className="size-3 shrink-0 text-slate-300" />
                  Last seen {formatDistanceToNow(new Date(data.lastSeenAt), { addSuffix: true })}
                </div>
              )}
            </div>
          ) : (
            <p className="text-[10px] text-slate-400">No location data available</p>
          )}
        </div>

        {/* Member since */}
        {data?.memberSince && (
          <div className="px-4 py-2.5">
            <p className="text-[9px] text-slate-300">
              Driver since{" "}
              {new Date(data.memberSince).toLocaleDateString("en-US", {
                month: "long",
                year:  "numeric",
              })}
            </p>
          </div>
        )}
        </>)}
      </div>

      {/* Quick actions */}
      <div className="border-t border-slate-100 p-3">
        <div className="flex gap-2">
          <a
            href={`tel:${phone}`}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#1B4D91] px-3 py-2.5 text-[12px] font-bold text-white transition hover:bg-[#163d73]"
          >
            <Phone className="size-3.5" />
            Call
          </a>
          <button
            onClick={() => onOpenPlayback(driverId)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[12px] font-bold text-slate-600 transition hover:bg-slate-100"
          >
            <Route className="size-3.5" />
            Playback
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Event config ─────────────────────────────────────────────────────────────

const EVENT_CFG: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  CREATED:        { label: "Assignment created",  icon: <Package       className="size-3" />, cls: "bg-slate-100  text-slate-500"  },
  ACCEPTED:       { label: "Driver accepted",     icon: <CheckCircle2  className="size-3" />, cls: "bg-emerald-100 text-emerald-600" },
  PICKED_UP:      { label: "Goods picked up",     icon: <Truck         className="size-3" />, cls: "bg-blue-100   text-blue-600"   },
  DELIVERED:      { label: "Delivered",           icon: <CheckCircle2  className="size-3" />, cls: "bg-emerald-100 text-emerald-700" },
  CANCELLED:      { label: "Cancelled",           icon: <XCircle       className="size-3" />, cls: "bg-red-100    text-red-600"    },
  OTP_VERIFIED:   { label: "OTP verified",        icon: <KeyRound      className="size-3" />, cls: "bg-violet-100 text-violet-600" },
  POD_UPLOADED:   { label: "Proof uploaded",      icon: <Camera        className="size-3" />, cls: "bg-cyan-100   text-cyan-600"   },
  ISSUE_REPORTED: { label: "Issue reported",      icon: <AlertTriangle className="size-3" />, cls: "bg-amber-100  text-amber-600"  },
};

function eventCfg(event: string) {
  return EVENT_CFG[event] ?? { label: event, icon: <Clock className="size-3" />, cls: "bg-slate-100 text-slate-500" };
}

// ─── Timeline tab ─────────────────────────────────────────────────────────────

function TimelineTab({
  driverId,
  activeAssignmentId,
}: {
  driverId:          string;
  activeAssignmentId: string | null;
}) {
  const { data: history = [], isLoading: histLoading } = useQuery({
    queryKey: queryKeys.drivers.assignments(driverId),
    queryFn:  () => trackingApi.getDriverAssignmentHistory(driverId, 1),
    staleTime: 15_000,
  });

  const targetId = activeAssignmentId ?? history[0]?.id ?? null;

  const { data: events = [], isLoading } = useQuery({
    queryKey: queryKeys.assignments.events(targetId ?? ""),
    queryFn:  () => trackingApi.getAssignmentEvents(targetId!),
    refetchInterval: 15_000,
    staleTime: 10_000,
    enabled: !!targetId,
  });

  if (isLoading || histLoading) {
    return (
      <div className="px-4 py-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="mb-4 flex gap-3">
            <div className="mt-0.5 size-6 animate-pulse rounded-full bg-slate-100 shrink-0" />
            <div className="flex-1">
              <div className="h-3 w-28 animate-pulse rounded bg-slate-100 mb-1.5" />
              <div className="h-2.5 w-16 animate-pulse rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!targetId) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-4">
        <ListOrdered className="mb-2 size-8 text-slate-200" />
        <p className="text-[11px] font-semibold text-slate-400">No active assignment</p>
        <p className="text-[10px] text-slate-300">Events appear here once a delivery starts</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-4">
        <Clock className="mb-2 size-8 text-slate-200" />
        <p className="text-[11px] font-semibold text-slate-400">No events yet</p>
        <p className="text-[10px] text-slate-300">Events will appear as the delivery progresses</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-3">
      <p className="mb-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
        Current Assignment
      </p>
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-3 top-3 bottom-3 w-px bg-slate-100" />
        <div className="flex flex-col gap-0">
          {events.map((ev, i) => (
            <TimelineEvent key={ev.id} event={ev} isLast={i === events.length - 1} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TimelineEvent({ event, isLast }: { event: AssignmentEvent; isLast: boolean }) {
  const cfg = eventCfg(event.event);
  return (
    <div className="relative flex gap-3 pb-4">
      <div
        className={cn(
          "relative z-10 mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full",
          cfg.cls,
          isLast && "ring-2 ring-[#1B4D91]/20"
        )}
      >
        {cfg.icon}
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-[11px] font-semibold text-slate-700">{cfg.label}</p>
        {event.note && event.event === "ISSUE_REPORTED" && (
          <p className="mt-0.5 text-[10px] text-amber-600 leading-snug">&quot;{event.note}&quot;</p>
        )}
        <p className="mt-0.5 text-[9px] text-slate-400">
          {format(new Date(event.createdAt), "HH:mm:ss")} ·{" "}
          {formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}

// ─── History tab ──────────────────────────────────────────────────────────────

const STATUS_PILL: Record<string, string> = {
  DELIVERED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100 text-red-600",
  ACCEPTED:  "bg-blue-100 text-blue-700",
  PICKED_UP: "bg-blue-100 text-blue-700",
  PENDING:   "bg-slate-100 text-slate-500",
};

function HistoryTab({ driverId }: { driverId: string }) {
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [allItems, setAllItems] = useState<AssignmentHistoryItem[]>([]);

  const { data = [], isLoading, isFetching } = useQuery({
    queryKey: [...queryKeys.drivers.assignments(driverId), cursor],
    queryFn:  () => trackingApi.getDriverAssignmentHistory(driverId, 10, cursor),
    staleTime: 30_000,
  });

  // Accumulate pages
  const items = cursor === undefined ? data : [...allItems, ...data];

  const loadMore = () => {
    if (data.length > 0) {
      setAllItems(items);
      setCursor(data[data.length - 1].id);
    }
  };

  if (isLoading) {
    return (
      <div className="px-4 py-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="mb-3 h-16 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center px-4">
        <History className="mb-2 size-8 text-slate-200" />
        <p className="text-[11px] font-semibold text-slate-400">No delivery history</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-3">
      <p className="mb-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
        Past Assignments
      </p>
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <HistoryCard key={item.id} item={item} />
        ))}
      </div>
      {data.length === 10 && (
        <button
          onClick={loadMore}
          disabled={isFetching}
          className="mt-3 flex w-full items-center justify-center gap-1 rounded-xl border border-slate-200 py-2 text-[10px] font-semibold text-slate-500 hover:bg-slate-50 disabled:opacity-50"
        >
          {isFetching ? "Loading…" : "Load more"}
          {!isFetching && <ChevronRight className="size-3" />}
        </button>
      )}
    </div>
  );
}

function HistoryCard({ item }: { item: AssignmentHistoryItem }) {
  const pillCls = STATUS_PILL[item.status] ?? "bg-slate-100 text-slate-500";
  return (
    <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
      <div className="flex items-start justify-between gap-2">
        <p className="truncate text-[11px] font-bold text-slate-700">
          {item.order.customerName}
        </p>
        <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold capitalize", pillCls)}>
          {item.status.toLowerCase().replace(/_/g, " ")}
        </span>
      </div>
      {item.order.deliveryAddress && (
        <p className="mt-0.5 flex items-start gap-1 text-[9px] text-slate-400 leading-snug">
          <MapPin className="mt-0.5 size-2.5 shrink-0 text-slate-300" />
          <span className="line-clamp-1">{item.order.deliveryAddress}</span>
        </p>
      )}
      <div className="mt-1.5 flex items-center justify-between">
        <span className="text-[9px] text-slate-400">
          {format(new Date(item.createdAt), "dd MMM, HH:mm")}
        </span>
        {item._count.events > 0 && (
          <span className="text-[9px] text-slate-300">{item._count.events} events</span>
        )}
      </div>
    </div>
  );
}

// ─── Stats tab ────────────────────────────────────────────────────────────────

function StatsTab({ driverId }: { driverId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.drivers.stats(driverId),
    queryFn:  () => trackingApi.getDriverStats(driverId),
    staleTime: 60_000,
  });

  const { data: ratingSummary } = useQuery({
    queryKey: queryKeys.drivers.ratingSummary(driverId),
    queryFn:  () => trackingApi.getDriverRatingSummary(driverId),
    staleTime: 120_000,
  });

  if (isLoading) {
    return (
      <div className="px-4 py-4 flex flex-col gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <Activity className="mb-2 size-8 text-slate-200" />
        <p className="text-[11px] font-semibold text-slate-400">No analytics available</p>
      </div>
    );
  }

  const hasSufficientData = data.total30 >= 3;

  return (
    <div className="px-4 py-3 flex flex-col gap-4">
      {/* 30-day summary */}
      <div>
        <p className="mb-2 text-[9px] font-black uppercase tracking-widest text-slate-400">
          Last 30 Days
        </p>
        <div className="grid grid-cols-3 gap-2">
          <MetricCard
            label="Deliveries"
            value={String(data.delivered30)}
            icon={<Package className="size-3 text-emerald-500" />}
            highlight="emerald"
          />
          <MetricCard
            label="Assigned"
            value={String(data.total30)}
            icon={<Truck className="size-3 text-slate-400" />}
          />
          <MetricCard
            label="Cancelled"
            value={String(data.cancelled30)}
            icon={<XCircle className="size-3 text-red-400" />}
            highlight={data.cancelled30 > 0 ? "red" : undefined}
          />
        </div>
      </div>

      {/* Rates */}
      {hasSufficientData && (
        <div>
          <p className="mb-2 text-[9px] font-black uppercase tracking-widest text-slate-400">
            Performance Rates
          </p>
          <div className="flex flex-col gap-2">
            <RateBar
              label="Acceptance rate"
              value={data.acceptanceRate}
              good={90}
              warn={75}
              icon={<TrendingUp className="size-3 shrink-0" />}
              suffix="%"
            />
            <RateBar
              label="Cancellation rate"
              value={data.cancellationRate}
              good={5}
              warn={15}
              invert
              icon={<TrendingDown className="size-3 shrink-0" />}
              suffix="%"
            />
          </div>
        </div>
      )}

      {/* Avg delivery time */}
      <div>
        <p className="mb-2 text-[9px] font-black uppercase tracking-widest text-slate-400">
          Efficiency
        </p>
        <div className="grid grid-cols-2 gap-2">
          <MetricCard
            label="Avg delivery"
            value={data.avgDeliveryMinutes != null ? `${data.avgDeliveryMinutes}m` : "—"}
            icon={<Timer className="size-3 text-blue-400" />}
            highlight={
              data.avgDeliveryMinutes != null && data.avgDeliveryMinutes > 90 ? "red" : undefined
            }
          />
          <MetricCard
            label="Issues"
            value={String(data.issueCount)}
            icon={<CircleAlert className="size-3 text-amber-500" />}
            highlight={data.issueCount > 0 ? "amber" : undefined}
          />
        </div>
        {data.issueRate != null && data.issueRate > 0 && (
          <p className="mt-1.5 text-[9px] text-amber-500">
            {data.issueRate.toFixed(2)} issues per delivery (last 30 days)
          </p>
        )}
      </div>

      {/* All-time */}
      <div>
        <p className="mb-2 text-[9px] font-black uppercase tracking-widest text-slate-400">
          All Time
        </p>
        <div className="rounded-xl bg-slate-50 ring-1 ring-slate-100 divide-y divide-slate-100">
          <AllTimeRow label="Total assigned"  value={data.allTime.total} />
          <AllTimeRow label="Completed"       value={data.allTime.delivered} highlight="emerald" />
          <AllTimeRow label="Cancelled"       value={data.allTime.cancelled} highlight={data.allTime.cancelled > 0 ? "red" : undefined} />
        </div>
      </div>

      {/* Customer ratings */}
      {ratingSummary && ratingSummary.count > 0 && (
        <div>
          <p className="mb-2 text-[9px] font-black uppercase tracking-widest text-slate-400">
            Customer Ratings
          </p>
          <div className="rounded-xl bg-slate-50 ring-1 ring-slate-100 p-3">
            {/* Average + count */}
            <div className="mb-2 flex items-center gap-2">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={cn(
                      "size-3",
                      ratingSummary.average != null && s <= Math.round(ratingSummary.average)
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-200"
                    )}
                  />
                ))}
              </div>
              <span className="text-[13px] font-black text-slate-700">
                {ratingSummary.average?.toFixed(1) ?? "—"}
              </span>
              <span className="text-[9px] text-slate-400">
                ({ratingSummary.count} {ratingSummary.count === 1 ? "review" : "reviews"})
              </span>
            </div>

            {/* Distribution bars */}
            <div className="flex flex-col gap-0.5 mb-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const cnt = ratingSummary.distribution[String(star)] ?? 0;
                const pct = ratingSummary.count > 0 ? (cnt / ratingSummary.count) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-1.5">
                    <span className="text-[8px] text-slate-400 w-2">{star}</span>
                    <Star className="size-2.5 fill-amber-300 text-amber-300 shrink-0" />
                    <div className="h-1 flex-1 rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-amber-400 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[8px] text-slate-400 w-3 text-right">{cnt}</span>
                  </div>
                );
              })}
            </div>

            {/* Top tags */}
            {ratingSummary.topTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {ratingSummary.topTags.map(({ tag, count }) => (
                  <span
                    key={tag}
                    className="rounded-full bg-white px-2 py-0.5 text-[9px] font-medium text-slate-500 ring-1 ring-slate-200"
                  >
                    {tag} · {count}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {!hasSufficientData && (
        <p className="text-center text-[9px] text-slate-300 pb-1">
          Rate analytics appear after 3+ assignments in 30 days
        </p>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
  highlight,
}: {
  label:      string;
  value:      string;
  icon:       React.ReactNode;
  highlight?: "emerald" | "red" | "amber";
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl bg-slate-50 py-2.5 ring-1 ring-slate-100">
      {icon}
      <span
        className={cn(
          "text-[15px] font-black",
          highlight === "emerald" && "text-emerald-600",
          highlight === "red"     && "text-red-500",
          highlight === "amber"   && "text-amber-500",
          !highlight              && "text-slate-700",
        )}
      >
        {value}
      </span>
      <span className="text-[9px] text-slate-400">{label}</span>
    </div>
  );
}

function RateBar({
  label,
  value,
  good,
  warn,
  invert = false,
  icon,
  suffix = "",
}: {
  label:    string;
  value:    number | null;
  good:     number;
  warn:     number;
  invert?:  boolean;
  icon:     React.ReactNode;
  suffix?:  string;
}) {
  if (value == null) return null;
  const isGood = invert ? value <= good : value >= good;
  const isWarn = invert
    ? value > good && value <= warn
    : value < good && value >= warn;
  const color = isGood ? "bg-emerald-400" : isWarn ? "bg-amber-400" : "bg-red-400";
  const textColor = isGood ? "text-emerald-600" : isWarn ? "text-amber-600" : "text-red-500";

  return (
    <div className="flex flex-col gap-1 rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 text-[10px] text-slate-500">
          {icon}{label}
        </span>
        <span className={cn("text-[12px] font-black", textColor)}>
          {value}{suffix}
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-200">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}

function AllTimeRow({
  label,
  value,
  highlight,
}: {
  label:      string;
  value:      number;
  highlight?: "emerald" | "red";
}) {
  return (
    <div className="flex items-center justify-between px-3 py-2">
      <span className="text-[10px] text-slate-500">{label}</span>
      <span
        className={cn(
          "text-[11px] font-bold",
          highlight === "emerald" && "text-emerald-600",
          highlight === "red"     && "text-red-500",
          !highlight              && "text-slate-700",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  highlight,
}: {
  label:      string;
  value:      number;
  icon:       React.ReactNode;
  highlight?: "emerald" | "red";
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl bg-slate-50 py-2.5 ring-1 ring-slate-100">
      {icon}
      <span
        className={cn(
          "text-[16px] font-black",
          highlight === "emerald" && "text-emerald-600",
          highlight === "red"     && "text-red-500",
          !highlight              && "text-slate-700"
        )}
      >
        {value}
      </span>
      <span className="text-[9px] text-slate-400">{label}</span>
    </div>
  );
}
