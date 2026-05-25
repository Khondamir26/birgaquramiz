"use client";

import { useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useFetch } from "@/hooks/useFetch";
import { useTrackingStore } from "@/store/trackingStore";
import { trackingApi } from "@/services/trackingApi";
import { DriverStatus } from "@/types/tracking";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, Phone, Calendar, Star,
  Package, AlertTriangle, CheckCircle2, Clock,
  Hash, TrendingUp, ExternalLink, MapPin,
} from "lucide-react";

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "—";
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)  return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" });
}

const STATUS_CONFIG = {
  [DriverStatus.ONLINE]:      { label: "Online",     color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-400" },
  [DriverStatus.ON_DELIVERY]: { label: "Delivering", color: "bg-blue-50 text-blue-700 border-blue-200",         dot: "bg-blue-400 animate-pulse" },
  [DriverStatus.OFFLINE]:     { label: "Offline",    color: "bg-slate-100 text-slate-500 border-slate-200",     dot: "bg-slate-300" },
};

const ASSIGNMENT_STATUS_COLORS: Record<string, string> = {
  PENDING:   "bg-amber-50 text-amber-700",
  ACCEPTED:  "bg-blue-50 text-blue-700",
  PICKED_UP: "bg-purple-50 text-purple-700",
  DELIVERED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-red-50 text-red-500",
};

function StatCard({ label, value, sub, highlight }: { label: string; value: string | number; sub?: string; highlight?: boolean }) {
  return (
    <div className={cn("bg-white rounded-2xl border shadow-sm px-4 py-3.5", highlight ? "border-[#1B4D91]/20 bg-[#1B4D91]/5" : "border-slate-100")}>
      <p className={cn("text-[22px] font-black leading-none", highlight ? "text-[#1B4D91]" : "text-slate-800")}>
        {value}
      </p>
      <p className="text-[12px] text-slate-500 font-medium mt-1">{label}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function AdminDriverDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const liveDriver = useTrackingStore((s) => s.drivers[id]);

  const detailFetcher  = useCallback(() => trackingApi.getDriverDetail(id),     [id]);
  const statsFetcher   = useCallback(() => trackingApi.getDriverStats(id),      [id]);
  const ratingFetcher  = useCallback(() => trackingApi.getDriverRatingSummary(id), [id]);
  const historyFetcher = useCallback(() => trackingApi.getDriverAssignmentHistory(id, 10), [id]);

  const { data: detail,  loading: loadingDetail  } = useFetch(detailFetcher);
  const { data: stats                             } = useFetch(statsFetcher);
  const { data: ratings                           } = useFetch(ratingFetcher);
  const { data: history                           } = useFetch(historyFetcher);

  const status = liveDriver?.status ?? (detail?.status as DriverStatus | undefined) ?? DriverStatus.OFFLINE;
  const cfg    = STATUS_CONFIG[status];
  const alerts = liveDriver?.alerts ?? [];

  if (loadingDetail) {
    return (
      <div className="flex flex-col flex-1 pb-12">
        <div className="mx-auto w-full max-w-[1440px] px-4 pt-4 md:px-7 md:pt-7 flex flex-col gap-4">
          <div className="h-8 w-32 animate-pulse rounded-xl bg-white" />
          <div className="grid md:grid-cols-[280px_1fr] gap-4">
            <div className="h-72 animate-pulse rounded-2xl bg-white" />
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-white" />)}
              </div>
              <div className="h-48 animate-pulse rounded-2xl bg-white" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex flex-col flex-1 pb-12">
        <div className="mx-auto w-full max-w-[1440px] px-4 pt-4 md:px-7 md:pt-7 flex flex-col gap-4">
          <button onClick={() => router.push("/admin/drivers")} className="flex items-center gap-2 text-[13px] font-bold text-[#1B4D91] hover:underline w-fit">
            <ArrowLeft className="size-4" /> Drivers
          </button>
          <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-[13px] text-red-600">Driver not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 pb-12">
      <div className="mx-auto w-full max-w-[1440px] px-4 pt-4 md:px-7 md:pt-7 flex flex-col gap-4">

        <button onClick={() => router.push("/admin/drivers")} className="flex items-center gap-2 text-[13px] font-bold text-[#1B4D91] hover:underline w-fit">
          <ArrowLeft className="size-4" /> Drivers
        </button>

        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4">

          {/* LEFT: Profile */}
          <div className="flex flex-col gap-3">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="h-14 bg-gradient-to-r from-[#1B4D91]/10 to-[#1B4D91]/5" />
              <div className="px-5 pb-5 -mt-7">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-[#1B4D91] text-white font-black text-[20px] shadow-lg border-4 border-white mb-3">
                  {detail.name.charAt(0).toUpperCase()}
                </div>
                <p className="text-[17px] font-black text-slate-800 leading-tight">{detail.name}</p>
                <p className="text-[12px] text-slate-400 mt-0.5">{detail.phone}</p>

                {/* Live status badge */}
                <div className={cn("inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 rounded-full text-[11px] font-bold border", cfg.color)}>
                  <span className={cn("size-1.5 rounded-full", cfg.dot)} />
                  {cfg.label}
                  {liveDriver && <span className="opacity-50">· live</span>}
                </div>

                {/* Active alerts */}
                {alerts.length > 0 && (
                  <div className="mt-2 flex flex-col gap-1">
                    {alerts.map((a, i) => (
                      <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-red-50 border border-red-100 text-[11px] font-medium text-red-600">
                        <AlertTriangle className="size-3 shrink-0" />
                        {a.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-slate-50 px-5 py-4 flex flex-col gap-2.5">
                <div className="flex items-center gap-2.5 text-[12px]">
                  <Phone className="size-3.5 text-slate-400 shrink-0" />
                  <span className="font-medium text-slate-500">{detail.phone}</span>
                </div>
                <div className="flex items-center gap-2.5 text-[12px]">
                  <Calendar className="size-3.5 text-slate-400 shrink-0" />
                  <span className="font-medium text-slate-500">Joined {fmt(detail.memberSince)}</span>
                </div>
                <div className="flex items-center gap-2.5 text-[12px]">
                  <Clock className="size-3.5 text-slate-400 shrink-0" />
                  <span className="font-medium text-slate-500">Last seen {timeAgo(detail.lastSeenAt)}</span>
                </div>
                <div className="flex items-center gap-2.5 text-[12px]">
                  <Hash className="size-3.5 text-slate-300 shrink-0" />
                  <span className="font-mono text-[10px] text-slate-400 truncate">{id}</span>
                </div>
                {detail.lastLat && detail.lastLng && (
                  <div className="flex items-center gap-2.5 text-[12px]">
                    <MapPin className="size-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono text-[11px] text-slate-400">{detail.lastLat.toFixed(4)}, {detail.lastLng.toFixed(4)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Ratings card */}
            {ratings && ratings.count > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="size-3.5 text-amber-400 fill-amber-400" />
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Customer Ratings</p>
                </div>
                <div className="flex items-baseline gap-2 mb-3">
                  <span className="text-[28px] font-black text-slate-800 leading-none">
                    {ratings.average?.toFixed(1) ?? "—"}
                  </span>
                  <span className="text-[12px] text-slate-400">/ 5 · {ratings.count} reviews</span>
                </div>
                {/* Star distribution */}
                <div className="flex flex-col gap-1">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = ratings.distribution[star] ?? 0;
                    const pct = ratings.count > 0 ? (count / ratings.count) * 100 : 0;
                    return (
                      <div key={star} className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 w-3">{star}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[10px] text-slate-400 w-4 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
                {ratings.topTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {ratings.topTags.slice(0, 5).map(({ tag, count }) => (
                      <span key={tag} className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">
                        {tag} ×{count}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT */}
          <div className="flex flex-col gap-4">

            {/* Stats grid */}
            {stats && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard label="Delivered (30d)"   value={stats.delivered30}   highlight />
                  <StatCard label="Total (30d)"       value={stats.total30} />
                  <StatCard
                    label="Acceptance Rate"
                    value={stats.acceptanceRate != null ? `${stats.acceptanceRate.toFixed(0)}%` : "—"}
                    sub={stats.cancelled30 > 0 ? `${stats.cancelled30} cancelled` : undefined}
                  />
                  <StatCard
                    label="Avg Delivery"
                    value={stats.avgDeliveryMinutes != null ? `${Math.round(stats.avgDeliveryMinutes)}m` : "—"}
                    sub={stats.issueCount > 0 ? `${stats.issueCount} issues` : "No issues"}
                  />
                </div>

                {/* All-time */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="size-4 text-[#1B4D91]" />
                    <p className="text-[13px] font-black text-slate-700">All-time Performance</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-[20px] font-black text-[#1B4D91]">{stats.allTime.delivered}</p>
                      <p className="text-[11px] text-slate-400">Delivered</p>
                    </div>
                    <div>
                      <p className="text-[20px] font-black text-slate-700">{stats.allTime.total}</p>
                      <p className="text-[11px] text-slate-400">Total</p>
                    </div>
                    <div>
                      <p className="text-[20px] font-black text-red-500">{stats.allTime.cancelled}</p>
                      <p className="text-[11px] text-slate-400">Cancelled</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Active delivery */}
            {detail.activeAssignment && (
              <div className="bg-blue-50 rounded-2xl border border-blue-100 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Package className="size-4 text-blue-600" />
                  <p className="text-[12px] font-black uppercase tracking-wider text-blue-600">Active Delivery</p>
                  <span className={cn("ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold", ASSIGNMENT_STATUS_COLORS[detail.activeAssignment.status])}>
                    {detail.activeAssignment.status}
                  </span>
                </div>
                <p className="text-[13px] font-bold text-slate-700">{detail.activeAssignment.order.customerName}</p>
                {detail.activeAssignment.order.deliveryAddress && (
                  <p className="text-[12px] text-slate-500 mt-0.5">{detail.activeAssignment.order.deliveryAddress}</p>
                )}
                <div className="flex items-center justify-between mt-3">
                  <p className="text-[13px] font-black text-[#1B4D91]">
                    {detail.activeAssignment.order.total.toLocaleString("ru-RU")} UZS
                  </p>
                  <Link
                    href={`/admin/orders/${detail.activeAssignment.order.id}`}
                    className="flex items-center gap-1.5 text-[12px] font-bold text-[#1B4D91] hover:underline"
                  >
                    View order <ExternalLink className="size-3" />
                  </Link>
                </div>
              </div>
            )}

            {/* Assignment history */}
            {history && history.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-[#1B4D91]" />
                  <p className="text-[13px] font-black text-slate-700">Recent Deliveries</p>
                </div>
                <div className="divide-y divide-slate-50">
                  {history.map((item) => (
                    <Link
                      key={item.id}
                      href={`/admin/orders/${item.order.id}`}
                      className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors group"
                    >
                      <div className="min-w-0">
                        <p className="text-[12px] font-bold text-slate-700 truncate">{item.order.customerName}</p>
                        {item.order.deliveryAddress && (
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">{item.order.deliveryAddress}</p>
                        )}
                        <p className="text-[10px] text-slate-400 mt-0.5">{fmt(item.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-2">
                        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold", ASSIGNMENT_STATUS_COLORS[item.status])}>
                          {item.status}
                        </span>
                        <p className="text-[12px] font-black text-[#1B4D91]">
                          {item.order.total.toLocaleString("ru-RU")} UZS
                        </p>
                        <ExternalLink className="size-3.5 text-slate-300 group-hover:text-[#1B4D91] transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
