"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTrackingStore } from "@/store/trackingStore";
import { DriverStatus } from "@/types/tracking";
import { ORDER_CREATED, ORDER_UNASSIGNED } from "@/types/tracking";
import { getSocket } from "@/lib/tracking/socket";
import { queryKeys } from "@/lib/tracking/queryKeys";
import { trackingApi, type AssignableOrder } from "@/services/trackingApi";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow } from "date-fns";
import { OrderCardSkeleton } from "@/components/dispatcher/ui/Skeleton";
import { EmptyState } from "@/components/dispatcher/ui/EmptyState";
import {
  Package,
  MapPin,
  Phone,
  Check,
  Clock,
  AlertTriangle,
  ChevronRight,
  User,
  Truck,
  X,
  RefreshCcw,
  Loader2,
  WifiOff,
} from "lucide-react";

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs));
}

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Something went wrong";
}

interface Props {
  selectedDriverId: string | null;
}

function waitMinutes(createdAt: string): number {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 60_000);
}

type Tier = "normal" | "amber" | "red";

function urgencyTier(mins: number): Tier {
  if (mins >= 30) return "red";
  if (mins >= 15) return "amber";
  return "normal";
}

const LEFT_BORDER: Record<Tier, string> = {
  normal: "border-l-slate-200",
  amber:  "border-l-amber-400",
  red:    "border-l-red-500",
};

const PACKAGE_BG: Record<Tier, string> = {
  normal: "bg-slate-50",
  amber:  "bg-amber-50",
  red:    "bg-red-50",
};

const PACKAGE_ICON: Record<Tier, string> = {
  normal: "text-slate-400",
  amber:  "text-amber-500",
  red:    "text-red-400",
};

function OrderCard({
  order,
  selectedDriverId,
  onAssign,
  isAssigning,
}: {
  order:            AssignableOrder;
  selectedDriverId: string | null;
  onAssign:         (orderId: string, note: string) => Promise<void>;
  isAssigning:      boolean;
}) {
  const { drivers } = useTrackingStore();
  const selectedDriver = selectedDriverId ? drivers[selectedDriverId] : null;

  const [expanded, setExpanded] = useState(false);
  const [note,     setNote]     = useState("");
  const [success,  setSuccess]  = useState(false);

  const mins = waitMinutes(order.createdAt);
  const tier = urgencyTier(mins);

  const handleConfirm = async () => {
    try {
      await onAssign(order.id, note);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2_200);
      setExpanded(false);
      setNote("");
    } catch {
      setExpanded(false);
      setNote("");
    }
  };

  if (success) {
    return (
      <div className="flex items-center gap-3 border-b border-slate-50 bg-emerald-50 px-4 py-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-100">
          <Check className="size-4 text-emerald-600" />
        </div>
        <div>
          <p className="text-[13px] font-bold text-emerald-700">Assigned!</p>
          <p className="text-[11px] text-emerald-500">
            {selectedDriver?.name ?? "Driver"} received the order
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("border-b border-slate-50 border-l-2 transition-all", LEFT_BORDER[tier])}>
      <div className="flex items-start gap-2.5 px-4 py-3">
        <div className={cn("mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg", PACKAGE_BG[tier])}>
          <Package className={cn("size-3.5", PACKAGE_ICON[tier])} aria-hidden />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-1.5">
            <span className="truncate text-[13px] font-bold leading-tight text-slate-800">
              {order.customerName}
            </span>
            <span className="shrink-0 text-[12px] font-black text-[#1B4D91]">
              {order.total.toLocaleString()} sum
            </span>
          </div>

          <div className="mt-1 flex items-start gap-1">
            <MapPin className="mt-0.5 size-3 shrink-0 text-slate-400" aria-hidden />
            <p className="truncate text-[11px] leading-tight text-slate-500">
              {order.deliveryAddress ?? "—"}
            </p>
          </div>

          <div className="mt-0.5 flex items-center gap-1">
            <Phone className="size-3 shrink-0 text-slate-400" aria-hidden />
            <p className="text-[11px] text-slate-400">{order.customerPhone}</p>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
              {order._count.items} items
            </span>

            {tier === "red" ? (
              <span className="flex items-center gap-0.5 rounded-full border border-red-200 bg-red-50 px-1.5 py-0.5 text-[10px] font-black text-red-600">
                <AlertTriangle className="size-2.5" aria-hidden />
                {mins}m waiting
              </span>
            ) : tier === "amber" ? (
              <span className="flex items-center gap-0.5 rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                <Clock className="size-2.5" aria-hidden />
                {mins}m
              </span>
            ) : (
              <span className="text-[10px] text-slate-400">
                {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
              </span>
            )}
          </div>
        </div>
      </div>

      {expanded ? (
        <div className="border-t border-slate-50 bg-slate-50/70 px-4 pb-3 pt-2.5">
          {selectedDriver ? (
            <div className="mb-2.5 flex items-center gap-2.5 rounded-lg border border-slate-100 bg-white px-3 py-2">
              <div
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-black",
                  selectedDriver.status === DriverStatus.ON_DELIVERY
                    ? "bg-blue-100 text-blue-700"
                    : "bg-emerald-100 text-emerald-700"
                )}
                aria-hidden
              >
                {initials(selectedDriver.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-bold text-slate-800">{selectedDriver.name}</p>
                <p className="text-[10px] text-slate-500">
                  {selectedDriver.status === DriverStatus.ONLINE ? "Available" : "On delivery"}
                  {selectedDriver.assignmentsToday > 0 ? ` · ${selectedDriver.assignmentsToday} today` : ""}
                </p>
              </div>
              <Truck className="size-3.5 shrink-0 text-slate-300" aria-hidden />
            </div>
          ) : (
            <div className="mb-2.5 flex items-center gap-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2">
              <AlertTriangle className="size-3.5 text-amber-500" aria-hidden />
              <p className="text-[11px] text-amber-700">Select a driver from the left panel</p>
            </div>
          )}

          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note for driver (optional)"
            aria-label="Note for driver"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[12px] outline-none transition focus:border-[#1B4D91] focus:ring-2 focus:ring-[#1B4D91]/10"
          />

          <div className="mt-2 flex gap-2">
            <button
              onClick={() => void handleConfirm()}
              disabled={!selectedDriverId || isAssigning}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#1B4D91] py-2 text-[12px] font-bold text-white transition hover:bg-[#163b92] disabled:opacity-40"
            >
              {isAssigning
                ? <Loader2 className="size-3.5 animate-spin" aria-hidden />
                : <Check className="size-3.5" aria-hidden />}
              {isAssigning ? "Assigning…" : "Assign"}
            </button>
            <button
              onClick={() => { setExpanded(false); setNote(""); }}
              disabled={isAssigning}
              aria-label="Cancel"
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-500 transition hover:bg-slate-50 disabled:opacity-40"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setExpanded(true)}
          disabled={!selectedDriverId}
          className={cn(
            "flex w-full items-center justify-between border-t border-slate-50 px-4 py-2 text-[12px] font-bold transition hover:bg-slate-50 disabled:cursor-not-allowed",
            selectedDriverId ? "text-[#1B4D91]" : "text-slate-300"
          )}
        >
          <span>Assign driver</span>
          <ChevronRight className="size-3.5" aria-hidden />
        </button>
      )}
    </div>
  );
}

export default function OrderPanel({ selectedDriverId }: Props) {
  const qc = useQueryClient();

  const [newFlash,     setNewFlash]     = useState(false);
  const [assignErrMsg, setAssignErrMsg] = useState<string | null>(null);
  const prevCountRef                    = useRef(0);

  const {
    data: orders = [],
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: queryKeys.orders.assignable(),
    queryFn:  trackingApi.getAssignableOrders,
    refetchInterval: 15_000,
  });

  useEffect(() => {
    if (orders.length > prevCountRef.current && prevCountRef.current > 0) {
      setNewFlash(true);
      setTimeout(() => setNewFlash(false), 3_000);
    }
    prevCountRef.current = orders.length;
  }, [orders.length]);

  useEffect(() => {
    const socket     = getSocket();
    const invalidate = () => void qc.invalidateQueries({ queryKey: queryKeys.orders.assignable() });
    socket.on(ORDER_CREATED,    invalidate);
    socket.on(ORDER_UNASSIGNED, invalidate);
    return () => {
      socket.off(ORDER_CREATED,    invalidate);
      socket.off(ORDER_UNASSIGNED, invalidate);
    };
  }, [qc]);

  const assign = useMutation({
    mutationFn: ({ orderId, note }: { orderId: string; note: string }) => {
      if (!selectedDriverId) return Promise.reject(new Error("No driver selected"));
      return trackingApi.createAssignment(orderId, selectedDriverId, note);
    },

    onMutate: async ({ orderId }) => {
      await qc.cancelQueries({ queryKey: queryKeys.orders.assignable() });
      const prev = qc.getQueryData<AssignableOrder[]>(queryKeys.orders.assignable());
      qc.setQueryData<AssignableOrder[]>(queryKeys.orders.assignable(), (old = []) =>
        old.filter((o) => o.id !== orderId)
      );
      return { prev };
    },

    onError: (err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKeys.orders.assignable(), ctx.prev);
      setAssignErrMsg(getErrorMessage(err));
    },

    onSettled: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.orders.assignable() });
      void qc.invalidateQueries({ queryKey: queryKeys.drivers.all() });
    },
  });

  const handleAssign = (orderId: string, note: string): Promise<void> => {
    setAssignErrMsg(null);
    return assign.mutateAsync({ orderId, note }).then(() => undefined);
  };

  const sorted = [...orders].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const urgentCount = sorted.filter(
    (o) => urgencyTier(waitMinutes(o.createdAt)) !== "normal"
  ).length;

  return (
    <div className="flex flex-col">
      <div className="border-b border-slate-100 px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
            Order Queue
          </h2>
          <button
            onClick={() => void refetch()}
            disabled={isFetching}
            aria-label="Refresh order list"
            className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40"
          >
            <RefreshCcw className={cn("size-3.5", isFetching && "animate-spin")} aria-hidden />
          </button>
        </div>
        <div className="mt-0.5 flex items-center gap-2" aria-live="polite" aria-atomic>
          <p className="text-[13px] font-semibold text-slate-700">
            {isLoading ? "…" : `${orders.length} waiting`}
          </p>
          {urgentCount > 0 && (
            <span className="flex items-center gap-0.5 rounded-full border border-red-100 bg-red-50 px-1.5 py-0.5 text-[10px] font-black text-red-600">
              <AlertTriangle className="size-2.5" aria-hidden />
              {urgentCount} urgent
            </span>
          )}
        </div>
      </div>

      {isError && (
        <div role="alert" className="mx-3 mt-2 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5">
          <WifiOff className="size-3.5 shrink-0 text-red-500" aria-hidden />
          <p className="flex-1 text-[11px] font-medium text-red-700">Failed to load orders</p>
          <button
            onClick={() => void refetch()}
            className="rounded-lg border border-red-200 bg-white px-2 py-1 text-[11px] font-bold text-red-600 transition hover:bg-red-50"
          >
            Retry
          </button>
        </div>
      )}

      {newFlash && (
        <div role="status" className="mx-3 mt-2 flex items-center gap-2 rounded-xl border border-[#1B4D91]/15 bg-[#1B4D91]/[0.06] px-3 py-2 animate-pulse">
          <Package className="size-3.5 text-[#1B4D91]" aria-hidden />
          <p className="text-[12px] font-bold text-[#1B4D91]">New order!</p>
        </div>
      )}

      {!selectedDriverId && !isLoading && orders.length > 0 && (
        <div className="mx-3 mt-2 flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2.5">
          <User className="size-3.5 shrink-0 text-amber-500" aria-hidden />
          <p className="text-[12px] font-medium text-amber-700">
            Select a driver on the left to assign
          </p>
        </div>
      )}

      {assignErrMsg && (
        <div role="alert" className="mx-3 mt-2 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2">
          <AlertTriangle className="size-3.5 shrink-0 text-red-500" aria-hidden />
          <p className="flex-1 text-[11px] text-red-700">{assignErrMsg}</p>
          <button
            onClick={() => setAssignErrMsg(null)}
            aria-label="Dismiss error"
            className="text-red-400 hover:text-red-600"
          >
            <X className="size-3" aria-hidden />
          </button>
        </div>
      )}

      <div className="mt-2 flex flex-col">
        {isLoading && (
          <>
            <OrderCardSkeleton />
            <OrderCardSkeleton />
            <OrderCardSkeleton />
          </>
        )}

        {!isLoading && sorted.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            selectedDriverId={selectedDriverId}
            onAssign={handleAssign}
            isAssigning={assign.isPending}
          />
        ))}

        {!isLoading && !isError && orders.length === 0 && (
          <EmptyState
            icon={<Package className="size-6" />}
            title="No pending orders"
            description="All orders have been assigned"
          />
        )}
      </div>
    </div>
  );
}
