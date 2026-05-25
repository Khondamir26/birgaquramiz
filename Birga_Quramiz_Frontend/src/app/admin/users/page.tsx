"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAdminUsers, updateAdminUserRole, createAdminUser } from "@/lib/api/admin";
import type { PaginatedResponse, Role, User } from "@/types";
import { useTranslations } from "next-intl";
import { Search, Users, ChevronLeft, ChevronRight, CheckCircle, Shield, User as UserIcon, Store, BadgeCheck, Clock, Truck, Radio, ExternalLink, UserPlus, X, Headset } from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

const ROLE_OPTIONS: { value: Role; label: string; desc: string; icon: React.ElementType; color: string }[] = [
  { value: "USER",       label: "User",       desc: "Regular customer",          icon: UserIcon, color: "text-blue-600 bg-blue-50 border-blue-200" },
  { value: "DRIVER",     label: "Driver",     desc: "Delivery driver",           icon: Truck,    color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { value: "DISPATCHER", label: "Dispatcher", desc: "Manages driver assignments", icon: Headset,  color: "text-purple-600 bg-purple-50 border-purple-200" },
  { value: "SELLER",     label: "Seller",     desc: "Marketplace seller",        icon: Store,    color: "text-orange-600 bg-orange-50 border-orange-200" },
  { value: "ADMIN",      label: "Admin",      desc: "Full platform access",      icon: Shield,   color: "text-red-600 bg-red-50 border-red-200" },
];

function AddUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName]   = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole]   = useState<Role>("USER");
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Name is required."); return; }
    if (!phone.trim()) { setError("Phone is required."); return; }
    setSaving(true);
    setError("");
    try {
      await createAdminUser({ name: name.trim(), phone: phone.trim(), role });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setSaving(false);
    }
  };

  const selected = ROLE_OPTIONS.find((r) => r.value === role)!;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[440px] rounded-2xl bg-white shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <div>
            <h2 className="text-[16px] font-black text-slate-800">Add User</h2>
            <p className="text-[12px] text-slate-400 mt-0.5">User will log in via OTP to their phone</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        <form onSubmit={(e) => { void handleSubmit(e); }} className="px-6 pb-6 flex flex-col gap-5">

          {/* Name + Phone */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">Full Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Khondamir Tuychiboev"
                autoFocus
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-[13px] font-medium text-slate-700 outline-none focus:border-[#1B4D91] focus:bg-white focus:ring-2 focus:ring-[#1B4D91]/10 transition-all placeholder:text-slate-300"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">Phone Number</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+998 90 123 45 67"
                className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-[13px] font-mono text-slate-700 outline-none focus:border-[#1B4D91] focus:bg-white focus:ring-2 focus:ring-[#1B4D91]/10 transition-all placeholder:text-slate-300"
              />
            </div>
          </div>

          {/* Role picker */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">Role</label>
            <div className="grid grid-cols-5 gap-1.5">
              {ROLE_OPTIONS.map(({ value, label, icon: Icon, color }) => {
                const active = role === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRole(value)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-xl border py-2.5 px-1 text-center transition-all",
                      active
                        ? cn("border shadow-sm", color)
                        : "border-slate-200 bg-slate-50 text-slate-400 hover:border-slate-300 hover:bg-white"
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="text-[10px] font-black leading-none">{label}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              <span className="font-bold text-slate-600">{selected.label}:</span> {selected.desc}
            </p>
          </div>

          {/* OTP notice */}
          <div className="flex items-start gap-2.5 rounded-xl bg-blue-50 border border-blue-100 px-3.5 py-3">
            <UserPlus className="size-3.5 text-blue-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-blue-600 leading-relaxed">
              No password needed. The user will receive a one-time code to their phone when they first log in.
            </p>
          </div>

          {error && (
            <p className="text-[12px] font-medium text-red-500 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 rounded-xl border border-slate-200 text-[13px] font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 h-11 rounded-xl bg-[#1B4D91] text-[13px] font-bold text-white hover:bg-[#163d7a] disabled:opacity-50 transition-colors"
            >
              {saving ? "Creating…" : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const t = useTranslations("AdminUsers");
  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState<PaginatedResponse<User>["meta"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [roleError, setRoleError] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);
  const [addOpen, setAddOpen] = useState(false);

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
    <>
      {addOpen && (
        <AddUserModal
          onClose={() => setAddOpen(false)}
          onCreated={() => { setAddOpen(false); setReloadTick((v) => v + 1); }}
        />
      )}
    <div className="flex flex-col flex-1 pb-12">
      <div className="mx-auto w-full max-w-[1440px] px-4 pt-4 md:px-7 md:pt-7 flex flex-col gap-5">

          {/* ── Header ── */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#1B4D91]/10 text-[#1B4D91]">
                <Users className="size-5" />
              </div>
              <h1 className="text-xl md:text-2xl font-black text-[#1B4D91]">{t("title") || "Users"}</h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1.5 text-blue-700">
                <span className="text-[11px] md:text-xs font-bold whitespace-nowrap">
                  {t("totalUsers", { count: meta?.total ?? users.length }) || `${meta?.total ?? users.length} total`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setAddOpen(true)}
                className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-[#1B4D91] text-white text-[12px] font-bold hover:bg-[#163d7a] transition-colors"
              >
                <UserPlus className="size-3.5" />
                Add User
              </button>
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

                    {/* View link */}
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 text-[11px] font-bold text-[#1B4D91] hover:bg-[#1B4D91]/5 transition-colors shrink-0"
                    >
                      <ExternalLink className="size-3" />
                    </Link>

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
    </>
  );
}
