"use client";

import { useEffect, useState } from "react";
import { getAdminOrders } from "@/lib/api/admin";
import type { Order, OrderStatus, PaginatedResponse } from "@/types";
import { useTranslations } from "next-intl";
import { Search, ClipboardList, ChevronLeft, ChevronRight, CheckCircle, Clock, AlertCircle, Truck, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

export default function AdminOrdersPage() {
  const t = useTranslations("AdminOrders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [meta, setMeta] = useState<PaginatedResponse<Order>["meta"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"ALL" | OrderStatus>("ALL");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await getAdminOrders({
          page,
          limit: PAGE_SIZE,
          status: status === "ALL" ? undefined : status,
          q: query.trim() || undefined,
        });

        if (cancelled) return;

        setOrders(res.data);
        setMeta(res.meta);
      } catch (err: unknown) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : t("loadError"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [page, status, query, t]);

  const getStatusBadge = (s: OrderStatus) => {
    switch (s) {
      case "DELIVERED": return { icon: CheckCircle, bg: "bg-emerald-100", text: "text-emerald-700", label: t("statusDELIVERED") };
      case "NEW": return { icon: Clock, bg: "bg-amber-100", text: "text-amber-700", label: t("statusNEW") };
      case "PAID": return { icon: AlertCircle, bg: "bg-blue-100", text: "text-blue-700", label: t("statusPAID") };
      case "CONFIRMED": return { icon: CheckCircle, bg: "bg-purple-100", text: "text-purple-700", label: t("statusCONFIRMED") };
      case "CANCELLED": return { icon: XCircle, bg: "bg-red-100", text: "text-red-700", label: t("statusCANCELLED") };
      case "SHIPPED": return { icon: Truck, bg: "bg-purple-100", text: "text-purple-700", label: t("statusSHIPPED") };
      default: return { icon: Clock, bg: "bg-slate-100", text: "text-slate-700", label: s };
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f6fa] pb-28 md:pb-12">
      <div className="mx-auto w-full md:max-w-7xl">
        <div className="mx-auto flex flex-col gap-5 px-4 md:px-6 max-w-md md:max-w-none pt-4 md:pt-6">

          {/* ── Header ── */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#1B4D91]/10 text-[#1B4D91]">
                <ClipboardList className="size-5" />
              </div>
              <h1 className="text-xl md:text-2xl font-black text-[#1B4D91]">{t("title") || "Orders"}</h1>
            </div>

            <div className="flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1.5 text-blue-700">
              <span className="text-[11px] md:text-xs font-bold whitespace-nowrap">
                {t("totalOrders", { count: meta?.total ?? orders.length }) || `${meta?.total ?? orders.length} total`}
              </span>
            </div>
          </div>

          {/* ── Filters ── */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => { setPage(1); setQuery(e.target.value); }}
                placeholder={t("searchPlaceholder")}
                className="h-12 w-full rounded-2xl border-none bg-white pl-11 pr-4 text-sm font-medium text-slate-700 shadow-sm outline-none ring-1 ring-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-[#1B4D91] transition-all"
              />
            </div>
            <select
              value={status}
              onChange={(e) => { setPage(1); setStatus(e.target.value as "ALL" | OrderStatus); }}
              className="h-12 w-full md:w-56 rounded-2xl border-none bg-white px-4 text-sm font-bold text-[#1B4D91] shadow-sm outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-[#1B4D91] transition-all cursor-pointer appearance-none"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%231B4D91'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: `right 16px center`, backgroundRepeat: `no-repeat`, backgroundSize: `16px` }}
            >
              <option value="ALL">{t("statusAll")}</option>
              <option value="NEW">{t("statusNEW")}</option>
              <option value="PAID">{t("statusPAID")}</option>
              <option value="CONFIRMED">{t("statusCONFIRMED")}</option>
              <option value="SHIPPED">{t("statusSHIPPED")}</option>
              <option value="DELIVERED">{t("statusDELIVERED")}</option>
              <option value="CANCELLED">{t("statusCANCELLED")}</option>
            </select>
          </div>

          {/* ── Content ── */}
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-28 animate-pulse rounded-3xl bg-white shadow-sm" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-[#E31E24]/20 bg-[#E31E24]/5 p-6 text-[13px] font-semibold text-[#E31E24]">
              {error}
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/50 py-16 text-center">
              <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <CheckCircle className="size-6" />
              </div>
              <p className="text-sm font-bold text-slate-600">No orders found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orders.map((o) => {
                const badge = getStatusBadge(o.status);
                const BadgeIcon = badge.icon;
                return (
                  <article key={o.id} className="group flex flex-col justify-between rounded-3xl bg-white border border-slate-100 p-5 shadow-sm transition-all hover:shadow-md hover:border-[#1B4D91]/20 relative overflow-hidden">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 pr-2">
                        <p className="text-[18px] font-black text-[#1B4D91] truncate leading-none">
                          {o.total.toLocaleString()} UZS
                        </p>
                        <p className="text-[12px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                          ID: {o.id.substring(0, 8)}
                        </p>
                      </div>
                      <div className={cn("flex items-center gap-1.5 rounded-full px-2.5 py-1", badge.bg, badge.text)}>
                        <BadgeIcon className="size-3.5" />
                        <span className="text-[10px] uppercase tracking-wider font-bold">{badge.label}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-1 border-t border-slate-100 pt-3">
                      <p className="text-[13px] font-black text-slate-700 truncate">{o.customerName || "Customer"}</p>
                      <p className="text-[12px] font-bold text-slate-500">{o.customerPhone}</p>
                    </div>
                  </article>
                )
              })}
            </div>
          )}

          {/* ── Pagination ── */}
          {!loading && !error && orders.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-[12px] font-bold text-slate-500">
                {t("pagination", { page: meta?.page ?? page, totalPages: meta?.totalPages ?? 1 })}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={(meta?.page ?? page) <= 1}
                  className="flex h-10 items-center justify-center gap-1 rounded-xl bg-white px-4 text-sm font-bold text-[#1B4D91] shadow-sm ring-1 ring-slate-100 transition-all hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white"
                >
                  <ChevronLeft className="size-4" /> {t("prev")}
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={Boolean(meta && meta.page >= meta.totalPages)}
                  className="flex h-10 items-center justify-center gap-1 rounded-xl bg-white px-4 text-sm font-bold text-[#1B4D91] shadow-sm ring-1 ring-slate-100 transition-all hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white"
                >
                  {t("next")} <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
