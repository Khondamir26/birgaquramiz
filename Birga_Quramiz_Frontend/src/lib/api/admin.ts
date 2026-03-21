import { apiFetch } from './client'
import type { PaginatedResponse, User, Order, OrderStatus, Role, AdminProductDetail } from '@/types'

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
