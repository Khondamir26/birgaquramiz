"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Package, Users, ClipboardList, ArrowRight,
  Shield, Tag, AlertTriangle, CheckCircle2,
  Clock, Trash2, ChevronRight, Store,
} from "lucide-react";
import { getAdminUsers, getAdminOrders, getAdminDeletionRequests, getAdminPendingSellers } from "@/lib/api/admin";
import { getPendingProducts, getProducts } from "@/lib/api/products";
import { getBrands } from "@/lib/api/brands";
import type { Order, OrderStatus } from "@/types";
import { cn } from "@/lib/utils";

// ── Order status badge ────────────────────────────────────────────────────────
const STATUS_STYLES: Record<OrderStatus, { label: string; className: string }> = {
  NEW:       { label: "New",       className: "bg-blue-50 text-blue-600 border-blue-100" },
  PAID:      { label: "Paid",      className: "bg-violet-50 text-violet-600 border-violet-100" },
  CONFIRMED: { label: "Confirmed", className: "bg-cyan-50 text-cyan-600 border-cyan-100" },
  SHIPPED:   { label: "Shipped",   className: "bg-amber-50 text-amber-700 border-amber-100" },
  DELIVERED: { label: "Delivered", className: "bg-emerald-50 text-emerald-600 border-emerald-100" },
  CANCELLED: { label: "Cancelled", className: "bg-red-50 text-red-500 border-red-100" },
};

function StatusBadge({ status }: { status: OrderStatus }) {
  const s = STATUS_STYLES[status] ?? { label: status, className: "bg-slate-100 text-slate-500" };
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-bold border", s.className)}>
      {s.label}
    </span>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({
  label, value, icon: Icon, color, loading, href,
}: {
  label: string; value: number | string; icon: React.ElementType;
  color: string; loading: boolean; href?: string;
}) {
  const inner = (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4 md:p-5 flex flex-col justify-between min-h-[110px] hover:shadow-md transition-shadow group">
      <div className="flex items-center justify-between">
        <div
          className="flex size-9 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${color}18`, color }}
        >
          <Icon className="size-4" />
        </div>
        {href && <ChevronRight className="size-3.5 text-slate-200 group-hover:text-slate-400 transition-colors" />}
      </div>
      <div className="mt-3">
        {loading ? (
          <div className="h-7 w-16 animate-pulse rounded-lg bg-slate-100 mb-1" />
        ) : (
          <p className="text-[22px] font-black text-[#1B4D91] leading-none">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
        )}
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1.5 line-clamp-1">{label}</p>
      </div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

// ── Alert item ────────────────────────────────────────────────────────────────
function AlertItem({ icon: Icon, color, title, sub, href }: {
  icon: React.ElementType; color: string; title: string; sub: string; href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
    >
      <div
        className="flex size-9 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${color}18`, color }}
      >
        <Icon className="size-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold text-slate-800 leading-tight">{title}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>
      </div>
      <ArrowRight className="size-4 text-slate-200 group-hover:text-slate-400 shrink-0 transition-colors" />
    </Link>
  );
}

// ── Quick action card ──────────────────────────────────────────────────────────
function QuickAction({ label, sub, icon: Icon, href, accent }: {
  label: string; sub: string; icon: React.ElementType; href: string; accent: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-2xl bg-white border border-slate-100 shadow-sm p-4 hover:shadow-md active:scale-[0.97] transition-all group"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${accent}12`, color: accent }}
        >
          <Icon className="size-[18px]" />
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-black text-[#1B4D91] truncate leading-tight">{label}</p>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">{sub}</p>
        </div>
      </div>
      <ArrowRight className="hidden md:block ml-2 size-4 text-slate-200 group-hover:text-[#1B4D91]/30 shrink-0 transition-colors" />
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { user, isAuthenticated, isInitialized } = useAuth();
  const router = useRouter();
  const t = useTranslations("AdminDashboard");

  // ── data state ──────────────────────────────────────────────────────────────
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalBrands: 0,
    pendingModeration: 0,
    pendingDeletion: 0,
    pendingSellers: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  // ── auth guard ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated) { router.push("/login"); return; }
    if (user && user.role !== "ADMIN") router.push("/");
  }, [user, isAuthenticated, isInitialized, router]);

  // ── fetch data ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isInitialized || !isAuthenticated || user?.role !== "ADMIN") return;

    async function load() {
      setLoadingStats(true);
      try {
        const [usersRes, ordersRes, productsRes, pendingRes, deletionRes, brandsRes, sellersRes] =
          await Promise.allSettled([
            getAdminUsers({ page: 1, limit: 1 }),
            getAdminOrders({ page: 1, limit: 5 }),
            getProducts(1, 1),
            getPendingProducts(),
            getAdminDeletionRequests(),
            getBrands(),
            getAdminPendingSellers({ page: 1, limit: 1 }),
          ]);

        setStats({
          totalUsers:
            usersRes.status === "fulfilled" ? (usersRes.value.meta?.total ?? 0) : 0,
          totalOrders:
            ordersRes.status === "fulfilled" ? (ordersRes.value.meta?.total ?? 0) : 0,
          totalProducts:
            productsRes.status === "fulfilled" ? (productsRes.value.meta?.total ?? 0) : 0,
          totalBrands:
            brandsRes.status === "fulfilled" ? brandsRes.value.length : 0,
          pendingModeration:
            pendingRes.status === "fulfilled" ? pendingRes.value.length : 0,
          pendingDeletion:
            deletionRes.status === "fulfilled"
              ? deletionRes.value.filter((r) => r.status === "PENDING").length
              : 0,
          pendingSellers:
            sellersRes.status === "fulfilled" ? (sellersRes.value.meta?.total ?? 0) : 0,
        });

        if (ordersRes.status === "fulfilled") {
          setRecentOrders(ordersRes.value.data);
        }
      } finally {
        setLoadingStats(false);
      }
    }

    void load();
  }, [isInitialized, isAuthenticated, user]);

  // ── loading skeleton ─────────────────────────────────────────────────────────
  if (!isInitialized || (isAuthenticated && !user)) {
    return (
      <div className="flex flex-col min-h-screen bg-[#f4f6fa] pb-28 md:pb-12">
        <div className="mx-auto w-full md:max-w-[1440px] px-4 md:px-6 pt-4 md:pt-6 flex flex-col gap-5">
          <div className="h-28 animate-pulse rounded-3xl bg-white" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-white" />
            ))}
          </div>
          <div className="h-40 animate-pulse rounded-2xl bg-white" />
          <div className="h-48 animate-pulse rounded-2xl bg-white" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "ADMIN") return null;

  const alerts: { icon: React.ElementType; color: string; title: string; sub: string; href: string }[] = [];
  if (stats.pendingModeration > 0) {
    alerts.push({
      icon: Clock,
      color: "#f59e0b",
      title: `${stats.pendingModeration} product${stats.pendingModeration > 1 ? "s" : ""} awaiting moderation`,
      sub: "Review and approve or reject pending listings",
      href: "/admin/products",
    });
  }
  if (stats.pendingDeletion > 0) {
    alerts.push({
      icon: Trash2,
      color: "#E31E24",
      title: `${stats.pendingDeletion} deletion request${stats.pendingDeletion > 1 ? "s" : ""} pending`,
      sub: "Sellers have requested product removal",
      href: "/admin/deletion-requests",
    });
  }
  if (stats.pendingSellers > 0) {
    alerts.push({
      icon: Store,
      color: "#0b3190",
      title: `${stats.pendingSellers} seller${stats.pendingSellers > 1 ? "s" : ""} awaiting verification`,
      sub: "Review and approve or reject seller applications",
      href: "/admin/sellers",
    });
  }

  const quickActions = [
    { label: t("actionProducts") || "Products",           sub: t("actionProductsSub") || "Moderation",        icon: Package,       href: "/admin/products",          accent: "#1B4D91" },
    { label: "Brands",                                     sub: "Manage catalog brands",                        icon: Tag,           href: "/admin/brands",            accent: "#8b5cf6" },
    { label: t("actionUsers") || "Users",                  sub: t("actionUsersSub") || "Control",              icon: Users,         href: "/admin/users",             accent: "#10b981" },
    { label: t("actionOrders") || "Orders",                sub: t("actionOrdersSub") || "Oversight",           icon: ClipboardList, href: "/admin/orders",            accent: "#f59e0b" },
    { label: t("actionDeletionRequests") || "Deletions",  sub: t("actionDeletionRequestsSub") || "Review",    icon: Trash2,        href: "/admin/deletion-requests", accent: "#E31E24" },
    { label: "Sellers",                                     sub: `${stats.pendingSellers} pending`,               icon: Store,         href: "/admin/sellers",           accent: "#0b3190" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f6fa] pb-28 md:pb-12">
      <div className="mx-auto w-full md:max-w-[1440px]">
        <div className="mx-auto flex flex-col gap-5 px-4 md:px-6 max-w-md md:max-w-none pt-4 md:pt-6">

          {/* ── Hero banner ────────────────────────────────────────────────── */}
          <div
            className="rounded-3xl px-6 py-7 md:px-10 md:py-8 flex items-center justify-between"
            style={{ background: "linear-gradient(135deg, #1B4D91 0%, #2563eb 50%, #1d4ed8 100%)" }}
          >
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/50 mb-1.5">
                BIRGA QURAMIZ
              </p>
              <h1 className="text-xl md:text-2xl font-black text-white">
                {t("title") || "Admin Panel"}
              </h1>
              <p className="mt-1 text-[13px] text-white/65">
                {t("welcome") || "Welcome"},{" "}
                <span className="font-bold text-white">
                  {user.name || t("defaultAdmin") || "Administrator"}
                </span>
              </p>

              {/* inline alerts in banner */}
              {alerts.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {alerts.map((a, i) => (
                    <Link
                      key={i}
                      href={a.href}
                      className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 transition-colors rounded-xl px-3 py-1.5 text-[11px] font-bold text-white"
                    >
                      <AlertTriangle className="size-3.5" />
                      {a.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="hidden md:flex flex-col items-center gap-3">
              <div className="flex size-16 items-center justify-center rounded-2xl bg-white/10">
                <Shield className="size-8 text-white/90" />
              </div>
              {alerts.length === 0 && (
                <div className="flex items-center gap-1.5 bg-emerald-400/20 rounded-xl px-3 py-1.5 text-[11px] font-bold text-emerald-200">
                  <CheckCircle2 className="size-3.5" />
                  All clear
                </div>
              )}
            </div>
          </div>

          {/* ── KPI stats ──────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label={t("usersTotal") || "Total Users"}    value={stats.totalUsers}    icon={Users}        color="#10b981" loading={loadingStats} href="/admin/users" />
            <StatCard label={t("ordersTotal") || "Total Orders"}  value={stats.totalOrders}   icon={ClipboardList} color="#3b82f6" loading={loadingStats} href="/admin/orders" />
            <StatCard label={t("productsTotal") || "Products"}    value={stats.totalProducts} icon={Package}      color="#f59e0b" loading={loadingStats} href="/admin/products" />
            <StatCard label="Brands"                               value={stats.totalBrands}   icon={Tag}          color="#8b5cf6" loading={loadingStats} href="/admin/brands" />
          </div>

          {/* ── Needs attention ────────────────────────────────────────────── */}
          <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-50 flex items-center justify-between">
              <p className="text-[12px] font-black uppercase tracking-[0.15em] text-slate-400">
                Needs Attention
              </p>
              {alerts.length === 0 && (
                <span className="text-[11px] font-bold text-emerald-500 flex items-center gap-1">
                  <CheckCircle2 className="size-3.5" /> All clear
                </span>
              )}
            </div>
            <div className="p-2">
              {alerts.length === 0 ? (
                <div className="py-4 px-3 text-center text-[13px] text-slate-400 font-medium">
                  No pending actions — platform is running smoothly.
                </div>
              ) : (
                alerts.map((a, i) => (
                  <AlertItem key={i} {...a} />
                ))
              )}

              {/* pending counts even if 0, for visibility */}
              {alerts.length === 0 && (
                <div className="mt-1 grid grid-cols-3 gap-2 px-2 pb-2">
                  <Link href="/admin/products" className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                    <Package className="size-4 text-slate-400" />
                    <div>
                      <p className="text-[12px] font-bold text-slate-600">{loadingStats ? "—" : `${stats.pendingModeration} pending`}</p>
                      <p className="text-[10px] text-slate-400">Moderation</p>
                    </div>
                  </Link>
                  <Link href="/admin/deletion-requests" className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                    <Trash2 className="size-4 text-slate-400" />
                    <div>
                      <p className="text-[12px] font-bold text-slate-600">{loadingStats ? "—" : `${stats.pendingDeletion} pending`}</p>
                      <p className="text-[10px] text-slate-400">Deletions</p>
                    </div>
                  </Link>
                  <Link href="/admin/sellers" className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                    <Store className="size-4 text-slate-400" />
                    <div>
                      <p className="text-[12px] font-bold text-slate-600">{loadingStats ? "—" : `${stats.pendingSellers} pending`}</p>
                      <p className="text-[10px] text-slate-400">Sellers</p>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* ── Main layout: quick actions + recent orders ──────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_380px] gap-5">

            {/* Quick Actions */}
            <div className="flex flex-col gap-3">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400 px-1">
                Quick Actions
              </p>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((a) => (
                  <QuickAction key={a.href + a.label} {...a} />
                ))}
              </div>
            </div>

            {/* Recent Orders */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">
                  Recent Orders
                </p>
                <Link
                  href="/admin/orders"
                  className="text-[11px] font-bold text-[#1B4D91]/60 hover:text-[#1B4D91] transition-colors flex items-center gap-1"
                >
                  View all <ChevronRight className="size-3" />
                </Link>
              </div>

              <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
                {loadingStats ? (
                  <div className="p-4 flex flex-col gap-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-50" />
                    ))}
                  </div>
                ) : recentOrders.length === 0 ? (
                  <div className="py-10 text-center text-[13px] text-slate-400 font-medium">
                    No orders yet
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {recentOrders.map((order) => (
                      <Link
                        key={order.id}
                        href="/admin/orders"
                        className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors group"
                      >
                        <div className="min-w-0">
                          <p className="text-[12px] font-black text-slate-700 truncate">
                            {order.customerName}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0 ml-3">
                          <StatusBadge status={order.status} />
                          <p className="text-[11px] font-bold text-[#1B4D91]">
                            {order.total.toLocaleString("ru-RU")} UZS
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                <div className="px-4 py-3 border-t border-slate-50">
                  <Link
                    href="/admin/orders"
                    className="flex items-center justify-center gap-1.5 text-[12px] font-bold text-[#1B4D91]/60 hover:text-[#1B4D91] transition-colors"
                  >
                    See all {stats.totalOrders > 0 ? `${stats.totalOrders.toLocaleString()} ` : ""}orders
                    <ChevronRight className="size-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
