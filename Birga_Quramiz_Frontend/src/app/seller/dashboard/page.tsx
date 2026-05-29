"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { getSellerAnalytics } from "@/lib/api/seller";
import { getMySellerProducts } from "@/lib/api/products";
import { getSellerOrders } from "@/lib/api/orders";
import type { Order } from "@/types";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  TrendingUp, Package, ShoppingBag, Truck,
  ClipboardList, PlusCircle, ArrowRight,
  Store, BarChart3, CheckCircle, Clock, XCircle, AlertCircle,
  AlertTriangle, RefreshCw, Sparkles,
} from "lucide-react";
import type { Product } from "@/types";

type Analytics = {
  totalOrders: number;
  totalRevenue: number;
  breakdown: Record<string, number>;
};

export default function SellerDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const router = useRouter();
  const t = useTranslations("SellerDashboard");

  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated) { router.push("/login"); return; }
    if (user && user.role !== "SELLER" && user.role !== "ADMIN") { router.push("/"); return; }
  }, [user, isAuthenticated, isInitialized, router]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    const [analyticsResult, productsResult, ordersResult] = await Promise.allSettled([
      getSellerAnalytics(),
      getMySellerProducts(),
      getSellerOrders(),
    ]);
    if (analyticsResult.status === "fulfilled") setAnalytics(analyticsResult.value as Analytics);
    else setError(String(analyticsResult.reason));
    if (productsResult.status === "fulfilled") setProducts(productsResult.value as Product[]);
    if (ordersResult.status === "fulfilled") {
      const raw = ordersResult.value as { data?: Order[] } | Order[];
      setOrders(Array.isArray(raw) ? raw : (raw?.data ?? []));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isInitialized && isAuthenticated && (user?.role === "SELLER" || user?.role === "ADMIN")) {
      async function run() { await fetchData(); }
      void run();
    }
  }, [isInitialized, isAuthenticated, user, fetchData]);

  const statusConfig = useMemo<Record<string, { label: string; icon: typeof CheckCircle; color: string }>>(() => ({
    DELIVERED: { label: t("statusDelivered"), icon: CheckCircle, color: "#10b981" },
    NEW: { label: t("statusNew"), icon: Clock, color: "#f59e0b" },
    PAID: { label: t("statusPaid"), icon: AlertCircle, color: "#3b82f6" },
    CONFIRMED: { label: t("statusConfirmed"), icon: CheckCircle, color: "#8b5cf6" },
    PROCESSING: { label: t("statusProcessing"), icon: AlertCircle, color: "#3b82f6" },
    CANCELLED: { label: t("statusCancelled"), icon: XCircle, color: "#ef4444" },
    SHIPPED: { label: t("statusShipped"), icon: Truck, color: "#8b5cf6" },
    PENDING: { label: t("statusPending"), icon: Clock, color: "#f59e0b" },
  }), [t]);

  if (!isInitialized || loading || (isAuthenticated && !user)) {
    return (
      <div className="flex flex-col min-h-screen bg-[#f4f6fa] pb-28 md:pb-12">
        <div className="mx-auto w-full md:max-w-[1488px]">
          <div className="mx-auto flex flex-col gap-5 px-4 md:px-6 max-w-md md:max-w-none pt-4 md:pt-6">
            <div className="h-36 animate-pulse rounded-3xl bg-white" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-28 animate-pulse rounded-3xl bg-white" />
              ))}
            </div>
            <div className="h-36 animate-pulse rounded-3xl bg-white" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-3xl bg-white" />
              ))}
            </div>
            <div className="h-56 animate-pulse rounded-3xl bg-white" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || (user?.role !== "SELLER" && user?.role !== "ADMIN")) return null;

  // ── Computed data ──
  const totalOrders = analytics?.totalOrders ?? 0;
  const totalRevenue = analytics?.totalRevenue ?? 0;
  const breakdown = analytics?.breakdown ?? {};
  const deliveredCount = (breakdown as Record<string, number>).DELIVERED ?? 0;

  const approvedProducts = products.filter((p) => p.status === "APPROVED").length;
  const pendingProducts = products.filter((p) => p.status === "PENDING").length;
  const rejectedProducts = products.filter((p) => p.status === "REJECTED").length;
  const totalProducts = products.length;

  // Use real order data for actionable count — analytics breakdown may not include all statuses
  const actionableOrders = orders.filter(
    (o) => o.status === "NEW" || o.status === "PAID"
  ).length;

  const hasAttentionItems = pendingProducts > 0 || rejectedProducts > 0 || actionableOrders > 0;

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f6fa] pb-28 md:pb-12">
      <div className="mx-auto w-full md:max-w-[1488px]">
        <div className="mx-auto flex flex-col gap-5 px-4 md:px-6 max-w-md md:max-w-none pt-4 md:pt-6">

          {/* ── Hero banner ── */}
          <div className="rounded-3xl bg-[#1B4D91] px-6 py-7 md:px-10 flex items-center justify-between overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
            <div className="relative z-10">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/50 mb-1">Birga Quramiz</p>
              <h1 className="text-xl font-black text-white md:text-2xl">{t("title")}</h1>
              <p className="mt-1 text-[13px] text-white/70">
                {t("welcome")}, <span className="font-bold text-white">{user.name || t("defaultSeller")}</span>
              </p>
              {totalProducts > 0 && (
                <p className="mt-2 text-[12px] text-white/50 font-medium">
                  {approvedProducts} / {totalProducts} {t("kpiActiveProducts").toLowerCase()}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2 relative z-10">
              <button
                onClick={() => void fetchData()}
                className="flex size-11 items-center justify-center rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-colors"
                title="Refresh"
              >
                <RefreshCw className="size-4" />
              </button>
              <div className="hidden md:flex size-12 items-center justify-center rounded-2xl bg-white/10">
                <Store className="size-6 text-white" />
              </div>
            </div>
          </div>

          {/* ── 4 KPI cards ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: t("kpiOrders"), value: totalOrders, icon: ShoppingBag, color: "#1B4D91", sub: null },
              { label: t("kpiRevenue"), value: totalRevenue >= 1_000_000 ? `${(totalRevenue / 1_000_000).toFixed(1)}M` : `${Math.round(totalRevenue / 1000)}K`, icon: TrendingUp, color: "#10b981", sub: "UZS" },
              { label: t("kpiActiveProducts"), value: approvedProducts, icon: Package, color: "#8b5cf6", sub: totalProducts > 0 ? `/ ${totalProducts}` : null },
              { label: t("kpiDelivered"), value: deliveredCount, icon: CheckCircle, color: "#f59e0b", sub: null },
            ].map((kpi) => {
              const Icon = kpi.icon;
              return (
                <div key={kpi.label} className="rounded-3xl bg-white border border-slate-100 shadow-sm p-4 flex flex-col gap-2">
                  <div className="flex size-9 items-center justify-center rounded-xl" style={{ backgroundColor: `${kpi.color}15`, color: kpi.color }}>
                    <Icon className="size-4" />
                  </div>
                  <div className="flex items-baseline gap-1">
                    <p className="text-[22px] font-black text-[#1B4D91] leading-none">{kpi.value}</p>
                    {kpi.sub && <span className="text-[11px] font-bold text-slate-400">{kpi.sub}</span>}
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-tight">{kpi.label}</p>
                </div>
              );
            })}
          </div>

          {/* ── Needs Attention ── */}
          <div className="rounded-3xl bg-white border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 pt-5 pb-3 border-b border-slate-50">
              {hasAttentionItems
                ? <AlertTriangle className="size-4 text-amber-500" />
                : <Sparkles className="size-4 text-emerald-500" />
              }
              <h2 className="text-[13px] font-black text-[#1B4D91]">{t("needsAttentionTitle")}</h2>
            </div>
            {!hasAttentionItems ? (
              <div className="px-5 py-6 flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500">
                  <CheckCircle className="size-5" />
                </div>
                <div>
                  <p className="text-[13px] font-black text-emerald-700">{t("noAttentionNeeded")}</p>
                  <p className="text-[11px] text-slate-400 font-medium">{t("noAttentionNeededSub")}</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {pendingProducts > 0 && (
                  <Link href="/seller/products?status=PENDING" className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors group">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                      <Clock className="size-4" />
                    </div>
                    <p className="text-[13px] font-semibold text-slate-700 flex-1">
                      <span className="font-black text-amber-600">{pendingProducts}</span> {t("pendingProductsAlert")}
                    </p>
                    <ArrowRight className="size-4 text-slate-300 group-hover:text-amber-400 transition-colors" />
                  </Link>
                )}
                {rejectedProducts > 0 && (
                  <Link href="/seller/products?status=REJECTED" className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors group">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500">
                      <XCircle className="size-4" />
                    </div>
                    <p className="text-[13px] font-semibold text-slate-700 flex-1">
                      <span className="font-black text-red-500">{rejectedProducts}</span> {t("rejectedProductsAlert")}
                    </p>
                    <ArrowRight className="size-4 text-slate-300 group-hover:text-red-400 transition-colors" />
                  </Link>
                )}
                {actionableOrders > 0 && (
                  <Link href="/seller/orders" className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors group">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
                      <AlertCircle className="size-4" />
                    </div>
                    <p className="text-[13px] font-semibold text-slate-700 flex-1">
                      <span className="font-black text-blue-600">{actionableOrders}</span> {t("actionableOrdersAlert")}
                    </p>
                    <ArrowRight className="size-4 text-slate-300 group-hover:text-blue-400 transition-colors" />
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* ── Quick actions ── */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: t("actionProducts"), sub: `${totalProducts} ${t("actionProductsSub")}`, icon: Package, href: "/seller/products", accent: "#1B4D91" },
              { label: t("actionOrders"), sub: t("actionOrdersSub"), icon: ClipboardList, href: "/seller/orders", accent: "#1B4D91" },
              { label: t("actionAdd"), sub: t("actionAddSub"), icon: PlusCircle, href: "/seller/products", accent: "#10b981" },
              { label: t("actionDelivery"), sub: `${actionableOrders} ${t("actionDeliverySub")}`, icon: Truck, href: "/seller/orders", accent: actionableOrders > 0 ? "#f59e0b" : "#64748b" },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex items-center gap-3.5 rounded-3xl bg-white border border-slate-100 shadow-sm p-4 hover:shadow-md active:scale-[0.97] transition-all group"
                >
                  <div
                    className="flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors"
                    style={{ backgroundColor: `${action.accent}12`, color: action.accent }}
                  >
                    <Icon className="size-[18px]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-black text-[#1B4D91] truncate">{action.label}</p>
                    <p className="text-[11px] text-slate-400 font-medium truncate">{action.sub}</p>
                  </div>
                  <ArrowRight className="ml-auto size-4 text-slate-200 group-hover:text-[#1B4D91]/30 transition-colors shrink-0" />
                </Link>
              );
            })}
          </div>

          {/* ── Product health strip ── */}
          {totalProducts > 0 && (
            <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <Package className="size-4 text-[#1B4D91]" />
                <h2 className="text-[13px] font-black text-[#1B4D91]">{t("productInsightsTitle")}</h2>
                <Link href="/seller/products" className="ml-auto text-[11px] font-bold text-[#1B4D91]/50 hover:text-[#1B4D91] flex items-center gap-1 transition-colors">
                  {t("viewAll")} <ArrowRight className="size-3" />
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: t("statusApproved"), count: approvedProducts, color: "#10b981", bg: "#d1fae5" },
                  { label: t("statusPending"), count: pendingProducts, color: "#f59e0b", bg: "#fef3c7" },
                  { label: t("statusRejected"), count: rejectedProducts, color: "#ef4444", bg: "#fee2e2" },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl p-2.5 md:p-3 text-center" style={{ backgroundColor: item.bg }}>
                    <p className="text-[18px] md:text-[22px] font-black" style={{ color: item.color }}>{item.count}</p>
                    <p className="text-[9px] md:text-[10px] font-bold mt-0.5 uppercase tracking-wider" style={{ color: item.color }}>{item.label}</p>
                  </div>
                ))}
              </div>
              {totalProducts > 0 && (
                <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden flex gap-0.5">
                  {approvedProducts > 0 && (
                    <div className="h-full rounded-l-full bg-emerald-400 transition-all duration-700" style={{ width: `${(approvedProducts / totalProducts) * 100}%` }} />
                  )}
                  {pendingProducts > 0 && (
                    <div className="h-full bg-amber-400 transition-all duration-700" style={{ width: `${(pendingProducts / totalProducts) * 100}%` }} />
                  )}
                  {rejectedProducts > 0 && (
                    <div className="h-full rounded-r-full bg-red-400 transition-all duration-700" style={{ width: `${(rejectedProducts / totalProducts) * 100}%` }} />
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Order status breakdown ── */}
          {analytics && Object.keys(breakdown).length > 0 && (
            <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="size-4 text-[#1B4D91]" />
                  <h2 className="text-[13px] font-black text-[#1B4D91]">{t("breakdownTitle")}</h2>
                </div>
                <Link href="/seller/orders" className="text-[11px] font-bold text-[#1B4D91]/60 hover:text-[#1B4D91] transition-colors flex items-center gap-1">
                  {t("viewAll")} <ArrowRight className="size-3" />
                </Link>
              </div>
              <div className="space-y-2.5">
                {Object.entries(breakdown)
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .map(([status, count]) => {
                    const cfg = statusConfig[status] ?? { label: status, icon: Package, color: "#64748b" };
                    const Icon = cfg.icon;
                    const pct = totalOrders > 0 ? Math.round(((count as number) / totalOrders) * 100) : 0;
                    return (
                      <div key={status} className="flex items-center gap-3">
                        <div className="flex size-7 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${cfg.color}15` }}>
                          <Icon className="size-3.5" style={{ color: cfg.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[12px] font-semibold text-slate-600">{cfg.label}</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-bold text-slate-400">{pct}%</span>
                              <span className="text-[12px] font-black text-[#1B4D91]">{count as number}</span>
                            </div>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: cfg.color }} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ── Revenue card ── */}
          {totalRevenue > 0 && (
            <div className="rounded-3xl bg-gradient-to-r from-[#1B4D91] to-[#2a6dd9] p-6 text-white shadow-lg shadow-[#1B4D91]/20">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-1">{t("revenueTitle")}</p>
              <p className="text-2xl md:text-3xl font-black">{totalRevenue.toLocaleString("ru-RU")} <span className="text-lg md:text-xl opacity-60">UZS</span></p>
              <div className="mt-3 h-px bg-white/10" />
              <div className="mt-3 grid grid-cols-3 gap-2">
                {[
                  { label: t("kpiOrders"), value: totalOrders },
                  { label: t("kpiDelivered"), value: deliveredCount },
                  { label: t("kpiActiveProducts"), value: approvedProducts },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="text-[18px] font-black text-white">{stat.value}</p>
                    <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider leading-tight">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Error notice (non-blocking) ── */}
          {error && (
            <div className="rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3 text-[12px] font-semibold text-amber-700">
              {t("loadError")}: {error}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
