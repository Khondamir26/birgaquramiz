"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useFetch } from "@/hooks/useFetch";
import {
    getAdminDeletionRequests,
    approveAdminDeletionRequest,
    rejectAdminDeletionRequest,
    type DeletionRequest,
} from "@/lib/api/admin";
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
    Trash2,
    Check,
    X,
    AlertTriangle,
    ImageIcon,
    User,
    Phone,
    Building,
    Clock,
    Package,
} from "lucide-react";

export default function AdminDeletionRequestsPage() {
    const router = useRouter();
    const t = useTranslations("AdminDeletionRequests");

    const fetcher = useCallback(() => getAdminDeletionRequests(), []);
    const { data: requests, loading, error, refetch } = useFetch(fetcher);

    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<{
        type: "approve" | "reject";
        request: DeletionRequest;
    } | null>(null);
    const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

    const handleAction = async (type: "approve" | "reject", requestId: string) => {
        setActionLoading(requestId);
        setFeedback(null);
        try {
            if (type === "approve") {
                await approveAdminDeletionRequest(requestId);
                setFeedback({ type: "success", msg: t("approvedSuccess") });
            } else {
                await rejectAdminDeletionRequest(requestId);
                setFeedback({ type: "success", msg: t("rejectedSuccess") });
            }
            refetch();
        } catch (err) {
            setFeedback({ type: "error", msg: err instanceof Error ? err.message : "Error" });
        } finally {
            setActionLoading(null);
            setConfirmDialog(null);
        }
    };

    // ── Loading ──
    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-[#f4f6fa] pb-28 md:pb-12">
                <div className="mx-auto w-full md:max-w-7xl">
                    <div className="mx-auto flex flex-col gap-6 px-4 md:px-6 max-w-md md:max-w-none pt-4 md:pt-6">
                        <div className="h-16 animate-pulse rounded-3xl bg-white" />
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-40 animate-pulse rounded-3xl bg-white" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const isEmpty = !requests || requests.length === 0;

    return (
        <div className="flex flex-col min-h-screen bg-[#f4f6fa] pb-28 md:pb-12">
            <div className="mx-auto w-full md:max-w-7xl">
                <div className="mx-auto flex flex-col gap-5 px-4 md:px-6 max-w-md md:max-w-none pt-4 md:pt-6">

                    {/* ── Header ── */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push("/admin")}
                            className="flex items-center gap-2 text-sm font-bold text-[#1B4D91] hover:underline"
                        >
                            <ArrowLeft className="size-4" />
                        </button>
                        <div>
                            <h1 className="text-xl font-black text-[#1B4D91]">{t("title")}</h1>
                            <p className="text-[12px] text-slate-400 font-medium">{t("subtitle")}</p>
                        </div>
                    </div>

                    {/* ── Feedback ── */}
                    {feedback && (
                        <div className={`rounded-2xl px-5 py-3 text-[13px] font-bold ${feedback.type === "success"
                            ? "bg-emerald-50 border border-emerald-100 text-emerald-700"
                            : "bg-red-50 border border-red-100 text-[#E31E24]"
                            }`}>
                            {feedback.msg}
                        </div>
                    )}

                    {/* ── Error ── */}
                    {error && (
                        <div className="rounded-2xl bg-red-50 border border-red-100 px-5 py-3 text-[13px] font-bold text-[#E31E24]">
                            {error}
                        </div>
                    )}

                    {/* ── Empty ── */}
                    {isEmpty && !error && (
                        <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-10 text-center">
                            <div className="flex size-16 mx-auto items-center justify-center rounded-full bg-emerald-50 text-emerald-500 mb-4">
                                <Check className="size-8" />
                            </div>
                            <h3 className="text-[16px] font-black text-[#1B4D91]">{t("noRequests")}</h3>
                            <p className="text-[13px] text-slate-400 font-medium mt-1">{t("noRequestsSub")}</p>
                        </div>
                    )}

                    {/* ── Request Cards ── */}
                    {requests?.map((req) => {
                        const isProcessing = actionLoading === req.id;
                        const imageUrl = req.product.imageUrl ? resolveImageUrl(req.product.imageUrl) : "";

                        return (
                            <div key={req.id} className="rounded-3xl bg-white border border-slate-100 shadow-sm overflow-hidden">
                                <div className="flex flex-col md:flex-row">

                                    {/* Product Image */}
                                    <div className="w-full md:w-48 h-44 md:h-auto shrink-0 bg-slate-50">
                                        {imageUrl ? (
                                            <img src={imageUrl} alt={req.product.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-slate-300">
                                                <ImageIcon className="size-12" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 p-5 flex flex-col gap-3">
                                        {/* Product info */}
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h3 className="text-[16px] font-black text-[#1B4D91] leading-tight">{req.product.name}</h3>
                                                <p className="text-[13px] font-bold text-[#E31E24] mt-0.5">
                                                    {req.product.price.toLocaleString()} <span className="text-[11px] text-slate-400">UZS</span>
                                                </p>
                                            </div>
                                            <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-red-700">
                                                <Trash2 className="size-3 mr-1" />
                                                {t("deletionTag")}
                                            </span>
                                        </div>

                                        {/* Seller info */}
                                        <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-[12px] text-slate-500">
                                            <span className="flex items-center gap-1.5">
                                                <Building className="size-3.5 text-slate-400" />
                                                <span className="font-semibold">{req.seller.company}</span>
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <User className="size-3.5 text-slate-400" />
                                                <span className="font-medium">{req.seller.user.name}</span>
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <Phone className="size-3.5 text-slate-400" />
                                                <span className="font-medium">{req.seller.user.phone}</span>
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <Clock className="size-3.5 text-slate-400" />
                                                <span className="font-medium">{new Date(req.createdAt).toLocaleDateString()}</span>
                                            </span>
                                        </div>

                                        {/* Reason */}
                                        <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4">
                                            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">{t("reason")}</p>
                                            <p className="text-[13px] text-amber-800 font-medium leading-relaxed">{req.reason}</p>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-3 mt-1">
                                            <Button
                                                variant="destructive"
                                                disabled={isProcessing}
                                                onClick={() => setConfirmDialog({ type: "approve", request: req })}
                                                className="h-10 rounded-2xl font-bold text-[13px] gap-1.5 px-6"
                                            >
                                                <Check className="size-4" />
                                                {t("approveBtn")}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                disabled={isProcessing}
                                                onClick={() => setConfirmDialog({ type: "reject", request: req })}
                                                className="h-10 rounded-2xl font-bold text-[13px] gap-1.5 px-6 border-slate-200"
                                            >
                                                <X className="size-4" />
                                                {t("rejectBtn")}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ── Confirmation Dialog ── */}
            <Dialog open={!!confirmDialog} onOpenChange={() => setConfirmDialog(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {confirmDialog?.type === "approve" ? t("confirmApproveTitle") : t("confirmRejectTitle")}
                        </DialogTitle>
                        <DialogDescription>
                            {confirmDialog?.type === "approve"
                                ? t("confirmApproveDesc", { product: confirmDialog?.request.product.name ?? "" })
                                : t("confirmRejectDesc", { product: confirmDialog?.request.product.name ?? "" })}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setConfirmDialog(null)}
                            disabled={!!actionLoading}
                            className="rounded-xl"
                        >
                            {t("cancel")}
                        </Button>
                        <Button
                            variant={confirmDialog?.type === "approve" ? "destructive" : "default"}
                            disabled={!!actionLoading}
                            onClick={() => confirmDialog && handleAction(confirmDialog.type, confirmDialog.request.id)}
                            className="rounded-xl gap-1.5"
                        >
                            {confirmDialog?.type === "approve" ? (
                                <>
                                    <Trash2 className="size-4" />
                                    {actionLoading ? t("pleaseWait") : t("confirmApproveBtn")}
                                </>
                            ) : (
                                <>
                                    <X className="size-4" />
                                    {actionLoading ? t("pleaseWait") : t("confirmRejectBtn")}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
