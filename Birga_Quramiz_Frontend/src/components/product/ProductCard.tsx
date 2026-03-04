"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { resolveImageUrl } from "@/lib/image";
import type { Product } from "@/types";
import { Share2, Heart, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/hooks/useFavorites";
import Image from "next/image";

export default function ProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const { addItem, increment, decrement, getQuantity } = useCart();
  const { user } = useAuth();
  const t = useTranslations("ProductCard");
  const quantity = getQuantity(product.id);
  const canAddToCart = !user || user.role === "USER";

  const { toggleFavorite, isFavorite } = useFavorites();
  const liked = isFavorite(product.id);

  const handleCardClick = (e: React.MouseEvent<HTMLElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("a")) return;
    router.push(`/catalog/product/${product.id}`);
  };

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    addItem({
      id: product.id,
      sku: product.sku,
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

  const handleFavorite = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    toggleFavorite(product);
  };

  return (
    <article
      className="flex min-w-0 cursor-pointer flex-col overflow-hidden surface-card tap-highlight-none"
      onClick={handleCardClick}
      role="button"
      aria-label={t("openDetails")}
    >
      <div className="flex flex-col p-3">
        <div className="flex items-center justify-between mb-2.5">
          <button
            className="p-1 text-slate-300 transition-colors duration-200 active:text-[#E31E24]"
            onClick={(e) => e.stopPropagation()}
            aria-label="Share"
          >
            <Share2 className="size-[18px]" />
          </button>

          <span className="text-[10px] font-semibold text-slate-400 tracking-tight">
            {product.sku ? `Art: ${product.sku}` : ""}
          </span>

          <button
            className={cn(
              "p-1 transition-colors duration-200",
              liked ? "text-[#E31E24]" : "text-slate-300 active:text-[#E31E24]"
            )}
            onClick={handleFavorite}
            aria-label={liked ? "Favorited" : "Favorite"}
          >
            <Heart className={cn("size-[18px] transition-all duration-200", liked && "fill-[#E31E24]")} />
          </button>
        </div>

        <div className="relative h-[180px] w-full flex items-center justify-center mb-3 overflow-hidden rounded-xl bg-slate-50 border border-slate-100/50">
          {product.imageUrl ? (
            <Image
              src={resolveImageUrl(product.imageUrl)}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="h-full w-full object-contain p-2 mix-blend-multiply transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-300">
              {t("noImage")}
            </div>
          )}
        </div>

        <div className="flex flex-col" style={{ minHeight: "86px" }}>
          <h2 className="line-clamp-2 text-[11.5px] font-bold leading-snug text-[#1B4D91] mb-auto">
            {product.name}
          </h2>
          <div className="mt-1.5">
            <p className="text-[9px] font-medium text-slate-400">
              {t("stock", { value: product.stock })}
            </p>
            <p className="text-[9px] font-medium text-slate-400 mt-0.5">
              {t("priceLabel")}
            </p>
            <p className="text-[13px] font-black text-[#1B4D91] leading-tight">
              {product.price.toLocaleString("ru-RU")} {" "}
              <span className="text-[10px] font-semibold text-slate-400">UZS</span>
            </p>
          </div>
        </div>

        <div className="mt-3 h-10">
          {!canAddToCart ? (
            <div className="flex h-full w-full items-center justify-center rounded-xl bg-slate-100 text-[9.5px] font-bold uppercase tracking-widest text-slate-400">
              {t("onlyCustomersCanBuy")}
            </div>
          ) : quantity > 0 ? (
            <div className="flex items-center justify-between h-full w-full rounded-xl border-2 border-[#1B4D91] bg-white overflow-hidden shadow-sm shadow-[#1B4D91]/10">
              <button
                className="flex h-full w-10 items-center justify-center text-lg font-black text-[#1B4D91] transition-colors duration-200 hover:bg-[#1B4D91]/5 active:bg-[#1B4D91]/10"
                onClick={handleDecrement}
                aria-label={t("decrease")}
              >
                -
              </button>
              <span className="text-[14px] font-black text-[#1B4D91] tabular-nums">{quantity}</span>
              <button
                className="flex h-full w-10 items-center justify-center text-lg font-black text-[#1B4D91] transition-colors duration-200 hover:bg-[#1B4D91]/5 active:bg-[#1B4D91]/10"
                onClick={handleIncrement}
                aria-label={t("increase")}
              >
                +
              </button>
            </div>
          ) : (
            <button
              onClick={handleAddToCart}
              className="flex h-full w-full items-center justify-center gap-1.5 rounded-xl bg-[#1B4D91] text-[11px] font-black uppercase tracking-wider text-white transition-all duration-200 hover:bg-[#1B4D91]/90 hover:shadow-md hover:shadow-[#1B4D91]/20 active:scale-[0.98]"
            >
              {t("addToCart")}
              <ShoppingCart className="size-4" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
