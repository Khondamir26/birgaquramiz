"use client";

import { useQuery } from "@tanstack/react-query";
import { trackingApi } from "@/services/trackingApi";
import { useT } from "@/store/dispatcherLocaleStore";
import { format } from "date-fns";
import {
  X,
  Phone,
  MapPin,
  Package,
  CreditCard,
  Banknote,
  ArrowLeftRight,
  Truck,
  ShoppingBag,
  MessageSquare,
  Hash,
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs));
}

const STATUS_PILL: Record<string, string> = {
  NEW:       "bg-slate-100  text-slate-600",
  PAID:      "bg-blue-100   text-blue-700",
  CONFIRMED: "bg-violet-100 text-violet-700",
  SHIPPED:   "bg-amber-100  text-amber-700",
  DELIVERED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-red-100    text-red-600",
};

interface Props {
  orderId: string;
  onClose: () => void;
}

export default function OrderDetailPanel({ orderId, onClose }: Props) {
  const t = useT();

  const { data: order, isLoading } = useQuery({
    queryKey: ["dispatcher-order-detail", orderId],
    queryFn:  () => trackingApi.getOrderDetail(orderId),
    staleTime: 60_000,
    enabled:  !!orderId,
  });

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-lg bg-[#1B4D91]/10">
            <Package className="size-3.5 text-[#1B4D91]" />
          </div>
          <div>
            <h2 className="text-[13px] font-black text-slate-800">{t.order_detail_title}</h2>
            {order && (
              <p className="text-[10px] text-slate-400">
                {t.order_detail_id} #{order.id.slice(-8).toUpperCase()}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close order detail"
          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col gap-3 px-4 py-4">
            <p className="text-[11px] text-slate-400 animate-pulse">{t.order_detail_loading}</p>
            {[80, 120, 60, 100].map((w, i) => (
              <div key={i} className={`h-4 animate-pulse rounded bg-slate-100`} style={{ width: `${w}%` }} />
            ))}
          </div>
        ) : order ? (
          <>
            {/* Status + date */}
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-bold", STATUS_PILL[order.status] ?? "bg-slate-100 text-slate-600")}>
                {t.order_detail_status(order.status)}
              </span>
              <span className="text-[10px] text-slate-400">
                {format(new Date(order.createdAt), "dd.MM.yyyy HH:mm")}
              </span>
            </div>

            {/* Customer info */}
            <section className="border-b border-slate-100 px-4 py-3">
              <p className="mb-2 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400">
                <Hash className="size-2.5" />
                {t.order_detail_customer}
              </p>
              <p className="text-[13px] font-bold text-slate-800">{order.customerName}</p>
              <a
                href={`tel:${order.customerPhone}`}
                className="mt-1 flex items-center gap-1.5 text-[11px] text-[#1B4D91] hover:underline"
              >
                <Phone className="size-3 shrink-0" />
                {order.customerPhone}
              </a>
              {order.deliveryAddress && (
                <p className="mt-1 flex items-start gap-1.5 text-[11px] text-slate-500">
                  <MapPin className="mt-0.5 size-3 shrink-0 text-slate-400" />
                  {order.deliveryAddress}
                </p>
              )}
            </section>

            {/* Order items */}
            <section className="border-b border-slate-100 px-4 py-3">
              <p className="mb-2 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400">
                <ShoppingBag className="size-2.5" />
                {t.order_detail_goods}
              </p>
              {order.items && order.items.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-semibold text-slate-700">
                          {item.product?.name ?? `#${item.productId.slice(-6)}`}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {item.quantity} {t.order_detail_qty} × {item.price.toLocaleString()} сум
                        </p>
                      </div>
                      <span className="shrink-0 text-[11px] font-bold text-slate-700">
                        {(item.quantity * item.price).toLocaleString()} сум
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-slate-400">{t.order_detail_no_items}</p>
              )}
            </section>

            {/* Payment & delivery */}
            <section className="border-b border-slate-100 px-4 py-3">
              <p className="mb-2 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400">
                <CreditCard className="size-2.5" />
                {t.order_detail_payment}
              </p>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-[11px] text-slate-600">
                  {order.deliveryType === "DELIVERY"
                    ? <Truck className="size-3 shrink-0 text-slate-400" />
                    : <ShoppingBag className="size-3 shrink-0 text-slate-400" />
                  }
                  {order.deliveryType === "DELIVERY" ? t.order_detail_home : t.order_detail_pickup}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-600">
                  {order.paymentMethod === "CASH"
                    ? <Banknote className="size-3 shrink-0 text-slate-400" />
                    : order.paymentMethod === "TRANSFER"
                    ? <ArrowLeftRight className="size-3 shrink-0 text-slate-400" />
                    : <CreditCard className="size-3 shrink-0 text-slate-400" />
                  }
                  {order.paymentMethod === "CASH"   ? t.order_detail_cash :
                   order.paymentMethod === "CARD"   ? t.order_detail_card :
                                                      t.order_detail_transfer}
                </div>
              </div>
            </section>

            {/* Comment */}
            {order.comment && (
              <section className="border-b border-slate-100 px-4 py-3">
                <p className="mb-1.5 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400">
                  <MessageSquare className="size-2.5" />
                  {t.order_detail_comment}
                </p>
                <p className="text-[11px] leading-relaxed text-slate-600">{order.comment}</p>
              </section>
            )}

            {/* Total */}
            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="text-[12px] font-bold text-slate-500">{t.order_detail_total_label}</span>
              <span className="text-[18px] font-black text-[#1B4D91]">
                {order.total.toLocaleString()} сум
              </span>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
