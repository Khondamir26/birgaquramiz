"use client"

import { useMemo } from "react"
import { useCartStore } from "@/store/cartStore"

export function useCart() {
  const items = useCartStore((state) => state.items)
  const addItem = useCartStore((state) => state.addItem)
  const removeItem = useCartStore((state) => state.removeItem)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const increment = useCartStore((state) => state.increment)
  const decrement = useCartStore((state) => state.decrement)
  const clearCart = useCartStore((state) => state.clearCart)

  const uniqueCount = useMemo(() => items.length, [items])

  const getQuantity = (productId: string) =>
    items.find((item) => item.id === productId)?.quantity ?? 0

  const getItem = (productId: string) =>
    items.find((item) => item.id === productId)

  return {
    items,
    uniqueCount,
    addItem,
    removeItem,
    updateQuantity,
    increment,
    decrement,
    clearCart,
    getQuantity,
    getItem,
  }
}
