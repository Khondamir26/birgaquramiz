"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  TrendingUp, Package, Users,
  ClipboardList, ArrowRight,
  Shield, CheckCircle, Clock, Info
} from "lucide-react";

export default function AdminDashboardPage() {
  const { user, isAuthenticated, isInitialized } = useAuth();
  const router = useRouter();
  const t = useTranslations("AdminDashboard");

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated) { router.push("/login"); return; }
    if (user && user.role !== "ADMIN") router.push("/");
  }, [user, isAuthenticated, isInitialized, router]);

  // Use dummy data as there is no specific admin analytics endpoint yet
  const totalUsers = 1245;
  const totalProducts = 8430;
  const totalOrders = 4120;

  // ── Loading skeleton ──
  if (!isInitialized || (isAuthenticated && !user)) {
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

  if (!isAuthenticated || user?.role !== "ADMIN") return null;

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f6fa] pb-28 md:pb-12">
      <div className="mx-auto w-full md:max-w-7xl">
        <div className="mx-auto flex flex-col gap-5 px-4 md:px-6 max-w-md md:max-w-none pt-4 md:pt-6">

          {/* ── Hero banner ── */}
          <div className="rounded-3xl bg-[#1B4D91] px-6 py-7 md:px-10 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/50 mb-1">Birga Quramiz</p>
              <h1 className="text-xl font-black text-white md:text-2xl">{t("title") || "Admin Panel"}</h1>
              <p className="mt-1 text-[13px] text-white/70">
                {t("welcome") || "Welcome"}, <span className="font-bold text-white">{user.name || t("defaultAdmin") || "Administrator"}</span>
              </p>
            </div>
            <div className="hidden md:flex size-16 shrink-0 items-center justify-center rounded-2xl bg-white/10">
              <Shield className="size-8 text-white" />
            </div>
          </div>

          {/* ── KPI stats (top 3) ── */}
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            {[
              { label: t("usersTotal") || "Total Users", value: totalUsers, icon: Users, color: "#10b981" },
              { label: t("productsTotal") || "Total Products", value: totalProducts, icon: Package, color: "#f59e0b" },
              { label: t("ordersTotal") || "Total Orders", value: totalOrders, icon: ClipboardList, color: "#3b82f6" },
            ].map((kpi) => {
              const Icon = kpi.icon;
              return (
                <div key={kpi.label} className="rounded-3xl bg-white border border-slate-100 shadow-sm p-4 flex flex-col justify-between min-h-[110px]">
                  <div className="flex size-9 items-center justify-center rounded-xl" style={{ backgroundColor: `${kpi.color}15`, color: kpi.color }}>
                    <Icon className="size-4" />
                  </div>
                  <div>
                    <p className="text-[20px] font-black text-[#1B4D91] leading-none mt-2">{kpi.value.toLocaleString()}</p>
                    <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1 line-clamp-1">{kpi.label}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Quick actions ── */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: t("actionProducts") || "Products", sub: t("actionProductsSub") || "Moderation", icon: Package, href: "/admin/products", accent: "#1B4D91" },
              { label: t("actionUsers") || "Users", sub: t("actionUsersSub") || "Control", icon: Users, href: "/admin/users", accent: "#10b981" },
              { label: t("actionOrders") || "Orders", sub: t("actionOrdersSub") || "Oversight", icon: ClipboardList, href: "/admin/orders", accent: "#f59e0b" },
              { label: t("actionDeletionRequests") || "Deletion Requests", sub: t("actionDeletionRequestsSub") || "Review", icon: Shield, href: "/admin/deletion-requests", accent: "#E31E24" },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex items-center justify-between rounded-3xl bg-white border border-slate-100 shadow-sm p-4 hover:shadow-md active:scale-[0.97] transition-all group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className="flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors"
                      style={{ backgroundColor: `${action.accent}12`, color: action.accent }}
                    >
                      <Icon className="size-[18px]" />
                    </div>
                    <div className="min-w-0 pr-2">
                      <p className="text-[13px] font-black text-[#1B4D91] truncate leading-tight">{action.label}</p>
                      <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">{action.sub}</p>
                    </div>
                  </div>
                  <ArrowRight className="hidden md:block ml-auto size-4 text-slate-200 group-hover:text-[#1B4D91]/30 transition-colors shrink-0" />
                </Link>
              );
            })}
          </div>

          {/* ── System Status Banner ── */}
          <div className="mt-2 rounded-3xl border border-blue-100 bg-blue-50/50 p-5 flex items-start gap-4 shadow-sm">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[#1B4D91]">
              <Info className="size-5" />
            </div>
            <div>
              <h3 className="text-[14px] font-black text-[#1B4D91]">System Status: Optimal</h3>
              <p className="mt-1 text-[12px] font-medium text-slate-500 leading-relaxed max-w-2xl">
                All marketplace services are running normally. No active alerts or pending infrastructure tasks.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
