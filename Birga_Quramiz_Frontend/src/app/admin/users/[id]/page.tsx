"use client";

import { useCallback, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useFetch } from "@/hooks/useFetch";
import { getAdminUserDetail, updateAdminUserRole } from "@/lib/api/admin";
import { cn } from "@/lib/utils";
import type { Role, OrderStatus } from "@/types";
import {
  ArrowLeft, User, Calendar, Shield, Store,
  ClipboardList, Hash, CheckCircle2, XCircle,
  ExternalLink, Truck, Radio, X, AlertTriangle,
} from "lucide-react";

const ROLE_CONFIG: Record<Role, { label: string; icon: React.ElementType; color: string; badge: string }> = {
  USER:       { label: "User",       icon: User,    color: "bg-slate-100 text-slate-700 border-slate-200",   badge: "bg-slate-100 text-slate-600" },
  SELLER:     { label: "Seller",     icon: Store,   color: "bg-blue-50 text-blue-700 border-blue-200",       badge: "bg-blue-100 text-blue-700" },
  ADMIN:      { label: "Admin",      icon: Shield,  color: "bg-[#1B4D91]/10 text-[#1B4D91] border-[#1B4D91]/20", badge: "bg-[#1B4D91]/10 text-[#1B4D91]" },
  DISPATCHER: { label: "Dispatcher", icon: Radio,   color: "bg-purple-50 text-purple-700 border-purple-200", badge: "bg-purple-100 text-purple-700" },
  DRIVER:     { label: "Driver",     icon: Truck,   color: "bg-amber-50 text-amber-700 border-amber-200",    badge: "bg-amber-100 text-amber-700" },
};

const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  NEW:       "bg-blue-50 text-blue-600",
  PAID:      "bg-violet-50 text-violet-600",
  CONFIRMED: "bg-cyan-50 text-cyan-700",
  SHIPPED:   "bg-amber-50 text-amber-700",
  DELIVERED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-red-50 text-red-500",
};

const ALL_ROLES: Role[] = ["USER", "SELLER", "ADMIN", "DISPATCHER", "DRIVER"];

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" });
}

function RoleConfirmModal({
  currentRole,
  targetRole,
  userName,
  onConfirm,
  onCancel,
  loading,
  error,
}: {
  currentRole: Role;
  targetRole: Role;
  userName: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
  error: string;
}) {
  const from = ROLE_CONFIG[currentRole];
  const to = ROLE_CONFIG[targetRole];
  const FromIcon = from.icon;
  const ToIcon = to.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-amber-50">
            <AlertTriangle className="size-5 text-amber-500" />
          </div>
          <button
            onClick={onCancel}
            className="flex size-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="px-6 pb-6">
          <h2 className="text-[16px] font-black text-slate-800 mb-1">Change Role</h2>
          <p className="text-[13px] text-slate-400 mb-5">
            You are about to change the role for <span className="font-bold text-slate-600">{userName}</span>.
          </p>

          {/* Role transition visual */}
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 mb-5">
            <div className={cn("flex items-center gap-2 px-3 py-2 rounded-xl border text-[12px] font-bold flex-1 justify-center", from.color)}>
              <FromIcon className="size-3.5" />
              {from.label}
            </div>
            <div className="text-slate-300 font-bold text-[12px]">→</div>
            <div className={cn("flex items-center gap-2 px-3 py-2 rounded-xl border text-[12px] font-bold flex-1 justify-center", to.color)}>
              <ToIcon className="size-3.5" />
              {to.label}
            </div>
          </div>

          {targetRole === "ADMIN" && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100 mb-4 text-[12px] text-red-600 font-medium">
              <AlertTriangle className="size-3.5 shrink-0 mt-0.5" />
              This will grant full admin access to the platform.
            </div>
          )}

          {error && (
            <p className="mb-3 text-[12px] font-medium text-red-500">{error}</p>
          )}

          <div className="flex gap-2">
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 h-11 rounded-2xl border border-slate-200 text-[13px] font-bold text-slate-500 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 h-11 rounded-2xl bg-[#1B4D91] text-white text-[13px] font-bold hover:bg-[#163d7a] transition-colors disabled:opacity-50"
            >
              {loading ? "Saving…" : "Confirm"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const fetcher = useCallback(() => getAdminUserDetail(id), [id]);
  const { data: user, loading, error, refetch } = useFetch(fetcher);

  const [pendingRole, setPendingRole] = useState<Role | null>(null);
  const [roleLoading, setRoleLoading] = useState(false);
  const [roleError, setRoleError] = useState("");

  const openModal = (role: Role) => {
    if (!user || user.role === role) return;
    setRoleError("");
    setPendingRole(role);
  };

  const confirmRoleChange = async () => {
    if (!pendingRole) return;
    setRoleLoading(true);
    setRoleError("");
    try {
      await updateAdminUserRole(id, { role: pendingRole });
      setPendingRole(null);
      refetch();
    } catch (err) {
      setRoleError(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setRoleLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col flex-1 pb-12">
        <div className="mx-auto w-full max-w-[1440px] px-4 pt-4 md:px-7 md:pt-7 flex flex-col gap-4">
          <div className="h-8 w-32 animate-pulse rounded-xl bg-white" />
          <div className="grid md:grid-cols-[300px_1fr] gap-4">
            <div className="h-80 animate-pulse rounded-2xl bg-white" />
            <div className="flex flex-col gap-4">
              <div className="h-48 animate-pulse rounded-2xl bg-white" />
              <div className="h-64 animate-pulse rounded-2xl bg-white" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex flex-col flex-1 pb-12">
        <div className="mx-auto w-full max-w-[1440px] px-4 pt-4 md:px-7 md:pt-7 flex flex-col gap-4">
          <button
            onClick={() => router.push("/admin/users")}
            className="flex items-center gap-2 text-[13px] font-bold text-[#1B4D91] hover:underline w-fit"
          >
            <ArrowLeft className="size-4" /> Users
          </button>
          <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-[13px] font-medium text-red-600">
            {error ?? "User not found"}
          </div>
        </div>
      </div>
    );
  }

  const roleConfig = ROLE_CONFIG[user.role];
  const RoleIcon = roleConfig.icon;

  return (
    <>
      {pendingRole && (
        <RoleConfirmModal
          currentRole={user.role}
          targetRole={pendingRole}
          userName={user.name}
          onConfirm={() => void confirmRoleChange()}
          onCancel={() => setPendingRole(null)}
          loading={roleLoading}
          error={roleError}
        />
      )}

      <div className="flex flex-col flex-1 pb-12">
        <div className="mx-auto w-full max-w-[1440px] px-4 pt-4 md:px-7 md:pt-7 flex flex-col gap-4">

          {/* Back */}
          <button
            onClick={() => router.push("/admin/users")}
            className="flex items-center gap-2 text-[13px] font-bold text-[#1B4D91] hover:underline w-fit"
          >
            <ArrowLeft className="size-4" /> Users
          </button>

          <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-4">

            {/* LEFT: Profile */}
            <div className="flex flex-col gap-3">

              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Color band */}
                <div className="h-16 bg-gradient-to-r from-[#1B4D91]/10 to-[#1B4D91]/5" />

                {/* Avatar */}
                <div className="px-5 pb-5 -mt-8">
                  <div className="flex size-16 items-center justify-center rounded-2xl bg-[#1B4D91] text-white font-black text-[22px] shadow-lg mb-3 border-4 border-white">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <p className="text-[18px] font-black text-slate-800 leading-tight">{user.name}</p>
                  <p className="text-[13px] text-slate-400 font-medium mt-0.5">{user.phone}</p>

                  <div className={cn(
                    "inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 rounded-full text-[11px] font-bold border",
                    roleConfig.color
                  )}>
                    <RoleIcon className="size-3" />
                    {roleConfig.label}
                  </div>
                </div>

                {/* Info rows */}
                <div className="border-t border-slate-50 px-5 py-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2.5">
                    <Hash className="size-3.5 text-slate-300 shrink-0" />
                    <span className="font-mono text-[10px] text-slate-400 truncate">{user.id}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Calendar className="size-3.5 text-slate-400 shrink-0" />
                    <span className="text-[12px] text-slate-500 font-medium">Joined {fmt(user.createdAt)}</span>
                  </div>
                  {user._count && (
                    <div className="flex items-center gap-2.5">
                      <ClipboardList className="size-3.5 text-slate-400 shrink-0" />
                      <span className="text-[12px] text-slate-500 font-medium">
                        {user._count.placedOrders ?? user._count.orders ?? 0} orders total
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Seller card */}
              {user.seller && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Store className="size-3.5 text-[#1B4D91]" />
                    <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Seller Account</p>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[13px] font-bold text-slate-700">{user.seller.company}</span>
                    {user.seller.verified ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="size-2.5" /> Verified
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                        <XCircle className="size-2.5" /> Pending
                      </span>
                    )}
                  </div>
                  {user.seller._count && (
                    <p className="text-[12px] text-slate-400 mb-3">{user.seller._count.products} products</p>
                  )}
                  <Link
                    href={`/admin/sellers/${user.seller.id}`}
                    className="flex items-center gap-1.5 text-[12px] font-bold text-[#1B4D91] hover:underline"
                  >
                    <ExternalLink className="size-3.5" /> View seller profile
                  </Link>
                </div>
              )}
            </div>

            {/* RIGHT */}
            <div className="flex flex-col gap-4">

              {/* Role management */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="size-4 text-[#1B4D91]" />
                  <p className="text-[13px] font-black text-slate-700">Role Management</p>
                </div>
                <p className="text-[12px] text-slate-400 mb-4">Click a role to reassign this user. A confirmation will be required.</p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ALL_ROLES.map((r) => {
                    const cfg = ROLE_CONFIG[r];
                    const Icon = cfg.icon;
                    const active = user.role === r;
                    return (
                      <button
                        key={r}
                        onClick={() => openModal(r)}
                        disabled={active}
                        className={cn(
                          "group flex items-center gap-2.5 px-4 py-3 rounded-2xl border text-[12px] font-bold transition-all text-left",
                          active
                            ? cn("cursor-default shadow-sm", cfg.color)
                            : "bg-white border-slate-200 text-slate-500 hover:border-[#1B4D91]/30 hover:bg-[#1B4D91]/5 hover:text-[#1B4D91]"
                        )}
                      >
                        <div className={cn(
                          "flex size-7 shrink-0 items-center justify-center rounded-xl transition-colors",
                          active ? "bg-white/60" : "bg-slate-100 group-hover:bg-[#1B4D91]/10"
                        )}>
                          <Icon className="size-3.5" />
                        </div>
                        <div>
                          <p>{cfg.label}</p>
                          {active && <p className="text-[9px] font-black uppercase tracking-wider opacity-60 mt-0.5">Current</p>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Recent orders */}
              {user.recentOrders && user.recentOrders.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ClipboardList className="size-4 text-[#1B4D91]" />
                      <p className="text-[13px] font-black text-slate-700">Recent Orders</p>
                    </div>
                    <Link
                      href="/admin/orders"
                      className="text-[11px] font-bold text-[#1B4D91]/50 hover:text-[#1B4D91] transition-colors"
                    >
                      View all
                    </Link>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {user.recentOrders.map((order) => (
                      <Link
                        key={order.id}
                        href={`/admin/orders/${order.id}`}
                        className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors group"
                      >
                        <div className="min-w-0">
                          <p className="text-[12px] font-black text-slate-700 font-mono">
                            #{order.id.slice(0, 8).toUpperCase()}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {new Date(order.createdAt).toLocaleDateString("ru-RU")}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-2">
                          <span className={cn(
                            "inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold",
                            ORDER_STATUS_COLORS[order.status]
                          )}>
                            {order.status}
                          </span>
                          <p className="text-[13px] font-black text-[#1B4D91]">
                            {order.total.toLocaleString("ru-RU")} UZS
                          </p>
                          <ExternalLink className="size-3.5 text-slate-300 group-hover:text-[#1B4D91] transition-colors" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </>
  );
}
