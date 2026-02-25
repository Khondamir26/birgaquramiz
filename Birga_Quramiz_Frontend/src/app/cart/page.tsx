"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useTranslations } from "next-intl";

export default function CartPage() {
  const router = useRouter();
  const { user, isAuthenticated, isInitialized } = useAuth();
  const { items, removeItem, updateQuantity } = useCartStore();
  const t = useTranslations("Cart");

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (!isInitialized) {
    return (
      <div className="page-shell max-w-4xl">
        <div className="surface-card h-40 animate-pulse" />
      </div>
    );
  }

  if (isAuthenticated && user && user.role !== "USER") {
    return (
      <div className="page-shell max-w-4xl">
        <div className="surface-card p-10 text-center">
          <h1 className="text-2xl font-bold text-primary">{t("restrictedTitle")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("restrictedText", { role: user.role })}</p>
          <Button asChild className="mt-4">
            <Link href={user.role === "ADMIN" ? "/admin" : "/seller/dashboard"}>{t("openDashboard")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="page-shell max-w-4xl">
        <div className="surface-card p-10 text-center">
          <h1 className="text-2xl font-bold text-primary">{t("emptyTitle")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("emptyText")}</p>
          <Button asChild className="mt-4">
            <Link href="/catalog">{t("goMarketplace")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell max-w-5xl space-y-6">
      <h1 className="section-title text-primary">{t("title")}</h1>

      <div className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
        <section className="surface-card space-y-4 p-5">
          {items.map((item) => (
            <article key={item.id} className="rounded-xl border border-border/70 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-primary">{item.name}</p>
                  <p className="text-sm text-muted-foreground">{item.price.toLocaleString()} UZS {t("each")}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button className="h-8 w-8 rounded-md border border-border/80" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                    -
                  </button>
                  <span className="w-7 text-center text-sm font-medium">{item.quantity}</span>
                  <button className="h-8 w-8 rounded-md border border-border/80" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                    +
                  </button>
                  <button onClick={() => removeItem(item.id)} className="ml-2 text-sm font-medium text-accent">
                    {t("remove")}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>

        <aside className="surface-card p-5">
          <h2 className="text-lg font-bold text-primary">{t("summary")}</h2>
          <div className="mt-3 space-y-2 text-sm text-muted-foreground">
            <p className="flex justify-between"><span>{t("items")}</span><span>{items.length}</span></p>
            <p className="flex justify-between"><span>{t("delivery")}</span><span>{t("deliveryAtCheckout")}</span></p>
          </div>

          <p className="mt-5 text-2xl font-black text-primary">{total.toLocaleString()} UZS</p>

          <div className="mt-4 space-y-2">
            <Button className="w-full" onClick={() => router.push("/checkout")}>
              {t("proceed")}
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/catalog">{t("continueShopping")}</Link>
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}
