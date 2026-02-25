"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { resolveImageUrl } from "@/lib/image";
import type { Product } from "@/types";

export default function ProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const { addItem, increment, decrement, getQuantity } = useCart();
  const { user, isAuthenticated } = useAuth();
  const t = useTranslations("ProductCard");
  const canBuy = !isAuthenticated || user?.role === "USER";
  const quantity = getQuantity(product.id);

  const openDetails = () => {
    router.push(`/catalog/${product.id}`);
  };

  const handleCardClick = (e: React.MouseEvent<HTMLElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("a")) return;
    openDetails();
  };

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: resolveImageUrl(product.imageUrl),
    });
    toast.success(t("addedToCartToast"));
  };

  const handleIncrement = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    increment(product.id);
  };

  const handleDecrement = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    decrement(product.id);
  };

  return (
    <article
      className="surface-card flex h-full min-w-0 cursor-pointer flex-col p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-30px_rgba(15,49,84,0.55)] md:min-w-[320px]"
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openDetails();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={t("openDetails")}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-primary">{t("factoryDirect")}</span>
        <span className="text-xs text-muted-foreground">{t("stock", { value: product.stock })}</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/70 bg-white">
        <div className="aspect-[4/3] w-full">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={resolveImageUrl(product.imageUrl)} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">{t("noImage")}</div>
          )}
        </div>
      </div>

      <Link href={`/catalog/${product.id}`} className="mt-3 line-clamp-2 text-xl font-semibold leading-snug text-primary hover:text-accent">
        {product.name}
      </Link>

      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{product.description}</p>

      <p className="mt-4 text-3xl font-black leading-none text-primary">{product.price.toLocaleString()} UZS</p>

      {product.seller?.company && <p className="mt-2 text-xs text-muted-foreground">{t("seller", { name: product.seller.company })}</p>}

      <div className="mt-5" />

      <div className="mt-auto flex w-full items-center gap-2">
        {quantity > 0 ? (
          <div className="grid h-11 flex-1 grid-cols-[44px_1fr_44px] items-center overflow-hidden rounded-lg border border-border/80 bg-white">
            <button className="h-full text-lg font-semibold text-primary transition-colors hover:bg-slate-50" onClick={handleDecrement} aria-label={t("decrease")}>-</button>
            <span className="h-full border-x border-border/70 text-center text-base font-semibold leading-[44px] text-primary">{quantity}</span>
            <button className="h-full text-lg font-semibold text-primary transition-colors hover:bg-slate-50" onClick={handleIncrement} aria-label={t("increase")}>+</button>
          </div>
        ) : (
          <Button
            className="h-11 flex-1"
            disabled={product.stock === 0 || !canBuy}
            onClick={handleAddToCart}
          >
            {product.stock === 0 ? t("outOfStock") : canBuy ? t("addToCart") : t("onlyCustomersCanBuy")}
          </Button>
        )}
      </div>
    </article>
  );
}
