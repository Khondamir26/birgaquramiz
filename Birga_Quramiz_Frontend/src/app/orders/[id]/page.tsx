"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Package, MapPin, CreditCard, MessageSquare,
  Truck, CheckCircle, Navigation,
} from "lucide-react";
import { getOrderById, payOrder, cancelOrder } from "@/lib/api/orders";
import { useAuth } from "@/hooks/useAuth";
import { useOrderTracking } from "@/hooks/use-order-tracking";
import { ProgressStepper, MilestonesTimeline } from "@/components/tracking/TrackingUI";
import type { MilestoneKey } from "@/lib/tracking";
import { fmtTime } from "@/lib/tracking";
import type { Order, OrderStatus } from "@/types";

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? "";

const STATUS_LABELS: Record<OrderStatus, string> = {
  NEW: "Новый",
  PAID: "Оплачен",
  CONFIRMED: "Подтверждён",
  SHIPPED: "В пути",
  DELIVERED: "Доставлен",
  CANCELLED: "Отменён",
};

const STATUS_HINTS: Record<OrderStatus, string> = {
  NEW: "Ожидает оплаты",
  PAID: "Продавец обрабатывает заказ",
  CONFIRMED: "Готовится к отправке",
  SHIPPED: "Курьер везёт ваш заказ",
  DELIVERED: "Успешно доставлен",
  CANCELLED: "Заказ отменён",
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  NEW: "bg-amber-100 text-amber-800",
  PAID: "bg-blue-100 text-[#1B4D91]",
  CONFIRMED: "bg-purple-100 text-purple-800",
  SHIPPED: "bg-[#1B4D91]/10 text-[#1B4D91]",
  DELIVERED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-50 text-[#E31E24]",
};

const DELIVERY_LABELS: Record<string, string> = {
  DELIVERY: "Доставка",
  PICKUP: "Самовывоз",
};

const PAYMENT_LABELS: Record<string, string> = {
  CASH: "Наличные",
  CARD: "Банковская карта",
  ONLINE: "Онлайн оплата",
};

function TrackingSection({ orderId }: { orderId: string }) {
  const tracking = useOrderTracking(orderId);

  const milestones = Object.fromEntries(
    Object.entries(tracking.stageMilestones)
      .filter(([, v]) => v != null)
      .map(([k, v]) => [k, new Date(v!).getTime()])
  ) as Partial<Record<MilestoneKey, number>>;

  const staticMapUrl =
    tracking.driverLocation && tracking.destinationCoords
      ? [
          "https://maps.googleapis.com/maps/api/staticmap",
          `?size=600x240&scale=2`,
          `&markers=color:0x1B4D91%7C${tracking.driverLocation.lat},${tracking.driverLocation.lng}`,
          `&markers=color:red%7C${tracking.destinationCoords.lat},${tracking.destinationCoords.lng}`,
          `&path=color:0x1B4D91CC|weight:3`,
          `|${tracking.driverLocation.lat},${tracking.driverLocation.lng}`,
          `|${tracking.destinationCoords.lat},${tracking.destinationCoords.lng}`,
          `&key=${MAPS_KEY}`,
        ].join("")
      : null;

  if (tracking.isLoading) {
    return (
      <div className="flex items-center gap-3 py-2">
        <div className="size-4 animate-spin rounded-full border-2 border-[#1B4D91]/20 border-t-[#1B4D91]" />
        <p className="text-[13px] text-slate-500">Загрузка данных о доставке…</p>
      </div>
    );
  }

  if (tracking.notFound || !tracking.status || tracking.status === "CANCELLED") {
    return null;
  }

  const st = tracking.status;
  const isDelivered = st === "DELIVERED";
  const isPending = st === "PENDING";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Truck className="size-4 text-[#1B4D91]" />
        <h2 className="text-[12px] font-black uppercase tracking-[0.14em] text-[#1B4D91]">
          Отслеживание доставки
        </h2>
        {tracking.isLive && (
          <span className="ml-auto flex items-center gap-1.5 text-emerald-600 text-[11px] font-semibold">
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
            </span>
            В сети
          </span>
        )}
      </div>

      {isPending && (
        <div className="flex items-center gap-3 rounded-2xl border border-[#1B4D91]/10 bg-[#1B4D91]/5 px-5 py-4">
          <Truck className="size-4 text-[#1B4D91] animate-pulse" />
          <p className="text-[13px] text-slate-600">Курьер принимает заказ…</p>
        </div>
      )}

      {!isPending && !isDelivered && (
        <ProgressStepper currentStatus={st} />
      )}

      {staticMapUrl && !isDelivered && (
        <div className="rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={staticMapUrl}
            alt="Карта доставки"
            className="w-full object-cover"
            style={{ height: 200 }}
          />
        </div>
      )}

      {!isPending && !isDelivered && (
        <MilestonesTimeline
          milestones={milestones}
          currentStatus={st}
          isNear={tracking.isDriverArriving}
        />
      )}

      {isDelivered && (
        <div className="flex items-center gap-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle className="size-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-[14px] font-black text-emerald-800">Заказ доставлен</p>
            {tracking.driverFirstName && (
              <p className="text-[12px] text-emerald-700">
                Курьер: {tracking.driverFirstName}
                {milestones.DELIVERED ? ` · ${fmtTime(milestones.DELIVERED)}` : ""}
              </p>
            )}
          </div>
        </div>
      )}

      {tracking.eta && !isDelivered && (
        <div className="flex items-center gap-3 rounded-2xl border border-[#1B4D91]/10 bg-[#1B4D91]/5 px-5 py-3">
          <Navigation className="size-4 text-[#1B4D91] shrink-0" />
          <p className="text-[13px] font-bold text-[#1B4D91]">
            Прибудет примерно через{" "}
            <span className="font-black">{tracking.eta.etaMinutes} мин</span>
          </p>
        </div>
      )}

      {tracking.driverFirstName && !isDelivered && (
        <div className="flex items-center gap-4 rounded-3xl bg-white border border-slate-100 shadow-sm px-5 py-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#1B4D91]/10 text-[13px] font-black text-[#1B4D91]">
            {tracking.driverInitials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-slate-800">Курьер: {tracking.driverFirstName}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Проверенный курьер Birga</p>
          </div>
          <Link
            href={`/track/${orderId}`}
            className="shrink-0 text-[12px] font-bold text-[#1B4D91] hover:underline flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            Карта →
          </Link>
        </div>
      )}
    </div>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isAuthenticated, isInitialized } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [localStatus, setLocalStatus] = useState<OrderStatus | null>(null);

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated) { router.push("/login"); return; }
    if (user && user.role !== "USER") {
      router.push(user.role === "ADMIN" ? "/admin" : "/seller/dashboard");
      return;
    }
    getOrderById(id)
      .then((o) => { setOrder(o); setLocalStatus(o.status); })
      .catch(() => setError("Заказ не найден"))
      .finally(() => setLoading(false));
  }, [isInitialized, isAuthenticated, user, id, router]);

  const doAction = async (fn: () => Promise<unknown>, key: string) => {
    setActionLoading(key);
    setActionError("");
    try {
      await fn();
      const updated = await getOrderById(id);
      setOrder(updated);
      setLocalStatus(updated.status);
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setActionLoading(null);
    }
  };

  if (!isInitialized || loading) {
    return (
      <div className="page-shell max-w-2xl space-y-4 pb-32">
        <div className="surface-card h-10 w-32 animate-pulse rounded-full" />
        <div className="surface-card h-36 animate-pulse rounded-[32px]" />
        <div className="surface-card h-48 animate-pulse rounded-[32px]" />
        <div className="surface-card h-32 animate-pulse rounded-[32px]" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="page-shell max-w-2xl">
        <div className="surface-card rounded-[32px] p-10 text-center">
          <Package className="size-12 text-slate-200 mx-auto mb-3" />
          <p className="font-bold text-slate-500">{error ?? "Заказ не найден"}</p>
          <Link href="/orders" className="mt-4 inline-block text-[#1B4D91] text-[14px] font-bold hover:underline">
            ← К моим заказам
          </Link>
        </div>
      </div>
    );
  }

  const currentStatus = localStatus ?? order.status;
  const showTracking = currentStatus === "SHIPPED" || currentStatus === "DELIVERED";

  return (
    <div className="page-shell max-w-2xl space-y-5 pb-32">
      {/* Back */}
      <Link
        href="/orders"
        className="flex items-center gap-2 text-[13px] font-bold text-slate-500 hover:text-[#1B4D91] transition-colors w-fit"
      >
        <ArrowLeft className="size-4" />
        Мои заказы
      </Link>

      {/* Order header */}
      <section className="surface-card rounded-[32px] p-6 md:p-8 shadow-[0_4px_30px_rgb(0,0,0,0.03)] border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
              Заказ <span className="text-[#1B4D91]">#{order.id.slice(0, 8).toUpperCase()}</span>
            </p>
            <p className="text-[13px] text-slate-400 mt-0.5">
              {new Date(order.createdAt).toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            <p className="font-black text-[28px] text-[#E31E24] mt-2">
              {order.total.toLocaleString()} <span className="text-[16px]">сум</span>
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5 self-start">
            <span className={`px-4 py-2 rounded-full text-[12px] font-black uppercase tracking-wider ${STATUS_COLORS[currentStatus]}`}>
              {STATUS_LABELS[currentStatus]}
            </span>
            <p className="text-[11px] text-slate-400 font-medium text-right">
              {STATUS_HINTS[currentStatus]}
            </p>
          </div>
        </div>
      </section>

      {actionError && (
        <div className="bg-red-50 text-[#E31E24] p-4 rounded-xl text-[14px] font-bold border border-red-100">
          {actionError}
        </div>
      )}

      {/* Items */}
      {order.items && order.items.length > 0 && (
        <section className="surface-card rounded-[32px] p-6 md:p-8 shadow-[0_4px_30px_rgb(0,0,0,0.03)] border-slate-100">
          <h2 className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400 mb-4 flex items-center gap-2">
            <Package className="size-3.5" /> Состав заказа
          </h2>
          <div className="space-y-3">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center bg-slate-50 rounded-2xl p-4 border border-slate-100/60"
              >
                <span className="text-[14px] font-bold text-slate-700 truncate mr-4">
                  {item.product?.name ?? item.productId}
                </span>
                <div className="text-right shrink-0">
                  <p className="text-[14px] font-black text-[#1B4D91]">
                    {(item.price * item.quantity).toLocaleString()} сум
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {item.quantity} × {item.price.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
            <div className="flex justify-between items-center pt-3 border-t border-slate-100">
              <span className="text-[13px] font-bold text-slate-500">Итого</span>
              <span className="text-[16px] font-black text-[#E31E24]">
                {order.total.toLocaleString()} сум
              </span>
            </div>
          </div>
        </section>
      )}

      {/* Delivery info */}
      <section className="surface-card rounded-[32px] p-6 md:p-8 shadow-[0_4px_30px_rgb(0,0,0,0.03)] border-slate-100">
        <h2 className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400 mb-4 flex items-center gap-2">
          <MapPin className="size-3.5" /> Детали доставки
        </h2>
        <div className="space-y-3">
          {order.deliveryAddress && (
            <div className="flex items-start gap-3">
              <MapPin className="size-4 text-slate-400 shrink-0 mt-0.5" />
              <p className="text-[14px] text-slate-700">{order.deliveryAddress}</p>
            </div>
          )}
          <div className="flex items-center gap-3">
            <Truck className="size-4 text-slate-400 shrink-0" />
            <p className="text-[14px] text-slate-700">
              {DELIVERY_LABELS[order.deliveryType] ?? order.deliveryType}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <CreditCard className="size-4 text-slate-400 shrink-0" />
            <p className="text-[14px] text-slate-700">
              {PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}
            </p>
          </div>
          {order.comment && (
            <div className="flex items-start gap-3">
              <MessageSquare className="size-4 text-slate-400 shrink-0 mt-0.5" />
              <p className="text-[14px] text-slate-600 italic">&ldquo;{order.comment}&rdquo;</p>
            </div>
          )}
        </div>
      </section>

      {/* Live tracking */}
      {showTracking && (
        <section className="surface-card rounded-[32px] p-6 md:p-8 shadow-[0_4px_30px_rgb(0,0,0,0.03)] border-slate-100">
          <TrackingSection orderId={id} />
        </section>
      )}

      {/* Actions — only pay/cancel; delivery is handled by the driver */}
      {(currentStatus === "NEW" || currentStatus === "PAID") && (
        <section className="flex flex-col sm:flex-row gap-3">
          {currentStatus === "NEW" && (
            <>
              <button
                disabled={actionLoading === "pay"}
                onClick={() => doAction(() => payOrder(id), "pay")}
                className="h-14 flex-1 rounded-full bg-[#E31E24] text-white text-[15px] font-bold hover:bg-[#C91A20] transition-colors shadow-lg shadow-[#E31E24]/20 flex items-center justify-center disabled:opacity-50"
              >
                {actionLoading === "pay" ? "Оплата…" : "Оплатить"}
              </button>
              <button
                disabled={actionLoading === "cancel"}
                onClick={() => doAction(() => cancelOrder(id), "cancel")}
                className="h-14 flex-1 rounded-full border-2 border-slate-200 bg-white text-slate-600 text-[15px] font-bold hover:border-[#E31E24] hover:text-[#E31E24] transition-colors flex items-center justify-center disabled:opacity-50"
              >
                Отменить
              </button>
            </>
          )}
          {currentStatus === "PAID" && (
            <button
              disabled={actionLoading === "cancel"}
              onClick={() => doAction(() => cancelOrder(id), "cancel")}
              className="h-14 flex-1 rounded-full border-2 border-slate-200 bg-white text-slate-600 text-[15px] font-bold hover:border-[#E31E24] hover:text-[#E31E24] transition-colors flex items-center justify-center disabled:opacity-50"
            >
              Отменить заказ
            </button>
          )}
        </section>
      )}
    </div>
  );
}
