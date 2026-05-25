"use client";

import { useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useFetch } from "@/hooks/useFetch";
import { useOrderTracking } from "@/hooks/use-order-tracking";
import LiveRouteMap from "@/components/tracking/LiveRouteMap";
import {
  getAdminOrderDetail, updateAdminOrderStatus, deleteAdminOrder,
} from "@/lib/api/admin";
import { trackingApi } from "@/services/trackingApi";
import { useTrackingStore } from "@/store/trackingStore";
import { DriverStatus } from "@/types/tracking";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types";
import {
  ArrowLeft, ClipboardList, User, Phone, MapPin,
  CreditCard, Package, Truck, Hash, Calendar,
  CheckCircle2, Clock, XCircle, ChevronRight,
  ExternalLink, MessageSquare, ShoppingBag, Trash2,
  UserCheck, ImageIcon, Shield, ChevronDown, ChevronUp, Navigation, Radio,
} from "lucide-react";

// ── Config ────────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<OrderStatus, string> = {
  NEW:       "bg-blue-50 text-blue-700 border-blue-200",
  PAID:      "bg-violet-50 text-violet-700 border-violet-200",
  CONFIRMED: "bg-cyan-50 text-cyan-700 border-cyan-200",
  SHIPPED:   "bg-amber-50 text-amber-700 border-amber-200",
  DELIVERED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-red-50 text-red-600 border-red-200",
};

const STATUS_LABELS: Record<OrderStatus, string> = {
  NEW: "New", PAID: "Paid", CONFIRMED: "Confirmed",
  SHIPPED: "Shipped", DELIVERED: "Delivered", CANCELLED: "Cancelled",
};

const STATUS_FLOW: OrderStatus[] = ["NEW", "CONFIRMED", "SHIPPED", "DELIVERED"];

function fmt(iso: string) {
  return new Date(iso).toLocaleString("ru-RU", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function InfoRow({ icon: Icon, label, value, mono }: {
  icon: React.ElementType; label: string; value: string; mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5 text-[13px]">
      <Icon className="size-3.5 shrink-0 text-slate-400" />
      <span className="text-slate-400 font-medium w-24 shrink-0">{label}</span>
      <span className={cn("font-bold text-slate-700 truncate", mono && "font-mono text-[12px] text-slate-500")}>
        {value}
      </span>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const fetcher = useCallback(() => getAdminOrderDetail(id), [id]);
  const { data: order, loading, error, refetch } = useFetch(fetcher);

  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState("");
  const [timelineOpen, setTimelineOpen] = useState(true);

  const drivers = useTrackingStore((s) => s.drivers);
  const allDrivers = useMemo(() => Object.values(drivers), [drivers]);

  // Rich tracking detail (includes assignment, POD, OTP)
  const trackingFetcher = useCallback(
    () => trackingApi.getOrderDetail(id).catch(() => null),
    [id]
  );
  const { data: trackingOrder, refetch: refetchTracking } = useFetch(trackingFetcher);
  const liveTracking = useOrderTracking(id);

  // Assignment event timeline
  const assignmentId = trackingOrder?.assignment?.id;
  const eventsFetcher = useCallback(
    () => assignmentId ? trackingApi.getAssignmentEvents(assignmentId) : Promise.resolve(null),
    [assignmentId]
  );
  const { data: assignmentEvents } = useFetch(eventsFetcher);

  const handleAssign = async (driverId: string) => {
    setAssignLoading(true);
    setAssignError("");
    try {
      await trackingApi.createAssignment(id, driverId);
      setAssignOpen(false);
      refetch();
      void refetchTracking();
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : "Failed to assign driver");
    } finally {
      setAssignLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this order permanently? This cannot be undone.")) return;
    setDeleteLoading(true);
    try {
      await deleteAdminOrder(id);
      router.push("/admin/orders");
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : "Failed to delete order");
      setDeleteLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!order || order.status === newStatus) return;
    setStatusLoading(true);
    setStatusError("");
    try {
      await updateAdminOrderStatus(id, newStatus);
      refetch();
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setStatusLoading(false);
    }
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex flex-col flex-1 pb-12">
        <div className="mx-auto w-full max-w-[1440px] px-4 pt-4 md:px-7 md:pt-7 flex flex-col gap-4">
          <div className="h-8 w-32 animate-pulse rounded-xl bg-white" />
          <div className="grid md:grid-cols-[1fr_380px] gap-4">
            <div className="flex flex-col gap-4">
              <div className="h-40 animate-pulse rounded-2xl bg-white" />
              <div className="h-56 animate-pulse rounded-2xl bg-white" />
            </div>
            <div className="flex flex-col gap-4">
              <div className="h-40 animate-pulse rounded-2xl bg-white" />
              <div className="h-32 animate-pulse rounded-2xl bg-white" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col flex-1 pb-12">
        <div className="mx-auto w-full max-w-[1440px] px-4 pt-4 md:px-7 md:pt-7 flex flex-col gap-4">
          <button
            onClick={() => router.push("/admin/orders")}
            className="flex items-center gap-2 text-[13px] font-bold text-[#1B4D91] hover:underline w-fit"
          >
            <ArrowLeft className="size-4" /> Back to orders
          </button>
          <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-[13px] font-medium text-red-600">
            {error ?? "Order not found"}
          </div>
        </div>
      </div>
    );
  }

  const deliveryLabel = order.deliveryType === "DELIVERY" ? "Delivery" : "Pickup";
  const paymentLabel = { CASH: "Cash", CARD: "Card", TRANSFER: "Transfer" }[order.paymentMethod] ?? order.paymentMethod;

  return (
    <div className="flex flex-col flex-1 pb-12">
      <div className="mx-auto w-full max-w-[1440px] px-4 pt-4 md:px-7 md:pt-7 flex flex-col gap-4">

        {/* ── Back + title ── */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <button
            onClick={() => router.push("/admin/orders")}
            className="flex items-center gap-2 text-[13px] font-bold text-[#1B4D91] hover:underline"
          >
            <ArrowLeft className="size-4" /> Orders
          </button>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-slate-400">#{id.toUpperCase()}</span>
            {order.status === "NEW" && !trackingOrder?.assignment && (
              <button
                onClick={() => void handleDelete()}
                disabled={deleteLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 text-red-600 text-[12px] font-bold hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                <Trash2 className="size-3.5" />
                {deleteLoading ? "Deleting..." : "Delete untouched order"}
              </button>
            )}
          </div>
        </div>

        {/* ── Header card ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#1B4D91]/10">
                <ClipboardList className="size-5 text-[#1B4D91]" />
              </div>
              <div>
                <p className="text-[20px] font-black text-[#1B4D91] leading-none">
                  {order.total.toLocaleString("ru-RU")} UZS
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">{fmt(order.createdAt)}</p>
              </div>
            </div>
            <span className={cn("inline-flex items-center px-3 py-1 rounded-full text-[12px] font-bold border", STATUS_COLORS[order.status])}>
              {STATUS_LABELS[order.status]}
            </span>
          </div>

          {/* Status flow */}
          <div className="mt-5 flex items-center gap-1 overflow-x-auto pb-1">
            {STATUS_FLOW.map((s, i) => {
              const idx = STATUS_FLOW.indexOf(order.status);
              const done = i < idx;
              const current = s === order.status;
              const cancelled = order.status === "CANCELLED";
              return (
                <div key={s} className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => void handleStatusChange(s)}
                    disabled={statusLoading || current}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all",
                      cancelled ? "bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100"
                        : done ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                        : current ? "bg-[#1B4D91] border-[#1B4D91] text-white shadow-sm cursor-default"
                        : "bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100"
                    )}
                  >
                    {done ? <CheckCircle2 className="size-3" /> : current ? <Clock className="size-3" /> : null}
                    {STATUS_LABELS[s]}
                  </button>
                  {i < STATUS_FLOW.length - 1 && (
                    <ChevronRight className="size-3 text-slate-300 shrink-0" />
                  )}
                </div>
              );
            })}
            <button
              onClick={() => void handleStatusChange("CANCELLED")}
              disabled={statusLoading || order.status === "CANCELLED"}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all ml-2",
                order.status === "CANCELLED"
                  ? "bg-red-50 border-red-200 text-red-600 cursor-default"
                  : "bg-slate-50 border-slate-200 text-slate-400 hover:bg-red-50 hover:border-red-200 hover:text-red-600"
              )}
            >
              <XCircle className="size-3" /> Cancel
            </button>
          </div>

          {statusError && (
            <p className="mt-2 text-[12px] font-medium text-red-500">{statusError}</p>
          )}
        </div>

        {/* ── Main 2-col ── */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">

          {/* LEFT: Items + Customer ── */}
          <div className="flex flex-col gap-4">

            {/* Order items */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-50 flex items-center gap-2">
                <ShoppingBag className="size-4 text-[#1B4D91]" />
                <p className="text-[12px] font-black uppercase tracking-wider text-slate-500">
                  Items ({order.items?.length ?? 0})
                </p>
              </div>
              {!order.items || order.items.length === 0 ? (
                <div className="px-5 py-8 text-center text-[13px] text-slate-400 font-medium">No items data</div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                      {item.product?.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name ?? ""}
                          className="size-12 rounded-xl object-cover border border-slate-100 shrink-0"
                        />
                      ) : (
                        <div className="size-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                          <Package className="size-5 text-slate-300" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-slate-700 truncate">
                          {item.product?.name ?? item.productId.slice(0, 12)}
                        </p>
                        {item.product?.seller && (
                          <Link
                            href={`/admin/sellers/${item.product.seller.id}`}
                            className="text-[11px] text-[#1B4D91]/60 hover:text-[#1B4D91] font-medium transition-colors"
                          >
                            {item.product.seller.company}
                          </Link>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[13px] font-black text-slate-700">
                          {(item.price * item.quantity).toLocaleString("ru-RU")} UZS
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {item.price.toLocaleString("ru-RU")} × {item.quantity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                <span className="text-[12px] font-bold text-slate-500">Total</span>
                <span className="text-[16px] font-black text-[#1B4D91]">
                  {order.total.toLocaleString("ru-RU")} UZS
                </span>
              </div>
            </div>

            {/* Customer account (if registered) */}
            {order.user && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <User className="size-4 text-[#1B4D91]" />
                  <p className="text-[12px] font-black uppercase tracking-wider text-slate-500">Account</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#1B4D91]/10">
                    <User className="size-5 text-[#1B4D91]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-black text-slate-700">{order.user.name}</p>
                    <p className="text-[12px] text-slate-400">{order.user.phone}</p>
                  </div>
                  <Link
                    href={`/admin/users/${order.user.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#1B4D91]/20 text-[12px] font-bold text-[#1B4D91] hover:bg-[#1B4D91]/5 transition-colors"
                  >
                    View <ExternalLink className="size-3" />
                  </Link>
                </div>
              </div>
            )}

            {/* Comment */}
            {order.comment && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="size-4 text-slate-400" />
                  <p className="text-[12px] font-black uppercase tracking-wider text-slate-500">Comment</p>
                </div>
                <p className="text-[13px] text-slate-600 font-medium leading-relaxed">{order.comment}</p>
              </div>
            )}
          </div>

          {/* RIGHT: Delivery + Tracking ── */}
          <div className="flex flex-col gap-4">

            {/* Delivery + payment */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <Truck className="size-4 text-[#1B4D91]" />
                <p className="text-[12px] font-black uppercase tracking-wider text-slate-500">Delivery & Payment</p>
              </div>
              <div className="flex flex-col gap-3">
                <InfoRow icon={User}       label="Customer"  value={order.customerName} />
                <InfoRow icon={Phone}      label="Phone"     value={order.customerPhone} />
                <InfoRow icon={Truck}      label="Type"      value={deliveryLabel} />
                {order.deliveryAddress && (
                  <InfoRow icon={MapPin}   label="Address"   value={order.deliveryAddress} />
                )}
                <InfoRow icon={CreditCard} label="Payment"   value={paymentLabel} />
                <InfoRow icon={Hash}       label="Order ID"  value={id.toUpperCase()} mono />
                <InfoRow icon={Calendar}   label="Created"   value={fmt(order.createdAt)} />
              </div>
            </div>

            {order.deliveryType === "DELIVERY" && (
              <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <div className="flex items-center gap-2">
                    <Navigation className="size-4 text-[#1B4D91]" />
                    <div>
                      <p className="text-[12px] font-black uppercase tracking-wider text-slate-600">Delivery Route</p>
                      <p className="text-[11px] text-slate-400">Driver position and route to destination</p>
                    </div>
                  </div>
                  {liveTracking.isLive && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                      <Radio className="size-3" /> Live
                    </span>
                  )}
                </div>
                {liveTracking.driverLocation && liveTracking.destinationCoords ? (
                  <>
                    <LiveRouteMap
                      driverLocation={liveTracking.driverLocation}
                      destinationCoords={liveTracking.destinationCoords}
                      className="h-[300px] w-full"
                    />
                    <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-slate-100 px-5 py-3 text-[12px]">
                      <span className="font-bold text-slate-700">
                        {liveTracking.eta ? `${liveTracking.eta.etaMinutes} min ETA` : "ETA calculating"}
                      </span>
                      <span className="text-slate-400">
                        Driver: {liveTracking.driverFirstName || trackingOrder?.assignment?.driver?.name || "Assigned"}
                      </span>
                      <span className="text-slate-400">
                        Stage: {liveTracking.status?.replace(/_/g, " ") ?? trackingOrder?.assignment?.status ?? "Assigned"}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex min-h-40 flex-col items-center justify-center gap-2 px-6 py-10 text-center">
                    <MapPin className="size-7 text-slate-300" />
                    <p className="text-[13px] font-bold text-slate-600">
                      {trackingOrder?.assignment ? "Waiting for a live route signal" : "No driver assigned yet"}
                    </p>
                    <p className="max-w-xs text-[12px] text-slate-400">
                      {trackingOrder?.assignment
                        ? "The map appears when the driver accepts the assignment and shares a location."
                        : "Assign an available driver to begin route tracking."}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Assign driver (only when CONFIRMED + no assignment) */}
            {order.status === "CONFIRMED" && !trackingOrder?.assignment && (
              <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-3">
                  <UserCheck className="size-4 text-amber-500" />
                  <p className="text-[12px] font-black uppercase tracking-wider text-slate-500">Assign Driver</p>
                </div>
                <p className="text-[12px] text-slate-400 mb-3">Order is confirmed and ready for delivery assignment.</p>
                <button
                  onClick={() => setAssignOpen((o) => !o)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1B4D91] text-white text-[12px] font-bold hover:bg-[#163d7a] transition-colors"
                >
                  <Truck className="size-3.5" />
                  {assignOpen ? "Hide Drivers" : "Choose Driver"}
                  {assignOpen ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                </button>
                {assignOpen && (
                  <div className="mt-3 flex flex-col gap-1.5 max-h-64 overflow-y-auto">
                    {allDrivers.filter((d) => d.status === DriverStatus.ONLINE).length === 0 && (
                      <p className="text-[12px] text-slate-400 text-center py-4">No online drivers available</p>
                    )}
                    {allDrivers
                      .filter((d) => d.status === DriverStatus.ONLINE)
                      .map((driver) => (
                        <button
                          key={driver.id}
                          onClick={() => void handleAssign(driver.id)}
                          disabled={assignLoading}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-slate-200 hover:border-[#1B4D91]/30 hover:bg-[#1B4D91]/5 transition-all text-left disabled:opacity-50"
                        >
                          <div className="relative shrink-0">
                            <div className="flex size-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 font-black text-[12px]">
                              {driver.name.charAt(0)}
                            </div>
                            <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-emerald-400 border border-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-bold text-slate-700 truncate">{driver.name}</p>
                            <p className="text-[10px] text-slate-400">{driver.assignmentsToday} deliveries today</p>
                          </div>
                        </button>
                      ))}
                    {assignError && <p className="text-[11px] text-red-500 mt-1">{assignError}</p>}
                  </div>
                )}
              </div>
            )}

            {/* Driver + assignment info */}
            {trackingOrder?.assignment && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Truck className="size-4 text-[#1B4D91]" />
                  <p className="text-[12px] font-black uppercase tracking-wider text-slate-500">Driver</p>
                  <span className={cn(
                    "ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold",
                    trackingOrder.assignment.status === "DELIVERED" ? "bg-emerald-50 text-emerald-700"
                    : trackingOrder.assignment.status === "PICKED_UP" ? "bg-purple-50 text-purple-700"
                    : trackingOrder.assignment.status === "ACCEPTED"  ? "bg-blue-50 text-blue-700"
                    : trackingOrder.assignment.status === "CANCELLED" ? "bg-red-50 text-red-600"
                    : "bg-amber-50 text-amber-700"
                  )}>
                    {trackingOrder.assignment.status}
                  </span>
                </div>
                {trackingOrder.assignment.driver && (
                  <Link
                    href={`/admin/drivers/${trackingOrder.assignment.driverId}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-[#1B4D91]/5 transition-colors group mb-3"
                  >
                    <div className="flex size-8 items-center justify-center rounded-full bg-[#1B4D91]/10 text-[#1B4D91] font-black text-[12px] shrink-0">
                      {trackingOrder.assignment.driver.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold text-slate-700">{trackingOrder.assignment.driver.name}</p>
                      <p className="text-[11px] text-slate-400">{trackingOrder.assignment.driver.phone}</p>
                    </div>
                    <ExternalLink className="size-3.5 text-slate-300 group-hover:text-[#1B4D91]" />
                  </Link>
                )}
                <div className="flex flex-col gap-1.5 text-[12px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">OTP Verified</span>
                    <span className={cn("font-bold", trackingOrder.assignment.otpVerified ? "text-emerald-600" : "text-slate-400")}>
                      {trackingOrder.assignment.otpVerified
                        ? <span className="flex items-center gap-1"><CheckCircle2 className="size-3" /> Yes</span>
                        : <span className="flex items-center gap-1"><XCircle className="size-3" /> No</span>
                      }
                    </span>
                  </div>
                  {trackingOrder.assignment.podPhotoUrl && (
                    <div className="mt-2">
                      <p className="text-[11px] font-bold text-slate-400 mb-1.5 flex items-center gap-1">
                        <ImageIcon className="size-3" /> Proof of Delivery
                      </p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={trackingOrder.assignment.podPhotoUrl}
                        alt="POD"
                        className="w-full rounded-xl object-cover border border-slate-100 max-h-48"
                      />
                      {trackingOrder.assignment.podPhotoAt && (
                        <p className="text-[10px] text-slate-400 mt-1">{fmt(trackingOrder.assignment.podPhotoAt)}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Assignment event timeline */}
            {assignmentEvents && assignmentEvents.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <button
                  onClick={() => setTimelineOpen((o) => !o)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Shield className="size-4 text-[#1B4D91]" />
                    <p className="text-[13px] font-black text-slate-700">Event Timeline</p>
                    <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">
                      {assignmentEvents.length}
                    </span>
                  </div>
                  {timelineOpen ? <ChevronUp className="size-4 text-slate-400" /> : <ChevronDown className="size-4 text-slate-400" />}
                </button>
                {timelineOpen && (
                  <div className="px-5 pb-4 flex flex-col gap-0">
                    {assignmentEvents.map((ev, i) => (
                      <div key={ev.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={cn(
                            "flex size-6 shrink-0 items-center justify-center rounded-full text-white mt-0.5",
                            ev.event === "DELIVERED"    ? "bg-emerald-500"
                            : ev.event === "CANCELLED" ? "bg-red-400"
                            : ev.event === "OTP_VERIFIED" || ev.event === "POD_UPLOADED" ? "bg-purple-500"
                            : "bg-[#1B4D91]"
                          )}>
                            <span className="text-[9px] font-black">{i + 1}</span>
                          </div>
                          {i < assignmentEvents.length - 1 && (
                            <div className="w-px flex-1 bg-slate-100 my-1" />
                          )}
                        </div>
                        <div className="pb-3 flex-1 min-w-0">
                          <p className="text-[12px] font-black text-slate-700">{ev.event.replace(/_/g, " ")}</p>
                          {ev.note && <p className="text-[11px] text-slate-400 mt-0.5 truncate">{ev.note}</p>}
                          <p className="text-[10px] text-slate-300 mt-0.5">{fmt(ev.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
