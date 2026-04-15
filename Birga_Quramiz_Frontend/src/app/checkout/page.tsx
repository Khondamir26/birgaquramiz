"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import {
  ShoppingBag, MapPin, Package, CreditCard, Banknote,
  CheckCircle2, ArrowLeft, Building2, ChevronRight,
  Loader2, User, Phone, MessageSquare, Truck,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { createGuestOrder, createOrder } from "@/lib/api/orders";
import { useTranslations } from "next-intl";
import { resolveImageUrl } from "@/lib/image";
import type { DeliveryType, PaymentMethod } from "@/types";

// ── Phone helpers ──────────────────────────────────────────────────────────────
function getDigits(value: string | undefined | null) {
  if (!value) return "";
  return value.replace(/\D/g, "");
}

function formatPhoneInput(value: string | undefined | null) {
  const digits = getDigits(value).slice(0, 12);
  const local = digits.startsWith("998") ? digits.slice(3) : digits.slice(-9);
  const p1 = local.slice(0, 2);
  const p2 = local.slice(2, 5);
  const p3 = local.slice(5, 7);
  const p4 = local.slice(7, 9);
  const parts = [p1, p2, p3, p4].filter(Boolean);
  return parts.length ? `+998 ${parts.join(" ")}` : "+998 ";
}

function normalizePhone(value: string | undefined | null) {
  const digits = getDigits(value);
  const local = digits.startsWith("998") ? digits.slice(3) : digits.slice(-9);
  return `+998${local}`;
}

function isValidPhone(value: string | undefined | null) {
  const digits = getDigits(value);
  if (digits.startsWith("998")) return digits.length === 12;
  return digits.length === 9;
}
// ──────────────────────────────────────────────────────────────────────────────

type CheckoutField = "customerName" | "customerPhone" | "deliveryAddress";
type FieldErrors = Partial<Record<CheckoutField, string>>;

const PAYMENT_OPTIONS: { value: PaymentMethod; icon: React.ElementType; labelKey: "CASH" | "CARD" | "TRANSFER" }[] = [
  { value: "CASH",     icon: Banknote,    labelKey: "CASH" },
  { value: "CARD",     icon: CreditCard,  labelKey: "CARD" },
  { value: "TRANSFER", icon: Building2,   labelKey: "TRANSFER" },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart } = useCartStore();
  const { user, isAuthenticated, isInitialized } = useAuth();
  const t = useTranslations("Checkout");

  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "+998 ",
    deliveryType: "DELIVERY" as DeliveryType,
    deliveryAddress: "",
    paymentMethod: "CASH" as PaymentMethod,
    comment: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [successOrderId, setSuccessOrderId] = useState("");

  useEffect(() => {
    if (!isInitialized) return;
    if (!isAuthenticated) { router.replace("/login?returnUrl=/checkout"); return; }
    if (user?.role === "ADMIN") { router.push("/admin"); return; }
    if (user?.role === "SELLER") { router.push("/seller/dashboard"); return; }
    if (user?.role === "USER") {
      setForm((prev) => ({
        ...prev,
        customerName: prev.customerName || user.name,
        customerPhone:
          prev.customerPhone.trim() === "+998" || prev.customerPhone.trim() === "+998 "
            ? formatPhoneInput(user.phone)
            : prev.customerPhone,
      }));
    }
  }, [isInitialized, isAuthenticated, user, router]);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const updateField = (field: CheckoutField, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    if (error) setError("");
  };

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (items.length === 0) { setError(t("errors.emptyCart")); return; }

    const nextErrors: FieldErrors = {};
    if (!form.customerName.trim()) nextErrors.customerName = t("errors.nameRequired");
    if (!isValidPhone(form.customerPhone)) nextErrors.customerPhone = t("errors.phoneInvalid");
    if (form.deliveryType === "DELIVERY" && !form.deliveryAddress.trim())
      nextErrors.deliveryAddress = t("errors.addressRequired");

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setError(Object.values(nextErrors)[0] || t("errors.checkoutFailed"));
      return;
    }

    setLoading(true);
    try {
      const payload = {
        items: items.map((item) => ({ productId: item.id, quantity: item.quantity })),
        customerName: form.customerName.trim(),
        customerPhone: normalizePhone(form.customerPhone),
        deliveryType: form.deliveryType,
        deliveryAddress: form.deliveryType === "DELIVERY" ? form.deliveryAddress.trim() : undefined,
        paymentMethod: form.paymentMethod,
        comment: form.comment.trim() || undefined,
      };
      const order =
        isAuthenticated && user?.role === "USER"
          ? await createOrder(payload)
          : await createGuestOrder(payload);
      clearCart();
      setSuccessOrderId(order.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("errors.checkoutFailed"));
    } finally {
      setLoading(false);
    }
  };

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (!isInitialized || (isAuthenticated && !user)) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] pt-8 pb-20">
        <div className="max-w-[1488px] mx-auto px-4 md:px-10">
          <div className="h-10 w-48 bg-white rounded-2xl animate-pulse mb-6" />
          <div className="grid lg:grid-cols-[1fr_400px] gap-6">
            <div className="flex flex-col gap-4">
              <div className="h-52 bg-white rounded-[24px] animate-pulse" />
              <div className="h-44 bg-white rounded-[24px] animate-pulse" />
              <div className="h-44 bg-white rounded-[24px] animate-pulse" />
            </div>
            <div className="hidden lg:block h-80 bg-white rounded-[24px] animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // ── Empty cart ──────────────────────────────────────────────────────────────
  if (items.length === 0 && !successOrderId) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] flex flex-col items-center justify-center px-4 py-24">
        <div className="flex size-28 items-center justify-center rounded-full bg-white border border-slate-100 shadow-sm mb-6">
          <ShoppingBag className="size-12 text-slate-300" />
        </div>
        <p className="text-[18px] font-bold text-slate-500 mb-6">{t("emptyCart")}</p>
        <Link
          href="/catalog"
          className="h-14 px-8 rounded-full bg-[#275fdb] text-white text-[15px] font-black shadow-lg shadow-[#275fdb]/25 hover:shadow-xl hover:shadow-[#275fdb]/30 transition-all flex items-center gap-2"
        >
          {t("goMarketplace")}
          <ChevronRight className="size-4" />
        </Link>
      </div>
    );
  }

  // ── Success screen ──────────────────────────────────────────────────────────
  if (successOrderId) {
    return (
      <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-[520px] bg-white rounded-[28px] shadow-sm border border-slate-100 p-8 md:p-12 flex flex-col items-center text-center">
          <div className="size-20 rounded-full bg-green-50 flex items-center justify-center mb-6">
            <CheckCircle2 className="size-10 text-green-500" strokeWidth={1.5} />
          </div>

          <h1 className="text-[24px] md:text-[28px] font-black text-black mb-2">{t("success.title")}</h1>
          <p className="text-[14px] text-slate-400 font-medium mb-8">
            {t("success.orderId", { id: successOrderId.slice(0, 8).toUpperCase() })}
          </p>

          <div className="w-full rounded-[18px] border border-slate-100 bg-[#F8FAFC] divide-y divide-slate-100 mb-8 text-left">
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center">
                  <User className="size-4 text-slate-400" />
                </div>
                <span className="text-[13px] font-semibold text-slate-500">{t("fields.fullName")}</span>
              </div>
              <span className="text-[14px] font-bold text-black">{form.customerName}</span>
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center">
                  <Phone className="size-4 text-slate-400" />
                </div>
                <span className="text-[13px] font-semibold text-slate-500">{t("fields.phone")}</span>
              </div>
              <span className="text-[14px] font-bold text-black">{form.customerPhone}</span>
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center">
                  <Truck className="size-4 text-slate-400" />
                </div>
                <span className="text-[13px] font-semibold text-slate-500">{t("success.delivery")}</span>
              </div>
              <span className="text-[14px] font-bold text-black">
                {form.deliveryType === "DELIVERY" ? t("delivery") : t("pickup")}
              </span>
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center">
                  <CreditCard className="size-4 text-slate-400" />
                </div>
                <span className="text-[13px] font-semibold text-slate-500">{t("success.payment")}</span>
              </div>
              <span className="text-[14px] font-bold text-black">{t(`payment.${form.paymentMethod}`)}</span>
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-[13px] font-bold text-slate-500">{t("summary.total")}</span>
              <span className="text-[18px] font-black text-[#1B4D91]">
                {total.toLocaleString("ru-RU")} <span className="text-[13px] text-slate-400">UZS</span>
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row w-full gap-3">
            <Link
              href="/catalog"
              className="flex-1 h-13 flex items-center justify-center rounded-full bg-[#275fdb] text-[14px] font-black text-white shadow-lg shadow-[#275fdb]/20 hover:shadow-xl transition-all"
            >
              {t("success.backMarketplace")}
            </Link>
            {isAuthenticated && user?.role === "USER" && (
              <Link
                href="/orders"
                className="flex-1 h-13 flex items-center justify-center rounded-full border-2 border-slate-200 bg-white text-[14px] font-bold text-slate-700 hover:border-[#1B4D91]/30 hover:text-[#1B4D91] transition-colors"
              >
                {t("success.myOrders")}
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Main checkout layout ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F0F2F5] pb-[calc(env(safe-area-inset-bottom)+144px)] md:pb-20 pt-6 md:pt-8">
      <div className="max-w-[1488px] mx-auto px-4 md:px-10">

        {/* Page header */}
        <div className="flex items-center gap-4 mb-6 md:mb-8">
          <Link
            href="/cart"
            className="flex items-center justify-center size-10 rounded-full bg-white border border-slate-100 shadow-sm text-slate-500 hover:text-slate-800 hover:shadow transition-all shrink-0"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <h1 className="text-[22px] md:text-[28px] font-black text-black">{t("title")}</h1>
        </div>

        <div className="grid lg:grid-cols-[1fr_390px] gap-6 items-start">

          {/* ── Left: form ─────────────────────────────────────────────────── */}
          <form id="checkout-form" onSubmit={placeOrder} className="flex flex-col gap-4">

            {/* Contact information */}
            <div className="bg-white rounded-[24px] p-5 md:p-7 shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-5">
                <div className="size-9 rounded-xl bg-[#EEF4FF] flex items-center justify-center">
                  <User className="size-4 text-[#1B4D91]" />
                </div>
                <h2 className="text-[16px] md:text-[18px] font-black text-black">{t("fields.fullName")}</h2>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    {t("fields.fullName")}
                  </label>
                  <input
                    value={form.customerName}
                    onChange={(e) => updateField("customerName", e.target.value)}
                    placeholder={t("fields.fullName")}
                    required
                    aria-invalid={Boolean(fieldErrors.customerName)}
                    className={`h-13 w-full rounded-[14px] border-2 bg-[#F8FAFC] px-4 text-[15px] font-medium text-black placeholder:text-slate-300 outline-none transition-colors focus:bg-white ${
                      fieldErrors.customerName
                        ? "border-red-300 focus:border-red-400"
                        : "border-slate-100 focus:border-[#275fdb]/40"
                    }`}
                  />
                  {fieldErrors.customerName && (
                    <p className="mt-1.5 text-[12px] font-bold text-red-500">{fieldErrors.customerName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    {t("fields.phone")}
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-300 pointer-events-none" />
                    <input
                      value={form.customerPhone}
                      onChange={(e) => updateField("customerPhone", formatPhoneInput(e.target.value))}
                      inputMode="tel"
                      required
                      aria-invalid={Boolean(fieldErrors.customerPhone)}
                      className={`h-13 w-full rounded-[14px] border-2 bg-[#F8FAFC] pl-11 pr-4 text-[15px] font-medium text-black placeholder:text-slate-300 outline-none transition-colors focus:bg-white ${
                        fieldErrors.customerPhone
                          ? "border-red-300 focus:border-red-400"
                          : "border-slate-100 focus:border-[#275fdb]/40"
                      }`}
                    />
                  </div>
                  {fieldErrors.customerPhone && (
                    <p className="mt-1.5 text-[12px] font-bold text-red-500">{fieldErrors.customerPhone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Delivery type */}
            <div className="bg-white rounded-[24px] p-5 md:p-7 shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-5">
                <div className="size-9 rounded-xl bg-[#EEF4FF] flex items-center justify-center">
                  <Truck className="size-4 text-[#1B4D91]" />
                </div>
                <h2 className="text-[16px] md:text-[18px] font-black text-black">{t("fields.deliveryType")}</h2>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 mb-4">
                {/* Delivery card */}
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, deliveryType: "DELIVERY" }))}
                  className={`flex items-center gap-3 rounded-[16px] border-2 p-4 transition-all text-left ${
                    form.deliveryType === "DELIVERY"
                      ? "border-[#275fdb] bg-[#EEF4FF]"
                      : "border-slate-100 bg-[#F8FAFC] hover:border-slate-200"
                  }`}
                >
                  <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
                    form.deliveryType === "DELIVERY" ? "bg-[#275fdb] text-white" : "bg-slate-100 text-slate-400"
                  }`}>
                    <Package className="size-5" />
                  </div>
                  <span className={`text-[15px] font-bold ${
                    form.deliveryType === "DELIVERY" ? "text-[#1B4D91]" : "text-slate-600"
                  }`}>
                    {t("delivery")}
                  </span>
                </button>

                {/* Pickup card */}
                <button
                  type="button"
                  onClick={() => {
                    setForm((p) => ({ ...p, deliveryType: "PICKUP", deliveryAddress: "" }));
                    setFieldErrors((prev) => ({ ...prev, deliveryAddress: undefined }));
                  }}
                  className={`flex items-center gap-3 rounded-[16px] border-2 p-4 transition-all text-left ${
                    form.deliveryType === "PICKUP"
                      ? "border-[#275fdb] bg-[#EEF4FF]"
                      : "border-slate-100 bg-[#F8FAFC] hover:border-slate-200"
                  }`}
                >
                  <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
                    form.deliveryType === "PICKUP" ? "bg-[#275fdb] text-white" : "bg-slate-100 text-slate-400"
                  }`}>
                    <MapPin className="size-5" />
                  </div>
                  <span className={`text-[15px] font-bold ${
                    form.deliveryType === "PICKUP" ? "text-[#1B4D91]" : "text-slate-600"
                  }`}>
                    {t("pickup")}
                  </span>
                </button>
              </div>

              {/* Address field — animated appearance */}
              {form.deliveryType === "DELIVERY" && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                  <label className="block text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    {t("fields.address")}
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-300 pointer-events-none" />
                    <input
                      value={form.deliveryAddress}
                      onChange={(e) => updateField("deliveryAddress", e.target.value)}
                      placeholder={t("fields.address")}
                      required
                      aria-invalid={Boolean(fieldErrors.deliveryAddress)}
                      className={`h-13 w-full rounded-[14px] border-2 bg-[#F8FAFC] pl-11 pr-4 text-[15px] font-medium text-black placeholder:text-slate-300 outline-none transition-colors focus:bg-white ${
                        fieldErrors.deliveryAddress
                          ? "border-red-300 focus:border-red-400"
                          : "border-slate-100 focus:border-[#275fdb]/40"
                      }`}
                    />
                  </div>
                  {fieldErrors.deliveryAddress && (
                    <p className="mt-1.5 text-[12px] font-bold text-red-500">{fieldErrors.deliveryAddress}</p>
                  )}
                </div>
              )}
            </div>

            {/* Payment method */}
            <div className="bg-white rounded-[24px] p-5 md:p-7 shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-5">
                <div className="size-9 rounded-xl bg-[#EEF4FF] flex items-center justify-center">
                  <CreditCard className="size-4 text-[#1B4D91]" />
                </div>
                <h2 className="text-[16px] md:text-[18px] font-black text-black">{t("fields.paymentMethod")}</h2>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                {PAYMENT_OPTIONS.map(({ value, icon: Icon, labelKey }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, paymentMethod: value }))}
                    className={`flex flex-col items-center gap-2.5 rounded-[16px] border-2 py-4 px-3 transition-all ${
                      form.paymentMethod === value
                        ? "border-[#275fdb] bg-[#EEF4FF]"
                        : "border-slate-100 bg-[#F8FAFC] hover:border-slate-200"
                    }`}
                  >
                    <div className={`size-10 rounded-xl flex items-center justify-center ${
                      form.paymentMethod === value ? "bg-[#275fdb] text-white" : "bg-slate-100 text-slate-400"
                    }`}>
                      <Icon className="size-5" />
                    </div>
                    <span className={`text-[13px] font-bold text-center leading-tight ${
                      form.paymentMethod === value ? "text-[#1B4D91]" : "text-slate-600"
                    }`}>
                      {t(`payment.${labelKey}`)}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div className="bg-white rounded-[24px] p-5 md:p-7 shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-5">
                <div className="size-9 rounded-xl bg-[#EEF4FF] flex items-center justify-center">
                  <MessageSquare className="size-4 text-[#1B4D91]" />
                </div>
                <h2 className="text-[16px] md:text-[18px] font-black text-black">{t("fields.comment")}</h2>
              </div>
              <textarea
                rows={3}
                value={form.comment}
                onChange={(e) => setForm((p) => ({ ...p, comment: e.target.value }))}
                placeholder={t("fields.comment")}
                className="w-full resize-none rounded-[14px] border-2 border-slate-100 bg-[#F8FAFC] p-4 text-[15px] font-medium text-black placeholder:text-slate-300 outline-none focus:bg-white focus:border-[#275fdb]/40 transition-colors"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-[14px] bg-red-50 border border-red-100 px-4 py-3 text-[13px] font-bold text-red-600">
                {error}
              </div>
            )}

            {/* Desktop submit */}
            <button
              type="submit"
              disabled={loading}
              className="hidden lg:flex h-14 w-full items-center justify-center rounded-full bg-[#275fdb] text-[16px] font-black text-white shadow-lg shadow-[#275fdb]/25 hover:shadow-xl hover:shadow-[#275fdb]/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="size-5 animate-spin mr-2" />
                  {t("placing")}
                </>
              ) : t("confirm")}
            </button>
          </form>

          {/* ── Right: order summary sidebar ──────────────────────────────── */}
          <aside className="hidden lg:block sticky top-10">
            <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100">
              <h2 className="text-[18px] font-black text-black mb-5">{t("summary.title")}</h2>

              {/* Items list */}
              <div className="flex flex-col gap-4 mb-5">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="size-14 rounded-[12px] bg-[#F8FAFC] border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                      {item.image ? (
                        <Image
                          src={resolveImageUrl(item.image)}
                          alt={item.name}
                          width={56}
                          height={56}
                          className="h-full w-full object-contain p-1"
                        />
                      ) : (
                        <ShoppingBag className="size-5 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-black leading-snug line-clamp-2 mb-0.5">{item.name}</p>
                      <p className="text-[12px] text-slate-400 font-medium">
                        {item.quantity} × {item.price.toLocaleString("ru-RU")} UZS
                      </p>
                    </div>
                    <p className="text-[14px] font-black text-[#1B4D91] whitespace-nowrap shrink-0">
                      {(item.price * item.quantity).toLocaleString("ru-RU")}
                    </p>
                  </div>
                ))}
              </div>

              {/* Divider + meta */}
              <div className="border-t border-slate-100 pt-4 space-y-3 mb-5">
                <div className="flex justify-between text-[13px]">
                  <span className="font-medium text-slate-400">{t("summary.items")}</span>
                  <span className="font-bold text-black">{items.length}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="font-medium text-slate-400">{t("summary.delivery")}</span>
                  <span className="font-bold text-black">
                    {form.deliveryType === "DELIVERY" ? t("delivery") : t("pickup")}
                  </span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="font-medium text-slate-400">{t("fields.paymentMethod")}</span>
                  <span className="font-bold text-black">{t(`payment.${form.paymentMethod}`)}</span>
                </div>
              </div>

              {/* Total */}
              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-[14px] font-black text-slate-500">{t("summary.total")}</span>
                  <div className="text-right">
                    <span className="text-[26px] font-black text-[#1B4D91] leading-none">
                      {total.toLocaleString("ru-RU")}
                    </span>
                    <span className="text-[13px] text-slate-400 ml-1">UZS</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ── Mobile sticky bottom bar ──────────────────────────────────────── */}
      <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+72px)] left-0 right-0 z-40 lg:hidden">
        <div className="mx-4 mb-4 rounded-[28px] bg-white/95 backdrop-blur-xl border border-slate-200/50 shadow-[0_12px_48px_rgba(0,0,0,0.18)] px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex flex-col min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#275fdb] mb-0.5">{t("summary.total")}</p>
            <p className="text-[20px] font-black text-black leading-none truncate">
              {total.toLocaleString("ru-RU")}
              <span className="text-[12px] ml-1 text-slate-300 uppercase">UZS</span>
            </p>
          </div>
          <button
            type="submit"
            form="checkout-form"
            disabled={loading}
            className="h-13 px-6 rounded-full bg-[#275fdb] flex items-center justify-center gap-2 text-[14px] font-black text-white shadow-lg shadow-[#275fdb]/25 active:scale-95 disabled:opacity-50 transition-all shrink-0"
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                {t("confirm")}
                <ChevronRight className="size-4" strokeWidth={3} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
