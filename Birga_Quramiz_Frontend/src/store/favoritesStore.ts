import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import type { Product } from "@/types"

// Only persist the fields ProductCard actually needs — avoids bloating localStorage
// with specs, description, seller details, etc.
export type FavoriteItem = Pick<Product,
  'id' | 'slug' | 'sku' | 'name' | 'price' | 'imageUrl' | 'images' |
  'stock' | 'rating' | 'reviewsCount' | 'brand' | 'seller'
>

type FavoritesState = {
  items: FavoriteItem[]
  toggleFavorite: (product: Product) => void
  isFavorite: (id: string) => boolean
  clearFavorites: () => void
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      items: [],

      toggleFavorite: (product) => {
        const items = get().items
        const exists = items.some((p) => p.id === product.id)
        if (exists) {
          set({ items: items.filter((p) => p.id !== product.id) })
        } else {
          // Pick only the fields we need
          const item: FavoriteItem = {
            id: product.id,
            slug: product.slug,
            sku: product.sku,
            name: product.name,
            price: product.price,
            imageUrl: product.imageUrl,
            images: product.images,
            stock: product.stock,
            rating: product.rating,
            reviewsCount: product.reviewsCount,
            brand: product.brand,
            seller: product.seller,
          }
          set({ items: [...items, item] })
        }
      },

      isFavorite: (id) => get().items.some((p) => p.id === id),

      clearFavorites: () => set({ items: [] }),
    }),
    {
      name: "favorites-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
