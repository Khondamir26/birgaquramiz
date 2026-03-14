"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useFetch } from "@/hooks/useFetch";
import {
    getMySellerProduct,
    deleteMySellerProduct,
    requestProductDeletion,
} from "@/lib/api/products";
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
    Pencil,
    Trash2,
    ExternalLink,
    Hash,
    Calendar,
    Box,
    AlertTriangle,
    ImageIcon,
    Clock,
    Send,
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

export default function SellerProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const t = useTranslations("SellerProductDetail");
    const id = String(params.id ?? "");

    const fetcher = useCallback(() => getMySellerProduct(id), [id]);
    const { data: product, loading, error } = useFetch(fetcher);

    // Delete dialog state
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    // Request deletion dialog state (for APPROVED products)
    const [requestDialogOpen, setRequestDialogOpen] = useState(false);
    const [deletionReason, setDeletionReason] = useState("");
    const [requestLoading, setRequestLoading] = useState(false);
    const [requestSuccess, setRequestSuccess] = useState("");
    const [actionError, setActionError] = useState("");

    const handleDelete = async () => {
        setDeleteLoading(true);
        setActionError("");
        try {
            await deleteMySellerProduct(id);
            router.push("/seller/products");
        } catch (err) {
            setActionError(err instanceof Error ? err.message : "Failed to delete");
        } finally {
            setDeleteLoading(false);
            setDeleteDialogOpen(false);
        }
    };

    const handleRequestDeletion = async () => {
        if (!deletionReason.trim()) return;
        setRequestLoading(true);
        setActionError("");
        setRequestSuccess("");
        try {
            await requestProductDeletion(id, deletionReason.trim());
            setRequestSuccess(t("requestSentSuccess"));
            setRequestDialogOpen(false);
            setDeletionReason("");
        } catch (err) {
            setActionError(err instanceof Error ? err.message : "Failed to send request");
        } finally {
            setRequestLoading(false);
        }
    };

    // ── Loading ──
    if (!id) {
        return (
            <div className="flex flex-col min-h-screen bg-[#f4f6fa] pb-28 md:pb-12">
                <div className="mx-auto w-full md:max-w-7xl">
                    <div className="mx-auto flex flex-col gap-4 px-4 md:px-6 max-w-md md:max-w-none pt-4 md:pt-6">
                        <button
                            onClick={() => router.push("/seller/products")}
                            className="flex items-center gap-2 text-sm font-bold text-[#1B4D91] hover:underline w-fit"
                        >
                            <ArrowLeft className="size-4" />
                            {t("backToList")}
                        </button>
                        <div className="rounded-3xl border border-[#E31E24]/20 bg-[#E31E24]/5 p-6 text-center">
                            <p className="text-[15px] font-bold text-[#E31E24]">
                                {t("errorNotFound")}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-[#f4f6fa] pb-28 md:pb-12">
                <div className="mx-auto w-full md:max-w-7xl">
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
                    </div>
                </div>
            </div>
        );
    }

    // ── Error ──
    if (error) {
        const is403 = error.includes("403") || error.toLowerCase().includes("access denied") || error.toLowerCase().includes("forbidden");
        const is404 = error.includes("404") || error.toLowerCase().includes("not found");

        return (
            <div className="flex flex-col min-h-screen bg-[#f4f6fa] pb-28 md:pb-12">
                <div className="mx-auto w-full md:max-w-7xl">
                    <div className="mx-auto flex flex-col gap-4 px-4 md:px-6 max-w-md md:max-w-none pt-4 md:pt-6">
                        <button
                            onClick={() => router.push("/seller/products")}
                            className="flex items-center gap-2 text-sm font-bold text-[#1B4D91] hover:underline w-fit"
                        >
                            <ArrowLeft className="size-4" />
                            {t("backToList")}
                        </button>
                        <div className="rounded-3xl border border-[#E31E24]/20 bg-[#E31E24]/5 p-6 text-center">
                            <p className="text-[15px] font-bold text-[#E31E24]">
                                {is403 ? t("errorAccessDenied") : is404 ? t("errorNotFound") : error}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!product) return null;

    const isPending = product.status === "PENDING";
    const isRejected = product.status === "REJECTED";
    const isApproved = product.status === "APPROVED";
    const canDirectDelete = isPending || isRejected;
    const canEdit = isPending || isRejected;
    const imageUrl = product.images[0] ? resolveImageUrl(product.images[0]) : "";

    return (
        <div className="flex flex-col min-h-screen bg-[#f4f6fa] pb-28 md:pb-12">
            <div className="mx-auto w-full md:max-w-7xl">
                <div className="mx-auto flex flex-col gap-5 px-4 md:px-6 max-w-md md:max-w-none pt-4 md:pt-6">

                    {/* ── Back ── */}
                    <button
                        onClick={() => router.push("/seller/products")}
                        className="flex items-center gap-2 text-sm font-bold text-[#1B4D91] hover:underline w-fit"
                    >
                        <ArrowLeft className="size-4" />
                        {t("backToList")}
                    </button>

                    {/* ── Feedback Messages ── */}
                    {actionError && (
                        <div className="rounded-2xl bg-red-50 border border-red-100 px-5 py-3 text-[13px] font-bold text-[#E31E24]">
                            {actionError}
                        </div>
                    )}
                    {requestSuccess && (
                        <div className="rounded-2xl bg-emerald-50 border border-emerald-100 px-5 py-3 text-[13px] font-bold text-emerald-700">
                            {requestSuccess}
                        </div>
                    )}

                    {/* ── Product Info ── */}
                    <div className="grid gap-6 md:grid-cols-[400px_1fr]">

                        {/* Left — Image */}
                        <div className="rounded-3xl bg-white border border-slate-100 shadow-sm overflow-hidden">
                            {imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={imageUrl}
                                    alt={product.title}
                                    className="w-full h-[320px] md:h-[400px] object-cover"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-[320px] md:h-[400px] bg-slate-50 text-slate-300">
                                    <ImageIcon className="size-16" />
                                </div>
                            )}
                        </div>

                        {/* Right — Details */}
                        <div className="flex flex-col gap-4">
                            {/* Title + Status */}
                            <div className="flex items-start gap-3 flex-wrap">
                                <h1 className="text-xl md:text-2xl font-black text-[#1B4D91] leading-tight flex-1">
                                    {product.title}
                                </h1>
                                <StatusBadge status={product.status} />
                            </div>

                            {/* Key info grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-2xl bg-white border border-slate-100 p-4 shadow-sm">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("price")}</p>
                                    <p className="text-lg font-black text-[#E31E24] mt-1">
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

                            {/* Meta */}
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

                    {/* ── Rejection reason ── */}
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

                    {/* ── Action Buttons ── */}
                    <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-6">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#1B4D91]/10 text-[#1B4D91]">
                                <Box className="size-5" />
                            </div>
                            <h2 className="text-lg font-black text-[#1B4D91]">{t("actions")}</h2>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                            {/* Edit — always available for PENDING/REJECTED */}
                            {canEdit && (
                                <Link
                                    href={`/seller/products/${product.id}/edit`}
                                    className="flex-1 sm:flex-none h-12 rounded-2xl bg-[#1B4D91] hover:bg-[#153a70] text-white font-bold text-[14px] gap-2 px-8 transition-all shadow-sm inline-flex items-center justify-center"
                                >
                                    <Pencil className="size-4" />
                                    {t("editBtn")}
                                </Link>
                            )}

                            {/* Direct delete — only for PENDING/REJECTED */}
                            {canDirectDelete && (
                                <Button
                                    variant="destructive"
                                    disabled={deleteLoading}
                                    onClick={() => setDeleteDialogOpen(true)}
                                    className="flex-1 sm:flex-none h-12 rounded-2xl hover:bg-red-700 font-bold text-[14px] gap-2 px-8 transition-all shadow-sm"
                                >
                                    <Trash2 className="size-4" />
                                    {t("deleteBtn")}
                                </Button>
                            )}

                            {/* APPROVED: View as User + Request Deletion */}
                            {isApproved && (
                                <>
                                    <Link
                                        href="/catalog"
                                        className="flex-1 sm:flex-none h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[14px] gap-2 px-8 transition-all shadow-sm inline-flex items-center justify-center"
                                    >
                                        <ExternalLink className="size-4" />
                                        {t("viewAsUser")}
                                    </Link>
                                    <Button
                                        variant="outline"
                                        onClick={() => setRequestDialogOpen(true)}
                                        className="flex-1 sm:flex-none h-12 rounded-2xl border-red-200 text-red-600 hover:bg-red-50 font-bold text-[14px] gap-2 px-8 transition-all"
                                    >
                                        <Send className="size-4" />
                                        {t("requestDeletionBtn")}
                                    </Button>
                                </>
                            )}

                            {/* Pending note */}
                            {isPending && (
                                <div className="flex items-center gap-2 rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3">
                                    <Clock className="size-4 text-amber-600" />
                                    <span className="text-[12px] font-bold text-amber-700">{t("pendingNote")}</span>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>

            {/* ── Direct Delete Confirmation Dialog ── */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t("deleteDialogTitle")}</DialogTitle>
                        <DialogDescription>{t("deleteDialogDesc")}</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                            disabled={deleteLoading}
                            className="rounded-xl"
                        >
                            {t("cancel")}
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={deleteLoading}
                            onClick={handleDelete}
                            className="rounded-xl gap-1.5"
                        >
                            <Trash2 className="size-4" />
                            {deleteLoading ? t("pleaseWait") : t("confirmDelete")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Request Deletion Dialog (APPROVED products) ── */}
            <Dialog open={requestDialogOpen} onOpenChange={setRequestDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t("requestDeletionTitle")}</DialogTitle>
                        <DialogDescription>{t("requestDeletionDesc")}</DialogDescription>
                    </DialogHeader>
                    <textarea
                        value={deletionReason}
                        onChange={(e) => setDeletionReason(e.target.value)}
                        placeholder={t("requestDeletionPlaceholder")}
                        rows={4}
                        className="w-full resize-none rounded-xl border-2 border-slate-100 bg-slate-50/50 p-4 text-[14px] font-medium transition-colors focus:bg-white focus:border-[#1B4D91] focus:outline-none focus:ring-4 focus:ring-[#1B4D91]/10"
                    />
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setRequestDialogOpen(false)}
                            disabled={requestLoading}
                            className="rounded-xl"
                        >
                            {t("cancel")}
                        </Button>
                        <Button
                            variant="destructive"
                            disabled={requestLoading || !deletionReason.trim()}
                            onClick={handleRequestDeletion}
                            className="rounded-xl gap-1.5"
                        >
                            <Send className="size-4" />
                            {requestLoading ? t("pleaseWait") : t("submitRequest")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
