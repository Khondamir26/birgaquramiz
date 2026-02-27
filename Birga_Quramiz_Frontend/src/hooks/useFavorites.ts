"use client"

import { useFavoritesStore } from "@/store/favoritesStore"

export function useFavorites() {
    const items = useFavoritesStore((state) => state.items)
    const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite)
    const isFavorite = useFavoritesStore((state) => state.isFavorite)
    const clearFavorites = useFavoritesStore((state) => state.clearFavorites)

    return {
        items,
        toggleFavorite,
        isFavorite,
        clearFavorites,
    }
}
