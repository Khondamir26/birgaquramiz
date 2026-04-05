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

type StatusCfg = { label: string; icon: typeof CheckCircle; color: string; bg: string; border: string };
type StatusConfigMap = Record<OrderStatus, StatusCfg>;

export default function SellerOrdersPage() {
  const { user, isAuthenticated, isInitialized } = useAuth();
  const router = useRouter();
  const t = useTranslations("SellerOrders");

  const STATUS_CONFIG: StatusConfigMap = {
    NEW: { label: t("statusNew"), icon: Clock, color: "#f59e0b", bg: "#fef3c7", border: "#fde68a" },
    PAID: { label: t("statusPaid"), icon: AlertCircle, color: "#3b82f6", bg: "#dbeafe", border: "#bfdbfe" },
    CONFIRMED: { label: t("statusConfirmed"), icon: CheckCircle, color: "#8b5cf6", bg: "#ede9fe", border: "#ddd6fe" },
    SHIPPED: { label: t("statusShipped"), icon: Truck, color: "#6366f1", bg: "#e0e7ff", border: "#c7d2fe" },
    DELIVERED: { label: t("statusDelivered"), icon: CheckCircle, color: "#10b981", bg: "#d1fae5", border: "#a7f3d0" },
    CANCELLED: { label: t("statusCancelled"), icon: XCircle, color: "#ef4444", bg: "#fee2e2", border: "#fecaca" },
  };

  const DELIVERY_LABELS: Record<string, string> = {
    PICKUP: t("deliveryPickup"),
    DELIVERY: t("deliveryHome"),
  };

  const PAYMENT_LABELS: Record<string, string> = {
    CASH: t("paymentCash"),
    CARD: t("paymentCard"),
    TRANSFER: t("paymentTransfer"),
  };

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated) { router.push("/login"); return; }
    if (user && user.role !== "SELLER") router.push("/");
  }, [user, isAuthenticated, isInitialized, router]);

  const { data, loading, error, refetch } = useFetch(() => getSellerOrders());
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"ALL" | "NEED_ACTION" | "ACTIVE" | "DELIVERED" | "CANCELLED">("ALL");

  const doAction = async (fn: () => Promise<unknown>, key: string) => {
    setActionLoading(key);
    try { await fn(); refetch(); } finally { setActionLoading(null); }
  };

  // ── Loading skeleton ──
  if (!isInitialized || loading || (isAuthenticated && !user)) {
    return (
      <div className="flex flex-col min-h-screen bg-[#f4f6fa] pb-28 md:pb-12">
        <div className="mx-auto w-full md:max-w-[1488px]">
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
        <div className="mx-auto w-full md:max-w-[1488px] px-4 md:px-6 pt-4 md:pt-6">
          <div className="rounded-3xl border border-[#E31E24]/20 bg-[#E31E24]/5 p-6 text-[13px] font-semibold text-[#E31E24]">
            {t("loadError") || "Ошибка загрузки заказов"}: {error}
          </div>
        </div>
      </div>
    );
  }

  const allOrders: Order[] = data?.data ?? [];

  const needActionCount = allOrders.filter((o) => o.status === "NEW" || o.status === "PAID").length;
  const activeCount = allOrders.filter((o) => o.status === "CONFIRMED" || o.status === "SHIPPED").length;
  const deliveredCount = allOrders.filter((o) => o.status === "DELIVERED").length;
  const cancelledCount = allOrders.filter((o) => o.status === "CANCELLED").length;

  const orders: Order[] = activeTab === "ALL" ? allOrders
    : activeTab === "NEED_ACTION" ? allOrders.filter((o) => o.status === "NEW" || o.status === "PAID")
    : activeTab === "ACTIVE" ? allOrders.filter((o) => o.status === "CONFIRMED" || o.status === "SHIPPED")
    : activeTab === "DELIVERED" ? allOrders.filter((o) => o.status === "DELIVERED")
    : allOrders.filter((o) => o.status === "CANCELLED");

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f6fa] pb-28 md:pb-12">
      <div className="mx-auto w-full md:max-w-[1488px]">
        <div className="mx-auto flex flex-col gap-5 px-4 md:px-6 max-w-md md:max-w-none pt-4 md:pt-6">

          {/* Hero */}
          <div className="rounded-3xl bg-[#1B4D91] px-6 py-7 md:px-10 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/50 mb-1">Birga Quramiz</p>
              <h1 className="text-xl font-black text-white md:text-2xl">{t("title")}</h1>
              <p className="mt-1 text-[13px] text-white/70">{allOrders.length} {t("ordersTotal")}</p>
            </div>
            <button
              onClick={() => refetch()}
              className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-colors"
              title={t("refresh")}
            >
              <RefreshCw className="size-5" />
            </button>
          </div>

          {/* ── Status filter tabs ── */}
          {allOrders.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-0.5 hide-scrollbar">
              {([
                { key: "ALL", label: t("filterAll"), count: allOrders.length },
                { key: "NEED_ACTION", label: t("filterNeedAction"), count: needActionCount, accent: needActionCount > 0 },
                { key: "ACTIVE", label: t("filterActive"), count: activeCount },
                { key: "DELIVERED", label: t("filterDelivered"), count: deliveredCount },
                { key: "CANCELLED", label: t("filterCancelled"), count: cancelledCount },
              ] as const).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-2xl px-4 py-2.5 text-[12px] font-black transition-all ${
                    activeTab === tab.key
                      ? "bg-[#1B4D91] text-white shadow-sm"
                      : "bg-white border border-slate-100 text-slate-500 hover:border-[#1B4D91]/20 hover:text-[#1B4D91]"
                  }`}
                >
                  {tab.label}
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${
                    activeTab === tab.key
                      ? "bg-white/20 text-white"
                      : ("accent" in tab && tab.accent)
                        ? "bg-amber-100 text-amber-700"
                        : "bg-slate-100 text-slate-500"
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          )}

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
                                {item.product?.name ?? `Товар #${item.productId}`}
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
                        {order.status === "CONFIRMED" && order.deliveryType === "PICKUP" && (
                          <button
                            disabled={actionLoading === shipKey}
                            onClick={() => doAction(() => shipOrder(order.id), shipKey)}
                            className="flex items-center gap-1.5 rounded-2xl bg-[#6366f1] px-4 py-2 text-[12px] font-black text-white hover:bg-[#4f46e5] disabled:opacity-50 transition-colors"
                          >
                            <Truck className="size-3.5" />
                            {actionLoading === shipKey ? "..." : t("ship") || "Отправить"}
                          </button>
                        )}
                        {order.status === "CONFIRMED" && order.deliveryType === "DELIVERY" && (
                          <span className="flex items-center gap-1.5 rounded-2xl bg-slate-100 px-4 py-2 text-[12px] font-semibold text-slate-400">
                            <Truck className="size-3.5" />
                            Передано диспетчеру
                          </span>
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
