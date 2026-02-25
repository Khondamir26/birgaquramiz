"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { useAuth } from "@/hooks/useAuth";
import { createGuestOrder, createOrder } from "@/lib/api/orders";
import { useTranslations } from "next-intl";
import type { DeliveryType, PaymentMethod } from "@/types";

type CheckoutField = "customerName" | "customerPhone" | "deliveryAddress";

type FieldErrors = Partial<Record<CheckoutField, string>>;

function getDigits(value: string) {
  return value.replace(/\D/g, "");
}

function formatPhoneInput(value: string) {
  const digits = getDigits(value).slice(0, 12);
  const local = digits.startsWith("998") ? digits.slice(3) : digits.slice(-9);

  const p1 = local.slice(0, 2);
  const p2 = local.slice(2, 5);
  const p3 = local.slice(5, 7);
  const p4 = local.slice(7, 9);

  const parts = [p1, p2, p3, p4].filter(Boolean);
  return parts.length ? `+998 ${parts.join(" ")}` : "+998 ";
}

function normalizePhone(value: string) {
  const digits = getDigits(value);
  const local = digits.startsWith("998") ? digits.slice(3) : digits.slice(-9);
  return `+998${local}`;
}

function isValidPhone(value: string) {
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
      <div className="page-shell max-w-4xl">
        <div className="surface-card p-8 text-center">
          <h1 className="text-3xl font-black text-primary">{t("success.title")}</h1>
          <p className="mt-3 text-sm text-muted-foreground">{t("success.orderId", { id: successOrderId.slice(0, 8) })}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("success.delivery")}: {form.deliveryType === "DELIVERY" ? t("delivery") : t("pickup")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("success.payment")}: {t(`payment.${form.paymentMethod}`)}</p>
          <div className="mt-5 flex justify-center gap-3">
            <Link href="/catalog" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90">{t("success.backMarketplace")}</Link>
            {isAuthenticated && user?.role === "USER" && (
              <Link href="/orders" className="rounded-lg border border-border/80 bg-white px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-primary">{t("success.myOrders")}</Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell max-w-5xl space-y-6">
      <section className="surface-card p-6">
        <h1 className="section-title text-primary">{t("title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
      </section>

      {items.length === 0 ? (
        <section className="surface-card p-8 text-center">
          <p className="text-muted-foreground">{t("emptyCart")}</p>
          <Link href="/catalog" className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90">{t("goMarketplace")}</Link>
        </section>
      ) : (
        <section className="grid gap-4 lg:grid-cols-[1.15fr,0.85fr]">
          <form onSubmit={placeOrder} className="surface-card space-y-5 p-5">
            <h2 className="text-lg font-bold text-primary">{t("deliveryDetails")}</h2>

            <div className="space-y-1">
              <input
                value={form.customerName}
                onChange={(e) => updateField("customerName", e.target.value)}
                className={`h-10 w-full rounded-lg border bg-white px-3 text-sm ${fieldErrors.customerName ? "border-destructive" : "border-border/80"}`}
                placeholder={t("fields.fullName")}
                aria-invalid={Boolean(fieldErrors.customerName)}
                required
              />
              {fieldErrors.customerName && <p className="text-xs text-destructive">{fieldErrors.customerName}</p>}
            </div>

            <div className="space-y-1">
              <input
                value={form.customerPhone}
                onChange={(e) => updateField("customerPhone", formatPhoneInput(e.target.value))}
                className={`h-10 w-full rounded-lg border bg-white px-3 text-sm ${fieldErrors.customerPhone ? "border-destructive" : "border-border/80"}`}
                placeholder={t("fields.phone")}
                inputMode="tel"
                aria-invalid={Boolean(fieldErrors.customerPhone)}
                required
              />
              {fieldErrors.customerPhone && <p className="text-xs text-destructive">{fieldErrors.customerPhone}</p>}
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-primary">{t("fields.deliveryType")}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="rounded-lg border border-border/70 bg-white px-3 py-2 text-sm">
                  <input
                    type="radio"
                    className="mr-2"
                    checked={form.deliveryType === "DELIVERY"}
                    onChange={() => setForm((p) => ({ ...p, deliveryType: "DELIVERY" }))}
                  />
                  {t("delivery")}
                </label>
                <label className="rounded-lg border border-border/70 bg-white px-3 py-2 text-sm">
                  <input
                    type="radio"
                    className="mr-2"
                    checked={form.deliveryType === "PICKUP"}
                    onChange={() => {
                      setForm((p) => ({ ...p, deliveryType: "PICKUP", deliveryAddress: "" }));
                      setFieldErrors((prev) => ({ ...prev, deliveryAddress: undefined }));
                    }}
                  />
                  {t("pickup")}
                </label>
              </div>
            </div>

            {form.deliveryType === "DELIVERY" && (
              <div className="space-y-1">
                <input
                  value={form.deliveryAddress}
                  onChange={(e) => updateField("deliveryAddress", e.target.value)}
                  className={`h-10 w-full rounded-lg border bg-white px-3 text-sm ${fieldErrors.deliveryAddress ? "border-destructive" : "border-border/80"}`}
                  placeholder={t("fields.address")}
                  aria-invalid={Boolean(fieldErrors.deliveryAddress)}
                  required
                />
                {fieldErrors.deliveryAddress && <p className="text-xs text-destructive">{fieldErrors.deliveryAddress}</p>}
              </div>
            )}

            <div>
              <p className="mb-2 text-sm font-semibold text-primary">{t("fields.paymentMethod")}</p>
              <select
                value={form.paymentMethod}
                onChange={(e) => setForm((p) => ({ ...p, paymentMethod: e.target.value as PaymentMethod }))}
                className="h-10 w-full rounded-lg border border-border/80 bg-white px-3 text-sm"
              >
                <option value="CASH">{t("payment.CASH")}</option>
                <option value="CARD">{t("payment.CARD")}</option>
                <option value="TRANSFER">{t("payment.TRANSFER")}</option>
              </select>
            </div>

            <textarea
              rows={3}
              value={form.comment}
              onChange={(e) => setForm((p) => ({ ...p, comment: e.target.value }))}
              className="w-full resize-none rounded-lg border border-border/80 bg-white px-3 py-2 text-sm"
              placeholder={t("fields.comment")}
            />

            {error && <p className="text-sm text-destructive">{error}</p>}

            <button type="submit" disabled={loading || items.length === 0} className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-70">
              {loading ? t("placing") : t("confirm")}
            </button>
          </form>

          <aside className="surface-card p-5">
            <h2 className="text-lg font-bold text-primary">{t("summary.title")}</h2>
            <div className="mt-4 space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
                  <div>
                    <p className="font-medium text-primary">{item.name}</p>
                    <p className="text-muted-foreground">{item.quantity} x {item.price.toLocaleString()} UZS</p>
                  </div>
                  <p className="font-semibold text-primary">{(item.price * item.quantity).toLocaleString()} UZS</p>
                </div>
              ))}
            </div>

            <div className="mt-5 border-t border-border/70 pt-4">
              <p className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{t("summary.items")}</span>
                <span>{items.length}</span>
              </p>
              <p className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
                <span>{t("summary.delivery")}</span>
                <span>{form.deliveryType === "DELIVERY" ? t("delivery") : t("pickup")}</span>
              </p>
              <p className="mt-2 flex items-center justify-between text-lg font-black text-primary">
                <span>{t("summary.total")}</span>
                <span>{total.toLocaleString()} UZS</span>
              </p>
            </div>

            <Link href="/cart" className="mt-4 inline-flex text-sm font-medium text-muted-foreground hover:text-primary">
              {t("backToCart")}
            </Link>
          </aside>
        </section>
      )}
    </div>
  );
}
