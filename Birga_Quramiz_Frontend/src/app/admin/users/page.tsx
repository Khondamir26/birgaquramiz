"use client";

import { useEffect, useState } from "react";
import { getAdminUsers, updateAdminUserRole } from "@/lib/api/admin";
import type { PaginatedResponse, Role, User } from "@/types";
import { useTranslations } from "next-intl";
import { Search, Users, ChevronLeft, ChevronRight, CheckCircle, Shield, User as UserIcon, Store, BadgeCheck, Clock, Truck, Radio } from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

export default function AdminUsersPage() {
  const t = useTranslations("AdminUsers");
  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState<PaginatedResponse<User>["meta"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [roleError, setRoleError] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  const [page, setPage] = useState(1);
  const [role, setRole] = useState<"ALL" | Role>("ALL");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await getAdminUsers({
          page,
          limit: PAGE_SIZE,
          role: role === "ALL" ? undefined : role,
          q: query.trim() || undefined,
        });

        if (cancelled) return;

        setUsers(res.data);
        setMeta(res.meta);
      } catch (err: unknown) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : t("loadError"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [page, role, query, t, reloadTick]);

  const handleRoleChange = async (user: User, nextRole: Role) => {
    if (user.role === nextRole || updatingUserId) return;

    const ok = window.confirm(`Change role for ${user.name} to ${nextRole}?`);
    if (!ok) return;
    let company: string | undefined;

    if (nextRole === "SELLER" && user.role !== "SELLER") {
      const input = window.prompt("Seller company name (optional):", `${user.name} Store`);
      if (input === null) return;
      company = input.trim() || undefined;
    }

    setUpdatingUserId(user.id);
    setRoleError("");

    try {
      await updateAdminUserRole(user.id, { role: nextRole, company });
      setReloadTick((value) => value + 1);
    } catch (err: unknown) {
      setRoleError(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const getRoleBadge = (r: Role) => {
    switch (r) {
      case "ADMIN":      return { icon: Shield,   bg: "bg-red-100",    text: "text-red-700",    label: t("roleAdmin") };
      case "SELLER":     return { icon: Store,    bg: "bg-orange-100", text: "text-orange-700", label: t("roleSeller") };
      case "DRIVER":     return { icon: Truck,    bg: "bg-green-100",  text: "text-green-700",  label: t("roleDriver") };
      case "DISPATCHER": return { icon: Radio,    bg: "bg-purple-100", text: "text-purple-700", label: t("roleDispatcher") };
      default:           return { icon: UserIcon, bg: "bg-blue-100",   text: "text-blue-700",   label: t("roleUser") };
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f6fa] pb-28 md:pb-12">
      <div className="mx-auto w-full md:max-w-[1488px]">
        <div className="mx-auto flex flex-col gap-5 px-4 md:px-6 max-w-md md:max-w-none pt-4 md:pt-6">

          {/* ── Header ── */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#1B4D91]/10 text-[#1B4D91]">
                <Users className="size-5" />
              </div>
              <h1 className="text-xl md:text-2xl font-black text-[#1B4D91]">{t("title") || "Users"}</h1>
            </div>

            <div className="flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1.5 text-blue-700">
              <span className="text-[11px] md:text-xs font-bold whitespace-nowrap">
                {t("totalUsers", { count: meta?.total ?? users.length }) || `${meta?.total ?? users.length} total`}
              </span>
            </div>
          </div>

          {/* ── Filters ── */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => { setPage(1); setQuery(e.target.value); }}
                placeholder={t("searchPlaceholder")}
                className="h-12 w-full rounded-2xl border-none bg-white pl-11 pr-4 text-sm font-medium text-slate-700 shadow-sm outline-none ring-1 ring-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-[#1B4D91] transition-all"
              />
            </div>
            <select
              value={role}
              onChange={(e) => { setPage(1); setRole(e.target.value as "ALL" | Role); }}
              className="h-12 w-full md:w-48 rounded-2xl border-none bg-white px-4 text-sm font-bold text-[#1B4D91] shadow-sm outline-none ring-1 ring-slate-100 focus:ring-2 focus:ring-[#1B4D91] transition-all cursor-pointer appearance-none"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%231B4D91'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: `right 16px center`, backgroundRepeat: `no-repeat`, backgroundSize: `16px` }}
            >
              <option value="ALL">{t("roleAll")}</option>
              <option value="USER">{t("roleUser")}</option>
              <option value="SELLER">{t("roleSeller")}</option>
              <option value="ADMIN">{t("roleAdmin")}</option>
              <option value="DRIVER">{t("roleDriver")}</option>
              <option value="DISPATCHER">{t("roleDispatcher")}</option>
            </select>
          </div>

          {roleError && (
            <div className="rounded-2xl border border-[#E31E24]/20 bg-[#E31E24]/5 px-4 py-3 text-[12px] font-semibold text-[#E31E24]">
              {roleError}
            </div>
          )}

          {/* ── Content ── */}
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-3xl bg-white shadow-sm" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-3xl border border-[#E31E24]/20 bg-[#E31E24]/5 p-6 text-[13px] font-semibold text-[#E31E24]">
              {error}
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/50 py-16 text-center">
              <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                <CheckCircle className="size-6" />
              </div>
              <p className="text-sm font-bold text-slate-600">No users found.</p>
            </div>
          ) : (
            <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
              {users.map((u, idx) => {
                const roleBadge = getRoleBadge(u.role);
                const RoleIcon = roleBadge.icon;
                return (
                  <div
                    key={u.id}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors",
                      idx !== 0 && "border-t border-slate-50"
                    )}
                  >
                    {/* Avatar */}
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#1B4D91]/8 text-[#1B4D91] font-black text-[12px]">
                      {u.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Name + phone */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[13px] font-bold text-slate-800 truncate">{u.name}</p>
                        <div className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 shrink-0", roleBadge.bg, roleBadge.text)}>
                          <RoleIcon className="size-2.5" />
                          <span className="text-[9px] uppercase tracking-wider font-black">{roleBadge.label}</span>
                        </div>
                        {u.role === "SELLER" && u.seller && (
                          u.seller.verified ? (
                            <div className="flex items-center gap-1 text-[9px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5 shrink-0">
                              <BadgeCheck className="size-2.5" /> Verified
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-[9px] font-black text-amber-600 bg-amber-50 border border-amber-100 rounded-full px-2 py-0.5 shrink-0">
                              <Clock className="size-2.5" /> Pending
                            </div>
                          )
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">{u.phone}</p>
                    </div>

                    {/* Date */}
                    <p className="hidden md:block text-[11px] text-slate-400 shrink-0 font-medium">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </p>

                    {/* Role select */}
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u, e.target.value as Role)}
                      disabled={updatingUserId === u.id}
                      className="h-8 w-32 shrink-0 rounded-xl border border-slate-200 bg-white px-2 text-[11px] font-bold text-[#1B4D91] outline-none focus:border-[#1B4D91]/40 focus:ring-2 focus:ring-[#1B4D91]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="USER">{t("roleUser")}</option>
                      <option value="SELLER">{t("roleSeller")}</option>
                      <option value="ADMIN">{t("roleAdmin")}</option>
                      <option value="DRIVER">{t("roleDriver")}</option>
                      <option value="DISPATCHER">{t("roleDispatcher")}</option>
                    </select>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Pagination ── */}
          {!loading && !error && users.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-[12px] font-bold text-slate-500">
                {t("pagination", { page: meta?.page ?? page, totalPages: meta?.totalPages ?? 1 })}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={(meta?.page ?? page) <= 1}
                  className="flex h-10 items-center justify-center gap-1 rounded-xl bg-white px-4 text-sm font-bold text-[#1B4D91] shadow-sm ring-1 ring-slate-100 transition-all hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white"
                >
                  <ChevronLeft className="size-4" /> {t("prev")}
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={Boolean(meta && meta.page >= meta.totalPages)}
                  className="flex h-10 items-center justify-center gap-1 rounded-xl bg-white px-4 text-sm font-bold text-[#1B4D91] shadow-sm ring-1 ring-slate-100 transition-all hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white"
                >
                  {t("next")} <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
