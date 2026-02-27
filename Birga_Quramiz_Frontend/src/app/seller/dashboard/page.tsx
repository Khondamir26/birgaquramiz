"use client";

import { useFetch } from "@/hooks/useFetch";
import { getSellerAnalytics } from "@/lib/api/seller";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  TrendingUp, Package, ShoppingBag, Truck,
  ClipboardList, PlusCircle, ArrowRight,
  Store, BarChart3, CheckCircle, Clock, XCircle, AlertCircle
} from "lucide-react";

export default function SellerDashboardPage() {
  const { user, isAuthenticated, isInitialized } = useAuth();
  const router = useRouter();
  const t = useTranslations("SellerDashboard");

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated) { router.push("/login"); return; }
    if (user && user.role !== "SELLER") router.push("/");
  }, [user, isAuthenticated, isInitialized, router]);

  const { data, loading, error } = useFetch(() => getSellerAnalytics());

  // Status labels resolved from translations (so they switch language too)
  const statusConfig: Record<string, { label: string; icon: typeof CheckCircle; color: string }> = {
    DELIVERED: { label: t("statusDelivered"), icon: CheckCircle, color: "#10b981" },
    NEW: { label: t("statusNew"), icon: Clock, color: "#f59e0b" },
    PAID: { label: t("statusPaid"), icon: AlertCircle, color: "#3b82f6" },
    CONFIRMED: { label: t("statusConfirmed"), icon: CheckCircle, color: "#8b5cf6" },
    PROCESSING: { label: t("statusProcessing"), icon: AlertCircle, color: "#3b82f6" },
    CANCELLED: { label: t("statusCancelled"), icon: XCircle, color: "#ef4444" },
    SHIPPED: { label: t("statusShipped"), icon: Truck, color: "#8b5cf6" },
    PENDING: { label: t("statusPending"), icon: Clock, color: "#f59e0b" },
  };

  // ── Loading skeleton ──
  if (!isInitialized || loading || (isAuthenticated && !user)) {
    return (
      <div className="flex flex-col min-h-screen bg-[#f4f6fa] pb-28 md:pb-12">
        <div className="mx-auto w-full md:max-w-7xl">
          <div className="mx-auto flex flex-col gap-6 px-4 md:px-6 max-w-md md:max-w-none pt-4 md:pt-6">
            <div className="h-32 animate-pulse rounded-3xl bg-white" />
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-3xl bg-white" />
              ))}
            </div>
            <div className="h-48 animate-pulse rounded-3xl bg-white" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "SELLER") return null;

  if (error) {
    return (
      <div className="flex flex-col min-h-screen bg-[#f4f6fa] pb-28 md:pb-12">
        <div className="mx-auto w-full md:max-w-7xl">
          <div className="mx-auto px-4 md:px-6 max-w-md md:max-w-none pt-4 md:pt-6">
            <div className="rounded-3xl border border-[#E31E24]/20 bg-[#E31E24]/5 p-6 text-[13px] font-semibold text-[#E31E24]">
              {t("loadError")}: {error}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalOrders = data?.totalOrders ?? 0;
  const totalRevenue = data?.totalRevenue ?? 0;
  const breakdown = data?.breakdown ?? {};
  const deliveredCount = (breakdown as Record<string, number>).DELIVERED ?? 0;
  const pendingCount = (breakdown as Record<string, number>).PENDING ?? 0;

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f6fa] pb-28 md:pb-12">
      <div className="mx-auto w-full md:max-w-7xl">
        <div className="mx-auto flex flex-col gap-5 px-4 md:px-6 max-w-md md:max-w-none pt-4 md:pt-6">

          {/* ── Hero banner ── */}
          <div className="rounded-3xl bg-[#1B4D91] px-6 py-7 md:px-10 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/50 mb-1">Birga Quramiz</p>
              <h1 className="text-xl font-black text-white md:text-2xl">{t("title")}</h1>
              <p className="mt-1 text-[13px] text-white/70">
                {t("welcome")}, <span className="font-bold text-white">{user.name || t("defaultSeller")}</span>
              </p>
            </div>
            <div className="hidden md:flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white/10">
              <Store className="size-8 text-white" />
            </div>
          </div>

          {/* ── KPI stats (top 3) ── */}
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            {[
              { label: t("kpiOrders"), value: totalOrders, icon: ShoppingBag, color: "#1B4D91" },
              { label: t("kpiRevenue"), value: `${(totalRevenue / 1000).toFixed(0)}K`, icon: TrendingUp, color: "#10b981" },
              { label: t("kpiDelivered"), value: deliveredCount, icon: CheckCircle, color: "#8b5cf6" },
            ].map((kpi) => {
              const Icon = kpi.icon;
              return (
                <div key={kpi.label} className="rounded-3xl bg-white border border-slate-100 shadow-sm p-4 flex flex-col gap-2">
                  <div className="flex size-9 items-center justify-center rounded-xl" style={{ backgroundColor: `${kpi.color}15`, color: kpi.color }}>
                    <Icon className="size-4" />
                  </div>
                  <p className="text-[20px] font-black text-[#1B4D91] leading-none">{kpi.value}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{kpi.label}</p>
                </div>
              );
            })}
          </div>

          {/* ── Quick actions ── */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: t("actionProducts"), sub: t("actionProductsSub"), icon: Package, href: "/seller/products", accent: "#1B4D91" },
              { label: t("actionOrders"), sub: t("actionOrdersSub"), icon: ClipboardList, href: "/seller/orders", accent: "#1B4D91" },
              { label: t("actionAdd"), sub: t("actionAddSub"), icon: PlusCircle, href: "/seller/products", accent: "#10b981" },
              { label: t("actionDelivery"), sub: `${pendingCount} ${t("actionDeliverySub")}`, icon: Truck, href: "/seller/orders", accent: "#f59e0b" },
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
                    <p className="text-[11px] text-slate-400 font-medium">{action.sub}</p>
                  </div>
                  <ArrowRight className="ml-auto size-4 text-slate-200 group-hover:text-[#1B4D91]/30 transition-colors shrink-0" />
                </Link>
              );
            })}
          </div>

          {/* ── Order status breakdown ── */}
          {data && Object.keys(breakdown).length > 0 && (
            <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="size-4 text-[#1B4D91]" />
                  <h2 className="text-[14px] font-black text-[#1B4D91]">{t("breakdownTitle")}</h2>
                </div>
                <Link href="/seller/orders" className="text-[11px] font-bold text-[#1B4D91]/60 hover:text-[#1B4D91] transition-colors flex items-center gap-1">
                  {t("viewAll")} <ArrowRight className="size-3" />
                </Link>
              </div>

              <div className="space-y-2">
                {Object.entries(breakdown).map(([status, count]) => {
                  const cfg = statusConfig[status] ?? { label: status, icon: Package, color: "#64748b" };
                  const Icon = cfg.icon;
                  const pct = totalOrders > 0 ? Math.round(((count as number) / totalOrders) * 100) : 0;
                  return (
                    <div key={status} className="flex items-center gap-3">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${cfg.color}15` }}>
                        <Icon className="size-3.5" style={{ color: cfg.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[12px] font-semibold text-slate-600">{cfg.label}</span>
                          <span className="text-[12px] font-black text-[#1B4D91]">{count as number}</span>
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
            <div className="rounded-3xl bg-gradient-to-r from-[#1B4D91] to-[#2a6dd9] p-5 text-white shadow-lg shadow-[#1B4D91]/20">
              <p className="text-[11px] font-black uppercase tracking-widest text-white/60 mb-1">{t("revenueTitle")}</p>
              <p className="text-3xl font-black">{totalRevenue.toLocaleString("ru-RU")} <span className="text-xl opacity-60">UZS</span></p>
              <div className="mt-3 flex items-center gap-1.5 text-white/70 text-[12px] font-semibold">
                <TrendingUp className="size-3.5" />
                <span>{t("revenueSubtitle")}</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}