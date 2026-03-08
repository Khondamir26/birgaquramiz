"use client";

import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useFetch } from "@/hooks/useFetch";
import { getProductById, getProducts } from "@/lib/api/products";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";
import { resolveImageUrl } from "@/lib/image";
import type { Product } from "@/types";
import { ChevronLeft, Heart, Share2, ShoppingCart, Store, Star, Minus, Plus, Package } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import ProductCard from "@/components/product/ProductCard";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { addItem, increment, decrement, getQuantity } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { toggleFavorite, isFavorite } = useFavorites();
  const t = useTranslations("ProductDetail");
  const tNav = useTranslations("Navbar");
  const canBuy = !isAuthenticated || user?.role === "USER";

  const productId = String(id ?? "");
  const { data: product, loading, error } = useFetch<Product>(() => getProductById(productId));

  const [activeImg, setActiveImg] = useState(0);
  const images = product?.imageUrl
    ? [resolveImageUrl(product.imageUrl)]
    : [];

  const [recommended, setRecommended] = useState<Product[]>([]);
  useEffect(() => {
    if (product) {
      getProducts(1, 6).then((res) => {
        setRecommended(res.data.filter((p) => p.id !== product.id).slice(0, 4));
      }).catch(() => { });
    }
  }, [product]);

  if (!productId) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-8 text-center">
        <p className="text-base font-bold text-slate-400">{t("notFound")}</p>
        <button
          onClick={() => router.back()}
          className="rounded-2xl border-2 border-[#1B4D91]/20 px-6 py-3 text-[13px] font-black text-[#1B4D91]"
        >
          {t("back")}
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-[#f4f6fa]">
        <div className="aspect-square w-full bg-white animate-pulse" />
        <div className="px-5 pt-5 space-y-3">
          <div className="h-5 w-2/3 rounded-xl bg-slate-100 animate-pulse" />
          <div className="h-7 w-1/2 rounded-xl bg-slate-100 animate-pulse" />
          <div className="h-4 w-full rounded-xl bg-slate-100 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-5 px-8 text-center">
        <p className="text-base font-bold text-slate-400">{error || t("notFound")}</p>
        <button
          onClick={() => router.back()}
          className="rounded-2xl border-2 border-[#1B4D91]/20 px-6 py-3 text-[13px] font-black text-[#1B4D91]"
        >
          {t("back")}
        </button>
      </div>
    );
  }

  const quantity = getQuantity(product.id);
  const liked = isFavorite(product.id);

  const breadcrumbItems = [
    { label: tNav("home"), href: "/" },
    { label: tNav("catalog"), href: "/catalog" },
    ...(product.category?.parent ? [{ label: product.category.parent.name, href: `/catalog/category/${product.category.parent.id}` }] : []),
    ...(product.category ? [{ label: product.category.name, href: `/catalog/category/${product.category.id}` }] : []),
    { label: product.name },
  ];

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      sku: product.sku,
      name: product.name,
      price: product.price,
      image: resolveImageUrl(product.imageUrl),
    });
    toast.success("Product added to cart");
  };

  const handleShare = () => {
    const url = window.location.href;
    const text = product.name;
    const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;

    // @ts-ignore
    const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : null;
    if (tg?.initData) {
      tg.openTelegramLink(telegramShareUrl);
    } else {
      window.open(telegramShareUrl, '_blank');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f6fa] pb-36 md:pb-16 pt-4 md:pt-8">
      <div className="max-w-7xl mx-auto w-full px-5 md:px-8 mb-3">
        <Breadcrumbs items={breadcrumbItems} />
      </div>
      <div className="hidden md:flex max-w-7xl mx-auto w-full px-8 mb-6 items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-[14px] font-bold text-slate-500 hover:text-[#1B4D91] transition-colors">
          <ChevronLeft className="size-4" />
          {t("backToCatalog")}
        </button>
        <div className="flex items-center gap-3">
          <button onClick={() => toggleFavorite(product)} className={cn("flex items-center gap-2 px-4 py-2 rounded-xl bg-white shadow-sm border border-slate-100 transition-colors font-bold text-[13px]", liked ? "text-[#E31E24]" : "text-slate-500 hover:text-[#1B4D91]")}>
            <Heart className={cn("size-4", liked && "fill-[#E31E24]")} />
            {liked ? t("favorited") : t("favorite")}
          </button>
          <button onClick={handleShare} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white shadow-sm border border-slate-100 text-slate-500 hover:text-[#1B4D91] transition-colors font-bold text-[13px]">
            <Share2 className="size-4" />
            {t("share")}
          </button>
        </div>
      </div>

      <div className="w-full md:max-w-7xl md:mx-auto md:px-8">
        <div className="md:grid md:grid-cols-2 md:gap-x-12 md:items-start">
          <div className="relative bg-white md:bg-transparent md:sticky md:top-24">
            <div className="relative aspect-square w-full overflow-hidden">
              {images.length > 0 ? (
                <img
                  src={images[activeImg]}
                  alt={product.name}
                  className="h-full w-full object-contain p-6 transition-opacity duration-200"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-slate-300">
                  <Package className="size-20 opacity-30" />
                </div>
              )}

              {images.length > 1 && (
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2 px-4">
                  {images.map((img, i) => (
                    <button
                      key={img}
                      onClick={() => setActiveImg(i)}
                      className={cn(
                        "h-1.5 rounded-full transition-all duration-200",
                        i === activeImg ? "w-5 bg-[#1B4D91]" : "w-1.5 bg-slate-200"
                      )}
                    />
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => router.back()}
              className="md:hidden absolute left-4 top-4 flex size-10 items-center justify-center rounded-full bg-white/90 shadow-md border border-slate-100 text-[#1B4D91] active:scale-90 transition-transform backdrop-blur-sm"
            >
              <ChevronLeft className="size-5" />
            </button>

            <div className="md:hidden absolute right-4 top-4 flex flex-col gap-2">
              <button
                className="flex size-10 items-center justify-center rounded-full bg-white/90 shadow-md border border-slate-100 text-slate-400 active:text-[#1B4D91] transition-colors backdrop-blur-sm"
                onClick={handleShare}
              >
                <Share2 className="size-[18px]" />
              </button>
              <button
                onClick={() => toggleFavorite(product)}
                className={cn(
                  "flex size-10 items-center justify-center rounded-full bg-white/90 shadow-md border border-slate-100 transition-colors backdrop-blur-sm",
                  liked ? "text-[#E31E24]" : "text-slate-400 active:text-[#E31E24]"
                )}
              >
                <Heart className={cn("size-[18px]", liked && "fill-[#E31E24]")} />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4 mt-[-12px] md:mt-0 relative z-10 w-full min-w-0">
            <div className="mx-4 md:mx-0 rounded-3xl md:rounded-[32px] bg-white shadow-sm border border-slate-100 p-5 md:p-8">
              <div className="flex items-center justify-between mb-2">
                <span className="rounded-lg bg-[#1B4D91]/6 px-2.5 py-1 text-[10px] font-black text-[#1B4D91] uppercase tracking-wider">
                  {product.sku ? `Art. ${product.sku}` : ""}
                </span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={cn("size-3.5", s <= 4 ? "fill-[#f9b41b] text-[#f9b41b]" : "text-slate-200")} />
                  ))}
                  <span className="ml-1 text-[11px] font-semibold text-slate-400">4.0</span>
                </div>
              </div>

              <h1 className="text-[18px] font-black leading-snug text-[#1B4D91] mt-1">
                {product.name}
              </h1>

              <p className="mt-2 text-[12px] font-semibold text-slate-400">
                {t("inStock")} <span className="text-emerald-500 font-bold">{product.stock} {t("inStockUnit")}</span>
              </p>

              <div className="mt-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{t("quantity")}</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center rounded-2xl border-2 border-[#1B4D91]/15 bg-[#f4f6fa] overflow-hidden">
                    <button
                      onClick={() => quantity > 0 ? decrement(product.id) : null}
                      className="flex size-11 items-center justify-center text-[#1B4D91] font-black active:bg-[#1B4D91]/10 transition-colors"
                    >
                      <Minus className="size-4" />
                    </button>
                    <span className="min-w-[36px] text-center text-[15px] font-black text-[#1B4D91] tabular-nums">
                      {quantity || 1}
                    </span>
                    <button
                      onClick={() => quantity > 0 ? increment(product.id) : null}
                      className="flex size-11 items-center justify-center text-[#1B4D91] font-black active:bg-[#1B4D91]/10 transition-colors"
                    >
                      <Plus className="size-4" />
                    </button>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-400">{t("perUnit")}</p>
                </div>
              </div>

              <div className="mt-5 flex items-end justify-between border-t border-slate-100 pt-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("price")}</p>
                  <p className="text-[26px] font-black text-[#1B4D91] leading-tight">
                    {product.price.toLocaleString("ru-RU")}
                    <span className="text-[13px] font-semibold text-slate-400 ml-1">{t("currencyUzs")}</span>
                  </p>
                </div>
                {quantity > 1 && (
                  <div className="text-right">
                    <p className="text-[10px] font-semibold text-slate-400">{t("total")}</p>
                    <p className="text-[16px] font-black text-[#E31E24]">
                      {(product.price * quantity).toLocaleString("ru-RU")}
                      <span className="text-[11px] font-semibold ml-1">{t("currencyUzs")}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="hidden md:block mt-8 pt-8 border-t border-slate-100">
              {quantity > 0 ? (
                <div className="flex items-center gap-6">
                  <div className="flex items-center h-14 rounded-2xl border-2 border-[#1B4D91]/15 bg-[#f4f6fa] overflow-hidden shrink-0">
                    <button onClick={() => decrement(product.id)} className="flex h-full w-14 items-center justify-center text-[#1B4D91] hover:bg-[#1B4D91]/5 transition-colors font-black text-xl">-</button>
                    <span className="w-12 text-center text-[16px] font-black text-[#1B4D91] tabular-nums">{quantity}</span>
                    <button onClick={() => increment(product.id)} className="flex h-full w-14 items-center justify-center text-[#1B4D91] hover:bg-[#1B4D91]/5 transition-colors font-black text-xl">+</button>
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{t("cartTotal")}</p>
                    <p className="text-[22px] font-black text-[#E31E24]">
                      {(product.price * quantity).toLocaleString("ru-RU")}
                      <span className="text-[14px] font-bold ml-1 text-slate-500">{t("currencyUzs")}</span>
                    </p>
                  </div>
                </div>
              ) : (
                <button
                  disabled={product.stock === 0 || !canBuy}
                  onClick={handleAddToCart}
                  className="flex h-14 w-full md:w-auto md:px-12 items-center justify-center gap-2 rounded-2xl bg-[#E31E24] hover:bg-[#C91A20] hover:shadow-lg hover:shadow-[#E31E24]/30 text-[14px] font-black text-white active:scale-95 transition-all disabled:opacity-40"
                >
                  <ShoppingCart className="size-5" />
                  {product.stock === 0 ? t("outOfStock") : canBuy ? t("addToCart") : t("onlyCustomersCanBuy")}
                </button>
              )}
            </div>

            {product.seller && (
              <div className="mx-4 md:mx-0 flex items-center gap-4 rounded-3xl md:rounded-[24px] bg-white shadow-sm border border-slate-100 p-4 md:p-6 md:mt-2">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#1B4D91]/8 text-[#1B4D91]">
                  <Store className="size-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("seller")}</p>
                  <p className="text-[14px] font-black text-[#1B4D91] truncate">{product.seller.company}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star className="size-3 fill-[#f9b41b] text-[#f9b41b]" />
                    <span className="text-[11px] font-semibold text-slate-400">{t("trustedSeller")}</span>
                  </div>
                </div>
                <button className="rounded-xl border border-[#1B4D91]/20 px-3 py-2 text-[11px] font-black text-[#1B4D91] active:bg-[#1B4D91]/5 transition-colors shrink-0">
                  {t("viewShop")}
                </button>
              </div>
            )}

            <div className="mx-4 md:mx-0 mt-3 md:mt-2 rounded-3xl md:rounded-[32px] bg-white shadow-sm border border-slate-100 overflow-hidden md:px-4">
              <Accordion type="single" collapsible className="divide-y divide-slate-100">
                <AccordionItem value="description" className="border-none px-5">
                  <AccordionTrigger className="text-[14px] font-black text-[#1B4D91] py-4 hover:no-underline">
                    {t("description")}
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 text-[13px] leading-relaxed text-slate-600">
                    {product.description || t("noDescription")}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="specs" className="border-none px-5">
                  <AccordionTrigger className="text-[14px] font-black text-[#1B4D91] py-4 hover:no-underline">
                    {t("specs")}
                  </AccordionTrigger>
                  <AccordionContent className="pb-5">
                    <div className="space-y-2.5">
                      {[
                        { label: t("specSku"), value: product.sku || "-" },
                        { label: t("specStock"), value: `${product.stock} ${t("inStockUnit")}` },
                        { label: t("specPrice"), value: `${product.price.toLocaleString("ru-RU")} ${t("currencyUzs")}` },
                        { label: t("specCategory"), value: product.category?.name || "-" },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between items-center py-1.5 border-b border-slate-50">
                          <span className="text-[12px] font-semibold text-slate-400">{label}</span>
                          <span className="text-[12px] font-bold text-[#1B4D91]">{value}</span>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="reviews" className="border-none px-5">
                  <AccordionTrigger className="text-[14px] font-black text-[#1B4D91] py-4 hover:no-underline">
                    {t("reviews")}
                  </AccordionTrigger>
                  <AccordionContent className="pb-5">
                    <div className="flex flex-col items-center py-4 text-center">
                      <div className="flex gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={cn("size-5", s <= 4 ? "fill-[#f9b41b] text-[#f9b41b]" : "text-slate-200")} />
                        ))}
                      </div>
                      <p className="text-[13px] font-bold text-[#1B4D91]">{t("noReviews")}</p>
                      <p className="text-[11px] text-slate-400 mt-1">{t("reviewsHint")}</p>
                      <button className="mt-4 rounded-xl bg-[#1B4D91]/8 px-5 py-2.5 text-[12px] font-black text-[#1B4D91] active:bg-[#1B4D91]/15 transition-colors">
                        {t("writeReview")}
                      </button>
                    </div>
                  </AccordionContent>
                </AccordionItem>

              </Accordion>
            </div>

          </div>
        </div>
      </div>

      {recommended.length > 0 && (
        <div className="mt-8 md:mt-16 w-full md:max-w-7xl md:mx-auto px-4 md:px-8">
          <h2 className="text-[16px] md:text-[22px] font-black text-[#1B4D91] mb-3 md:mb-6">{t("recommended")}</h2>
          <div className="grid grid-cols-2 gap-3">
            {recommended.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      <div className="md:hidden fixed bottom-[72px] left-0 right-0 z-40 border-t border-slate-100 bg-white/96 backdrop-blur-md px-5 py-4 shadow-[0_-4px_20px_rgba(27,77,145,0.06)]">
        <div className="flex items-center gap-4">
          <div className="shrink-0">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t("price")}</p>
            <p className="text-[16px] font-black text-[#1B4D91]">
              {(product.price * (quantity || 1)).toLocaleString("ru-RU")}
              <span className="text-[10px] font-semibold text-slate-400 ml-1">{t("currencyUzs")}</span>
            </p>
          </div>
          <div className="flex-1">
            {quantity > 0 ? (
              <div className="flex items-center justify-between h-13 rounded-2xl border-2 border-[#1B4D91]/15 bg-[#f4f6fa] overflow-hidden">
                <button onClick={() => decrement(product.id)} className="flex h-full w-12 items-center justify-center text-[#1B4D91] font-black active:bg-[#1B4D91]/10 transition-colors text-xl">-</button>
                <span className="text-[15px] font-black text-[#1B4D91] tabular-nums">{quantity}</span>
                <button onClick={() => increment(product.id)} className="flex h-full w-12 items-center justify-center text-[#1B4D91] font-black active:bg-[#1B4D91]/10 transition-colors text-xl">+</button>
              </div>
            ) : (
              <button
                disabled={product.stock === 0 || !canBuy}
                onClick={handleAddToCart}
                className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#E31E24] text-[13px] font-black text-white shadow-lg shadow-[#E31E24]/20 active:scale-[0.97] transition-transform disabled:opacity-40"
              >
                <ShoppingCart className="size-4.5" />
                {product.stock === 0 ? t("outOfStock") : canBuy ? t("addToCart") : t("onlyCustomersCanBuy")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
