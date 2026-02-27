"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFetch } from "@/hooks/useFetch";
import { getMyOrders, payOrder, cancelOrder, deliverOrder } from "@/lib/api/orders";
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
  NEW: "bg-amber-100 text-amber-800",
  PAID: "bg-blue-100 text-[#1B4D91]",
  CONFIRMED: "bg-purple-100 text-purple-800",
  SHIPPED: "bg-[#1B4D91]/10 text-[#1B4D91]",
  DELIVERED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-50 text-[#E31E24]",
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
      <div className="page-shell max-w-5xl">
        <div className="surface-card h-28 animate-pulse rounded-[32px]" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-shell max-w-5xl space-y-6 md:space-y-8 pb-32">
        <div className="surface-card h-28 animate-pulse rounded-[32px]" />
        <div className="surface-card h-64 animate-pulse rounded-[32px]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-shell max-w-5xl">
        <div className="surface-card rounded-[32px] p-8 text-center text-[#E31E24] font-bold">
          Ошибка загрузки заказов: {error}
        </div>
      </div>
    );
  }

  const orders: Order[] = data?.data ?? [];

  return (
    <div className="page-shell max-w-5xl space-y-6 md:space-y-8 pb-32">
      <section className="surface-card rounded-[32px] p-6 md:p-8 shadow-[0_4px_30px_rgb(0,0,0,0.03)] border-slate-100 flex items-center gap-4">
        <div className="w-12 h-12 bg-[#1B4D91]/5 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-[#1B4D91]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-[#1B4D91]">Мои заказы</h1>
      </section>

      {actionError && (
        <div className="bg-red-50 text-[#E31E24] p-4 rounded-xl text-[14px] font-bold border border-red-100">
          {actionError}
        </div>
      )}

      {orders.length === 0 ? (
        <section className="surface-card rounded-[32px] flex flex-col items-center justify-center p-12 py-20 text-center shadow-[0_4px_30px_rgb(0,0,0,0.03)] border-slate-100">
          <div className="flex size-32 items-center justify-center rounded-full bg-[#1B4D91]/5 mb-6">
            <svg className="size-16 text-[#1B4D91]/30" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-[#1B4D91] mb-2">У вас ещё нет заказов</h2>
          <p className="text-[14px] md:text-[15px] text-slate-500 font-medium mb-8 max-w-sm">Сделайте свой первый заказ, добавив товары в корзину из каталога.</p>
          <Link href="/catalog" className="h-14 px-8 rounded-full bg-[#E31E24] text-white font-bold text-[15px] flex items-center justify-center hover:bg-[#C91A20] transition-colors shadow-lg shadow-[#E31E24]/20 w-full md:w-auto">
            Перейти в каталог
          </Link>
        </section>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.id} className="surface-card rounded-[32px] p-6 md:p-8 shadow-[0_4px_30px_rgb(0,0,0,0.03)] border-slate-100 flex flex-col gap-6">

              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-100 pb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[11px] md:text-[13px] text-slate-500 font-bold uppercase tracking-wider">Заказ <span className="text-[#1B4D91]">#{order.id.slice(0, 8).toUpperCase()}</span></p>
                    <span className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-slate-300"></span>
                    <p className="text-[11px] md:text-[13px] text-slate-500 font-bold tracking-wide">{new Date(order.createdAt).toLocaleDateString("ru-RU")}</p>
                  </div>
                  <p className="font-black text-[22px] md:text-3xl text-[#E31E24] mt-2">{order.total.toLocaleString()} <span className="text-[14px] md:text-lg">сум</span></p>
                </div>
                <div className={`px-4 py-2 rounded-full text-[11px] md:text-[12px] font-black uppercase tracking-wider inline-flex items-center justify-center ${STATUS_COLORS[order.status]}`}>
                  {STATUS_LABELS[order.status]}
                </div>
              </div>

              {/* Items Receipt Block */}
              {order.items && order.items.length > 0 && (
                <div className="bg-slate-50/70 rounded-2xl p-4 md:p-5 border border-slate-100 space-y-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center bg-white rounded-xl p-3 md:p-4 shadow-sm border border-slate-100/50">
                      <span className="text-[13px] md:text-[15px] font-bold text-slate-700 mr-4 truncate" title={item.product?.name ?? item.productId}>
                        {item.product?.name ?? item.productId}
                      </span>
                      <span className="text-[13px] md:text-[15px] font-black text-[#1B4D91] whitespace-nowrap">
                        {item.quantity} × {item.price.toLocaleString()} сум
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                {order.status === "NEW" && (
                  <>
                    <button
                      disabled={actionLoading === order.id + "pay"}
                      onClick={() => doAction(() => payOrder(order.id), order.id + "pay")}
                      className="h-12 flex-1 sm:flex-none rounded-full px-8 bg-[#E31E24] text-white text-[14px] font-bold hover:bg-[#C91A20] transition-colors shadow-lg shadow-[#E31E24]/20 flex items-center justify-center disabled:opacity-50"
                    >
                      {actionLoading === order.id + "pay" ? "Оплата..." : "Оплатить"}
                    </button>
                    <button
                      disabled={actionLoading === order.id + "cancel"}
                      onClick={() => doAction(() => cancelOrder(order.id), order.id + "cancel")}
                      className="h-12 flex-1 sm:flex-none rounded-full px-8 border-2 border-slate-200 bg-white text-slate-600 text-[14px] font-bold hover:border-[#E31E24] hover:text-[#E31E24] transition-colors flex items-center justify-center disabled:opacity-50"
                    >
                      Отменить
                    </button>
                  </>
                )}

                {order.status === "PAID" && (
                  <button
                    disabled={actionLoading === order.id + "cancel"}
                    onClick={() => doAction(() => cancelOrder(order.id), order.id + "cancel")}
                    className="h-12 flex-1 sm:flex-none rounded-full px-8 border-2 border-slate-200 bg-white text-slate-600 text-[14px] font-bold hover:border-[#E31E24] hover:text-[#E31E24] transition-colors flex items-center justify-center disabled:opacity-50"
                  >
                    Отменить
                  </button>
                )}

                {order.status === "SHIPPED" && (
                  <button
                    disabled={actionLoading === order.id + "deliver"}
                    onClick={() => doAction(() => deliverOrder(order.id), order.id + "deliver")}
                    className="h-12 flex-1 sm:flex-none rounded-full px-8 bg-[#1B4D91] text-white text-[14px] font-bold hover:bg-[#1B4D91]/90 transition-colors shadow-lg shadow-[#1B4D91]/20 flex items-center justify-center disabled:opacity-50"
                  >
                    Подтвердить получение
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}