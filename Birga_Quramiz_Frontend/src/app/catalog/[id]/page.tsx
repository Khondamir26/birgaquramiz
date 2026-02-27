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

// Brand: Blue #1B4D91 | Red #E31E24

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { addItem, increment, decrement, getQuantity } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { toggleFavorite, isFavorite } = useFavorites();
  const t = useTranslations("ProductDetail");
  const canBuy = !isAuthenticated || user?.role === "USER";

  const { data: product, loading, error } = useFetch<Product>(() => getProductById(id));

  // Simulated multiple images (use real ones if API provides them)
  const [activeImg, setActiveImg] = useState(0);
  const images = product?.imageUrl
    ? [resolveImageUrl(product.imageUrl)]
    : [];

  // Recommended products
  const [recommended, setRecommended] = useState<Product[]>([]);
  useEffect(() => {
    if (product) {
      getProducts(1, 6).then((res) => {
        setRecommended(res.data.filter((p) => p.id !== product.id).slice(0, 4));
      }).catch(() => { });
    }
  }, [product]);

  /* ── Loading skeleton ── */
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

  /* ── Error ── */
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

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: resolveImageUrl(product.imageUrl),
    });
    toast.success("Товар добавлен в корзину");
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f6fa] pb-36 md:pb-16 pt-4 md:pt-8">

      {/* Desktop Breadcrumbs & Actions Row */}
      <div className="hidden md:flex max-w-7xl mx-auto w-full px-8 mb-6 items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-[14px] font-bold text-slate-500 hover:text-[#1B4D91] transition-colors">
          <ChevronLeft className="size-4" />
          {t("backToCatalog") || "Назад в каталог"}
        </button>
        <div className="flex items-center gap-3">
          <button onClick={() => toggleFavorite(product)} className={cn("flex items-center gap-2 px-4 py-2 rounded-xl bg-white shadow-sm border border-slate-100 transition-colors font-bold text-[13px]", liked ? "text-[#E31E24]" : "text-slate-500 hover:text-[#1B4D91]")}>
            <Heart className={cn("size-4", liked && "fill-[#E31E24]")} />
            {liked ? "В избранном" : "В избранное"}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white shadow-sm border border-slate-100 text-slate-500 hover:text-[#1B4D91] transition-colors font-bold text-[13px]">
            <Share2 className="size-4" />
            Поделиться
          </button>
        </div>
      </div>

      <div className="w-full md:max-w-7xl md:mx-auto md:px-8">
        <div className="md:grid md:grid-cols-2 md:gap-x-12 md:items-start">

          {/* ════════════════════════════════════════
              LEFT COLUMN: PHOTO CAROUSEL
          ════════════════════════════════════════ */}
          <div className="relative bg-white md:bg-transparent md:sticky md:top-24">
            {/* Main image */}
            <div className="relative aspect-square w-full overflow-hidden">
              {images.length > 0 ? (
                // eslint-disable-next-line @next/next/no-img-element
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

              {/* Thumbnail row (visible when multiple images later) */}
              {images.length > 1 && (
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2 px-4">
                  {images.map((img, i) => (
                    <button
                      key={i}
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

            {/* Floating back button (Mobile Only) */}
            <button
              onClick={() => router.back()}
              className="md:hidden absolute left-4 top-4 flex size-10 items-center justify-center rounded-full bg-white/90 shadow-md border border-slate-100 text-[#1B4D91] active:scale-90 transition-transform backdrop-blur-sm"
            >
              <ChevronLeft className="size-5" />
            </button>

            {/* Floating action buttons (Mobile Only) */}
            <div className="md:hidden absolute right-4 top-4 flex flex-col gap-2">
              <button
                className="flex size-10 items-center justify-center rounded-full bg-white/90 shadow-md border border-slate-100 text-slate-400 active:text-[#1B4D91] transition-colors backdrop-blur-sm"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({ title: product.name, url: window.location.href });
                  }
                }}
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

          {/* ════════════════════════════════════════
          RIGHT COLUMN: INFO & ACTIONS
      ════════════════════════════════════════ */}
          <div className="flex flex-col gap-4 mt-[-12px] md:mt-0 relative z-10 w-full min-w-0">

            {/* PRODUCT INFO CARD */}
            <div className="mx-4 md:mx-0 rounded-3xl md:rounded-[32px] bg-white shadow-sm border border-slate-100 p-5 md:p-8">

              {/* Article code + rating row */}
              <div className="flex items-center justify-between mb-2">
                <span className="rounded-lg bg-[#1B4D91]/6 px-2.5 py-1 text-[10px] font-black text-[#1B4D91] uppercase tracking-wider">
                  Арт. {product.id.toString().slice(-6)}
                </span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={cn("size-3.5", s <= 4 ? "fill-[#f9b41b] text-[#f9b41b]" : "text-slate-200")} />
                  ))}
                  <span className="ml-1 text-[11px] font-semibold text-slate-400">4.0</span>
                </div>
              </div>

              {/* Product name */}
              <h1 className="text-[18px] font-black leading-snug text-[#1B4D91] mt-1">
                {product.name}
              </h1>

              {/* Stock availability */}
              <p className="mt-2 text-[12px] font-semibold text-slate-400">
                В наличии: <span className="text-emerald-500 font-bold">{product.stock} шт.</span>
              </p>

              {/* Quantity selector */}
              <div className="mt-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Количество</p>
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
                  <p className="text-[11px] font-semibold text-slate-400">мин. 1 шт.</p>
                </div>
              </div>

              {/* Price */}
              <div className="mt-5 flex items-end justify-between border-t border-slate-100 pt-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("price")}</p>
                  <p className="text-[26px] font-black text-[#1B4D91] leading-tight">
                    {product.price.toLocaleString("ru-RU")}
                    <span className="text-[13px] font-semibold text-slate-400 ml-1">сум/шт.</span>
                  </p>
                </div>
                {quantity > 1 && (
                  <div className="text-right">
                    <p className="text-[10px] font-semibold text-slate-400">Итого</p>
                    <p className="text-[16px] font-black text-[#E31E24]">
                      {(product.price * quantity).toLocaleString("ru-RU")}
                      <span className="text-[11px] font-semibold ml-1">сум</span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Desktop Cart Controls (Hidden on mobile) */}
            <div className="hidden md:block mt-8 pt-8 border-t border-slate-100">
              {quantity > 0 ? (
                <div className="flex items-center gap-6">
                  <div className="flex items-center h-14 rounded-2xl border-2 border-[#1B4D91]/15 bg-[#f4f6fa] overflow-hidden shrink-0">
                    <button onClick={() => decrement(product.id)} className="flex h-full w-14 items-center justify-center text-[#1B4D91] hover:bg-[#1B4D91]/5 transition-colors font-black text-xl">−</button>
                    <span className="w-12 text-center text-[16px] font-black text-[#1B4D91] tabular-nums">{quantity}</span>
                    <button onClick={() => increment(product.id)} className="flex h-full w-14 items-center justify-center text-[#1B4D91] hover:bg-[#1B4D91]/5 transition-colors font-black text-xl">+</button>
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Итоговая сумма</p>
                    <p className="text-[22px] font-black text-[#E31E24]">
                      {(product.price * quantity).toLocaleString("ru-RU")}
                      <span className="text-[14px] font-bold ml-1 text-slate-500">сум</span>
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
                  {product.stock === 0 ? t("outOfStock") : canBuy ? t("addToCart") : t("onlyCustomersCanBuy") || "Только для покупателей"}
                </button>
              )}
            </div>

            {/* ════════════════════════════════════════
          SELLER CARD
      ════════════════════════════════════════ */}
            {product.seller && (
              <div className="mx-4 md:mx-0 flex items-center gap-4 rounded-3xl md:rounded-[24px] bg-white shadow-sm border border-slate-100 p-4 md:p-6 md:mt-2">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[#1B4D91]/8 text-[#1B4D91]">
                  <Store className="size-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Поставщик</p>
                  <p className="text-[14px] font-black text-[#1B4D91] truncate">{product.seller.company}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star className="size-3 fill-[#f9b41b] text-[#f9b41b]" />
                    <span className="text-[11px] font-semibold text-slate-400">Верифицированный партнёр</span>
                  </div>
                </div>
                <button className="rounded-xl border border-[#1B4D91]/20 px-3 py-2 text-[11px] font-black text-[#1B4D91] active:bg-[#1B4D91]/5 transition-colors shrink-0">
                  Контакты
                </button>
              </div>
            )}

            {/* ════════════════════════════════════════
          ACCORDION: Описание / Характеристики / Отзывы
      ════════════════════════════════════════ */}
            <div className="mx-4 md:mx-0 mt-3 md:mt-2 rounded-3xl md:rounded-[32px] bg-white shadow-sm border border-slate-100 overflow-hidden md:px-4">
              <Accordion type="single" collapsible className="divide-y divide-slate-100">

                {/* Описание */}
                <AccordionItem value="description" className="border-none px-5">
                  <AccordionTrigger className="text-[14px] font-black text-[#1B4D91] py-4 hover:no-underline">
                    Описание
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 text-[13px] leading-relaxed text-slate-600">
                    {product.description || "Описание товара не указано."}
                  </AccordionContent>
                </AccordionItem>

                {/* Характеристики */}
                <AccordionItem value="specs" className="border-none px-5">
                  <AccordionTrigger className="text-[14px] font-black text-[#1B4D91] py-4 hover:no-underline">
                    Характеристики
                  </AccordionTrigger>
                  <AccordionContent className="pb-5">
                    <div className="space-y-2.5">
                      {[
                        { label: "Артикул", value: product.id.toString().slice(-8) },
                        { label: "В наличии", value: `${product.stock} шт.` },
                        { label: "Цена за единицу", value: `${product.price.toLocaleString("ru-RU")} сум` },
                        { label: "Статус", value: "Одобрен" },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between items-center py-1.5 border-b border-slate-50">
                          <span className="text-[12px] font-semibold text-slate-400">{label}</span>
                          <span className="text-[12px] font-bold text-[#1B4D91]">{value}</span>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* Отзывы */}
                <AccordionItem value="reviews" className="border-none px-5">
                  <AccordionTrigger className="text-[14px] font-black text-[#1B4D91] py-4 hover:no-underline">
                    Отзывы
                  </AccordionTrigger>
                  <AccordionContent className="pb-5">
                    <div className="flex flex-col items-center py-4 text-center">
                      <div className="flex gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={cn("size-5", s <= 4 ? "fill-[#f9b41b] text-[#f9b41b]" : "text-slate-200")} />
                        ))}
                      </div>
                      <p className="text-[13px] font-bold text-[#1B4D91]">Пока нет отзывов</p>
                      <p className="text-[11px] text-slate-400 mt-1">Станьте первым, кто оставит отзыв</p>
                      <button className="mt-4 rounded-xl bg-[#1B4D91]/8 px-5 py-2.5 text-[12px] font-black text-[#1B4D91] active:bg-[#1B4D91]/15 transition-colors">
                        Написать отзыв
                      </button>
                    </div>
                  </AccordionContent>
                </AccordionItem>

              </Accordion>
            </div>

          </div> {/* End of Right Column */}
        </div> {/* End of Grid */}
      </div> {/* End of Max-Width Container */}

      {/* ════════════════════════════════════════
          RECOMMENDED PRODUCTS
      ════════════════════════════════════════ */}
      {
        recommended.length > 0 && (
          <div className="mt-8 md:mt-16 w-full md:max-w-7xl md:mx-auto px-4 md:px-8">
            <h2 className="text-[16px] md:text-[22px] font-black text-[#1B4D91] mb-3 md:mb-6">Похожие товары</h2>
            <div className="grid grid-cols-2 gap-3">
              {recommended.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )
      }

      {/* ════════════════════════════════════════
          STICKY BOTTOM CTA BAR (Mobile Only)
      ════════════════════════════════════════ */}
      <div className="md:hidden fixed bottom-[72px] left-0 right-0 z-40 border-t border-slate-100 bg-white/96 backdrop-blur-md px-5 py-4 shadow-[0_-4px_20px_rgba(27,77,145,0.06)]">
        <div className="flex items-center gap-4">
          <div className="shrink-0">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t("price")}</p>
            <p className="text-[16px] font-black text-[#1B4D91]">
              {(product.price * (quantity || 1)).toLocaleString("ru-RU")}
              <span className="text-[10px] font-semibold text-slate-400 ml-1">сум</span>
            </p>
          </div>
          <div className="flex-1">
            {quantity > 0 ? (
              <div className="flex items-center justify-between h-13 rounded-2xl border-2 border-[#1B4D91]/15 bg-[#f4f6fa] overflow-hidden">
                <button onClick={() => decrement(product.id)} className="flex h-full w-12 items-center justify-center text-[#1B4D91] font-black active:bg-[#1B4D91]/10 transition-colors text-xl">−</button>
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
    </div >
  );
}
