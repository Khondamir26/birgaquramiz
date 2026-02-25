export type Role = 'USER' | 'SELLER' | 'ADMIN'
export type ProductStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type OrderStatus = 'NEW' | 'PAID' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
export type DeliveryType = 'DELIVERY' | 'PICKUP'
export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER'

export type User = {
  id: string
  name: string
  phone: string
  role: Role
  createdAt: string
}

export type Seller = {
  id: string
  userId: string
  company: string
  verified: boolean
}

export type Product = {
  id: string
  sellerId: string
  name: string
  description: string
  imageUrl: string
  price: number
  stock: number
  status: ProductStatus
  createdAt: string
  seller?: Seller & { user?: User }
}

export type OrderItem = {
  id: string
  orderId: string
  productId: string
  quantity: number
  price: number
  product?: Product
}

export type Order = {
  id: string
  userId?: string | null
  customerName: string
  customerPhone: string
  deliveryType: DeliveryType
  deliveryAddress?: string | null
  paymentMethod: PaymentMethod
  comment?: string | null
  total: number
  status: OrderStatus
  createdAt: string
  user?: User | null
  items?: OrderItem[]
}

export type PaginatedResponse<T> = {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export type SellerAnalytics = {
  totalOrders: number
  totalRevenue: number
  breakdown: {
    NEW: number
    CONFIRMED: number
    SHIPPED: number
    DELIVERED: number
    CANCELLED: number
  }
}