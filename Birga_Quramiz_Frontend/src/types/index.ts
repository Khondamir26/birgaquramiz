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

export type Category = {
  id: string
  name: string
  code: string
  parentId?: string | null
  parent?: { id: string; name: string } | null
}

export type Product = {
  id: string
  sku?: string | null
  sellerId: string
  categoryId?: string | null
  brandId?: string | null
  name: string
  description: string
  imageUrl: string
  price: number
  stock: number
  status: ProductStatus
  createdAt: string
  seller?: Seller & { user?: User }
  category?: Category | null
  brand?: Brand | null
  reviews?: Review[]
  rating?: number
  reviewsCount?: number
  specifications?: Record<string, string> | null
}

export type Review = {
  id: string
  productId: string
  userId: string
  rating: number
  pros?: string | null
  cons?: string | null
  comment?: string | null
  images: string[]
  likes: number
  createdAt: string
  user?: User
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

export type ModerationLogEntry = {
  id: string
  adminId: string
  productId: string
  action: string
  reason?: string | null
  createdAt: string
}

export type AdminProductDetail = {
  product: {
    id: string
    sku?: string | null
    title: string
    description: string
    price: number
    images: string[]
    stock: number
    createdAt: string
    status: ProductStatus
    rejectionReason?: string | null
    moderationLogs: ModerationLogEntry[]
    category?: Category | null
  }
  seller: {
    id: string
    name: string
    companyName?: string
    phone: string
    createdAt: string
    productsCount: number
  }
}

export type Brand = {
  id: string
  name: string
  slug: string
  logoUrl: string
  website?: string | null
  description?: string | null
  featured: boolean
  createdAt: string
  products?: Product[]
}