import { apiFetch } from './client'
import type { PaginatedResponse, User, Order, OrderStatus, Role, AdminProductDetail, DeliveryType, PaymentMethod } from '@/types'

// ── Detailed response types ────────────────────────────────────────────────────

export interface AdminOrderItem {
  id: string
  productId: string
  quantity: number
  price: number
  product?: {
    id: string
    name: string
    imageUrl: string
    seller?: { id: string; company: string }
  } | null
}

export interface AdminOrderDetail {
  id: string
  customerName: string
  customerPhone: string
  deliveryType: DeliveryType
  deliveryAddress?: string | null
  paymentMethod: PaymentMethod
  comment?: string | null
  total: number
  status: OrderStatus
  createdAt: string
  updatedAt?: string
  user?: {
    id: string
    name: string
    phone: string
    role: Role
    createdAt: string
  } | null
  items: AdminOrderItem[]
}

export interface AdminUserDetail {
  id: string
  name: string
  phone: string
  role: Role
  createdAt: string
  seller?: {
    id: string
    company: string
    verified: boolean
    articleNumber?: number
    _count?: { products: number }
  } | null
  _count?: {
    orders: number
    placedOrders: number
  }
  recentOrders?: Order[]
}

export interface AdminSellerDetail {
  id: string
  company: string
  verified: boolean
  articleNumber?: number
  createdAt?: string
  user: {
    id: string
    name: string
    phone: string
    createdAt: string
  }
  _count: { products: number }
  recentProducts?: {
    id: string
    name: string
    price: number
    status: string
    imageUrl: string
    createdAt: string
  }[]
}

export interface AdminDashboardStats {
  orders: {
    total: number
    byStatus: Record<string, number>
  }
  pendingSellers: number
  pendingProducts: number
  pendingDeletions: number
  recentPendingSellers: { id: string; company: string; user: { id: string; name: string; createdAt: string } }[]
  recentPendingDeletions: { id: string; createdAt: string; product: { id: string; name: string }; seller: { id: string; company: string } }[]
}

export function getAdminDashboardStats() {
  return apiFetch<AdminDashboardStats>('/admin/stats')
}

export function getAdminUsers(params?: {
  page?: number
  limit?: number
  role?: Role
  q?: string
}) {
  const query = new URLSearchParams()
  if (params?.page) query.set('page', String(params.page))
  if (params?.limit) query.set('limit', String(params.limit))
  if (params?.role) query.set('role', params.role)
  if (params?.q?.trim()) query.set('q', params.q.trim())
  const qs = query.toString()

  return apiFetch<PaginatedResponse<User>>(`/admin/users${qs ? `?${qs}` : ''}`)
}

export function updateAdminUserRole(
  id: string,
  payload: { role: Role; company?: string },
) {
  return apiFetch<{ message: string; user: User }>(`/admin/users/${id}/role`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function getAdminOrders(params?: {
  page?: number
  limit?: number
  status?: OrderStatus
  q?: string
}) {
  const query = new URLSearchParams()
  if (params?.page) query.set('page', String(params.page))
  if (params?.limit) query.set('limit', String(params.limit))
  if (params?.status) query.set('status', params.status)
  if (params?.q?.trim()) query.set('q', params.q.trim())
  const qs = query.toString()

  return apiFetch<PaginatedResponse<Order>>(`/admin/orders${qs ? `?${qs}` : ''}`)
}

export function getAdminProduct(id: string) {
  return apiFetch<AdminProductDetail>(`/admin/products/${id}`)
}

export function approveAdminProduct(id: string) {
  return apiFetch<{ message: string }>(`/admin/products/${id}/approve`, {
    method: 'PATCH',
  })
}

export function rejectAdminProduct(id: string, reason: string) {
  return apiFetch<{ message: string }>(`/admin/products/${id}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  })
}

export function getAdminDeletionRequests() {
  return apiFetch<DeletionRequest[]>('/products/admin/deletion-requests')
}

export function approveAdminDeletionRequest(id: string) {
  return apiFetch<{ message: string }>(`/products/admin/deletion-requests/${id}/approve`, {
    method: 'PATCH',
  })
}

export function rejectAdminDeletionRequest(id: string) {
  return apiFetch<{ message: string }>(`/products/admin/deletion-requests/${id}/reject`, {
    method: 'PATCH',
  })
}

export interface PendingSeller {
  id: string
  company: string
  verified: boolean
  user: {
    id: string
    name: string
    phone: string
    createdAt: string
  }
  _count: { products: number }
}

export function getAdminPendingSellers(params?: { page?: number; limit?: number; q?: string }) {
  const query = new URLSearchParams()
  if (params?.page) query.set('page', String(params.page))
  if (params?.limit) query.set('limit', String(params.limit))
  if (params?.q?.trim()) query.set('q', params.q.trim())
  const qs = query.toString()
  return apiFetch<{ data: PendingSeller[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(
    `/admin/sellers/pending${qs ? `?${qs}` : ''}`
  )
}

export function verifyAdminSeller(id: string) {
  return apiFetch<{ message: string }>(`/admin/sellers/${id}/verify`, { method: 'PATCH' })
}

export function rejectAdminSeller(id: string) {
  return apiFetch<{ message: string }>(`/admin/sellers/${id}/reject`, { method: 'PATCH' })
}

export function getAdminOrderDetail(id: string) {
  return apiFetch<AdminOrderDetail>(`/admin/orders/${id}`)
}

export function deleteAdminOrder(id: string) {
  return apiFetch<{ message: string }>(`/admin/orders/${id}`, { method: 'DELETE' })
}

export function updateAdminOrderStatus(id: string, status: OrderStatus) {
  return apiFetch<{ message: string; order: AdminOrderDetail }>(`/admin/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export function createAdminUser(payload: {
  name: string
  phone: string
  role?: string
}) {
  return apiFetch<{ id: string; name: string; phone: string; role: string; createdAt: string }>(
    '/admin/users',
    { method: 'POST', body: JSON.stringify(payload) },
  )
}

export function getAdminUserDetail(id: string) {
  return apiFetch<AdminUserDetail>(`/admin/users/${id}`)
}

export function getAdminSellerDetail(id: string) {
  return apiFetch<AdminSellerDetail>(`/admin/sellers/${id}`)
}

export function getAdminAllSellers(params?: { page?: number; limit?: number; q?: string }) {
  const query = new URLSearchParams()
  if (params?.page) query.set('page', String(params.page))
  if (params?.limit) query.set('limit', String(params.limit))
  if (params?.q?.trim()) query.set('q', params.q.trim())
  const qs = query.toString()
  return apiFetch<{ data: AdminSellerDetail[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(
    `/admin/sellers${qs ? `?${qs}` : ''}`
  )
}

export interface AdminDispatcherListItem {
  id: string
  name: string
  phone: string | null
  createdAt: string
  _count: { dispatched: number }
}

export interface AdminDispatcherDetail {
  id: string
  name: string
  phone: string | null
  role: string
  createdAt: string
  stats: {
    total: number
    today: number
    delivered: number
    cancelled: number
  }
  recentAssignments: {
    id: string
    status: string
    createdAt: string
    order: { id: string; customerName: string; deliveryAddress: string | null; total: number }
    driver: { id: string; name: string; phone: string } | null
  }[]
}

export function getAdminDispatchers(params?: { page?: number; limit?: number; q?: string }) {
  const query = new URLSearchParams()
  if (params?.page) query.set('page', String(params.page))
  if (params?.limit) query.set('limit', String(params.limit))
  if (params?.q?.trim()) query.set('q', params.q.trim())
  const qs = query.toString()
  return apiFetch<{ data: AdminDispatcherListItem[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(
    `/admin/dispatchers${qs ? `?${qs}` : ''}`
  )
}

export function getAdminDispatcherDetail(id: string) {
  return apiFetch<AdminDispatcherDetail>(`/admin/dispatchers/${id}`)
}

export interface DeletionRequest {
  id: string
  productId: string
  sellerId: string
  reason: string
  status: string
  createdAt: string
  product: {
    id: string
    name: string
    imageUrl: string
    price: number
    status: string
  }
  seller: {
    id: string
    company: string
    user: {
      name: string
      phone: string
    }
  }
}
