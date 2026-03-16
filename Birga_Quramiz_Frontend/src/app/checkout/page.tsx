"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { ShoppingBag, MapPin, Package, CreditCard, Banknote, CheckCircle2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { createGuestOrder, createOrder } from "@/lib/api/orders";
import { useTranslations } from "next-intl";
import type { DeliveryType, PaymentMethod } from "@/types";

// ── Brand colours ─────────────────────────────────────────────────────────────
// Primary Blue #1B4D91 | Accent Red #E31E24
// ─────────────────────────────────────────────────────────────────────────────

type CheckoutField = "customerName" | "customerPhone" | "deliveryAddress";

type FieldErrors = Partial<Record<CheckoutField, string>>;

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

    if (isAuthenticated && user?.role === "ADMIN") {
      router.push("/admin");
      return;
    }

    if (isAuthenticated && user?.role === "SELLER") {
      router.push("/seller/dashboard");
      return;
    }

    if (user?.role === "USER") {
      setForm((prev) => ({
        ...prev,
        customerName: prev.customerName || user.name,
        customerPhone: prev.customerPhone.trim() === "+998" || prev.customerPhone.trim() === "+998 "
          ? formatPhoneInput(user.phone)
          : prev.customerPhone,
      }));
    }
  }, [isInitialized, isAuthenticated, user, router]);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const updateField = (field: CheckoutField, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (error) setError("");
  };

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (items.length === 0) {
      setError(t("errors.emptyCart"));
      return;
    }

    const nextFieldErrors: FieldErrors = {};

    if (!form.customerName.trim()) {
      nextFieldErrors.customerName = t("errors.nameRequired");
    }

    if (!isValidPhone(form.customerPhone)) {
      nextFieldErrors.customerPhone = t("errors.phoneInvalid");
    }

    if (form.deliveryType === "DELIVERY" && !form.deliveryAddress.trim()) {
      nextFieldErrors.deliveryAddress = t("errors.addressRequired");
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      setError(Object.values(nextFieldErrors)[0] || t("errors.checkoutFailed"));
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

      const order = isAuthenticated && user?.role === "USER"
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

  if (!isInitialized || (isAuthenticated && !user)) {
    return (
      <div className="page-shell max-w-5xl">
        <div className="surface-card h-48 animate-pulse" />
      </div>
    );
  }

  if (successOrderId) {
    return (
      <div className="page-shell max-w-3xl pb-32">
        <div className="surface-card rounded-[32px] p-8 md:p-12 text-center shadow-[0_4px_30px_rgb(0,0,0,0.03)] border-slate-100 flex flex-col items-center">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="size-10 text-green-500" />
          </div>

          <h1 className="text-2xl md:text-3xl font-black text-[#1B4D91] mb-8">{t("success.title")}</h1>

          <div className="w-full max-w-sm bg-slate-50/70 rounded-2xl p-6 text-left space-y-4 mb-10 border border-slate-100">
            <div className="flex justify-between items-center border-b border-slate-200/60 pb-4">
              <span className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">{t("success.orderId", { id: "" }).replace(":", "")}</span>
              <span className="text-[15px] font-extrabold text-[#1B4D91]">{successOrderId.slice(0, 8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-200/60 pb-4">
              <span className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">{t("success.delivery")}</span>
              <span className="text-[15px] font-bold text-slate-700">{form.deliveryType === "DELIVERY" ? t("delivery") : t("pickup")}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">{t("success.payment")}</span>
              <span className="text-[15px] font-bold text-slate-700">{t(`payment.${form.paymentMethod}`)}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row w-full max-w-sm gap-4">
            <Link
              href="/catalog"
              className="flex-1 h-14 flex items-center justify-center rounded-full bg-navbar-gradient text-[15px] font-bold text-white hover:shadow-lg hover:shadow-[#1B4D91]/25 transition-all shadow-[#1B4D91]/20"
            >
              {t("success.backMarketplace")}
            </Link>

            {isAuthenticated && user?.role === "USER" && (
              <Link
                href="/orders"
                className="flex-1 h-14 flex items-center justify-center rounded-full border-2 border-slate-200 bg-white text-[15px] font-bold text-slate-600 hover:border-[#1B4D91]/30 hover:text-[#1B4D91] transition-colors"
              >
                {t("success.myOrders")}
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell max-w-[1440px] space-y-6 md:space-y-8 pb-32">
      <section className="surface-card rounded-[32px] p-6 md:p-8 shadow-[0_4px_30px_rgb(0,0,0,0.03)] border-slate-100">
        <h1 className="text-2xl md:text-3xl font-black text-[#1B4D91]">{t("title")}</h1>
        <p className="mt-2 text-[14px] md:text-[15px] text-slate-500 font-medium">{t("subtitle")}</p>
      </section>

      {items.length === 0 ? (
        <section className="flex flex-col items-center justify-center p-12 text-center">
          <div className="flex size-32 items-center justify-center rounded-full bg-[#1B4D91]/5 mb-6">
            <ShoppingBag className="size-16 text-[#1B4D91]/15" />
          </div>
          <p className="text-[16px] font-medium text-slate-500">{t("emptyCart")}</p>
          <Link href="/catalog" className="mt-6 inline-flex h-14 items-center justify-center rounded-full bg-navbar-gradient px-8 text-[15px] font-black text-white hover:-translate-y-0.5 shadow-xl shadow-[#1B4D91]/25 transition-all duration-300">{t("goMarketplace")}</Link>
        </section>
      ) : (
        <section className="grid gap-6 md:gap-12 lg:grid-cols-[1.2fr,0.85fr] items-start">
          <form onSubmit={placeOrder} className="surface-card bg-gradient-to-br from-white to-slate-50/30 rounded-[32px] p-6 md:p-10 shadow-[0_8px_40px_rgba(0,0,0,0.04)] border border-slate-100/60 space-y-8">
            <h2 className="text-xl md:text-2xl font-black text-[#1B4D91] border-b border-slate-100 pb-4">{t("deliveryDetails")}</h2>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">{t("fields.fullName")}</label>
                <input
                  value={form.customerName}
                  onChange={(e) => updateField("customerName", e.target.value)}
                  className={`h-14 w-full rounded-2xl border-2 bg-slate-50/50 px-4 text-[15px] font-medium placeholder:text-slate-400 focus:bg-white transition-colors outline-none focus:border-[#1B4D91]/30 ${fieldErrors.customerName ? "border-destructive focus:border-destructive" : "border-slate-100"}`}
                  placeholder={t("fields.fullName")}
                  aria-invalid={Boolean(fieldErrors.customerName)}
                  required
                />
                {fieldErrors.customerName && <p className="text-xs font-bold text-destructive">{fieldErrors.customerName}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">{t("fields.phone")}</label>
                <input
                  value={form.customerPhone}
                  onChange={(e) => updateField("customerPhone", formatPhoneInput(e.target.value))}
                  className={`h-14 w-full rounded-2xl border-2 bg-slate-50/50 px-4 text-[15px] font-medium placeholder:text-slate-400 focus:bg-white transition-colors outline-none focus:border-[#1B4D91]/30 ${fieldErrors.customerPhone ? "border-destructive focus:border-destructive" : "border-slate-100"}`}
                  placeholder={t("fields.phone")}
                  inputMode="tel"
                  aria-invalid={Boolean(fieldErrors.customerPhone)}
                  required
                />
                {fieldErrors.customerPhone && <p className="text-xs font-bold text-destructive">{fieldErrors.customerPhone}</p>}
              </div>

              <div className="pt-2">
                <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-3">{t("fields.deliveryType")}</label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className={`relative flex cursor-pointer flex-col gap-2 rounded-2xl border-2 p-4 transition-all ${form.deliveryType === "DELIVERY" ? "border-[#1B4D91] bg-[#1B4D91]/5 shadow-sm" : "border-slate-100 bg-white hover:border-slate-200"}`}>
                    <input
                      type="radio"
                      className="peer sr-only"
                      checked={form.deliveryType === "DELIVERY"}
                      onChange={() => setForm((p) => ({ ...p, deliveryType: "DELIVERY" }))}
                    />
                    <div className="flex items-center gap-3">
                      <div className={`flex size-10 items-center justify-center rounded-xl ${form.deliveryType === "DELIVERY" ? "bg-[#1B4D91] text-white" : "bg-slate-100 text-slate-500"}`}>
                        <Package className="size-5" />
                      </div>
                      <span className={`text-[15px] font-bold ${form.deliveryType === "DELIVERY" ? "text-[#1B4D91]" : "text-slate-700"}`}>{t("delivery")}</span>
                    </div>
                  </label>

                  <label className={`relative flex cursor-pointer flex-col gap-2 rounded-2xl border-2 p-4 transition-all ${form.deliveryType === "PICKUP" ? "border-[#1B4D91] bg-[#1B4D91]/5 shadow-sm" : "border-slate-100 bg-white hover:border-slate-200"}`}>
                    <input
                      type="radio"
                      className="peer sr-only"
                      checked={form.deliveryType === "PICKUP"}
                      onChange={() => {
                        setForm((p) => ({ ...p, deliveryType: "PICKUP", deliveryAddress: "" }));
                        setFieldErrors((prev) => ({ ...prev, deliveryAddress: undefined }));
                      }}
                    />
                    <div className="flex items-center gap-3">
                      <div className={`flex size-10 items-center justify-center rounded-xl ${form.deliveryType === "PICKUP" ? "bg-[#1B4D91] text-white" : "bg-slate-100 text-slate-500"}`}>
                        <MapPin className="size-5" />
                      </div>
                      <span className={`text-[15px] font-bold ${form.deliveryType === "PICKUP" ? "text-[#1B4D91]" : "text-slate-700"}`}>{t("pickup")}</span>
                    </div>
                  </label>
                </div>
              </div>

              {form.deliveryType === "DELIVERY" && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-300">
                  <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">{t("fields.address")}</label>
                  <input
                    value={form.deliveryAddress}
                    onChange={(e) => updateField("deliveryAddress", e.target.value)}
                    className={`h-14 w-full rounded-2xl border-2 bg-slate-50/50 px-4 text-[15px] font-medium placeholder:text-slate-400 focus:bg-white transition-colors outline-none focus:border-[#1B4D91]/30 ${fieldErrors.deliveryAddress ? "border-destructive focus:border-destructive" : "border-slate-100"}`}
                    placeholder={t("fields.address")}
                    aria-invalid={Boolean(fieldErrors.deliveryAddress)}
                    required
                  />
                  {fieldErrors.deliveryAddress && <p className="text-xs font-bold text-destructive">{fieldErrors.deliveryAddress}</p>}
                </div>
              )}

              <div className="pt-2">
                <label className="block text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-3">{t("fields.paymentMethod")}</label>
                <Select
                  value={form.paymentMethod}
                  onValueChange={(val: string) => setForm((p) => ({ ...p, paymentMethod: val as PaymentMethod }))}
                >
                  <SelectTrigger className="w-full h-14 rounded-2xl border-2 border-slate-100 bg-white px-4 text-[15px] font-bold text-[#1B4D91] focus:ring-0 focus:border-[#1B4D91]/30 shadow-none">
                    <div className="flex items-center gap-3">
                      {form.paymentMethod === 'CARD' ? <CreditCard className="size-5 text-slate-400" /> : <Banknote className="size-5 text-slate-400" />}
                      <SelectValue placeholder="Select payment method" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-100 shadow-xl p-1">
                    <SelectItem value="CASH" className="text-[15px] font-bold text-[#1B4D91] py-3 rounded-lg cursor-pointer">{t("payment.CASH")}</SelectItem>
                    <SelectItem value="CARD" className="text-[15px] font-bold text-[#1B4D91] py-3 rounded-lg cursor-pointer">{t("payment.CARD")}</SelectItem>
                    <SelectItem value="TRANSFER" className="text-[15px] font-bold text-[#1B4D91] py-3 rounded-lg cursor-pointer">{t("payment.TRANSFER")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">{t("fields.comment")} (Optional)</label>
                <textarea
                  rows={4}
                  value={form.comment}
                  onChange={(e) => setForm((p) => ({ ...p, comment: e.target.value }))}
                  className="w-full resize-none rounded-2xl border-2 border-slate-100 bg-slate-50/50 p-4 text-[15px] font-medium placeholder:text-slate-400 focus:bg-white transition-colors outline-none focus:border-[#1B4D91]/30"
                  placeholder={t("fields.comment")}
                />
              </div>
            </div>

            {error && <div className="rounded-xl bg-destructive/10 p-4 border border-destructive/20 text-sm font-bold text-destructive text-center">{error}</div>}

            <button
              type="submit"
              disabled={loading || items.length === 0}
              className="w-full rounded-full bg-navbar-gradient h-14 text-[16px] font-black text-white hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-[#1B4D91]/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all duration-300 shadow-xl shadow-[#1B4D91]/25 mt-8"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {t("placing")}
                </div>
              ) : t("confirm")}
            </button>
          </form>

          {/* ── Desktop order summary (Aesthetic matched to Cart) ── */}
          <aside className="sticky top-24 rounded-[32px] bg-gradient-to-br from-white to-slate-50/50 border border-slate-100/80 shadow-[0_8px_40px_rgba(0,0,0,0.04)] p-8 md:p-10 flex flex-col w-full h-max">
            <h2 className="text-[22px] font-black text-[#1B4D91] border-b border-slate-100 pb-4 mb-6">{t("summary.title")}</h2>

            <div className="space-y-4 mb-8">
              {items.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="font-bold text-[#1B4D91] line-clamp-2 text-[14px] leading-snug mb-1">{item.name}</p>
                    <p className="text-[13px] font-medium text-slate-500">{item.quantity} x {item.price.toLocaleString("ru-RU")} UZS</p>
                  </div>
                  <p className="font-black text-[#1B4D91] text-[15px] whitespace-nowrap pt-0.5">{(item.price * item.quantity).toLocaleString("ru-RU")}</p>
                </div>
              ))}
            </div>

            <div className="space-y-4 text-[14px] font-semibold text-slate-500 w-full mb-6 pt-6 border-t border-slate-100">
              <div className="flex justify-between w-full">
                <span>{t("summary.items")}</span>
                <span className="text-[#1B4D91] font-bold">{items.length}</span>
              </div>
              <div className="flex justify-between w-full">
                <span>{t("summary.delivery")}</span>
                <span className="text-[#1B4D91] font-bold uppercase text-[12px]">{form.deliveryType === "DELIVERY" ? t("delivery") : t("pickup")}</span>
              </div>
            </div>

            <div className="w-full pt-6 border-t border-slate-100 mt-auto">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">{t("summary.total")}</p>
              <p className="text-[36px] font-black text-[#E31E24] leading-none mb-2">
                {total.toLocaleString("ru-RU")} <span className="text-[18px] text-[#1B4D91] ml-2">UZS</span>
              </p>
            </div>

            <Link href="/cart" className="mt-8 flex w-full h-14 items-center justify-center rounded-full border border-slate-200 text-[14px] font-bold text-[#1B4D91] hover:bg-slate-50 transition-colors">
              {t("backToCart")}
            </Link>
          </aside>
        </section>
      )}
    </div>
  );
}
