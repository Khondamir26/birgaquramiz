"use client";

import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useFetch } from "@/hooks/useFetch";
import { getProductById } from "@/lib/api/products";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { resolveImageUrl } from "@/lib/image";
import type { Product } from "@/types";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { addItem } = useCart();
  const { user, isAuthenticated } = useAuth();
  const t = useTranslations("ProductDetail");
  const canBuy = !isAuthenticated || user?.role === "USER";

  const { data: product, loading, error } = useFetch<Product>(() => getProductById(id));

  if (loading) {
    return (
      <div className="page-shell max-w-4xl">
        <div className="surface-card h-72 animate-pulse" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="page-shell max-w-4xl space-y-4">
        <div className="surface-card p-6">
          <p className="text-sm font-medium text-destructive">{error || t("notFound")}</p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          {t("back")}
        </Button>
      </div>
    );
  }

  return (
    <div className="page-shell max-w-4xl space-y-6">
      <Button variant="outline" onClick={() => router.back()}>
        {t("backToCatalog")}
      </Button>

      <section className="surface-card p-6 md:p-8">
        <div className="grid gap-7 md:grid-cols-[1.2fr,0.8fr]">
          <div>
            <div className="overflow-hidden rounded-xl border border-border/70 bg-white">
              {product.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={resolveImageUrl(product.imageUrl)} alt={product.name} className="h-64 w-full object-cover" />
              ) : (
                <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">{t("noImage")}</div>
              )}
            </div>

            <h1 className="mt-5 text-3xl font-black tracking-tight text-primary">{product.name}</h1>
            <p className="mt-3 text-sm text-muted-foreground md:text-base">{product.description}</p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border/70 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("price")}</p>
                <p className="mt-1 text-2xl font-black text-primary">{product.price.toLocaleString()} UZS</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{t("stock")}</p>
                <p className="mt-1 text-2xl font-black text-primary">{t("stockValue", { value: product.stock })}</p>
              </div>
            </div>
          </div>

          <aside className="rounded-2xl border border-border/70 bg-secondary/55 p-5">
            <h2 className="text-lg font-bold text-primary">{t("purchaseOptions")}</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>{t("installment")}</li>
              <li>{t("estimatedDelivery")}</li>
              <li>{t("invoiceTracking")}</li>
            </ul>

            {product.seller && <p className="mt-4 text-sm text-muted-foreground">{t("seller", { name: product.seller.company })}</p>}

            <Button
              size="lg"
              className="mt-5 w-full"
              disabled={product.stock === 0 || !canBuy}
              onClick={() => {
                addItem({
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  image: resolveImageUrl(product.imageUrl),
                });
                router.push("/cart");
              }}
            >
              {product.stock === 0 ? t("outOfStock") : canBuy ? t("addToCart") : t("onlyCustomersCanBuy")}
            </Button>
          </aside>
        </div>
      </section>
    </div>
  );
}
