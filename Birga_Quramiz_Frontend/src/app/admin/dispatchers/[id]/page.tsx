"use client";

import { useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useFetch } from "@/hooks/useFetch";
import { getAdminDispatcherDetail } from "@/lib/api/admin";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, Headset, Phone, Calendar, Package,
  CheckCircle2, XCircle, Clock, Hash, ExternalLink,
  TrendingUp,
} from "lucide-react";

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const ASSIGNMENT_STATUS_COLORS: Record<string, string> = {
  PENDING:   "bg-amber-50 text-amber-700 border-amber-200",
  ACCEPTED:  "bg-blue-50 text-blue-700 border-blue-200",
  PICKED_UP: "bg-purple-50 text-purple-700 border-purple-200",
  DELIVERED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-red-50 text-red-600 border-red-200",
};

const ASSIGNMENT_STATUS_ICON: Record<string, React.ElementType> = {
  DELIVERED: CheckCircle2,
  CANCELLED: XCircle,
  ACCEPTED:  Clock,
  PICKED_UP: Package,
  PENDING:   Clock,
};

function StatCard({ label, value, sub, accent }: {
  label: string; value: string | number; sub?: string; accent?: boolean;
}) {
  return (
    <div className={cn(
      "rounded-2xl border shadow-sm px-4 py-3.5",
      accent ? "bg-[#1B4D91]/5 border-[#1B4D91]/20" : "bg-white border-slate-100"
    )}>
      <p className={cn("text-[22px] font-black leading-none", accent ? "text-[#1B4D91]" : "text-slate-800")}>
        {value}
      </p>
      <p className="text-[12px] text-slate-500 font-medium mt-1">{label}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function AdminDispatcherDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const fetcher = useCallback(() => getAdminDispatcherDetail(id), [id]);
  const { data: dispatcher, loading, error } = useFetch(fetcher);

  if (loading) {
    return (
      <div className="flex flex-col flex-1 pb-12">
        <div className="mx-auto w-full max-w-[1440px] px-4 pt-4 md:px-7 md:pt-7 flex flex-col gap-4">
          <div className="h-8 w-32 animate-pulse rounded-xl bg-white" />
          <div className="grid md:grid-cols-[280px_1fr] gap-4">
            <div className="h-64 animate-pulse rounded-2xl bg-white" />
            <div className="flex flex-col gap-3">
              <div className="h-24 animate-pulse rounded-2xl bg-white" />
              <div className="h-48 animate-pulse rounded-2xl bg-white" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !dispatcher) {
    return (
      <div className="flex flex-col flex-1 pb-12">
        <div className="mx-auto w-full max-w-[1440px] px-4 pt-4 md:px-7 md:pt-7 flex flex-col gap-4">
          <button
            onClick={() => router.push("/admin/dispatchers")}
            className="flex items-center gap-2 text-[13px] font-bold text-[#1B4D91] hover:underline w-fit"
          >
            <ArrowLeft className="size-4" /> Back to dispatchers
          </button>
          <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-[13px] font-medium text-red-600">
            {error ?? "Dispatcher not found"}
          </div>
        </div>
      </div>
    );
  }

  const { stats, recentAssignments } = dispatcher;
  const successRate = stats.total > 0
    ? Math.round((stats.delivered / stats.total) * 100)
    : null;

  return (
    <div className="flex flex-col flex-1 pb-12">
      <div className="mx-auto w-full max-w-[1440px] px-4 pt-4 md:px-7 md:pt-7 flex flex-col gap-4">

        {/* Back */}
        <button
          onClick={() => router.push("/admin/dispatchers")}
          className="flex items-center gap-2 text-[13px] font-bold text-[#1B4D91] hover:underline w-fit"
        >
          <ArrowLeft className="size-4" /> Dispatchers
        </button>

        {/* 2-col layout */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[280px_1fr]">

          {/* LEFT: Profile card */}
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {/* Gradient band */}
              <div className="h-20 bg-gradient-to-r from-[#1B4D91] to-[#2563eb]" />
              <div className="px-5 pb-5">
                <div className="-mt-7 mb-4 flex items-end justify-between">
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-white shadow-md border border-slate-100 text-[#1B4D91] font-black text-[22px]">
                    {dispatcher.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1B4D91]/10 text-[#1B4D91] text-[11px] font-bold border border-[#1B4D91]/20">
                    <Headset className="size-3" />
                    Dispatcher
                  </span>
                </div>
                <p className="text-[17px] font-black text-slate-800 leading-tight">{dispatcher.name}</p>

                <div className="mt-3 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-[12px] text-slate-500">
                    <Phone className="size-3.5 text-slate-300 shrink-0" />
                    <span className="font-mono">{dispatcher.phone ?? "—"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[12px] text-slate-500">
                    <Calendar className="size-3.5 text-slate-300 shrink-0" />
                    <span>Joined {fmt(dispatcher.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[12px] text-slate-500">
                    <Hash className="size-3.5 text-slate-300 shrink-0" />
                    <span className="font-mono text-[11px] text-slate-400">{id.toUpperCase()}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-50">
                  <Link
                    href={`/admin/users/${id}`}
                    className="flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-xl border border-[#1B4D91]/20 text-[12px] font-bold text-[#1B4D91] hover:bg-[#1B4D91]/5 transition-colors"
                  >
                    View user profile <ExternalLink className="size-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Stats + assignments */}
          <div className="flex flex-col gap-4">

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard label="Total assigned" value={stats.total} accent />
              <StatCard label="Today" value={stats.today} />
              <StatCard
                label="Delivered"
                value={stats.delivered}
                sub={successRate !== null ? `${successRate}% rate` : undefined}
              />
              <StatCard label="Cancelled" value={stats.cancelled} />
            </div>

            {/* Recent assignments */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-50 flex items-center gap-2">
                <TrendingUp className="size-4 text-[#1B4D91]" />
                <p className="text-[12px] font-black uppercase tracking-wider text-slate-500">
                  Recent Assignments
                </p>
                {recentAssignments.length > 0 && (
                  <span className="ml-auto text-[10px] text-slate-300 font-medium">
                    Last {recentAssignments.length}
                  </span>
                )}
              </div>

              {recentAssignments.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-12 text-center">
                  <Package className="size-7 text-slate-200" />
                  <p className="text-[13px] font-bold text-slate-500">No assignments yet</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {recentAssignments.map((a) => {
                    const StatusIcon = ASSIGNMENT_STATUS_ICON[a.status] ?? Clock;
                    return (
                      <div key={a.id} className="flex items-start gap-4 px-5 py-4">
                        {/* Status badge */}
                        <span className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 mt-0.5",
                          ASSIGNMENT_STATUS_COLORS[a.status] ?? "bg-slate-50 text-slate-500 border-slate-200"
                        )}>
                          <StatusIcon className="size-2.5" />
                          {a.status}
                        </span>

                        {/* Order + driver info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              href={`/admin/orders/${a.order.id}`}
                              className="text-[12px] font-bold text-slate-700 hover:text-[#1B4D91] transition-colors truncate"
                            >
                              {a.order.customerName}
                            </Link>
                            <span className="text-[11px] font-mono text-slate-400">
                              #{a.order.id.slice(0, 8).toUpperCase()}
                            </span>
                          </div>
                          {a.order.deliveryAddress && (
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">
                              {a.order.deliveryAddress}
                            </p>
                          )}
                          {a.driver && (
                            <Link
                              href={`/admin/drivers/${a.driver.id}`}
                              className="inline-flex items-center gap-1 mt-1 text-[11px] text-[#1B4D91]/70 hover:text-[#1B4D91] font-medium transition-colors"
                            >
                              Driver: {a.driver.name}
                              <ExternalLink className="size-2.5" />
                            </Link>
                          )}
                        </div>

                        {/* Amount + time */}
                        <div className="text-right shrink-0">
                          <p className="text-[12px] font-black text-slate-700 tabular-nums">
                            {a.order.total.toLocaleString("ru-RU")} UZS
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{fmtTime(a.createdAt)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
