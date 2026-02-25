import { apiFetch } from './client'
import type { PaginatedResponse, User, Order, OrderStatus, Role } from '@/types'

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
