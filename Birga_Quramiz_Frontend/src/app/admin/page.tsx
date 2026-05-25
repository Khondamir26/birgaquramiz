"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  AlertOctagon, Store, Trash2, Package, Truck,
  ClipboardList, RefreshCw,
  CheckCircle2, ChevronRight,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  getAdminOrders, getAdminDashboardStats,
} from "@/lib/api/admin";
import { trackingApi, type FraudFlag } from "@/services/trackingApi";
import type { Order, OrderStatus } from "@/types";
import { DriverStatus, type DriverListItem } from "@/types/tracking";

// ── Utilities ──────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "< 1m";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

// ── Status config ──────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<OrderStatus, string> = {
  NEW:       "bg-blue-50 text-blue-600 border-blue-100",
  PAID:      "bg-violet-50 text-violet-600 border-violet-100",
  CONFIRMED: "bg-cyan-50 text-cyan-600 border-cyan-100",
  SHIPPED:   "bg-amber-50 text-amber-700 border-amber-100",
  DELIVERED: "bg-emerald-50 text-emerald-600 border-emerald-100",
  CANCELLED: "bg-red-50 text-red-500 border-red-100",
};

const STATUS_KEY_MAP: Record<OrderStatus, "statusNEW"|"statusPAID"|"statusCONFIRMED"|"statusSHIPPED"|"statusDELIVERED"|"statusCANCELLED"> = {
  NEW: "statusNEW", PAID: "statusPAID", CONFIRMED: "statusCONFIRMED",
  SHIPPED: "statusSHIPPED", DELIVERED: "statusDELIVERED", CANCELLED: "statusCANCELLED",
};

const DIST_STATUSES: { status: OrderStatus; color: string }[] = [
  { status: "NEW",       color: "#3b82f6" },
  { status: "PAID",      color: "#8b5cf6" },
  { status: "CONFIRMED", color: "#06b6d4" },
  { status: "SHIPPED",   color: "#f59e0b" },
  { status: "DELIVERED", color: "#10b981" },
  { status: "CANCELLED", color: "#ef4444" },
];

// ── Activity feed type ─────────────────────────────────────────────────────────

type ActivityItem = {
  id: string;
  kind: "order" | "fraud" | "seller" | "deletion";
  title: string;
  sub?: string;
  ts: string;
  href: string;
};

const KIND_ICON: Record<ActivityItem["kind"], React.ElementType> = {
  order: ClipboardList, fraud: AlertOctagon, seller: Store, deletion: Trash2,
};
const KIND_COLOR: Record<ActivityItem["kind"], string> = {
  order: "#3b82f6", fraud: "#ef4444", seller: "#1B4D91", deletion: "#f59e0b",
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function UrgentCard({
  count, label, href, icon: Icon, color, loading, pulsed,
}: {
  count: number; label: string; href: string;
  icon: React.ElementType; color: string; loading: boolean; pulsed?: boolean;
}) {
  const active = count > 0;
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col justify-between rounded-xl px-3 py-3 border transition-all hover:shadow-md active:scale-[0.97] min-h-[76px]",
        active ? "bg-white border-slate-200 shadow-sm" : "bg-slate-50 border-slate-100"
      )}
    >
      <div className="flex items-center justify-between">
        <div
          className="flex size-6 shrink-0 items-center justify-center rounded-md"
          style={{ backgroundColor: active ? `${color}20` : "#f1f5f9", color: active ? color : "#94a3b8" }}
        >
          <Icon className="size-3.5" />
        </div>
        {active && pulsed && (
          <span className="size-1.5 rounded-full animate-pulse" style={{ backgroundColor: color }} />
        )}
      </div>
      <div className="mt-2">
        {loading ? (
          <div className="h-5 w-7 animate-pulse rounded bg-slate-100" />
        ) : active ? (
          <p className="text-[20px] font-black leading-none text-slate-800">{count}</p>
        ) : (
          <CheckCircle2 className="size-4 text-emerald-400" />
        )}
        <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 line-clamp-1">{label}</p>
      </div>
    </Link>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const tOrders = useTranslations("AdminOrders");
  return (
    <span className={cn("inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold border", STATUS_COLORS[status])}>
      {tOrders(STATUS_KEY_MAP[status])}
    </span>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { user, isAuthenticated, isInitialized } = useAuth();
  const router = useRouter();
  const t = useTranslations("AdminDashboard");

  // ── State ──────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  // Urgent queue counts
  const [fraudCount, setFraudCount] = useState(0);
  const [pendingModeration, setPendingModeration] = useState(0);
  const [pendingSellers, setPendingSellers] = useState(0);
  const [pendingDeletion, setPendingDeletion] = useState(0);
  const [deliveryProblems, setDeliveryProblems] = useState(0);

  // Order distribution
  const [orderDist, setOrderDist] = useState<Record<OrderStatus, number>>({
    NEW: 0, PAID: 0, CONFIRMED: 0, SHIPPED: 0, DELIVERED: 0, CANCELLED: 0,
  });

  // Driver ops
  const [drivers, setDrivers] = useState<DriverListItem[]>([]);

  // Activity feed
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  // Recent orders
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  // Secondary metrics
  const [totalOrders, setTotalOrders] = useState(0);

  // ── Auth guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated) { router.push("/admin/login"); return; }
    if (user?.role !== "ADMIN") router.push("/catalog");
  }, [user, isAuthenticated, isInitialized, router]);

  // ── Data loader — 4 requests instead of 13 ────────────────────────────────
  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [statsRes, recentOrdersRes, driversRes, fraudRes] = await Promise.allSettled([
        getAdminDashboardStats(),
        getAdminOrders({ limit: 8 }),
        trackingApi.getDrivers(),
        trackingApi.getFraudFlags(),
      ]);

      // Stats: counts + order distribution
      if (statsRes.status === "fulfilled") {
        const s = statsRes.value;
        setPendingModeration(s.pendingProducts);
        setPendingSellers(s.pendingSellers);
        setPendingDeletion(s.pendingDeletions);
        setOrderDist({
          NEW:       s.orders.byStatus["NEW"]       ?? 0,
          PAID:      s.orders.byStatus["PAID"]      ?? 0,
          CONFIRMED: s.orders.byStatus["CONFIRMED"] ?? 0,
          SHIPPED:   s.orders.byStatus["SHIPPED"]   ?? 0,
          DELIVERED: s.orders.byStatus["DELIVERED"] ?? 0,
          CANCELLED: s.orders.byStatus["CANCELLED"] ?? 0,
        });
      }

      // Recent orders
      let recentOrdList: Order[] = [];
      if (recentOrdersRes.status === "fulfilled") {
        recentOrdList = recentOrdersRes.value.data;
        setRecentOrders(recentOrdList);
        setTotalOrders(recentOrdersRes.value.meta?.total ?? 0);
      }

      // Drivers
      const driverList: DriverListItem[] =
        driversRes.status === "fulfilled" ? driversRes.value : [];
      setDrivers(driverList);
      setDeliveryProblems(
        driverList.filter((d) => (d.minutesStuck ?? 0) > 0 || d.signalLost === true).length
      );

      // Fraud
      const fraudList: FraudFlag[] =
        fraudRes.status === "fulfilled" ? fraudRes.value : [];
      setFraudCount(fraudList.length);

      // Activity feed
      const pendingSellersList = statsRes.status === "fulfilled" ? statsRes.value.recentPendingSellers : [];
      const pendingDelList     = statsRes.status === "fulfilled" ? statsRes.value.recentPendingDeletions : [];

      const actList: ActivityItem[] = [
        ...recentOrdList.map((o) => ({
          id: o.id, kind: "order" as const,
          title: o.customerName,
          sub: `#${o.id.slice(0, 8).toUpperCase()} · ${o.total.toLocaleString("ru-RU")} UZS`,
          ts: o.createdAt, href: `/admin/orders/${o.id}`,
        })),
        ...fraudList.map((f) => ({
          id: f.id, kind: "fraud" as const,
          title: f.driver?.name ?? f.driverId.slice(0, 8),
          sub: f.reason,
          ts: f.createdAt, href: `/admin/drivers/${f.driverId}`,
        })),
        ...pendingDelList.map((d) => ({
          id: d.id, kind: "deletion" as const,
          title: d.product.name,
          sub: d.seller.company,
          ts: d.createdAt, href: "/admin/deletion-requests",
        })),
        ...pendingSellersList.map((s) => ({
          id: s.id, kind: "seller" as const,
          title: s.company,
          sub: s.user.name,
          ts: s.user.createdAt, href: "/admin/sellers",
        })),
      ]
        .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
        .slice(0, 15);

      setActivities(actList);
      setLastRefreshed(new Date());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load + 60s auto-refresh
  useEffect(() => {
    if (!isInitialized || !isAuthenticated || user?.role !== "ADMIN") return;
    void load();
    const interval = setInterval(() => void load(true), 60_000);
    return () => clearInterval(interval);
  }, [isInitialized, isAuthenticated, user, load]);

  // ── Guards ─────────────────────────────────────────────────────────────────
  if (!isInitialized || (isAuthenticated && !user)) {
    return (
      <div className="flex flex-col flex-1 pb-12">
        <div className="mx-auto w-full max-w-[1440px] px-4 pt-4 md:px-7 md:pt-7 flex flex-col gap-4">
          <div className="h-10 w-48 animate-pulse rounded-xl bg-white" />
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-[76px] animate-pulse rounded-xl bg-white" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="flex flex-col gap-4">
              <div className="h-52 animate-pulse rounded-2xl bg-white" />
              <div className="h-72 animate-pulse rounded-2xl bg-white" />
            </div>
            <div className="flex flex-col gap-4">
              <div className="h-40 animate-pulse rounded-2xl bg-white" />
              <div className="h-72 animate-pulse rounded-2xl bg-white" />
            </div>
          </div>
          <div className="h-20 animate-pulse rounded-2xl bg-white" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "ADMIN") return null;

  // ── Driver stats ────────────────────────────────────────────────────────────
  const dOnline     = drivers.filter((d) => d.status === DriverStatus.ONLINE).length;
  const dOnDelivery = drivers.filter((d) => d.status === DriverStatus.ON_DELIVERY).length;
  const dOffline    = drivers.filter((d) => d.status === DriverStatus.OFFLINE).length;
  const dStuck      = drivers.filter((d) => (d.minutesStuck ?? 0) > 0 || d.signalLost === true).length;

  const orderDistTotal = Math.max(Object.values(orderDist).reduce((a, b) => a + b, 0), 1);

  return (
    <div className="flex flex-col flex-1 pb-12 min-w-0">
      <div className="mx-auto w-full max-w-[1440px] px-4 pt-4 md:px-7 md:pt-7 flex flex-col gap-4">

        {/* ── Header ── */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Overview</p>
            <h1 className="text-[22px] font-black text-slate-900 leading-tight">{t("title")}</h1>
            <p className="text-[12px] text-slate-400">
              {t("welcome")},{" "}
              <span className="font-semibold text-slate-700">{user.name}</span>
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {lastRefreshed && !loading && (
              <span className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                <span className={cn("size-1.5 rounded-full", refreshing ? "bg-amber-400 animate-pulse" : "bg-emerald-400")} />
                {refreshing ? "Syncing…" : `Updated ${timeAgo(lastRefreshed.toISOString())} ago`}
              </span>
            )}
            <button
              type="button"
              onClick={() => void load(true)}
              disabled={refreshing || loading}
              className="flex size-9 items-center justify-center rounded-xl bg-[#1B4D91]/8 hover:bg-[#1B4D91]/15 text-[#1B4D91] transition-colors disabled:opacity-40"
            >
              <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
            </button>
          </div>
        </div>

        {/* ── URGENT QUEUE — top 5 ── */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-5">
          <UrgentCard
            count={fraudCount}        label={t("fraudAlerts")}
            href="/admin/drivers"     icon={AlertOctagon}
            color="#ef4444"           loading={loading} pulsed
          />
          <UrgentCard
            count={pendingModeration} label={t("moderation")}
            href="/admin/products"    icon={Package}
            color="#f59e0b"           loading={loading} pulsed
          />
          <UrgentCard
            count={pendingSellers}    label={t("sellers")}
            href="/admin/sellers"     icon={Store}
            color="#1B4D91"           loading={loading} pulsed
          />
          <UrgentCard
            count={pendingDeletion}   label={t("deletions")}
            href="/admin/deletion-requests" icon={Trash2}
            color="#f59e0b"           loading={loading}
          />
          <UrgentCard
            count={deliveryProblems}  label={t("deliveryProblems")}
            href="/admin/orders"      icon={Truck}
            color="#ef4444"           loading={loading} pulsed
          />
        </div>

        {/* ── MAIN 2-col layout ── */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">

          {/* ── LEFT: Order distribution + Activity feed ── */}
          <div className="flex flex-col gap-4">

            {/* Order Pipeline */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-black text-slate-900">{t("orderDistribution")}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 tabular-nums">
                    {loading ? "—" : `${totalOrders.toLocaleString()} total orders`}
                  </p>
                </div>
                <Link
                  href="/admin/orders"
                  className="text-[11px] font-bold text-[#1B4D91]/50 hover:text-[#1B4D91] flex items-center gap-0.5 transition-colors"
                >
                  {t("viewAll")} <ChevronRight className="size-3" />
                </Link>
              </div>
              <div className="p-4 grid grid-cols-3 gap-2.5">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-[76px] animate-pulse rounded-xl bg-slate-50" />
                  ))
                ) : (
                  DIST_STATUSES.map(({ status, color }) => {
                    const count = orderDist[status];
                    const pct = Math.round((count / orderDistTotal) * 100);
                    return (
                      <div
                        key={status}
                        className="relative overflow-hidden rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-3"
                      >
                        <div className="absolute top-0 inset-x-0 h-[3px] rounded-t-xl" style={{ backgroundColor: color }} />
                        <p className="text-[26px] font-black leading-none text-slate-800 tabular-nums">{count}</p>
                        <p className="text-[10px] font-black uppercase tracking-wider mt-1.5 leading-none" style={{ color }}>{status}</p>
                        {pct > 0 && (
                          <p className="text-[10px] text-slate-300 font-medium mt-1 tabular-nums">{pct}%</p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Activity Feed */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                  <p className="text-[13px] font-black text-slate-900">{t("activityFeed")}</p>
                </div>
                {!loading && activities.length > 0 && (
                  <span className="text-[11px] font-bold text-slate-300 tabular-nums">
                    {activities.length} events
                  </span>
                )}
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {loading ? (
                  <div className="px-5 py-4 flex flex-col gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <div className="size-7 rounded-full bg-slate-100 animate-pulse shrink-0 mt-0.5" />
                        <div className="flex-1 flex flex-col gap-1.5 pt-1">
                          <div className="h-3 bg-slate-100 animate-pulse rounded w-3/5" />
                          <div className="h-2.5 bg-slate-100 animate-pulse rounded w-2/5" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : activities.length === 0 ? (
                  <div className="px-5 py-12 text-center text-[13px] text-slate-400 font-medium">
                    {t("noActivity")}
                  </div>
                ) : (
                  <div className="px-5 py-3">
                    {activities.map((item, idx) => {
                      const Icon = KIND_ICON[item.kind];
                      const color = KIND_COLOR[item.kind];
                      const isLast = idx === activities.length - 1;
                      return (
                        <Link
                          key={item.id}
                          href={item.href}
                          className="relative flex gap-3 py-2.5 hover:opacity-75 transition-opacity"
                        >
                          {!isLast && (
                            <div className="absolute left-[13px] top-10 bottom-0 w-px bg-slate-100" />
                          )}
                          <div
                            className="relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border-2 border-white shadow-sm mt-0.5"
                            style={{ backgroundColor: `${color}18` }}
                          >
                            <Icon className="size-3" style={{ color }} />
                          </div>
                          <div className="flex-1 min-w-0 pt-0.5">
                            <div className="flex items-baseline justify-between gap-2">
                              <p className="text-[12px] font-bold text-slate-800 truncate">{item.title}</p>
                              <span className="text-[10px] font-medium text-slate-300 shrink-0 tabular-nums whitespace-nowrap">{timeAgo(item.ts)}</span>
                            </div>
                            {item.sub && (
                              <p className="text-[11px] text-slate-400 mt-0.5 truncate">{item.sub}</p>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* ── RIGHT: Driver ops + Recent orders ── */}
          <div className="flex flex-col gap-4">

            {/* Driver Ops */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
                <p className="text-[13px] font-black text-slate-900">{t("driverOps")}</p>
                <Link
                  href="/admin/drivers"
                  className="text-[11px] font-bold text-[#1B4D91]/50 hover:text-[#1B4D91] transition-colors flex items-center gap-0.5"
                >
                  {t("viewAll")} <ChevronRight className="size-3" />
                </Link>
              </div>
              {loading ? (
                <div className="flex divide-x divide-slate-100">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex-1 px-3 py-5 flex flex-col items-center gap-2">
                      <div className="h-7 w-8 animate-pulse rounded-lg bg-slate-100" />
                      <div className="h-2.5 w-12 animate-pulse rounded bg-slate-100" />
                    </div>
                  ))}
                </div>
              ) : drivers.length === 0 ? (
                <div className="px-5 py-8 text-center text-[12px] text-slate-400 font-medium">
                  {t("noDriverData")}
                </div>
              ) : (
                <div className="flex divide-x divide-slate-100">
                  {[
                    { label: t("driversOnline"),     value: dOnline,     color: "#10b981" },
                    { label: t("driversOnDelivery"), value: dOnDelivery, color: "#3b82f6" },
                    { label: t("driversOffline"),    value: dOffline,    color: "#94a3b8" },
                    { label: t("driversStuck"),      value: dStuck,      color: dStuck > 0 ? "#ef4444" : "#94a3b8" },
                  ].map(({ label, value, color }) => (
                    <div
                      key={label}
                      className="flex-1 flex flex-col items-center justify-center py-5 px-2"
                    >
                      <p className="text-[28px] font-black leading-none tabular-nums" style={{ color }}>{value}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wide text-center leading-tight">{label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent orders */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between shrink-0">
                <p className="text-[13px] font-black text-slate-900">
                  {t("recentOrders")}
                </p>
                <Link
                  href="/admin/orders"
                  className="text-[11px] font-bold text-[#1B4D91]/50 hover:text-[#1B4D91] flex items-center gap-0.5 transition-colors"
                >
                  {t("viewAll")} <ChevronRight className="size-3" />
                </Link>
              </div>

              <div className="divide-y divide-slate-50">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="px-4 py-3 flex items-center gap-3">
                      <div className="flex-1 h-3 animate-pulse rounded bg-slate-50" />
                      <div className="h-5 w-16 animate-pulse rounded bg-slate-50" />
                    </div>
                  ))
                ) : recentOrders.length === 0 ? (
                  <div className="px-4 py-10 text-center text-[12px] text-slate-400 font-medium">
                    {t("noOrders")}
                  </div>
                ) : (
                  recentOrders.map((order) => (
                    <Link
                      key={order.id}
                      href={`/admin/orders/${order.id}`}
                      className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors group"
                    >
                      <div className="min-w-0">
                        <p className="text-[12px] font-bold text-slate-700 truncate leading-tight">
                          {order.customerName}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                        <StatusBadge status={order.status} />
                        <span className="text-[10px] text-slate-300 font-bold tabular-nums">
                          {timeAgo(order.createdAt)}
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>

              <div className="px-4 py-2.5 border-t border-slate-50 shrink-0">
                <Link
                  href="/admin/orders"
                  className="flex items-center justify-center gap-1 text-[11px] font-bold text-[#1B4D91]/50 hover:text-[#1B4D91] transition-colors"
                >
                  {t("seeAllOrders", { count: totalOrders.toLocaleString() })}
                  <ChevronRight className="size-3" />
                </Link>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
