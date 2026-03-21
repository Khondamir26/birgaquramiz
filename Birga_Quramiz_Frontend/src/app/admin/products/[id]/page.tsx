"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useFetch } from "@/hooks/useFetch";
import { getAdminProduct, approveAdminProduct, rejectAdminProduct } from "@/lib/api/admin";
import { resolveImageUrl } from "@/lib/image";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    ArrowLeft,
    CheckCircle,
    XCircle,
    ExternalLink,
    Package,
    User,
    Clock,
    Hash,
    Calendar,
    Building2,
    Phone,
    ShoppingBag,
    AlertTriangle,
    ImageIcon,
} from "lucide-react";

function StatusBadge({ status }: { status: string }) {
    const colorMap: Record<string, string> = {
        PENDING: "bg-amber-100 text-amber-800 border-amber-200",
        APPROVED: "bg-emerald-100 text-emerald-800 border-emerald-200",
        REJECTED: "bg-red-100 text-red-800 border-red-200",
    };
    return (
        <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${colorMap[status] || "bg-slate-100 text-slate-600 border-slate-200"}`}
        >
            {status}
        </span>
    );
}

function daysSince(dateStr: string): number {
    const created = new Date(dateStr);
    const now = new Date();
    return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
}

export default function AdminProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const t = useTranslations("AdminProductDetail");
    const id = String(params.id ?? "");

    const fetcher = useCallback(() => {
        if (!id) {
            return Promise.reject(new Error(t("errorNotFound")));
        }
        return getAdminProduct(id);
    }, [id, t]);
    const { data, loading, error, refetch } = useFetch(fetcher);

    const [actionLoading, setActionLoading] = useState(false);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [activeImageIdx, setActiveImageIdx] = useState(0);

    if (!id) {
        return (
            <div className="flex flex-col min-h-screen bg-[#f4f6fa] pb-28 md:pb-12">
                <div className="mx-auto w-full md:max-w-[1440px]">
                    <div className="mx-auto flex flex-col gap-4 px-4 md:px-6 max-w-md md:max-w-none pt-4 md:pt-6">
                        <button
                            onClick={() => router.push("/admin/products")}
                            className="flex items-center gap-2 text-sm font-bold text-[#1B4D91] hover:underline w-fit"
                        >
                            <ArrowLeft className="size-4" />
                            {t("backToList")}
                        </button>
                        <div className="rounded-3xl border border-[#E31E24]/20 bg-[#E31E24]/5 p-6 text-[13px] font-semibold text-[#E31E24]">
                            {t("errorNotFound")}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const handleApprove = async () => {
        setActionLoading(true);
        try {
            await approveAdminProduct(id);
            refetch();
        } catch {
            // error handled by useFetch on refetch
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) return;
        setActionLoading(true);
        try {
            await rejectAdminProduct(id, rejectReason.trim());
            setRejectDialogOpen(false);
            setRejectReason("");
            refetch();
        } catch {
            // error handled by useFetch on refetch
        } finally {
            setActionLoading(false);
        }
    };

    // ── Loading ──
    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-[#f4f6fa] pb-28 md:pb-12">
                <div className="mx-auto w-full md:max-w-[1440px]">
                    <div className="mx-auto flex flex-col gap-6 px-4 md:px-6 max-w-md md:max-w-none pt-4 md:pt-6">
                        <div className="h-10 w-40 animate-pulse rounded-2xl bg-white" />
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="h-80 animate-pulse rounded-3xl bg-white" />
                            <div className="space-y-4">
                                <div className="h-8 w-3/4 animate-pulse rounded-xl bg-white" />
                                <div className="h-6 w-1/3 animate-pulse rounded-full bg-white" />
                                <div className="h-32 animate-pulse rounded-2xl bg-white" />
                            </div>
                        </div>
                        <div className="h-48 animate-pulse rounded-3xl bg-white" />
                        <div className="h-20 animate-pulse rounded-3xl bg-white" />
                    </div>
                </div>
            </div>
        );
    }

    // ── Error ──
    if (error) {
        return (
            <div className="flex flex-col min-h-screen bg-[#f4f6fa] pb-28 md:pb-12">
                <div className="mx-auto w-full md:max-w-[1440px]">
                    <div className="mx-auto flex flex-col gap-4 px-4 md:px-6 max-w-md md:max-w-none pt-4 md:pt-6">
                        <button
                            onClick={() => router.push("/admin/products")}
                            className="flex items-center gap-2 text-sm font-bold text-[#1B4D91] hover:underline w-fit"
                        >
                            <ArrowLeft className="size-4" />
                            {t("backToList")}
                        </button>
                        <div className="rounded-3xl border border-[#E31E24]/20 bg-[#E31E24]/5 p-6 text-[13px] font-semibold text-[#E31E24]">
                            {error}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const { product, seller } = data;
    const isPending = product.status === "PENDING";
    const daysInModeration = daysSince(product.createdAt);
    const images = product.images.map((img) => resolveImageUrl(img));

    return (
        <div className="flex flex-col min-h-screen bg-[#f4f6fa] pb-28 md:pb-12">
            <div className="mx-auto w-full md:max-w-[1440px]">
                <div className="mx-auto flex flex-col gap-5 px-4 md:px-6 max-w-md md:max-w-none pt-4 md:pt-6">

                    {/* ── Back + Actions top bar ── */}
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <button
                            onClick={() => router.push("/admin/products")}
                            className="flex items-center gap-2 text-sm font-bold text-[#1B4D91] hover:underline"
                        >
                            <ArrowLeft className="size-4" />
                            {t("backToList")}
                        </button>

                        <Link
                            href={`/catalog`}
                            className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-500 hover:text-[#1B4D91] transition-colors"
                        >
                            <ExternalLink className="size-3.5" />
                            {t("viewAsUser")}
                        </Link>
                    </div>

                    {/* ── SECTION A: Product Info ── */}
                    <div className="grid gap-6 md:grid-cols-[400px_1fr]">

                        {/* Left — Image Gallery */}
                        <div className="rounded-3xl bg-white border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                            {images.length > 0 ? (
                                <>
                                    {/* Main image */}
                                    <div className="relative h-[280px] md:h-[360px] bg-slate-50">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={images[activeImageIdx]}
                                            alt={product.title}
                                            className="w-full h-full object-cover"
                                        />
                                        {images.length > 1 && (
                                            <>
                                                <button
                                                    onClick={() => setActiveImageIdx((i) => (i - 1 + images.length) % images.length)}
                                                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition-all border border-slate-100"
                                                >
                                                    <svg className="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                                                </button>
                                                <button
                                                    onClick={() => setActiveImageIdx((i) => (i + 1) % images.length)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition-all border border-slate-100"
                                                >
                                                    <svg className="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                                                </button>
                                                <span className="absolute bottom-3 right-3 bg-black/50 text-white text-[11px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">
                                                    {activeImageIdx + 1} / {images.length}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                    {/* Thumbnails */}
                                    {images.length > 1 && (
                                        <div className="flex gap-2 p-3 overflow-x-auto">
                                            {images.map((src, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setActiveImageIdx(idx)}
                                                    className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${activeImageIdx === idx ? 'border-[#1B4D91] shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                                >
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={src} alt="" className="w-full h-full object-cover" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="flex items-center justify-center h-[320px] md:h-[400px] bg-slate-50 text-slate-300">
                                    <ImageIcon className="size-16" />
                                </div>
                            )}
                        </div>

                        {/* Right — Details */}
                        <div className="flex flex-col gap-4">
                            {/* Title + Status */}
                            <div>
                                <div className="flex items-start gap-3 flex-wrap">
                                    <h1 className="text-xl md:text-2xl font-black text-[#1B4D91] leading-tight flex-1">
                                        {product.title}
                                    </h1>
                                    <StatusBadge status={product.status} />
                                </div>
                            </div>

                            {/* Days in moderation */}
                            <div className="flex items-center gap-1.5 text-[12px] font-semibold text-amber-700 bg-amber-50 rounded-lg px-3 py-1.5 w-fit border border-amber-100">
                                <Clock className="size-3.5" />
                                {t("daysInModeration", { days: daysInModeration })}
                            </div>

                            {/* Key info grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-2xl bg-white border border-slate-100 p-4 shadow-sm">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("price")}</p>
                                    <p className="text-lg font-black text-[#1B4D91] mt-1">
                                        {product.price.toLocaleString()} <span className="text-sm font-bold text-slate-400">UZS</span>
                                    </p>
                                </div>
                                <div className="rounded-2xl bg-white border border-slate-100 p-4 shadow-sm">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("stock")}</p>
                                    <p className="text-lg font-black text-[#1B4D91] mt-1">
                                        {product.stock} <span className="text-sm font-bold text-slate-400">{t("pcs")}</span>
                                    </p>
                                </div>
                            </div>

                            {/* Meta details */}
                            <div className="space-y-2.5">
                                {product.sku && (
                                    <div className="flex items-center gap-2.5 text-[13px] text-slate-600">
                                        <Hash className="size-3.5 text-[#1B4D91]" />
                                        <span className="font-semibold text-slate-400">Article:</span>
                                        <span className="font-black text-[#1B4D91] tracking-wide">{product.sku}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2.5 text-[13px] text-slate-600">
                                    <Hash className="size-3.5 text-slate-400" />
                                    <span className="font-semibold text-slate-400">{t("productId")}:</span>
                                    <span className="font-mono text-[12px] text-slate-500">{product.id}</span>
                                </div>
                                <div className="flex items-center gap-2.5 text-[13px] text-slate-600">
                                    <Calendar className="size-3.5 text-slate-400" />
                                    <span className="font-semibold text-slate-400">{t("createdAt")}:</span>
                                    <span className="font-medium">
                                        {new Date(product.createdAt).toLocaleDateString("en-US", {
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                        })}
                                    </span>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="rounded-2xl bg-white border border-slate-100 p-5 shadow-sm">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{t("description")}</p>
                                <p className="text-[13px] text-slate-600 leading-relaxed whitespace-pre-line">
                                    {product.description}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ── Rejection reason (if previously rejected) ── */}
                    {product.rejectionReason && (
                        <div className="rounded-3xl border border-red-100 bg-red-50/50 p-5 flex items-start gap-4 shadow-sm">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                                <AlertTriangle className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-[14px] font-black text-red-800">{t("rejectionReasonTitle")}</h3>
                                <p className="mt-1 text-[12px] font-medium text-red-700 leading-relaxed">
                                    {product.rejectionReason}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ── SECTION B: Seller Info ── */}
                    <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-6">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#1B4D91]/10 text-[#1B4D91]">
                                <User className="size-5" />
                            </div>
                            <h2 className="text-lg font-black text-[#1B4D91]">{t("sellerInfo")}</h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2.5 text-[13px]">
                                    <User className="size-3.5 text-slate-400" />
                                    <span className="font-semibold text-slate-400">{t("sellerName")}:</span>
                                    <span className="font-bold text-slate-700">{seller.name}</span>
                                </div>
                                {seller.companyName && (
                                    <div className="flex items-center gap-2.5 text-[13px]">
                                        <Building2 className="size-3.5 text-slate-400" />
                                        <span className="font-semibold text-slate-400">{t("companyName")}:</span>
                                        <span className="font-bold text-slate-700">{seller.companyName}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2.5 text-[13px]">
                                    <Phone className="size-3.5 text-slate-400" />
                                    <span className="font-semibold text-slate-400">{t("phone")}:</span>
                                    <span className="font-bold text-slate-700">{seller.phone}</span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2.5 text-[13px]">
                                    <Hash className="size-3.5 text-slate-400" />
                                    <span className="font-semibold text-slate-400">{t("sellerId")}:</span>
                                    <span className="font-mono text-[12px] text-slate-500">{seller.id}</span>
                                </div>
                                <div className="flex items-center gap-2.5 text-[13px]">
                                    <Calendar className="size-3.5 text-slate-400" />
                                    <span className="font-semibold text-slate-400">{t("registeredAt")}:</span>
                                    <span className="font-medium text-slate-700">
                                        {new Date(seller.createdAt).toLocaleDateString("en-US", {
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                        })}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2.5 text-[13px]">
                                    <ShoppingBag className="size-3.5 text-slate-400" />
                                    <span className="font-semibold text-slate-400">{t("totalProducts")}:</span>
                                    <span className="font-bold text-slate-700">{seller.productsCount}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 pt-4 border-t border-slate-100">
                            <Link
                                href={`/admin/users`}
                                className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#1B4D91] hover:underline"
                            >
                                <ExternalLink className="size-3.5" />
                                {t("viewSellerProfile")}
                            </Link>
                        </div>
                    </div>

                    {/* ── SECTION C: Moderation Actions ── */}
                    <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-6">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                                <Package className="size-5" />
                            </div>
                            <h2 className="text-lg font-black text-[#1B4D91]">{t("moderationActions")}</h2>
                        </div>

                        {isPending ? (
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                <Button
                                    disabled={actionLoading}
                                    onClick={handleApprove}
                                    className="flex-1 sm:flex-none h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[14px] gap-2 px-8 transition-all shadow-sm"
                                >
                                    <CheckCircle className="size-5" />
                                    {actionLoading ? t("pleaseWait") : t("approveBtn")}
                                </Button>
                                <Button
                                    variant="destructive"
                                    disabled={actionLoading}
                                    onClick={() => setRejectDialogOpen(true)}
                                    className="flex-1 sm:flex-none h-12 rounded-2xl hover:bg-red-700 font-bold text-[14px] gap-2 px-8 transition-all shadow-sm"
                                >
                                    <XCircle className="size-5" />
                                    {t("rejectBtn")}
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 border border-slate-100 p-4">
                                <StatusBadge status={product.status} />
                                <span className="text-[13px] font-semibold text-slate-500">
                                    {t("alreadyModerated")}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* ── Moderation History ── */}
                    {product.moderationLogs && product.moderationLogs.length > 0 && (
                        <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                                    <Clock className="size-5" />
                                </div>
                                <h2 className="text-lg font-black text-[#1B4D91]">{t("moderationHistory")}</h2>
                            </div>

                            <div className="space-y-3">
                                {product.moderationLogs.map((log) => (
                                    <div
                                        key={log.id}
                                        className="flex items-start gap-3 rounded-2xl border border-slate-100 p-4"
                                    >
                                        <div className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${log.action === "APPROVED"
                                            ? "bg-emerald-100 text-emerald-700"
                                            : "bg-red-100 text-red-700"
                                            }`}>
                                            {log.action === "APPROVED" ? (
                                                <CheckCircle className="size-4" />
                                            ) : (
                                                <XCircle className="size-4" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`text-[12px] font-bold ${log.action === "APPROVED" ? "text-emerald-700" : "text-red-700"
                                                    }`}>
                                                    {log.action}
                                                </span>
                                                <span className="text-[11px] text-slate-400">
                                                    {new Date(log.createdAt).toLocaleString()}
                                                </span>
                                            </div>
                                            {log.reason && (
                                                <p className="mt-1 text-[12px] text-slate-500">{log.reason}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* ── Reject Dialog ── */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t("rejectDialogTitle")}</DialogTitle>
                        <DialogDescription>{t("rejectDialogDesc")}</DialogDescription>
                    </DialogHeader>

                    <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder={t("rejectReasonPlaceholder")}
                        className="w-full min-h-[120px] rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium text-slate-700 outline-none resize-none focus:ring-2 focus:ring-[#1B4D91] focus:border-transparent transition-all placeholder:text-slate-400"
                    />

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setRejectDialogOpen(false)}
                            disabled={actionLoading}
                            className="rounded-xl"
                        >
                            {t("cancel")}
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={actionLoading || !rejectReason.trim()}
                            onClick={handleReject}
                            className="rounded-xl gap-1.5"
                        >
                            <XCircle className="size-4" />
                            {actionLoading ? t("pleaseWait") : t("confirmReject")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
