export type CartItem = {
  id: string
  sku?: string | null
  name: string
  price: number
  image: string
  quantity: number
}

export type CartProductInput = {
  id: string
  sku?: string | null
  name: string
  price: number
  image: string
}

export function addOrIncrementItem(items: CartItem[], product: CartProductInput): CartItem[] {
  const existing = items.find((item) => item.id === product.id)
  if (!existing) {
    return [...items, { ...product, quantity: 1 }]
  }

  return items.map((item) =>
    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
  )
}

export function setItemQuantity(items: CartItem[], productId: string, quantity: number): CartItem[] {
  if (quantity <= 0) {
    return items.filter((item) => item.id !== productId)
  }

  return items.map((item) =>
    item.id === productId ? { ...item, quantity } : item,
  )
}

export function incrementItem(items: CartItem[], productId: string): CartItem[] {
  return items.map((item) =>
    item.id === productId ? { ...item, quantity: item.quantity + 1 } : item,
  )
}

export function decrementItem(items: CartItem[], productId: string): CartItem[] {
  const target = items.find((item) => item.id === productId)
  if (!target) return items

  if (target.quantity <= 1) {
    return items.filter((item) => item.id !== productId)
  }

  return items.map((item) =>
    item.id === productId ? { ...item, quantity: item.quantity - 1 } : item,
  )
}

export function removeItem(items: CartItem[], productId: string): CartItem[] {
  return items.filter((item) => item.id !== productId)
}

export function getUniqueProductsCount(items: CartItem[]): number {
  return items.length
}

export function getItemQuantity(items: CartItem[], productId: string): number {
  return items.find((item) => item.id === productId)?.quantity ?? 0
}