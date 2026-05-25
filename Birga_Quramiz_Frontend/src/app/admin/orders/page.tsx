"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  MapPin,
  Package,
  Search,
  Truck,
  XCircle,
} from "lucide-react";
import { AdminPage } from "@/components/admin/AdminPage";
import { getAdminOrders } from "@/lib/api/admin";
import { cn } from "@/lib/utils";
import type { Order, OrderStatus, PaginatedResponse } from "@/types";

const PAGE_SIZE = 20;

const STATUS_STYLE: Record<OrderStatus, { icon: React.ElementType; className: string }> = {
  NEW: { icon: Clock3, className: "bg-blue-50 text-blue-700 border-blue-100" },
  PAID: { icon: CheckCircle2, className: "bg-violet-50 text-violet-700 border-violet-100" },
  CONFIRMED: { icon: Package, className: "bg-cyan-50 text-cyan-700 border-cyan-100" },
  SHIPPED: { icon: Truck, className: "bg-amber-50 text-amber-700 border-amber-100" },
  DELIVERED: { icon: CheckCircle2, className: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  CANCELLED: { icon: XCircle, className: "bg-red-50 text-red-600 border-red-100" },
};

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
        if (!cancelled) {
          setOrders(res.data);
          setMeta(res.meta);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : t("loadError"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [page, query, status, t]);

  return (
    <AdminPage>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Operations</p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-black text-slate-900">
            <ClipboardList className="size-6 text-[#1B4D91]" />
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-slate-500">Manage fulfillment, dispatch and delivery progress in one queue.</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600">
          {t("totalOrders", { count: meta?.total ?? orders.length })}
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => {
              setPage(1);
              setQuery(event.target.value);
            }}
            placeholder={t("searchPlaceholder")}
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-700 outline-none focus:border-[#1B4D91] focus:bg-white"
          />
        </div>
        <select
          value={status}
          onChange={(event) => {
            setPage(1);
            setStatus(event.target.value as "ALL" | OrderStatus);
          }}
          className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 outline-none focus:border-[#1B4D91] md:w-56"
        >
          <option value="ALL">{t("statusAll")}</option>
          {(["NEW", "PAID", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"] as OrderStatus[]).map((value) => (
            <option key={value} value={value}>{t(`status${value}`)}</option>
          ))}
        </select>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="hidden grid-cols-[120px_1.2fr_1fr_148px_160px_44px] gap-4 border-b border-slate-100 bg-slate-50 px-5 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400 lg:grid">
          <span>Order</span>
          <span>Customer</span>
          <span>Delivery</span>
          <span>Amount</span>
          <span>Status</span>
          <span />
        </div>

        {loading ? (
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-[74px] animate-pulse bg-white px-5 py-3">
                <div className="h-full rounded-lg bg-slate-50" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-6 text-sm font-semibold text-red-600">{error}</div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <ClipboardList className="size-8 text-slate-300" />
            <p className="text-sm font-bold text-slate-600">No orders match this queue.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {orders.map((order) => {
              const statusConfig = STATUS_STYLE[order.status];
              const StatusIcon = statusConfig.icon;
              return (
                <Link
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="grid gap-3 px-4 py-4 transition-colors hover:bg-slate-50 lg:grid-cols-[120px_1.2fr_1fr_148px_160px_44px] lg:items-center lg:px-5"
                >
                  <div>
                    <p className="font-mono text-[12px] font-bold text-[#1B4D91]">#{order.id.slice(0, 8).toUpperCase()}</p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-800">{order.customerName}</p>
                    <p className="truncate text-xs text-slate-500">{order.customerPhone}</p>
                  </div>
                  <div className="flex min-w-0 items-start gap-2 text-xs text-slate-600">
                    {order.deliveryType === "DELIVERY" ? <MapPin className="mt-0.5 size-3.5 shrink-0 text-slate-400" /> : <Package className="mt-0.5 size-3.5 shrink-0 text-slate-400" />}
                    <span className="truncate">{order.deliveryType === "DELIVERY" ? order.deliveryAddress || "Delivery address missing" : "Pickup"}</span>
                  </div>
                  <p className="text-sm font-black tabular-nums text-slate-800">
                    {order.total.toLocaleString("ru-RU")} UZS
                  </p>
                  <span className={cn("inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold", statusConfig.className)}>
                    <StatusIcon className="size-3.5" />
                    {t(`status${order.status}`)}
                  </span>
                  <ArrowRight className="hidden size-4 text-slate-300 lg:block" />
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {!loading && !error && orders.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-slate-500">
            {t("pagination", { page: meta?.page ?? page, totalPages: meta?.totalPages ?? 1 })}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={(meta?.page ?? page) <= 1}
              className="inline-flex h-10 items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 disabled:opacity-40"
            >
              <ChevronLeft className="size-4" /> {t("prev")}
            </button>
            <button
              type="button"
              onClick={() => setPage((current) => current + 1)}
              disabled={Boolean(meta && meta.page >= meta.totalPages)}
              className="inline-flex h-10 items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 disabled:opacity-40"
            >
              {t("next")} <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}
    </AdminPage>
  );
}
