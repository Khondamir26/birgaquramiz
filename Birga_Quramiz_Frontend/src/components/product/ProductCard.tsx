'use client'

import { memo } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { useCartStore } from "@/store/cartStore"
import { useFavoritesStore } from "@/store/favoritesStore"
import { resolveImageUrl } from "@/lib/image"
import type { Product } from "@/types"
import { ShoppingCart } from "lucide-react"
import ProductFrame from "@/components/ui/ProductFrame"

const ProductCard = memo(function ProductCard({ product }: { product: Product }) {
  const router = useRouter()
  const t = useTranslations("ProductCard")

  // Granular selectors — only this card re-renders when its own quantity/favorite changes
  const quantity = useCartStore(s => s.items.find(i => i.id === product.id)?.quantity ?? 0)
  const addItem  = useCartStore(s => s.addItem)
  const increment = useCartStore(s => s.increment)
  const decrement = useCartStore(s => s.decrement)

  const liked = useFavoritesStore(s => s.isFavorite(product.id))
  const toggleFavorite = useFavoritesStore(s => s.toggleFavorite)

  const handleCardClick = (e: React.MouseEvent<HTMLElement>) => {
    const target = e.target as HTMLElement
    if (target.closest("button")) return
    router.push(product.slug ? `/product/${product.slug}` : `/catalog/product/${product.id}`)
  }

  const handleAddToCart = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    addItem({
      id: product.id,
      sku: product.sku,
      name: product.name,
      price: product.price,
      image: resolveImageUrl(product.imageUrl),
      brandName: product.brand?.name,
      sellerCompany: product.seller?.company,
      stock: product.stock,
    })
    toast.success(t("addedToCartToast"))
  }

  const handleIncrement = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    increment(product.id)
  }

  const handleDecrement = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    decrement(product.id)
  }

  return (
    <article
      onClick={handleCardClick}
      className="bg-white rounded-xl flex flex-col overflow-hidden cursor-pointer w-full shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      {/* IMAGE AREA */}
      <div className="relative aspect-[446/595] w-full rounded-[7%] overflow-hidden">
        <button
          onClick={(e) => {
            e.stopPropagation()
            toggleFavorite(product)
          }}
          aria-label={liked ? "Remove from favorites" : "Add to favorites"}
          className="absolute top-1.5 right-1.5 z-20 p-2.5"
        >
          {!liked ? (
            <svg fill="none" height="24px" width="24px" xmlns="http://www.w3.org/2000/svg">
              <path fill="white" d="M7 5a4 4 0 0 0-4 4c0 3.552 2.218 6.296 4.621 8.22A21.5 21.5 0 0 0 12 19.91a21.6 21.6 0 0 0 4.377-2.69C18.78 15.294 21 12.551 21 9a4 4 0 0 0-4-4c-1.957 0-3.652 1.396-4.02 3.2a1 1 0 0 1-1.96 0C10.652 6.396 8.957 5 7 5"></path>
              <path fill="black" d="M12 22c-.316-.02-.56-.147-.848-.278a23.5 23.5 0 0 1-4.781-2.942C3.777 16.705 1 13.449 1 9a6 6 0 0 1 6-6 6.18 6.18 0 0 1 5 2.568A6.18 6.18 0 0 1 17 3a6 6 0 0 1 6 6c0 4.448-2.78 7.705-5.375 9.78a23.6 23.6 0 0 1-4.78 2.942c-.543.249-.732.278-.845.278M7 5a4 4 0 0 0-4 4c0 3.552 2.218 6.296 4.621 8.22A21.5 21.5 0 0 0 12 19.91a21.6 21.6 0 0 0 4.377-2.69C18.78 15.294 21 12.551 21 9a4 4 0 0 0-4-4c-1.957 0-3.652 1.396-4.02 3.2a1 1 0 0 1-1.96 0C10.652 6.396 8.957 5 7 5"></path>
            </svg>
          ) : (
            <svg height="24px" width="24px" xmlns="http://www.w3.org/2000/svg">
              <path fill="#F8104B" fillRule="evenodd" d="M12 22c-.316-.02-.56-.147-.848-.278a23.5 23.5 0 0 1-4.781-2.942C3.777 16.705 1 13.449 1 9a6 6 0 0 1 6-6 6.18 6.18 0 0 1 5 2.568A6.18 6.18 0 0 1 17 3a6 6 0 0 1 6 6c0 4.448-2.78 7.705-5.375 9.78a23.6 23.6 0 0 1-4.78 2.942c-.543.249-.732.278-.845.278" clipRule="evenodd"></path>
            </svg>
          )}
        </button>

        <ProductFrame
          src={resolveImageUrl(product.imageUrl)}
          alt={product.name}
          loading="lazy"
          className="absolute inset-0 w-full h-full"
        />
      </div>

      <div className="pb-3 pt-2.5 px-2.5 flex flex-col flex-grow bg-white">

        {/* TITLE */}
        <h3 className="text-[14px] text-black line-clamp-2 mb-1 h-max">
          {product.name}
        </h3>
        {/* PRICE */}
        <div className="mb-1.5 flex items-baseline gap-1">
          <span className="text-[16px] font-bold text-black tracking-tight">
            {product.price.toLocaleString("ru-RU")}
          </span>
          <span className="text-[12px] text-black">UZS</span>
        </div>
        {/* RATING */}
        <div className="flex items-center gap-2 mb-2">
          {product.rating && product.rating > 0 ? (
            <div className="flex items-center gap-[3px] text-[13px] font-bold text-black">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFA800" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              {product.rating.toFixed(1)}
            </div>
          ) : null}
          <div className="flex items-center gap-[4px] text-[13px] font-medium text-[#6b7280]">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#6b7280" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
            {product.reviewsCount && product.reviewsCount > 0 ? t("reviews", { count: product.reviewsCount }) : t("noReviews")}
          </div>
        </div>

        {/* BUTTON */}
        <div className="h-max w-full mt-auto ">
          {quantity > 0 ? (
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full h-11 rounded-2xl bg-[#275fdb] flex items-center overflow-hidden"
            >
              <button
                onClick={handleDecrement}
                className="flex-none w-11 h-full flex items-center justify-center text-white active:opacity-70"
              >
                <svg width="14" height="2" viewBox="0 0 16 2" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M1.25 1H14.75"/></svg>
              </button>
              <span className="flex-1 flex flex-col items-center justify-center select-none leading-none gap-[2px]">
                <span className="text-white font-bold text-[15px]">{quantity}</span>
                <span className="text-white/90 font-medium text-[11px]">{t("inCart")}</span>
              </span>
              <button
                onClick={handleIncrement}
                className="flex-none w-11 h-full flex items-center justify-center text-white active:opacity-70"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
            </div>
          ) : (
            <button
              onClick={handleAddToCart}
              className="w-full min-h-[44px] py-2 cursor-pointer rounded-2xl bg-[#275fdb] border-[1.5px] border-[#275fdb] gap-1.5 md:gap-2 text-white text-[12px] md:text-[14px] font-semibold flex items-center justify-center transition-colors hover:bg-opacity-90 active:scale-[0.98]"
            >
              <ShoppingCart className="size-[13px] md:size-[15px] shrink-0" />
              {t("addToCart")}
            </button>
          )}
        </div>
      </div>
    </article>
  )
})

export default ProductCard