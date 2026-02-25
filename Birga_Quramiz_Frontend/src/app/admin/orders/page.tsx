"use client";

import { useEffect, useState } from "react";
import { getAdminOrders } from "@/lib/api/admin";
import type { Order, OrderStatus, PaginatedResponse } from "@/types";

const PAGE_SIZE = 20;

export default function AdminOrdersPage() {
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
        setError(err instanceof Error ? err.message : "Failed to load orders");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [page, status, query]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="section-title text-primary">Orders</h1>
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary">
          {meta?.total ?? orders.length} total
        </span>
      </div>

      <div className="surface-card grid gap-3 p-4 md:grid-cols-[1fr,220px]">
        <input
          value={query}
          onChange={(e) => {
            setPage(1);
            setQuery(e.target.value);
          }}
          placeholder="Search by id, customer, phone"
          className="h-10 rounded-lg border border-border/80 bg-white px-3 text-sm"
        />

        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value as "ALL" | OrderStatus);
          }}
          className="h-10 rounded-lg border border-border/80 bg-white px-3 text-sm"
        >
          <option value="ALL">All statuses</option>
          <option value="NEW">NEW</option>
          <option value="PAID">PAID</option>
          <option value="CONFIRMED">CONFIRMED</option>
          <option value="SHIPPED">SHIPPED</option>
          <option value="DELIVERED">DELIVERED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="surface-card h-20 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <p className="text-destructive">Failed to load orders: {error}</p>
      ) : (
        <>
          <div className="grid gap-3">
            {orders.map((order) => (
              <article key={order.id} className="surface-card flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-semibold text-primary">#{order.id.slice(0, 8)}</p>
                  <p className="text-sm text-muted-foreground">{order.total.toLocaleString()} UZS</p>
                  <p className="text-xs text-muted-foreground">
                    {order.customerName} · {order.customerPhone}
                  </p>
                </div>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary">{order.status}</span>
              </article>
            ))}
          </div>

          <div className="flex items-center justify-between text-sm">
            <p className="text-muted-foreground">
              Page {meta?.page ?? page} of {meta?.totalPages ?? 1}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={(meta?.page ?? page) <= 1}
                className="rounded-lg border border-border/80 bg-white px-3 py-1.5 text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={Boolean(meta && meta.page >= meta.totalPages)}
                className="rounded-lg border border-border/80 bg-white px-3 py-1.5 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
