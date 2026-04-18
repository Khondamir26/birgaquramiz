import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import {
  addItemWithQuantity,
  addOrIncrementItem,
  decrementItem,
  getItemQuantity,
  getUniqueProductsCount,
  incrementItem,
  removeItem,
  setItemQuantity,
  type CartItem,
  type CartProductInput,
} from "@/lib/cart/cart-domain"

type CartState = {
  items: CartItem[]
  addItem: (product: CartProductInput) => void
  addItemWithQuantity: (product: CartProductInput, quantity: number) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  increment: (id: string) => void
  decrement: (id: string) => void
  getQuantity: (id: string) => number
  getUniqueCount: () => number
  clearCart: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product) =>
        set((state) => ({
          items: addOrIncrementItem(state.items, product),
        })),

      addItemWithQuantity: (product, quantity) =>
        set((state) => ({
          items: addItemWithQuantity(state.items, product, quantity),
        })),

      removeItem: (id) =>
        set((state) => ({
          items: removeItem(state.items, id),
        })),

      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: setItemQuantity(state.items, id, quantity),
        })),

      increment: (id) =>
        set((state) => ({
          items: incrementItem(state.items, id),
        })),

      decrement: (id) =>
        set((state) => ({
          items: decrementItem(state.items, id),
        })),

      getQuantity: (id) => getItemQuantity(get().items, id),
      getUniqueCount: () => getUniqueProductsCount(get().items),

      clearCart: () => set({ items: [] }),
    }),
    {
      name: "cart-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    },
  ),
)
