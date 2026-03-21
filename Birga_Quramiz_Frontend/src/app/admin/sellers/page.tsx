"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import {
  Store, Search, CheckCircle2, XCircle, Phone,
  Calendar, ChevronLeft, ChevronRight, Loader2, User,
} from "lucide-react";
import {
  getAdminPendingSellers, verifyAdminSeller, rejectAdminSeller,
  type PendingSeller,
} from "@/lib/api/admin";
import { cn } from "@/lib/utils";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" });
}

type ActionState = { id: string; action: "verify" | "reject" } | null;

export default function AdminSellersPage() {
  const { user, isAuthenticated, isInitialized } = useAuth();
  const router = useRouter();

  const [sellers, setSellers] = useState<PendingSeller[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [actionState, setActionState] = useState<ActionState>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated) { router.push("/login"); return; }
    if (user?.role !== "ADMIN") { router.push("/"); return; }
  }, [isInitialized, isAuthenticated, user, router]);

  const load = useCallback(async () => {
    if (!isAuthenticated || user?.role !== "ADMIN") return;
    setLoading(true);
    try {
      const res = await getAdminPendingSellers({ page, limit: 15, q: search || undefined });
      setSellers(res.data);
      setMeta({ total: res.meta.total, page: res.meta.page, totalPages: res.meta.totalPages });
    } catch {
      setError("Failed to load sellers");
    } finally {
      setLoading(false);
    }
  }, [page, search, isAuthenticated, user]);

  useEffect(() => {
    if (isInitialized && isAuthenticated && user?.role === "ADMIN") {
      void load();
    }
  }, [load, isInitialized, isAuthenticated, user]);

  const handleAction = async (seller: PendingSeller, action: "verify" | "reject") => {
    setActionState({ id: seller.id, action });
    setError(null);
    try {
      if (action === "verify") {
        await verifyAdminSeller(seller.id);
      } else {
        await rejectAdminSeller(seller.id);
      }
      setSuccessId(seller.id);
      setTimeout(() => {
        setSuccessId(null);
        setSellers((prev) => prev.filter((s) => s.id !== seller.id));
        setMeta((m) => ({ ...m, total: m.total - 1 }));
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionState(null);
    }
  };

  if (!isInitialized || !isAuthenticated || user?.role !== "ADMIN") return null;

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f6fa] pb-28 md:pb-12">
      <div className="mx-auto w-full md:max-w-[1440px] px-4 md:px-6 pt-5 md:pt-7 flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="flex size-8 items-center justify-center rounded-xl bg-[#0b3190]/10">
                <Store className="size-4 text-[#0b3190]" />
              </div>
              <h1 className="text-[20px] font-black text-slate-900">Seller Verification</h1>
            </div>
            <p className="text-[12px] text-slate-400 font-medium">
              {loading ? "Loading…" : `${meta.total} seller${meta.total !== 1 ? "s" : ""} awaiting verification`}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-300" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name, company or phone…"
            className="w-full h-11 pl-10 pr-4 rounded-2xl border border-slate-200 bg-white text-[13px] font-medium text-slate-700 placeholder:text-slate-300 focus:outline-none focus:border-[#0b3190] focus:ring-2 focus:ring-[#0b3190]/10 transition-all"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-[13px] font-semibold text-red-600">
            {error}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-44 rounded-2xl bg-white animate-pulse" />
            ))}
          </div>
        ) : sellers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex size-16 items-center justify-center rounded-full bg-emerald-50 mb-4">
              <CheckCircle2 className="size-8 text-emerald-400" />
            </div>
            <p className="text-[15px] font-black text-slate-700">No pending sellers</p>
            <p className="mt-1 text-[13px] text-slate-400">All seller applications have been reviewed.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sellers.map((seller) => {
              const isActing = actionState?.id === seller.id;
              const isDone = successId === seller.id;
              const actingVerify = isActing && actionState?.action === "verify";
              const actingReject = isActing && actionState?.action === "reject";

              return (
                <div
                  key={seller.id}
                  className={cn(
                    "bg-white rounded-2xl border shadow-sm flex flex-col transition-all duration-300",
                    isDone
                      ? actionState?.action === "verify" || successId
                        ? "border-emerald-200 bg-emerald-50/50"
                        : "border-red-200 bg-red-50/30"
                      : "border-slate-100 hover:shadow-md"
                  )}
                >
                  {/* Card header */}
                  <div className="px-5 pt-5 pb-4 flex items-start gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#0b3190]/8 text-[#0b3190] font-black text-[15px]">
                      {seller.company.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-black text-slate-900 truncate">{seller.company}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
                          <Store className="size-2.5" />
                          Pending
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Info rows */}
                  <div className="px-5 pb-5 flex flex-col gap-2 flex-1">
                    <div className="flex items-center gap-2 text-[12px] text-slate-500">
                      <User className="size-3.5 text-slate-300 shrink-0" />
                      <span className="font-semibold truncate">{seller.user.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[12px] text-slate-500">
                      <Phone className="size-3.5 text-slate-300 shrink-0" />
                      <span className="font-mono">{seller.user.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[12px] text-slate-500">
                      <Calendar className="size-3.5 text-slate-300 shrink-0" />
                      <span>Applied {formatDate(seller.user.createdAt)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-4 pb-4 flex gap-2">
                    {isDone ? (
                      <div className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl bg-emerald-100 text-emerald-700 text-[12px] font-black">
                        <CheckCircle2 className="size-4" />
                        Done
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => handleAction(seller, "verify")}
                          disabled={isActing}
                          className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl bg-[#0b3190] hover:bg-[#0a2d82] text-white text-[12px] font-black transition-all active:scale-95 disabled:opacity-50"
                        >
                          {actingVerify ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle2 className="size-3.5" />}
                          Verify
                        </button>
                        <button
                          onClick={() => handleAction(seller, "reject")}
                          disabled={isActing}
                          className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 text-[12px] font-black transition-all active:scale-95 disabled:opacity-50"
                        >
                          {actingReject ? <Loader2 className="size-3.5 animate-spin" /> : <XCircle className="size-3.5" />}
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className={cn(
                "flex size-9 items-center justify-center rounded-xl border-2 transition-all",
                page <= 1 ? "border-slate-100 text-slate-300 cursor-not-allowed" : "border-[#0b3190]/20 text-[#0b3190] hover:bg-[#0b3190]/5"
              )}
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-[13px] font-bold text-slate-500 px-2">
              {page} / {meta.totalPages}
            </span>
            <button
              disabled={page >= meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className={cn(
                "flex size-9 items-center justify-center rounded-xl border-2 transition-all",
                page >= meta.totalPages ? "border-slate-100 text-slate-300 cursor-not-allowed" : "border-[#0b3190]/20 text-[#0b3190] hover:bg-[#0b3190]/5"
              )}
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
