"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFetch } from "@/hooks/useFetch";
import { getMyOrders, payOrder, cancelOrder, deliverOrder } from "@/lib/api/orders";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import type { Order, OrderStatus } from "@/types";

const STATUS_LABELS: Record<OrderStatus, string> = {
  NEW: "Новый",
  PAID: "Оплачен",
  CONFIRMED: "Подтверждён",
  SHIPPED: "Отправлен",
  DELIVERED: "Доставлен",
  CANCELLED: "Отменён",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  NEW: "bg-yellow-100 text-yellow-800",
  PAID: "bg-blue-100 text-blue-800",
  CONFIRMED: "bg-purple-100 text-purple-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function OrdersPage() {
  const router = useRouter();
  const { user, isAuthenticated, isInitialized } = useAuth();
  const { data, loading, error, refetch } = useFetch(() => getMyOrders());
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    if (!isInitialized) return;

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (user && user.role !== "USER") {
      router.push(user.role === "ADMIN" ? "/admin" : "/seller/dashboard");
    }
  }, [isInitialized, isAuthenticated, user, router]);

  const doAction = async (fn: () => Promise<unknown>, id: string) => {
    setActionLoading(id);
    setActionError("");
    try {
      await fn();
      refetch();
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Error");
    } finally {
      setActionLoading(null);
    }
  };

  if (!isInitialized || !isAuthenticated || (user && user.role !== "USER")) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="h-28 animate-pulse bg-gray-100 rounded-lg" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse bg-gray-100 rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <p className="text-red-500">Ошибка загрузки заказов: {error}</p>
      </div>
    );
  }

  const orders: Order[] = data?.data ?? [];

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Мои заказы</h1>

      {actionError && <p className="text-sm text-red-500">{actionError}</p>}

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">У вас ещё нет заказов</p>
          <Link href="/catalog" className="text-orange-500 underline mt-2 inline-block">
            Перейти в каталог
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs text-muted-foreground font-mono">#{order.id.slice(0, 8)}...</p>
                  <p className="font-bold text-lg">{order.total.toLocaleString()} сум</p>
                  <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString("ru-RU")}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded font-medium ${STATUS_COLORS[order.status]}`}>{STATUS_LABELS[order.status]}</span>
              </div>

              {order.items && order.items.length > 0 && (
                <div className="text-sm text-muted-foreground space-y-1">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <span>{item.product?.name ?? item.productId}</span>
                      <span>
                        {item.quantity} × {item.price.toLocaleString()} сум
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                {order.status === "NEW" && (
                  <>
                    <Button size="sm" disabled={actionLoading === order.id + "pay"} onClick={() => doAction(() => payOrder(order.id), order.id + "pay")}>
                      Оплатить
                    </Button>
                    <Button size="sm" variant="outline" disabled={actionLoading === order.id + "cancel"} onClick={() => doAction(() => cancelOrder(order.id), order.id + "cancel")}>
                      Отменить
                    </Button>
                  </>
                )}

                {order.status === "PAID" && (
                  <Button size="sm" variant="outline" disabled={actionLoading === order.id + "cancel"} onClick={() => doAction(() => cancelOrder(order.id), order.id + "cancel")}>
                    Отменить
                  </Button>
                )}

                {order.status === "SHIPPED" && (
                  <Button size="sm" disabled={actionLoading === order.id + "deliver"} onClick={() => doAction(() => deliverOrder(order.id), order.id + "deliver")}>
                    Подтвердить получение
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}