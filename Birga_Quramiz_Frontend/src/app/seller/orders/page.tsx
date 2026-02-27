"use client";

import { useState } from "react";
import { useFetch } from "@/hooks/useFetch";
import { getSellerOrders, confirmOrder, shipOrder, cancelOrder } from "@/lib/api/orders";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useTranslations } from "next-intl";
import type { Order, OrderStatus } from "@/types";
import {
  CheckCircle, Clock, Truck, XCircle, AlertCircle, Package,
  User2, Phone, MapPin, CreditCard, MessageSquare, ArrowRight,
  RefreshCw, ShoppingBag
} from "lucide-react";

// ── Status config ──────────────────────────────────────────
const STATUS_CONFIG: Record<OrderStatus, { label: string; icon: typeof CheckCircle; color: string; bg: string; border: string }> = {
  NEW: { label: "Новый", icon: Clock, color: "#f59e0b", bg: "#fef3c7", border: "#fde68a" },
  PAID: { label: "Оплачен", icon: AlertCircle, color: "#3b82f6", bg: "#dbeafe", border: "#bfdbfe" },
  CONFIRMED: { label: "Подтверждён", icon: CheckCircle, color: "#8b5cf6", bg: "#ede9fe", border: "#ddd6fe" },
  SHIPPED: { label: "Отправлен", icon: Truck, color: "#6366f1", bg: "#e0e7ff", border: "#c7d2fe" },
  DELIVERED: { label: "Доставлен", icon: CheckCircle, color: "#10b981", bg: "#d1fae5", border: "#a7f3d0" },
  CANCELLED: { label: "Отменён", icon: XCircle, color: "#ef4444", bg: "#fee2e2", border: "#fecaca" },
};

const DELIVERY_LABELS: Record<string, string> = {
  PICKUP: "Самовывоз",
  DELIVERY: "Доставка",
};

const PAYMENT_LABELS: Record<string, string> = {
  CASH: "Наличные",
  CARD: "Карта",
  TRANSFER: "Перевод",
};

export default function SellerOrdersPage() {
  const { user, isAuthenticated, isInitialized } = useAuth();
  const router = useRouter();
  const t = useTranslations("SellerOrders");

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated) { router.push("/login"); return; }
    if (user && user.role !== "SELLER") router.push("/");
  }, [user, isAuthenticated, isInitialized, router]);

  const { data, loading, error, refetch } = useFetch(() => getSellerOrders());
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const doAction = async (fn: () => Promise<unknown>, key: string) => {
    setActionLoading(key);
    try { await fn(); refetch(); } finally { setActionLoading(null); }
  };

  // ── Loading skeleton ──
  if (!isInitialized || loading || (isAuthenticated && !user)) {
    return (
      <div className="flex flex-col min-h-screen bg-[#f4f6fa] pb-28 md:pb-12">
        <div className="mx-auto w-full md:max-w-7xl">
          <div className="mx-auto flex flex-col gap-5 px-4 md:px-6 max-w-md md:max-w-none pt-4 md:pt-6">
            <div className="h-32 animate-pulse rounded-3xl bg-white" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-36 animate-pulse rounded-3xl bg-white" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "SELLER") return null;

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-[#f4f6fa] pb-28 md:pb-12">
        <div className="mx-auto w-full md:max-w-7xl px-4 md:px-6 pt-4 md:pt-6">
          <div className="rounded-3xl border border-[#E31E24]/20 bg-[#E31E24]/5 p-6 text-[13px] font-semibold text-[#E31E24]">
            {t("loadError") || "Ошибка загрузки заказов"}: {error}
          </div>
        </div>
      </div>
    );
  }

  const orders: Order[] = data?.data ?? [];

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f6fa] pb-28 md:pb-12">
      <div className="mx-auto w-full md:max-w-7xl">
        <div className="mx-auto flex flex-col gap-5 px-4 md:px-6 max-w-md md:max-w-none pt-4 md:pt-6">

          {/* Hero */}
          <div className="rounded-3xl bg-[#1B4D91] px-6 py-7 md:px-10 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/50 mb-1">Birga Quramiz</p>
              <h1 className="text-xl font-black text-white md:text-2xl">{t("title") || "Заказы"}</h1>
              <p className="mt-1 text-[13px] text-white/70">{orders.length} {t("ordersTotal") || "заказов всего"}</p>
            </div>
            <button
              onClick={() => refetch()}
              className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-colors"
              title="Обновить"
            >
              <RefreshCw className="size-5" />
            </button>
          </div>

          {/* Empty state */}
          {orders.length === 0 ? (
            <div className="rounded-3xl bg-white border border-slate-100 p-12 flex flex-col items-center gap-3 text-center">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-[#1B4D91]/6 text-[#1B4D91]">
                <ShoppingBag className="size-8" />
              </div>
              <p className="text-[15px] font-black text-[#1B4D91]">{t("noOrders") || "Заказов пока нет"}</p>
              <p className="text-[13px] text-slate-400">{t("noOrdersHint") || "Новые заказы появятся здесь"}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const cfg = STATUS_CONFIG[order.status];
                const StatusIcon = cfg.icon;
                const confirmKey = order.id + "confirm";
                const cancelKey = order.id + "cancel";
                const shipKey = order.id + "ship";

                return (
                  <article key={order.id} className="rounded-3xl bg-white border border-slate-100 shadow-sm overflow-hidden">

                    {/* ── Order header ── */}
                    <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-[#f4f6fa]">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                          #{order.id.slice(0, 8)}
                        </p>
                        <p className="text-[18px] font-black text-[#1B4D91]">
                          {order.total.toLocaleString("ru-RU")} <span className="text-[13px] font-semibold opacity-60">UZS</span>
                        </p>
                      </div>
                      <span
                        className="flex items-center gap-1.5 rounded-2xl px-3 py-1.5 text-[11px] font-black border"
                        style={{ color: cfg.color, backgroundColor: cfg.bg, borderColor: cfg.border }}
                      >
                        <StatusIcon className="size-3.5" />
                        {cfg.label}
                      </span>
                    </div>

                    {/* ── Order details grid ── */}
                    <div className="px-5 py-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                      {/* Customer */}
                      <div className="flex items-start gap-2">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#1B4D91]/8 text-[#1B4D91] mt-0.5">
                          <User2 className="size-3.5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("customer") || "Клиент"}</p>
                          <p className="text-[12px] font-semibold text-slate-700 mt-0.5">{order.customerName}</p>
                        </div>
                      </div>

                      {/* Phone */}
                      <div className="flex items-start gap-2">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#1B4D91]/8 text-[#1B4D91] mt-0.5">
                          <Phone className="size-3.5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("phone") || "Телефон"}</p>
                          <p className="text-[12px] font-semibold text-slate-700 mt-0.5">{order.customerPhone}</p>
                        </div>
                      </div>

                      {/* Delivery */}
                      <div className="flex items-start gap-2">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#1B4D91]/8 text-[#1B4D91] mt-0.5">
                          <MapPin className="size-3.5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("delivery") || "Доставка"}</p>
                          <p className="text-[12px] font-semibold text-slate-700 mt-0.5">
                            {DELIVERY_LABELS[order.deliveryType] ?? order.deliveryType}
                          </p>
                          {order.deliveryAddress && (
                            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{order.deliveryAddress}</p>
                          )}
                        </div>
                      </div>

                      {/* Payment */}
                      <div className="flex items-start gap-2">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#1B4D91]/8 text-[#1B4D91] mt-0.5">
                          <CreditCard className="size-3.5" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("payment") || "Оплата"}</p>
                          <p className="text-[12px] font-semibold text-slate-700 mt-0.5">
                            {PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* ── Order items ── */}
                    {order.items && order.items.length > 0 && (
                      <div className="px-5 pb-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                          <Package className="size-3" /> {t("items") || "Товары"} ({order.items.length})
                        </p>
                        <div className="space-y-1.5">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between rounded-xl bg-[#f4f6fa] px-3 py-2">
                              <span className="text-[12px] font-semibold text-slate-700 truncate flex-1 mr-3">
                                {item.product?.name ?? `Товар #${item.productId.slice(0, 6)}`}
                              </span>
                              <div className="flex items-center gap-3 shrink-0">
                                <span className="text-[11px] text-slate-400">×{item.quantity}</span>
                                <span className="text-[12px] font-black text-[#1B4D91]">
                                  {(item.price * item.quantity).toLocaleString("ru-RU")} UZS
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* ── Comment ── */}
                    {order.comment && (
                      <div className="mx-5 mb-4 flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-100 px-3 py-2.5">
                        <MessageSquare className="size-4 shrink-0 text-amber-500 mt-0.5" />
                        <p className="text-[12px] text-amber-700 font-medium">{order.comment}</p>
                      </div>
                    )}

                    {/* ── Date ── */}
                    <div className="px-5 pb-3 text-[11px] text-slate-400 font-medium">
                      {new Date(order.createdAt).toLocaleDateString("ru-RU", {
                        day: "numeric", month: "long", year: "numeric",
                        hour: "2-digit", minute: "2-digit"
                      })}
                    </div>

                    {/* ── Actions ── */}
                    {(order.status === "PAID" || order.status === "CONFIRMED") && (
                      <div className="border-t border-[#f4f6fa] px-5 py-3 flex flex-wrap gap-2">
                        {order.status === "PAID" && (
                          <>
                            <button
                              disabled={actionLoading === confirmKey}
                              onClick={() => doAction(() => confirmOrder(order.id), confirmKey)}
                              className="flex items-center gap-1.5 rounded-2xl bg-[#1B4D91] px-4 py-2 text-[12px] font-black text-white hover:bg-[#163d73] disabled:opacity-50 transition-colors"
                            >
                              <CheckCircle className="size-3.5" />
                              {actionLoading === confirmKey ? "..." : t("confirm") || "Подтвердить"}
                            </button>
                            <button
                              disabled={actionLoading === cancelKey}
                              onClick={() => doAction(() => cancelOrder(order.id), cancelKey)}
                              className="flex items-center gap-1.5 rounded-2xl border border-[#E31E24]/20 bg-[#E31E24]/5 px-4 py-2 text-[12px] font-black text-[#E31E24] hover:bg-[#E31E24]/10 disabled:opacity-50 transition-colors"
                            >
                              <XCircle className="size-3.5" />
                              {actionLoading === cancelKey ? "..." : t("cancel") || "Отменить"}
                            </button>
                          </>
                        )}
                        {order.status === "CONFIRMED" && (
                          <button
                            disabled={actionLoading === shipKey}
                            onClick={() => doAction(() => shipOrder(order.id), shipKey)}
                            className="flex items-center gap-1.5 rounded-2xl bg-[#6366f1] px-4 py-2 text-[12px] font-black text-white hover:bg-[#4f46e5] disabled:opacity-50 transition-colors"
                          >
                            <Truck className="size-3.5" />
                            {actionLoading === shipKey ? "..." : t("ship") || "Отправить"}
                          </button>
                        )}
                        <div className="flex-1" />
                        <span className="text-[11px] text-slate-400 self-center">
                          <ArrowRight className="size-3 inline mr-1" />
                          {t("actionPrompt") || "Выберите действие"}
                        </span>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}