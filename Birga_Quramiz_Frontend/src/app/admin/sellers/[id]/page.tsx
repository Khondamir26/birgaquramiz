"use client";

import { useCallback, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useFetch } from "@/hooks/useFetch";
import { getAdminSellerDetail, verifyAdminSeller, rejectAdminSeller } from "@/lib/api/admin";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, Store, User, Phone, Calendar, Package,
  CheckCircle2, XCircle, Hash, ExternalLink, BadgeCheck,
  AlertTriangle,
} from "lucide-react";

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

const STATUS_MAP: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  REJECTED: "bg-red-50 text-red-600 border-red-200",
};

export default function AdminSellerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const fetcher = useCallback(() => getAdminSellerDetail(id), [id]);
  const { data: seller, loading, error, refetch } = useFetch(fetcher);

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  const handleVerify = async () => {
    setActionLoading(true);
    setActionError("");
    try {
      await verifyAdminSeller(id);
      refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to verify seller");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    setActionLoading(true);
    setActionError("");
    try {
      await rejectAdminSeller(id);
      refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to reject seller");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col flex-1 pb-12">
        <div className="mx-auto w-full max-w-[1440px] px-4 pt-4 md:px-7 md:pt-7 flex flex-col gap-4">
          <div className="h-8 w-32 animate-pulse rounded-xl bg-white" />
          <div className="grid md:grid-cols-[320px_1fr] gap-4">
            <div className="h-64 animate-pulse rounded-2xl bg-white" />
            <div className="flex flex-col gap-4">
              <div className="h-32 animate-pulse rounded-2xl bg-white" />
              <div className="h-56 animate-pulse rounded-2xl bg-white" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !seller) {
    return (
      <div className="flex flex-col flex-1 pb-12">
        <div className="mx-auto w-full max-w-[1440px] px-4 pt-4 md:px-7 md:pt-7 flex flex-col gap-4">
          <button
            onClick={() => router.push("/admin/sellers")}
            className="flex items-center gap-2 text-[13px] font-bold text-[#1B4D91] hover:underline w-fit"
          >
            <ArrowLeft className="size-4" /> Back to sellers
          </button>
          <div className="rounded-2xl border border-red-100 bg-red-50 p-5 text-[13px] font-medium text-red-600">
            {error ?? "Seller not found"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 pb-12">
      <div className="mx-auto w-full max-w-[1440px] px-4 pt-4 md:px-7 md:pt-7 flex flex-col gap-4">

        {/* ── Back ── */}
        <button
          onClick={() => router.push("/admin/sellers")}
          className="flex items-center gap-2 text-[13px] font-bold text-[#1B4D91] hover:underline w-fit"
        >
          <ArrowLeft className="size-4" /> Sellers
        </button>

        <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-4">

          {/* LEFT: Seller profile ── */}
          <div className="flex flex-col gap-4">

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
              <div className="flex flex-col items-center text-center gap-3 mb-5">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-[#1B4D91]/10">
                  <Store className="size-8 text-[#1B4D91]" />
                </div>
                <div>
                  <p className="text-[18px] font-black text-slate-800">{seller.company}</p>
                  {seller.articleNumber && (
                    <p className="text-[12px] text-slate-400 mt-0.5">#{seller.articleNumber}</p>
                  )}
                </div>
                <span className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border",
                  seller.verified
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                )}>
                  {seller.verified ? (
                    <><CheckCircle2 className="size-3" /> Verified</>
                  ) : (
                    <><AlertTriangle className="size-3" /> Pending</>
                  )}
                </span>
              </div>

              <div className="flex flex-col gap-2.5 border-t border-slate-100 pt-4">
                <div className="flex items-center gap-2.5 text-[13px]">
                  <User className="size-3.5 text-slate-400 shrink-0" />
                  <span className="font-bold text-slate-700">{seller.user.name}</span>
                </div>
                <div className="flex items-center gap-2.5 text-[13px]">
                  <Phone className="size-3.5 text-slate-400 shrink-0" />
                  <span className="text-slate-500 font-medium">{seller.user.phone}</span>
                </div>
                <div className="flex items-center gap-2.5 text-[13px]">
                  <Calendar className="size-3.5 text-slate-400 shrink-0" />
                  <span className="text-slate-500 font-medium">Joined {fmt(seller.user.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2.5 text-[13px]">
                  <Package className="size-3.5 text-slate-400 shrink-0" />
                  <span className="text-slate-500 font-medium">{seller._count.products} products</span>
                </div>
                <div className="flex items-center gap-2.5 text-[13px]">
                  <Hash className="size-3.5 text-slate-300 shrink-0" />
                  <span className="font-mono text-[11px] text-slate-400 truncate">{id}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100">
                <Link
                  href={`/admin/users/${seller.user.id}`}
                  className="flex items-center gap-1.5 text-[12px] font-bold text-[#1B4D91] hover:underline"
                >
                  <ExternalLink className="size-3.5" /> View user account
                </Link>
              </div>
            </div>

          </div>

          {/* RIGHT: Actions + Products ── */}
          <div className="flex flex-col gap-4">

            {/* Verification actions */}
            {!seller.verified && (
              <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="size-4 text-amber-500" />
                  <p className="text-[12px] font-black uppercase tracking-wider text-slate-500">Verification Required</p>
                </div>
                <p className="text-[13px] text-slate-500 mb-4">
                  This seller is pending verification. Review their profile and approve or reject their application.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => void handleVerify()}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-[13px] font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    <BadgeCheck className="size-4" />
                    Verify Seller
                  </button>
                  <button
                    onClick={() => void handleReject()}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-[13px] font-bold hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="size-4" />
                    Reject
                  </button>
                </div>
                {actionError && (
                  <p className="mt-2 text-[12px] font-medium text-red-500">{actionError}</p>
                )}
              </div>
            )}

            {seller.verified && (
              <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-4 flex items-center gap-3">
                <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-[13px] font-black text-emerald-800">Seller Verified</p>
                  <p className="text-[12px] text-emerald-600 mt-0.5">This seller is approved and active on the platform.</p>
                </div>
              </div>
            )}

            {/* Recent products */}
            {seller.recentProducts && seller.recentProducts.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="size-4 text-[#1B4D91]" />
                    <p className="text-[12px] font-black uppercase tracking-wider text-slate-500">
                      Products ({seller._count.products})
                    </p>
                  </div>
                </div>
                <div className="divide-y divide-slate-50">
                  {seller.recentProducts.map((p) => (
                    <Link
                      key={p.id}
                      href={`/admin/products/${p.id}`}
                      className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-colors group"
                    >
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="size-10 rounded-lg object-cover border border-slate-100 shrink-0"
                        />
                      ) : (
                        <div className="size-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                          <Package className="size-4 text-slate-300" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-bold text-slate-700 truncate">{p.name}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{fmt(p.createdAt)}</p>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <p className="text-[12px] font-black text-[#1B4D91]">
                          {p.price.toLocaleString("ru-RU")} UZS
                        </p>
                        <span className={cn(
                          "text-[10px] font-bold px-1.5 py-0.5 rounded",
                          STATUS_MAP[p.status] ?? "bg-slate-100 text-slate-500"
                        )}>
                          {p.status}
                        </span>
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
  );
}
