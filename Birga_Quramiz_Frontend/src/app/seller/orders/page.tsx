"use client";

import { useState } from "react";
import { useFetch } from "@/hooks/useFetch";
import { getSellerOrders, confirmOrder, shipOrder, cancelOrder } from "@/lib/api/orders";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { Order, OrderStatus } from "@/types";

const STATUS_COLORS: Record<OrderStatus, string> = {
  NEW: "bg-yellow-100 text-yellow-800",
  PAID: "bg-blue-100 text-blue-800",
  CONFIRMED: "bg-purple-100 text-purple-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function SellerOrdersPage() {
  const { user, isAuthenticated, isInitialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isInitialized) return;

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (user && user.role !== "SELLER") {
      router.push("/");
    }
  }, [user, isAuthenticated, isInitialized, router]);

  const { data, loading, error, refetch } = useFetch(() => getSellerOrders());
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const doAction = async (fn: () => Promise<unknown>, key: string) => {
    setActionLoading(key);
    try {
      await fn();
      refetch();
    } finally {
      setActionLoading(null);
    }
  };

  if (!isInitialized || loading || (isAuthenticated && !user)) {
    return (
      <div className="page-shell max-w-5xl space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="surface-card h-24 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "SELLER") {
    return null;
  }

  if (error) {
    return <div className="page-shell max-w-5xl text-destructive">Failed to load orders: {error}</div>;
  }

  const orders: Order[] = data?.data ?? [];

  return (
    <div className="page-shell max-w-5xl space-y-6">
      <h1 className="section-title text-primary">Seller Orders</h1>

      {orders.length === 0 ? (
        <div className="surface-card p-10 text-center text-muted-foreground">No orders yet.</div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <article key={order.id} className="surface-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">#{order.id.slice(0, 8)}</p>
                  <p className="text-lg font-bold text-primary">{order.total.toLocaleString()} UZS</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLORS[order.status]}`}>{order.status}</span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {order.status === "PAID" && (
                  <>
                    <Button size="sm" disabled={actionLoading === order.id + "confirm"} onClick={() => doAction(() => confirmOrder(order.id), order.id + "confirm")}>
                      Confirm
                    </Button>
                    <Button size="sm" variant="outline" disabled={actionLoading === order.id + "cancel"} onClick={() => doAction(() => cancelOrder(order.id), order.id + "cancel")}>
                      Cancel
                    </Button>
                  </>
                )}

                {order.status === "CONFIRMED" && (
                  <Button size="sm" disabled={actionLoading === order.id + "ship"} onClick={() => doAction(() => shipOrder(order.id), order.id + "ship")}>
                    Mark as shipped
                  </Button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}