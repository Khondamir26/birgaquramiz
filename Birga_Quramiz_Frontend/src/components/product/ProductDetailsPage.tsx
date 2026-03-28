"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { getCategoryName } from "@/lib/categoryName";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";
import { resolveImageUrl } from "@/lib/image";
import type { Product } from "@/types";
import { ArrowLeft, Heart } from "lucide-react";
import Breadcrumbs from "@/components/navigation/Breadcrumbs";

import ProductGallery from "./ProductGallery";
import ProductInfo from "./ProductInfo";
import StickyPurchaseCard from "./StickyPurchaseCard";
import ProductStickyBar from "./ProductStickyBar";
import FullPageLoader from "@/components/ui/FullPageLoader";
import SpecsDrawer from "./SpecsDrawer";
import ReviewsSection from "./ReviewsSection";
import SimilarProducts from "./SimilarProducts";
import { UZ_MONTHS } from "@/lib/date";
import { getProducts } from "@/lib/api/products";

type ProductDetailsPageProps = {
  product: Product;
};

export default function ProductDetailsPage({ product }: ProductDetailsPageProps) {
  const router = useRouter();
  const { addItem, increment, decrement, getQuantity } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { toggleFavorite, isFavorite } = useFavorites();
  const t = useTranslations("ProductDetail");
  const tNav = useTranslations("Navbar");
  const locale = useLocale();

  const [specsOpen, setSpecsOpen] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [similarItems, setSimilarItems] = useState<Product[] | undefined>(undefined);
  const productGridRef = useRef<HTMLDivElement>(null);

  // Make navbar non-sticky on this page only
  useEffect(() => {
    document.body.classList.add("product-page");
    return () => document.body.classList.remove("product-page");
  }, []);

  // Show sticky bar when product grid scrolls out of view (above viewport)
  useEffect(() => {
    const el = productGridRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowStickyBar(!entry.isIntersecting && entry.boundingClientRect.bottom < 0);
      },
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Fetch similar products once — shared between mobile and desktop renders
  useEffect(() => {
    if (!product.categoryId) {
      Promise.resolve().then(() => setSimilarItems([]));
      return;
    }
    getProducts(1, 16, undefined, product.categoryId)
      .then((res) => setSimilarItems(res.data.filter((p) => p.id !== product.id)))
      .catch(() => setSimilarItems([]));
  }, [product.id, product.categoryId]);

  const canBuy = !isAuthenticated || user?.role === "USER";
  const quantity = getQuantity(product.id);
  const liked = isFavorite(product.id);
  const images = product.images && product.images.length > 0
    ? product.images.map((img) => resolveImageUrl(img))
    : product.imageUrl ? [resolveImageUrl(product.imageUrl)] : [];

  const handleBuyNow = () => {
    setIsBuying(true);
    if (quantity === 0) {
      handleAddToCart();
    }
    router.push('/cart');
  };

  const handleGoToCart = () => {
    setIsBuying(true);
    router.push('/cart');
  };

  const breadcrumbItems = [
    { label: tNav("home"), href: "/" },
    ...(product.category?.parent ? [{ label: getCategoryName(product.category.parent, locale), href: `/catalog/category/${product.category.parent.slug ?? product.category.parent.id}` }] : []),
    ...(product.category ? [{ label: getCategoryName(product.category, locale), href: `/catalog/category/${product.category.slug ?? product.category.id}` }] : []),
    { label: product.name },
  ];

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      sku: product.sku || "",
      name: product.name,
      price: product.price,
      image: images[0] || "",
      brandName: product.brand?.name,
      sellerCompany: product.seller?.company,
      stock: product.stock,
    });
    // toast.success("Product added to cart");
  };

  const handleShare = () => {
    const url = window.location.href;
    const text = product.name;
    const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    window.open(telegramShareUrl, '_blank');
  };

  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 2);
  const formattedDelivery = `${deliveryDate.getDate()} ${UZ_MONTHS[deliveryDate.getMonth()]}`;

  return (
    <div className="flex flex-col min-h-screen bg-white">

      {/* ── Desktop header: breadcrumbs + actions ── */}
      <div className="hidden lg:flex mx-auto w-full max-w-[1440px] px-6 mb-4 mt-5 justify-between items-center">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="text-slate-600 hover:text-slate-900 transition-colors p-1 -ml-1 cursor-pointer" aria-label="Back">
            <ArrowLeft className="size-6" />
          </button>
          <Breadcrumbs items={breadcrumbItems} />
        </div>
        <div className="flex items-center gap-6">
          <button onClick={() => toggleFavorite(product)} className="text-slate-400 hover:text-[#275fdb] transition-colors" aria-label="Favorite">
            <Heart className={liked ? "fill-[#275fdb] text-[#275fdb] size-6" : "size-6"} />
          </button>
          <button onClick={handleShare} className="text-slate-400 hover:text-[#275fdb] transition-colors" aria-label="Share">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          </button>
        </div>
      </div>

      {/* ── Mobile: full-bleed gallery with floating nav ── */}
      <div className="relative lg:hidden">
        {/* Floating top bar over image */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-3 pt-3">
          {/* Back */}
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center rounded-lg bg-white/75 backdrop-blur-md"
            style={{ width: 40, height: 40 }}
            aria-label="Oldingi sahifaga"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M15.2071 19.7071C15.5976 19.3166 15.5976 18.6834 15.2071 18.2929L8.91421 12L15.2071 5.70711C15.5976 5.31658 15.5976 4.68342 15.2071 4.29289C14.8166 3.90237 14.1834 3.90237 13.7929 4.29289L6.90603 11.1798L6.90325 11.1825C6.88991 11.1957 6.84518 11.2401 6.80532 11.2871C6.75433 11.3471 6.65601 11.4731 6.59526 11.6601C6.52347 11.881 6.52347 12.119 6.59526 12.3399C6.65601 12.5269 6.75433 12.6529 6.80532 12.7129C6.84518 12.7599 6.88992 12.8043 6.90325 12.8175L6.90603 12.8202L13.7929 19.7071C14.1834 20.0976 14.8166 20.0976 15.2071 19.7071Z" fill="currentColor"/>
            </svg>
          </button>

          <div className="flex items-center gap-2">
            {/* Favorite */}
            <button
              onClick={() => toggleFavorite(product)}
              className="flex items-center justify-center rounded-lg bg-white/75 backdrop-blur-md"
              style={{ width: 40, height: 40 }}
              aria-label="Saralanganlarga qo'shish"
            >
              {liked ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M15.3073 3.27088C17.1525 2.72032 19.3373 2.92306 21.2126 4.70838L21.3933 4.88611L21.4011 4.8949L21.4089 4.90272C23.8744 7.53266 23.1561 11.1122 21.4157 13.7181C20.6946 14.7977 19.0871 16.5041 17.5105 18.0883C15.9065 19.6999 14.246 21.2715 13.3513 22.1088C12.5916 22.8194 11.4147 22.8257 10.6491 22.1185C9.75229 21.2899 8.09064 19.7347 6.48606 18.1273C4.91737 16.5559 3.3128 14.8456 2.58371 13.7172C0.851984 11.1242 0.110911 7.42715 2.60617 4.88611L2.61594 4.87635C4.57461 2.93743 6.83708 2.72527 8.73117 3.30701C10.0345 3.70739 11.1843 4.48839 11.987 5.33729C12.8033 4.45641 13.9835 3.66597 15.3073 3.27088Z" fill="#E31E24"/>
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M15.3073 3.27088C17.1525 2.72032 19.3373 2.92306 21.2126 4.70838L21.3933 4.88611L21.4011 4.8949L21.4089 4.90272C23.8744 7.53266 23.1561 11.1122 21.4157 13.7181C20.6946 14.7977 19.0871 16.5041 17.5105 18.0883C15.9065 19.6999 14.246 21.2715 13.3513 22.1088C12.5916 22.8194 11.4147 22.8257 10.6491 22.1185C9.75229 21.2899 8.09064 19.7347 6.48606 18.1273C4.91737 16.5559 3.3128 14.8456 2.58371 13.7172C0.851984 11.1242 0.110911 7.42715 2.60617 4.88611L2.61594 4.87635C4.57461 2.93743 6.83708 2.72527 8.73117 3.30701C10.0345 3.70739 11.1843 4.48839 11.987 5.33729C12.8033 4.45641 13.9835 3.66597 15.3073 3.27088ZM19.9538 6.27576C18.6333 4.93947 17.1735 4.8019 15.8796 5.18787C14.5084 5.59713 13.3923 6.58154 12.9685 7.34412C12.5492 8.0975 11.4661 8.10348 11.0359 7.3617C10.607 6.62229 9.50308 5.63665 8.14426 5.21912C6.86145 4.82513 5.3948 4.94268 4.02805 6.29236C2.61733 7.73461 2.71671 10.0358 3.97824 12.1801L4.2468 12.6068L4.25657 12.6224C4.84496 13.5385 6.29632 15.1057 7.90207 16.7142C9.4719 18.2868 11.1026 19.8144 11.9939 20.6381C12.8836 19.8052 14.5187 18.2585 16.0925 16.6771C17.6996 15.0623 19.1596 13.4947 19.7527 12.6068C21.254 10.3587 21.4899 7.9191 19.9538 6.27576Z" fill="currentColor"/>
                </svg>
              )}
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              className="flex items-center justify-center rounded-lg bg-white/75 backdrop-blur-md"
              style={{ width: 40, height: 40 }}
              aria-label="Tovar havolasini ulashish"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M17.5 2C15.567 2 14 3.567 14 5.5C14 5.72875 14.0219 5.95238 14.0638 6.16889L8.66807 9.25219C8.0719 8.78116 7.31878 8.5 6.5 8.5C4.567 8.5 3 10.067 3 12C3 13.933 4.567 15.5 6.5 15.5C7.31881 15.5 8.07195 15.2188 8.66814 14.7478L14.0639 17.831C14.0219 18.0476 14 18.2712 14 18.5C14 20.433 15.567 22 17.5 22C19.433 22 21 20.433 21 18.5C21 16.567 19.433 15 17.5 15C16.5168 15 15.6283 15.4054 14.9925 16.0582L9.82238 13.1038C9.93761 12.7568 10 12.3857 10 12C10 11.6143 9.9376 11.2431 9.82236 10.8961L14.9924 7.94176C15.6282 8.59457 16.5168 9 17.5 9C19.433 9 21 7.433 21 5.5C21 3.567 19.433 2 17.5 2ZM16 5.5C16 4.67157 16.6716 4 17.5 4C18.3284 4 19 4.67157 19 5.5C19 6.32843 18.3284 7 17.5 7C16.6716 7 16 6.32843 16 5.5ZM5 12C5 11.1716 5.67157 10.5 6.5 10.5C7.32843 10.5 8 11.1716 8 12C8 12.8284 7.32843 13.5 6.5 13.5C5.67157 13.5 5 12.8284 5 12ZM17.5 17C16.6716 17 16 17.6716 16 18.5C16 19.3284 16.6716 20 17.5 20C18.3284 20 19 19.3284 19 18.5C19 17.6716 18.3284 17 17.5 17Z" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>
        {/* Full-bleed gallery (no padding) */}
        <ProductGallery images={images} productName={product.name} />
      </div>

      {/* ── Mobile content ── */}
      <div className="lg:hidden flex flex-col bg-[#e8e8ed] px-[6px] pt-1 pb-[130px]">

        {/* ── Card: Price ── */}
        <div className="bg-white rounded-2xl border border-[#e2e2e8] px-4 py-4">
          <div className="flex items-baseline gap-2">
            <span className="text-[26px] font-black text-[#E31E24] leading-none tracking-tight">
              {product.price.toLocaleString("ru-RU")}
            </span>
            <span className="text-[14px] font-semibold text-[#E31E24]">{t("currencyUzs")}</span>
          </div>
        </div>

        {/* ── Card: Reviews (mobile only, after price like WB) ── */}
        <div className="bg-white rounded-2xl border border-[#e2e2e8] overflow-hidden">
          <ReviewsSection product={product} compact />
        </div>

        {/* ── Card: Brand + Title + Specs ── */}
        <div className="bg-white rounded-2xl border border-[#e2e2e8] px-4 py-4 flex flex-col gap-3">

          {/* Brand pill + three-dot */}
          <div className="flex items-center justify-between">
            {(product.brand || product.seller?.company) ? (
              <a
                href={product.brand ? `/brands/${product.brand.slug}` : `/catalog?brand=${encodeURIComponent(product.seller!.company)}`}
                className="px-3 py-1 bg-[#f4f4f6] rounded-lg text-[13px] font-semibold text-[#444] border border-[#e8e8ec]"
              >
                {product.brand?.name ?? product.seller!.company}
              </a>
            ) : <span />}
            <button onClick={() => setSpecsOpen(true)} className="p-1.5 -mr-1 text-[#bbb]" aria-label="More">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
            </button>
          </div>

          {/* Title */}
          <h1 className="text-[16px] font-bold text-[#1a1a1a] leading-snug">{product.name}</h1>

          {/* Description preview */}
          {product.description && (
            <p className="text-[13px] text-[#666] leading-relaxed line-clamp-3">
              {product.description}
            </p>
          )}

          {/* Specs link */}
          <button
            onClick={() => setSpecsOpen(true)}
            className="self-start flex items-center gap-1 text-[13px] text-[#275fdb] font-semibold"
          >
            {t("specsAndDescription")}
            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>

        {/* ── Card: Seller ── */}
        {product.seller && (
          <a
            href={`/sellers/${product.seller.articleNumber ?? product.seller.id}`}
            className="bg-white rounded-2xl border border-[#e2e2e8] px-4 py-4 flex items-center justify-between active:bg-[#f9f9fb]"
          >
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-[15px] font-bold text-[#1a1a1a] truncate">{product.seller.company}</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[12px] text-[#888]">{t("sellerLabel")}</span>
                <span className="text-[#ddd]">·</span>
                <svg className="size-3 fill-[#FFA800]" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                <span className="text-[12px] font-bold text-[#333]">4.8</span>
              </div>
            </div>
            <svg className="size-4 text-[#ccc] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </a>
        )}

      </div>

      {/* ── Mobile fixed bottom CTA ── */}
      <div className="lg:hidden fixed bottom-[60px] left-0 right-0 z-40 bg-white border-t border-[#ebebeb] px-4 pt-2 pb-4 flex flex-col gap-2">
        {/* Price + delivery row */}
        <div className="flex items-center">
          <span className="text-[13px] font-bold text-[#E31E24] leading-none">
            {product.price.toLocaleString("ru-RU")}
            <span className="text-[12px] font-medium text-[#E31E24] ml-1">{t("currencyUzs")}</span>
          </span>
          <div className="flex items-center gap-1 ml-auto text-[12px] text-[#555]">
            <span>📦</span>
            <span>{formattedDelivery}</span>
            <svg className="size-3 text-[#aaa]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </div>
        </div>
        {/* Buttons row */}
        <div className="flex gap-3">
          <button
            onClick={handleBuyNow}
            disabled={product.stock === 0 || !canBuy || isBuying}
            className="flex-1 h-12 rounded-2xl bg-[#e8edfc] text-[#275fdb] text-[15px] font-bold transition-colors active:bg-[#d6e0f8] disabled:opacity-40"
          >
            {t("buyNow")}
          </button>
          {quantity > 0 ? (
            <div className="flex flex-1 h-12 items-center bg-[#275fdb] rounded-2xl overflow-hidden">
              <button onClick={() => decrement(product.id)} className="flex-none px-4 h-full text-white flex items-center justify-center">
                <svg width="16" height="2" viewBox="0 0 16 2" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M1.25 1H14.75"/></svg>
              </button>
              <button onClick={() => router.push("/cart")} className="flex-1 h-full flex flex-col items-center justify-center gap-[2px]">
                <span className="text-white font-bold text-[15px] leading-none">{quantity}</span>
                <span className="text-white/90 font-medium text-[11px] leading-none">{t("inCart")}</span>
              </button>
              <button onClick={() => increment(product.id)} className="flex-none px-4 h-full text-white flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
            </div>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0 || !canBuy}
              className="flex-1 h-12 rounded-2xl bg-[#275fdb] text-white text-[15px] font-bold transition-colors active:bg-[#1a4fc4] disabled:opacity-40"
            >
              {t("addToCart")}
            </button>
          )}
        </div>
      </div>

      {/* ── Desktop layout ── */}
      <div ref={productGridRef} className="hidden lg:block mx-auto w-full max-w-[1440px] px-6">
        <div className="grid items-start gap-5
          lg:grid-cols-[minmax(200px,360px)_1fr_340px]
          xl:grid-cols-[84px_minmax(300px,440px)_1fr_360px]
          xl:gap-8">
          {/* Gallery: sticky grid item at lg; at xl becomes contents and children handle sticky */}
          <div className="col-span-1 xl:col-span-2 xl:contents sticky top-6">
            <ProductGallery images={images} productName={product.name} />
          </div>
          <div className="col-span-1 pb-10">
            <ProductInfo product={product} onOpenSpecs={() => setSpecsOpen(true)} />
          </div>
          <div className="col-span-1 sticky top-6">
            <StickyPurchaseCard
              product={product}
              quantity={quantity}
              increment={increment}
              decrement={decrement}
              handleAddToCart={handleAddToCart}
              handleBuyNow={handleBuyNow}
              handleGoToCart={handleGoToCart}
              isBuying={isBuying}
              canBuy={canBuy}
              t={t}
            />
          </div>
        </div>
      </div>

      {/* ── Sticky mini product bar (desktop only) ── */}
      <ProductStickyBar
        product={product}
        images={images}
        quantity={quantity}
        liked={liked}
        canBuy={canBuy}
        isBuying={isBuying}
        show={showStickyBar}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        onGoToCart={handleGoToCart}
        onToggleFavorite={() => toggleFavorite(product)}
        onIncrement={increment}
        onDecrement={decrement}
      />

      <SpecsDrawer
        open={specsOpen}
        onOpenChange={setSpecsOpen}
        product={product}
        quantity={quantity}
        increment={increment}
        decrement={decrement}
        handleAddToCart={handleAddToCart}
        handleBuyNow={handleBuyNow}
        handleGoToCart={handleGoToCart}
        isBuying={isBuying}
        canBuy={canBuy}
        t={t}
      />

      {/* ── Reviews (desktop only) ── */}
      <div className="hidden lg:block mt-14">
        <div className="mx-auto w-full max-w-[1440px] px-6">
          <ReviewsSection product={product} />
        </div>
      </div>

      {/* ── Similar products ── */}
      {/* Mobile: only render card when items exist; spacer always shown for fixed CTA */}
      {similarItems && similarItems.length > 0 && (
        <div className="lg:hidden bg-[#e8e8ed] px-[6px]">
          <div className="bg-white rounded-2xl border border-[#e2e2e8] px-4 py-2">
            <SimilarProducts product={product} initialItems={similarItems} />
          </div>
        </div>
      )}
      {/* Desktop: contained section below reviews */}
      <div className="hidden lg:block mx-auto w-full max-w-[1440px] px-6 pb-12 mt-4">
        <SimilarProducts product={product} />
      </div>

      <FullPageLoader isOpen={isBuying} />
    </div>
  );
}
