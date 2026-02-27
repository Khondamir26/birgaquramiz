import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import type { Product } from "@/types"

type FavoritesState = {
    items: Product[]
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
                const exists = items.find((p) => p.id === product.id)

                if (exists) {
                    set({ items: items.filter((p) => p.id !== product.id) })
                } else {
                    set({ items: [...items, product] })
                }
            },

            isFavorite: (id) => {
                return get().items.some((p) => p.id === id)
            },

            clearFavorites: () => set({ items: [] }),
        }),
        {
            name: "favorites-storage",
            storage: createJSONStorage(() => localStorage),
        },
    ),
)
