"use client";

import { useState } from "react";
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
import FullPageLoader from "@/components/ui/FullPageLoader";
import SpecsDrawer from "./SpecsDrawer";
// import ReviewsSection from "./ReviewsSection";

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
  
  const canBuy = !isAuthenticated || user?.role === "USER";
  const quantity = getQuantity(product.id);
  const liked = isFavorite(product.id);
  const images = product.images && product.images.length > 0
    ? product.images.map((img) => resolveImageUrl(img))
    : product.imageUrl ? [resolveImageUrl(product.imageUrl)] : [];

  const handleBuyNow = async () => {
    setIsBuying(true);
    if (quantity === 0) {
      handleAddToCart();
    }
    await new Promise(resolve => setTimeout(resolve, 800));
    router.push('/cart');
  };

  const handleGoToCart = async () => {
    setIsBuying(true);
    await new Promise(resolve => setTimeout(resolve, 800));
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

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="mx-auto w-full max-w-[1440px] px-4 md:px-6 mb-4 md:mb-6 mt-4 md:mt-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
              <button 
                onClick={() => router.back()}
                className="text-slate-600 hover:text-slate-900 transition-colors p-1 -ml-1 cursor-pointer"
                aria-label="Back"
              >
                <ArrowLeft className="size-5 md:size-6" />
              </button>
              <Breadcrumbs items={breadcrumbItems} />
          </div>
          
          <div className="flex items-center gap-4 md:gap-6">
              <button 
                onClick={() => toggleFavorite(product)} 
                className="text-slate-400 hover:text-[#275fdb] transition-colors flex items-center justify-center group"
                aria-label="Favorite"
              >
                <Heart className={liked ? "fill-[#275fdb] text-[#275fdb] size-5 md:size-6" : "size-5 md:size-6"} />
              </button>
              <button 
                onClick={handleShare} 
                className="text-slate-400 hover:text-[#275fdb] transition-colors flex items-center justify-center group"
                aria-label="Share"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5 md:size-6"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
              </button>
              <button 
                className="text-slate-400 hover:text-[#275fdb] transition-colors flex items-center justify-center group"
                aria-label="Report"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5 md:size-6"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              </button>
          </div>
      </div>
      

      {/* Main Container */}
      <div className="mx-auto w-full max-w-[1440px] px-4 md:px-6">

        {/* Desktop Container -> the Grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-[84px_1fr_340px] lg:grid-cols-[84px_440px_1fr_360px] gap-6 lg:gap-10 lg:items-start">
          
          {/* LEFT: GALLERY (occupies first 2 cols on lg) */}
          <div className="col-span-1 md:col-span-2 lg:col-span-2 lg:contents md:contents block order-1 md:order-none">
             <ProductGallery images={images} productName={product.name} />
          </div>

          {/* CENTER: INFO BLOCK + SELLER + ACCORDIONS (1fr col) */}
          <div className="flex flex-col gap-0 px-0 md:px-0 order-2 md:order-none col-span-1 pb-10">
            <ProductInfo 
              product={product}
              onOpenSpecs={() => setSpecsOpen(true)}
            />
          </div>

          {/* RIGHT: STICKY PURCHASE CARD (360px col on lg, hidden on small screens unless adapted) */}
          <div className="hidden lg:block order-last lg:order-none col-span-1 lg:col-span-1 col-start-4">
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
        
        {/* 
        <div className="mt-8 flex flex-col gap-8">
            <ReviewsSection product={product} />
        </div>
        */}
      </div>

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

      <FullPageLoader isOpen={isBuying} />

    </div>
  );
}
