"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import {
  Bell, CheckCheck, ChevronLeft, ChevronRight,
  ShoppingBag, Package, Truck, XCircle, CheckCircle, Store, AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type Notification,
  type NotificationType,
} from "@/lib/api/notifications";

const LIMIT = 20;

const TYPE_META: Record<NotificationType, { icon: React.ElementType; color: string; bg: string }> = {
  ORDER_NEW:               { icon: ShoppingBag,  color: "#1B4D91", bg: "#dbeafe" },
  ORDER_PAID:              { icon: CheckCircle,  color: "#10b981", bg: "#d1fae5" },
  ORDER_CANCELLED:         { icon: XCircle,      color: "#ef4444", bg: "#fee2e2" },
  ORDER_SHIPPED:           { icon: Truck,        color: "#6366f1", bg: "#e0e7ff" },
  ORDER_DELIVERED:         { icon: CheckCircle,  color: "#10b981", bg: "#d1fae5" },
  PRODUCT_APPROVED:        { icon: Package,      color: "#10b981", bg: "#d1fae5" },
  PRODUCT_REJECTED:        { icon: Package,      color: "#ef4444", bg: "#fee2e2" },
  SELLER_APPROVED:         { icon: Store,        color: "#10b981", bg: "#d1fae5" },
  SELLER_REJECTED:         { icon: Store,        color: "#ef4444", bg: "#fee2e2" },
  ASSIGNMENT_CREATED:      { icon: Truck,        color: "#6366f1", bg: "#e0e7ff" },
  ASSIGNMENT_NEW:          { icon: Truck,        color: "#6366f1", bg: "#e0e7ff" },
  ASSIGNMENT_CANCELLED_DRV:{ icon: XCircle,      color: "#ef4444", bg: "#fee2e2" },
  DRIVER_OFFLINE:          { icon: AlertTriangle,color: "#f59e0b", bg: "#fef3c7" },
  ORDER_DELAYED:           { icon: AlertTriangle,color: "#f59e0b", bg: "#fef3c7" },
  FRAUD_ALERT:             { icon: AlertTriangle,color: "#ef4444", bg: "#fee2e2" },
  SELLER_APPLICATION:      { icon: Store,        color: "#1B4D91", bg: "#dbeafe" },
};

type Tab = "ALL" | "UNREAD";

function NotificationCard({
  n,
  onMarkRead,
}: {
  n: Notification;
  onMarkRead: (id: string) => void;
}) {
  const meta = TYPE_META[n.type] ?? { icon: Bell, color: "#64748b", bg: "#f1f5f9" };
  const Icon = meta.icon;
  const isUnread = !n.readAt;

  return (
    <article
      className={cn(
        "flex items-start gap-4 rounded-2xl border px-5 py-4 transition-colors",
        isUnread
          ? "border-[#1B4D91]/10 bg-blue-50/40"
          : "border-slate-100 bg-white"
      )}
    >
      <div
        className="flex size-10 shrink-0 items-center justify-center rounded-xl mt-0.5"
        style={{ backgroundColor: meta.bg }}
      >
        <Icon className="size-5" style={{ color: meta.color }} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[13px] font-black text-slate-800 leading-tight">{n.title}</p>
          {isUnread && (
            <span className="shrink-0 size-2 rounded-full bg-[#1B4D91] mt-1.5" />
          )}
        </div>
        <p className="text-[12px] text-slate-500 mt-0.5 leading-snug">{n.body}</p>
        <div className="flex items-center justify-between mt-2">
          <p className="text-[11px] text-slate-300">
            {new Date(n.createdAt).toLocaleString("en-US", {
              month: "short", day: "numeric",
              hour: "2-digit", minute: "2-digit",
            })}
          </p>
          {isUnread && (
            <button
              type="button"
              onClick={() => onMarkRead(n.id)}
              className="text-[11px] font-bold text-[#1B4D91] hover:opacity-70 transition-opacity"
            >
              Mark read
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default function SellerNotificationsPage() {
  const { user, isAuthenticated, isInitialized } = useAuth();
  const router = useRouter();

  const [tab, setTab]               = useState<Tab>("ALL");
  const [page, setPage]             = useState(1);
  const [items, setItems]           = useState<Notification[]>([]);
  const [meta, setMeta]             = useState({ total: 0, totalPages: 1, unread: 0 });
  const [loading, setLoading]       = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated) { router.push("/login"); return; }
    if (user && user.role !== "SELLER") router.push("/");
  }, [user, isAuthenticated, isInitialized, router]);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await getNotifications(p, LIMIT);
      setItems(res.data);
      setMeta({ total: res.meta.total, totalPages: res.meta.totalPages, unread: res.meta.unread });
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.role === "SELLER") {
      load(page);
    }
  }, [page, isAuthenticated, user, load]);

  const handleMarkRead = useCallback(async (id: string) => {
    await markNotificationRead(id).catch(() => {});
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, readAt: new Date().toISOString() } : n));
    setMeta((m) => ({ ...m, unread: Math.max(0, m.unread - 1) }));
  }, []);

  const handleMarkAllRead = useCallback(async () => {
    setMarkingAll(true);
    try {
      await markAllNotificationsRead();
      setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
      setMeta((m) => ({ ...m, unread: 0 }));
    } finally {
      setMarkingAll(false);
    }
  }, []);

  const displayed = tab === "UNREAD" ? items.filter((n) => !n.readAt) : items;

  if (!isInitialized || (isAuthenticated && !user)) {
    return (
      <div className="flex flex-col min-h-screen bg-[#f4f6fa] pb-28 md:pb-12">
        <div className="mx-auto w-full md:max-w-3xl px-4 md:px-6 pt-4 md:pt-6 space-y-4">
          <div className="h-32 animate-pulse rounded-3xl bg-white" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-white" />
          ))}
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "SELLER") return null;

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f6fa] pb-28 md:pb-12">
      <div className="mx-auto w-full md:max-w-3xl px-4 md:px-6 pt-4 md:pt-6 space-y-4">

        {/* Hero */}
        <div className="rounded-3xl bg-[#1B4D91] px-6 py-7 md:px-10 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/50 mb-1">Birga Quramiz</p>
            <h1 className="text-xl font-black text-white md:text-2xl">Notifications</h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-[13px] text-white/70">{meta.total} total</p>
              {meta.unread > 0 && (
                <span className="rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-black text-white">
                  {meta.unread} unread
                </span>
              )}
            </div>
          </div>
          {meta.unread > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2.5 text-[12px] font-black text-white hover:bg-white/20 disabled:opacity-50 transition-colors shrink-0"
            >
              <CheckCheck className="size-4" />
              {markingAll ? "..." : "Mark all read"}
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {(["ALL", "UNREAD"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "flex items-center gap-1.5 rounded-2xl px-4 py-2.5 text-[12px] font-black transition-all",
                tab === t
                  ? "bg-[#1B4D91] text-white shadow-sm"
                  : "bg-white border border-slate-100 text-slate-500 hover:border-[#1B4D91]/20 hover:text-[#1B4D91]"
              )}
            >
              {t === "ALL" ? "All" : "Unread"}
              <span className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-black",
                tab === t ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
              )}>
                {t === "ALL" ? meta.total : meta.unread}
              </span>
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-white" />
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="rounded-3xl bg-white border border-slate-100 p-12 flex flex-col items-center gap-3 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-[#1B4D91]/6 text-[#1B4D91]">
              <Bell className="size-8" />
            </div>
            <p className="text-[15px] font-black text-[#1B4D91]">
              {tab === "UNREAD" ? "All caught up!" : "No notifications yet"}
            </p>
            <p className="text-[13px] text-slate-400">
              {tab === "UNREAD" ? "No unread notifications" : "Notifications will appear here"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayed.map((n) => (
              <NotificationCard key={n.id} n={n} onMarkRead={handleMarkRead} />
            ))}
          </div>
        )}

        {/* Pagination — only shown on All tab */}
        {!loading && tab === "ALL" && meta.totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex size-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-[13px] font-black text-slate-600">
              {page} / {meta.totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={page === meta.totalPages}
              className="flex size-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
